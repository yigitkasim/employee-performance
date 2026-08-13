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

  // Resolve the member's real score for the referenced skill, if any.
  let scoreRow: { id: string; current: number } | null = null;
  if (skillName) {
    scoreRow = await prisma.score.findFirst({
      where: {
        memberId: item.memberId,
        subSkill: { name: skillName, group: { orgId: session.orgId } },
      },
      select: { id: true, current: true },
    });
  }

  // Only claim a score change when one actually happens. A plain observation is
  // filed with no score at all rather than a made-up "no change · 3".
  const willBump = bump && !!scoreRow && scoreRow.current < 5;
  const fromScore = willBump ? scoreRow!.current : null;
  const toScore = willBump ? scoreRow!.current + 1 : null;

  await prisma.$transaction(async (tx) => {
    if (willBump) {
      await tx.score.update({
        where: { id: scoreRow!.id },
        data: { current: toScore! },
      });
    }
    await tx.logEntry.create({
      data: {
        memberId: item.memberId!,
        authorId: session.userId,
        skillName: skillName ?? null,
        fromScore,
        toScore,
        note: item.text,
      },
    });
    await tx.inboxItem.delete({ where: { id } });
  });

  return NextResponse.json({
    ok: true,
    bumped: willBump,
    toScore,
    atMax: bump && !!scoreRow && scoreRow.current >= 5,
  });
}
