import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { issueToken, audit } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  // Always answer the same way, whether or not the address exists, so this
  // endpoint can't be used to enumerate accounts.
  const ok = NextResponse.json({ ok: true });
  if (!parsed.success) return ok;

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
    select: { id: true, email: true, suspendedAt: true },
  });
  if (!user || user.suspendedAt) return ok;

  const token = await issueToken(user.id, "PASSWORD_RESET");
  await sendPasswordResetEmail(user.email, token);
  await audit("password.reset_requested", user.id);

  return ok;
}
