import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { consumeToken, issueToken, getSession, audit } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";

const schema = z.object({ token: z.string().min(1) });

/** Confirm an address using the emailed token. */
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const userId = await consumeToken(parsed.data.token, "EMAIL_VERIFY");
  if (!userId) {
    return NextResponse.json(
      { error: "This confirmation link is invalid or has expired." },
      { status: 400 },
    );
  }

  await prisma.user.update({
    where: { id: userId },
    data: { emailVerifiedAt: new Date() },
  });
  await audit("email.verified", userId);

  return NextResponse.json({ ok: true });
}

/** Re-send the confirmation email to the signed-in user. */
export async function PUT() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, emailVerifiedAt: true },
  });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.emailVerifiedAt) return NextResponse.json({ ok: true, already: true });

  const token = await issueToken(user.id, "EMAIL_VERIFY");
  const res = await sendVerificationEmail(user.email, user.name, token);
  await audit("email.verification_resent", user.id);

  return NextResponse.json({ ok: true, delivered: res.delivered });
}
