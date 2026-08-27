import "server-only";
import { prisma } from "./db";

/**
 * Database-backed fixed-window limiter for the endpoints outside login.
 *
 * Login was the only throttled route, which left three abuse channels open:
 * signup (mass org creation), password-reset (mail-bombing a victim and burning
 * the sending quota), and the verification resend. Each gets its own bucket so
 * one does not starve another. Login keeps its dedicated two-tier limiter in
 * `auth.ts` because it also needs a per-IP dimension.
 */

export type Bucket = "signup" | "forgot" | "verify-resend";

const LIMITS: Record<Bucket, { max: number; windowMs: number }> = {
  signup: { max: 10, windowMs: 60 * 60_000 },
  forgot: { max: 5, windowMs: 60 * 60_000 },
  "verify-resend": { max: 5, windowMs: 60 * 60_000 },
};

function keyFor(bucket: Bucket, id: string): string {
  return `${bucket}:${id.toLowerCase()}`;
}

/** True when this (bucket, id) pair has exhausted its window. */
export async function isRateLimited(
  bucket: Bucket,
  id: string,
): Promise<boolean> {
  const { max, windowMs } = LIMITS[bucket];
  const count = await prisma.loginAttempt.count({
    where: {
      key: keyFor(bucket, id),
      createdAt: { gte: new Date(Date.now() - windowMs) },
    },
  });
  return count >= max;
}

/** Record one use of the bucket. */
export async function recordAttempt(
  bucket: Bucket,
  id: string,
  ip = "",
): Promise<void> {
  const key = keyFor(bucket, id);
  await prisma.loginAttempt.create({ data: { key, ip } });
  await prisma.loginAttempt.deleteMany({
    where: { key, createdAt: { lt: new Date(Date.now() - 24 * 60 * 60_000) } },
  });
}

/** Client IP from the proxy headers the host sets. */
export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    ""
  );
}

export function tooManyRequests(
  message = "Too many requests. Please try again later.",
) {
  return Response.json({ error: message }, { status: 429 });
}
