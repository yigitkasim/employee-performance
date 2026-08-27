import "server-only";
import bcrypt from "bcryptjs";
import { randomBytes, createHash } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./db";
import type { TokenPurpose } from "@prisma/client";

const COOKIE = "gm_session";

/**
 * Session signing key. This MUST fail closed.
 *
 * A hardcoded fallback used to stand in when AUTH_SECRET was unset, which meant
 * any deployment that forgot the env var signed sessions with a string printed
 * in the source. Anyone who knew it could mint a cookie for any userId/orgId and
 * impersonate any account in any tenant. Refusing to start is the only safe
 * behaviour.
 */
const WEAK_SECRETS = new Set([
  "dev-secret-change-me",
  "change-me",
  "secret",
  "changeme",
]);

function loadSecret(): Uint8Array {
  const value = process.env.AUTH_SECRET;
  if (!value || value.trim().length === 0) {
    throw new Error(
      "AUTH_SECRET is not set. Generate one with `openssl rand -base64 32` and " +
        "set it in the environment — the app will not sign sessions without it.",
    );
  }
  if (value.length < 32) {
    throw new Error(
      "AUTH_SECRET is too short (needs at least 32 characters). " +
        "Generate one with `openssl rand -base64 32`.",
    );
  }
  if (WEAK_SECRETS.has(value.trim().toLowerCase())) {
    throw new Error(
      "AUTH_SECRET is a placeholder value. Generate a real one with " +
        "`openssl rand -base64 32`.",
    );
  }
  return new TextEncoder().encode(value);
}

const secret = loadSecret();

export type SessionPayload = {
  userId: string;
  orgId: string;
  email: string;
  name: string;
  /** Issued-at (seconds). Compared against User.sessionsValidFrom to allow global revocation. */
  iat?: number;
};

// ─────────────────────────── passwords ───────────────────────────

/** bcrypt reads at most 72 bytes; anything beyond that is silently ignored. */
export const MAX_PASSWORD_BYTES = 72;

export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 12);
}

export async function verifyPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash);
}

/**
 * A bcrypt hash of a value nobody can supply, used to spend the same CPU when
 * an account does not exist.
 *
 * Without it, login returned in ~22ms for an unknown address and ~350ms for a
 * known one, so response latency alone revealed which emails were registered.
 */
const DUMMY_HASH =
  "$2a$12$C6UzMDM.H6dfI/f/IKcEe.7Ts1YkQhFCE0hV0dO0dLbCJmQnBhV3S";

/** Constant-ish-time password check that runs bcrypt even for a missing user. */
export async function verifyPasswordConstantTime(
  pw: string,
  hash: string | null | undefined,
): Promise<boolean> {
  if (!hash) {
    await bcrypt.compare(pw, DUMMY_HASH).catch(() => false);
    return false;
  }
  return bcrypt.compare(pw, hash);
}

const COMMON_PASSWORDS = new Set([
  "password", "password1", "password123", "12345678", "123456789", "1234567890",
  "qwerty", "qwerty123", "qwertyui", "abc12345", "11111111", "00000000",
  "iloveyou", "letmein", "welcome", "welcome1", "admin123", "adminadmin",
  "aaaaaaaa", "changeme", "passw0rd", "p@ssw0rd", "football", "baseball",
  "sunshine", "princess", "dragon123", "monkey123", "trustno1", "starwars",
  "whatever", "superman", "michael1", "shadow123",
]);

/**
 * NIST 800-63B style checks: length, a small breached/common list, and no
 * reuse of the identifiers the attacker already knows.
 */
export function passwordProblem(
  pw: string,
  context: { email?: string; name?: string; orgName?: string } = {},
): string | null {
  if (pw.length < 8) return "Password must be at least 8 characters";
  if (Buffer.byteLength(pw, "utf8") > MAX_PASSWORD_BYTES) {
    return `Password must be at most ${MAX_PASSWORD_BYTES} bytes`;
  }
  const lower = pw.toLowerCase();
  if (COMMON_PASSWORDS.has(lower)) {
    return "That password is too common — choose something harder to guess";
  }
  if (/^(.)\1+$/.test(pw)) {
    return "Password cannot be a single repeated character";
  }
  const email = context.email?.toLowerCase();
  if (email && (lower === email || lower === email.split("@")[0])) {
    return "Password cannot be your email address";
  }
  for (const v of [context.name, context.orgName]) {
    if (v && v.trim().length >= 4 && lower === v.trim().toLowerCase()) {
      return "Password cannot be your name or organization name";
    }
  }
  return null;
}

// ─────────────────────────── sessions ───────────────────────────

export async function createSession(
  payload: Omit<SessionPayload, "iat">,
): Promise<void> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

/**
 * Returns the decoded session payload or null.
 * Cheap path: signature + expiry only (no DB hit).
 */
export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Full validation against the database: confirms the user still exists, is not
 * suspended, and that the token was issued after `sessionsValidFrom`
 * (which password resets and "sign out everywhere" bump).
 * Use on sensitive paths; `getSession` is fine for ordinary reads.
 */
