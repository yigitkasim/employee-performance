import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { issueToken, audit } from "@/lib/auth";
import { isRateLimited, recordAttempt, clientIp } from "@/lib/rate-limit";
import { sendPasswordResetEmail } from "@/lib/email";
import { zEmail } from "@/lib/validation";

const schema = z.object({ email: zEmail }).strict();

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  // Always answer the same way, whether or not the address exists, so this
  // endpoint can't be used to enumerate accounts.
  const ok = NextResponse.json({ ok: true });
  if (!parsed.success) return ok;

  const email = parsed.data.email;
  const ip = clientIp(req);

  // Cap how many reset mails go to one address and from one source — otherwise
  // this endpoint mail-bombs a victim and burns the sending quota. Still return
  // the same generic response so throttling doesn't leak existence either.
  if ((await isRateLimited("forgot", email)) || (await isRateLimited("forgot", ip || "noip"))) {
    return ok;
  }
  await recordAttempt("forgot", email, ip);
  await recordAttempt("forgot", ip || "noip", ip);

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, suspendedAt: true },
  });
  if (!user || user.suspendedAt) return ok;

  const token = await issueToken(user.id, "PASSWORD_RESET");
  await sendPasswordResetEmail(user.email, token);
  await audit("password.reset_requested", user.id);

  return ok;
}
