import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authed, badRequest } from "@/lib/api-helpers";

const schema = z.object({ marketingOptIn: z.boolean() });

/** Update the caller's marketing-email consent (GDPR Art. 7(3) / CASL). */
export async function PATCH(req: NextRequest) {
  const session = await authed();
  if (session instanceof NextResponse) return session;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Invalid input");

  await prisma.user.update({
    where: { id: session.userId },
    data: { marketingOptIn: parsed.data.marketingOptIn },
  });

  await prisma.auditLog.create({
    data: {
      action: "consent.marketing",
      detail: parsed.data.marketingOptIn ? "opt-in" : "opt-out",
      actorId: session.userId,
    },
  });

  return NextResponse.json({ ok: true });
}
