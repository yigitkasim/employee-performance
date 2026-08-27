import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  hashPassword,
  createSession,
  issueToken,
  audit,
  passwordProblem,
} from "@/lib/auth";
import { isRateLimited, recordAttempt, clientIp } from "@/lib/rate-limit";
import { sendVerificationEmail } from "@/lib/email";
import { DEFAULT_INBOX_SOURCES } from "@/lib/framework-template";
import { zName, zEmail, zPassword } from "@/lib/validation";

const schema = z
  .object({
    name: zName,
    email: zEmail,
    password: zPassword,
    orgName: zName,
    // GDPR Art. 7 / KVKK accountability: consent must be explicit and recorded.
    acceptTerms: z.boolean().optional(),
    // Separate, optional opt-in (GDPR / CASL / CAN-SPAM).
    marketingOptIn: z.boolean().optional(),
  })
  .strict();

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
  const { name, email, password, orgName, acceptTerms, marketingOptIn } =
    parsed.data;

  // Cap mass org creation from one source.
  const ip = clientIp(req);
  if (await isRateLimited("signup", ip || "noip")) {
    return NextResponse.json(
      { error: "Too many sign-ups from here. Please try again later." },
      { status: 429 },
    );
  }

  if (acceptTerms !== true) {
    return NextResponse.json(
      {
        error:
          "You must accept the Terms of Service and Privacy Policy to create an account",
      },
      { status: 400 },
    );
  }

  const pwProblem = passwordProblem(password, { email, name, orgName });
  if (pwProblem) {
    return NextResponse.json({ error: pwProblem }, { status: 400 });
  }

  await recordAttempt("signup", ip || "noip", ip);

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    // Signup necessarily reveals that an email is taken (the user needs to know
    // why they can't proceed). Rate limiting above keeps this from being usable
    // for bulk enumeration; the forgot-password flow stays non-disclosing.
    return NextResponse.json(
      { error: "An account with that email already exists" },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        name: orgName,
        sources: DEFAULT_INBOX_SOURCES,
        cycles: { create: { name: "H1 2026 cycle", active: true } },
      },
    });
    return tx.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "OWNER",
        orgId: org.id,
        termsAcceptedAt: new Date(),
        marketingOptIn: marketingOptIn === true,
      },
    });
  });

  await createSession({
    userId: user.id,
    orgId: user.orgId,
    email: user.email,
    name: user.name,
  });

  // Send the confirmation email. Never fail signup if delivery has a problem —
  // the user can resend from the in-app banner.
  try {
    const token = await issueToken(user.id, "EMAIL_VERIFY");
    await sendVerificationEmail(user.email, user.name, token);
  } catch (err) {
    console.error("[signup] verification email failed:", err);
  }
  await audit("account.created", user.id, user.orgId);

  return NextResponse.json({ ok: true });
}
