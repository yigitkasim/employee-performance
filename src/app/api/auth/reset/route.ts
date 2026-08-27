import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  consumeToken,
  hashPassword,
  revokeAllSessions,
  clearLoginAttempts,
  destroySession,
  audit,
  passwordProblem,
} from "@/lib/auth";
import { zPassword } from "@/lib/validation";

const schema = z
  .object({
    token: z.string().min(1).max(256),
    password: zPassword,
  })
  .strict();

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 },
    );
  }
  const { token, password } = parsed.data;

  const userId = await consumeToken(token, "PASSWORD_RESET");
  if (!userId) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired. Request a new one." },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, org: { select: { name: true } } },
  });

  // Enforce the strength policy on reset too, not just at signup.
  const pwProblem = passwordProblem(password, {
    email: user?.email,
    name: user?.name,
    orgName: user?.org?.name,
  });
  if (pwProblem) {
    return NextResponse.json({ error: pwProblem }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(password) },
  });

  // A password change invalidates every existing session everywhere.
  await revokeAllSessions(userId);
  if (user) await clearLoginAttempts(user.email);
  await destroySession();
  await audit("password.reset_completed", userId);

  return NextResponse.json({ ok: true });
}
