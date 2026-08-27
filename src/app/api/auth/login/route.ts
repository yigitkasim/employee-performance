import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  verifyPasswordConstantTime,
  createSession,
  isLoginBlocked,
  recordFailedLogin,
  clearLoginAttempts,
  audit,
} from "@/lib/auth";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    ""
  );
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 },
    );
  }
  const { email, password } = parsed.data;

  const ip = clientIp(req);

  // Throttle before doing any password work.
  if (await isLoginBlocked(email, ip)) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in 15 minutes." },
      { status: 429 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  // Always spend the bcrypt cost, even when the account does not exist —
  // otherwise the response time alone reveals which emails are registered
  // (measured ~22ms unknown vs ~350ms known before this).
  const passwordOk = await verifyPasswordConstantTime(
    password,
    user?.passwordHash,
  );

  if (!user || !passwordOk) {
    await recordFailedLogin(email, ip);
    return NextResponse.json(
      { error: "Incorrect email or password" },
      { status: 401 },
    );
  }

  if (user.suspendedAt) {
    await audit("login.blocked_suspended", user.id);
    return NextResponse.json(
      { error: "This account has been suspended. Contact support." },
      { status: 403 },
    );
  }

  await clearLoginAttempts(email, ip);
  await createSession({
    userId: user.id,
    orgId: user.orgId,
    email: user.email,
    name: user.name,
  });
  await audit("login.success", user.id);

  return NextResponse.json({ ok: true });
}