export async function getVerifiedSession(): Promise<SessionPayload | null> {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { suspendedAt: true, sessionsValidFrom: true, orgId: true },
  });
  if (!user || user.suspendedAt) return null;
  // `iat` is whole seconds (rounded down), so a token minted in the same second
  // as `sessionsValidFrom` can look marginally older. Allow one second of slack
  // so a fresh login is never rejected by its own revocation timestamp.
  const IAT_SKEW_MS = 1000;
  if (
    session.iat &&
    user.sessionsValidFrom.getTime() - IAT_SKEW_MS > session.iat * 1000
  ) {
    return null; // issued before a global revocation
  }
  if (user.orgId !== session.orgId) return null;
  return session;
}

/** Returns the full user (with org) for the current session, or null. */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  return prisma.user.findUnique({
    where: { id: session.userId },
    include: { org: true },
  });
}

/** Invalidate every session previously issued for a user. */
export async function revokeAllSessions(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { sessionsValidFrom: new Date() },
  });
}

// ─────────────────────────── single-use tokens ───────────────────────────

const TOKEN_TTL_MS: Record<TokenPurpose, number> = {
  EMAIL_VERIFY: 24 * 60 * 60 * 1000, // 24h
  PASSWORD_RESET: 60 * 60 * 1000, // 1h
};

function sha256(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/**
 * Creates a single-use token. Only its hash is stored; the raw value is
 * returned once, for embedding in an email link.
 */
export async function issueToken(
  userId: string,
  purpose: TokenPurpose,
): Promise<string> {
  // Only one live token per purpose.
  await prisma.authToken.deleteMany({ where: { userId, purpose, usedAt: null } });
  const raw = randomBytes(32).toString("hex");
  await prisma.authToken.create({
    data: {
      userId,
      purpose,
      tokenHash: sha256(raw),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS[purpose]),
    },
  });
  return raw;
}

/**
 * Validates and CONSUMES a token. Returns the userId, or null when the token is
 * unknown, already used, or expired.
 */
export async function consumeToken(
  raw: string,
  purpose: TokenPurpose,
): Promise<string | null> {
  const row = await prisma.authToken.findUnique({
    where: { tokenHash: sha256(raw) },
  });
  if (!row || row.purpose !== purpose) return null;
  if (row.usedAt) return null;
  if (row.expiresAt.getTime() < Date.now()) return null;
  await prisma.authToken.update({
    where: { id: row.id },
    data: { usedAt: new Date() },
  });
  return row.userId;
}

// ─────────────────────────── login throttling ───────────────────────────

const WINDOW_MS = 15 * 60 * 1000;
/** Per (email, source IP): stops one attacker guessing at a single account. */
const MAX_PER_SOURCE = 5;
/**
 * Per email across all sources. Deliberately far higher than the per-source
 * limit: keying the lock on the email alone let anyone who knew an address lock
 * its owner out permanently with five junk requests every 15 minutes. A
 * legitimate user signing in from their own IP now has their own untouched
 * budget, while a distributed spray still hits this ceiling.
 */
const MAX_PER_EMAIL = 50;

function sourceKey(email: string, ip: string): string {
  return `login:${email.toLowerCase()}|${ip || "unknown"}`;
}
function emailKey(email: string): string {
  return `login:${email.toLowerCase()}`;
}

async function countSince(key: string): Promise<number> {
  return prisma.loginAttempt.count({
    where: { key, createdAt: { gte: new Date(Date.now() - WINDOW_MS) } },
  });
}

/** True when this email+IP pair (or the email globally) is over its budget. */
export async function isLoginBlocked(email: string, ip = ""): Promise<boolean> {
  const [bySource, byEmail] = await Promise.all([
    countSince(sourceKey(email, ip)),
    countSince(emailKey(email)),
  ]);
  return bySource >= MAX_PER_SOURCE || byEmail >= MAX_PER_EMAIL;
}

export async function recordFailedLogin(email: string, ip = ""): Promise<void> {
  await prisma.loginAttempt.createMany({
    data: [
      { key: sourceKey(email, ip), ip },
      { key: emailKey(email), ip },
    ],
  });
  // Opportunistic cleanup so the table cannot grow without bound.
  await prisma.loginAttempt.deleteMany({
    where: {
      key: { in: [sourceKey(email, ip), emailKey(email)] },
      createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });
}

export async function clearLoginAttempts(email: string, ip = ""): Promise<void> {
  await prisma.loginAttempt.deleteMany({
    where: { key: { in: [sourceKey(email, ip), emailKey(email)] } },
  });
}

// ─────────────────────────── audit ───────────────────────────

export async function audit(
  action: string,
  actorId: string | null,
  detail = "",
): Promise<void> {
  try {
    await prisma.auditLog.create({ data: { action, actorId, detail } });
  } catch {
    // Audit logging must never break the request path.
  }
}

/** True when the email is configured as an owner/superadmin. */
export function isAdminEmail(email: string): boolean {
  const list = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}
