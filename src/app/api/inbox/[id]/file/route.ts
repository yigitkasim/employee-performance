import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authed, notFound, badRequest } from "@/lib/api-helpers";

const schema = z.object({ bump: z.boolean().optional() });

// File an inbox item as a log entry (optionally bumping the related score).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await authed();
  if (session instanceof NextResponse) return session;
  const { id } = await params;

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return badRequest("Invalid input");
  const bump = parsed.data.bump ?? false;

  const item = await prisma.inboxItem.findFirst({
    where: { id, orgId: session.orgId },
  });
  if (!item) return notFound();
  if (!item.memberId)
    return badRequest("Assign this note to a member before filing");

  const skillName = item.skillName;
  let fromScore = 3;
  let toScore = 3;

  // Resolve the current score for the referenced skill, if any.
  let scoreRow = null as { id: string; current: number } | null;
  if (skillName) {
    const s = await prisma.score.findFirst({
      where: { memberId: item.memberId, subSkill: { name: skillName } },
      select: { id: true, current: true },
    });
    if (s) {
      scoreRow = s;
      fromScore = s.current;
      toScore = s.current;
    }
  }

  await prisma.$transaction(async (tx) => {
    if (bump && scoreRow && scoreRow.current < 5) {
      toScore = scoreRow.current + 1;
      await tx.score.update({
        where: { id: scoreRow.id },
        data: { current: toScore },
      });
    }
    await tx.logEntry.create({
      data: {
        memberId: item.memberId!,
        authorId: session.userId,
        skillName: skillName || "General",
        fromScore,
        toScore,
        note: item.text,
      },
    });
    await tx.inboxItem.delete({ where: { id } });
  });

  return NextResponse.json({ ok: true, bumped: toScore > fromScore, toScore });
}
