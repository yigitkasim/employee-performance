import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authed, badRequest, notFound } from "@/lib/api-helpers";

const schema = z.object({
  subSkillId: z.string(),
  self: z.number().int().min(1).max(5).nullable(),
});

// Set (or clear) a member's self-assessment for one sub-skill.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await authed();
  if (session instanceof NextResponse) return session;
  const { id: memberId } = await params;

  const member = await prisma.member.findFirst({
    where: { id: memberId, orgId: session.orgId },
  });
  if (!member) return notFound();

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Invalid input");
  const { subSkillId, self } = parsed.data;

  const score = await prisma.score.findUnique({
    where: { memberId_subSkillId: { memberId, subSkillId } },
  });
  if (!score) return notFound("Score not found");

  await prisma.score.update({
    where: { memberId_subSkillId: { memberId, subSkillId } },
    data: { self },
  });
  return NextResponse.json({ ok: true });
}
