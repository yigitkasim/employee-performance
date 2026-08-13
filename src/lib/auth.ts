import "server-only";
import bcrypt from "bcryptjs";
import { randomBytes, createHash } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./db";
import type { TokenPurpose } from "@prisma/client";

const COOKIE = "gm_session";
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dev-secret-change-me",
);

export type SessionPayload = {
  userId: string;
  orgId: string;
  email: string;
  name: string;
  /** Issued-at (seconds). Compared against User.sessionsValidFrom to allow global revocation. */
  iat?: number;
};

// ─────────────────────────── passwords ───────────────────────────

export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 12);
}

export async function verifyPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash);
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
  if (session.iat && user.sessionsValidFrom.getTime() > session.iat * 1000) {
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
const MAX_ATTEMPTS = 5;

/** True when this email has too many recent failed logins. */
export async function isLoginBlocked(email: string): Promise<boolean> {
  const count = await prisma.loginAttempt.count({
    where: {
      key: email.toLowerCase(),
      createdAt: { gte: new Date(Date.now() - WINDOW_MS) },
    },
  });
  return count >= MAX_ATTEMPTS;
}

export async function recordFailedLogin(email: string, ip = ""): Promise<void> {
  const key = email.toLowerCase();
  await prisma.loginAttempt.create({ data: { key, ip } });
  // Opportunistic cleanup of old rows for this key.
  await prisma.loginAttempt.deleteMany({
    where: { key, createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
  });
}

export async function clearLoginAttempts(email: string): Promise<void> {
  await prisma.loginAttempt.deleteMany({ where: { key: email.toLowerCase() } });
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
