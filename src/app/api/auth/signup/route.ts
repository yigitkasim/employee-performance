import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import { DEFAULT_INBOX_SOURCES } from "@/lib/framework-template";

const schema = z.object({
  name: z.string().min(1, "Your name is required").max(120),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  orgName: z.string().min(1, "Organization name is required").max(120),
  // GDPR Art. 7 / KVKK accountability: consent must be explicit and recorded.
  acceptTerms: z.boolean().optional(),
  // Separate, optional opt-in (GDPR / CASL / CAN-SPAM).
  marketingOptIn: z.boolean().optional(),
});

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

  if (acceptTerms !== true) {
    return NextResponse.json(
      {
        error:
          "You must accept the Terms of Service and Privacy Policy to create an account",
      },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (existing) {
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
        email: email.toLowerCase(),
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

  return NextResponse.json({ ok: true });
}
