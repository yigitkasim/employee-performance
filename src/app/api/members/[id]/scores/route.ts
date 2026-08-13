import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authed, badRequest, notFound } from "@/lib/api-helpers";

const schema = z.object({
  subSkillId: z.string(),
  current: z.number().int().min(1).max(5),
  note: z.string().max(1000).optional(),
});

// Set a member's current score for a sub-skill and record a log entry.
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
  const { subSkillId, current, note } = parsed.data;

  const score = await prisma.score.findUnique({
    where: { memberId_subSkillId: { memberId, subSkillId } },
    include: { subSkill: { select: { name: true } } },
  });
  if (!score) return notFound("Score not found");
  if (score.current === current) return NextResponse.json({ ok: true, noop: true });

  const old = score.current;
  await prisma.$transaction([
    prisma.score.update({
      where: { memberId_subSkillId: { memberId, subSkillId } },
      data: { current },
    }),
    prisma.logEntry.create({
      data: {
        memberId,
        authorId: session.userId,
        skillName: score.subSkill.name,
        fromScore: old,
        toScore: current,
        note: note || "Updated from rating screen.",
      },
    }),
  ]);

  return NextResponse.json({ ok: true, from: old, to: current });
}
