import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authed, badRequest, notFound } from "@/lib/api-helpers";
import { defaultExpected } from "@/lib/framework-template";

const schema = z.object({ name: z.string().min(1).max(120) });

// Add a level to a role and seed expected-matrix rows for all of the role's
// sub-skills so the matrix and member seeding stay consistent.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await authed();
  if (session instanceof NextResponse) return session;
  const { id: roleId } = await params;

  const role = await prisma.jobRole.findFirst({
    where: { id: roleId, orgId: session.orgId },
    include: { skillGroups: { select: { groupId: true } } },
  });
  if (!role) return notFound();

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Level name is required");

  const orderIndex = await prisma.level.count({ where: { roleId } });
  const level = await prisma.level.create({
    data: { roleId, name: parsed.data.name, orderIndex },
  });

  const groupIds = role.skillGroups.map((g) => g.groupId);
  if (groupIds.length) {
    const subs = await prisma.subSkill.findMany({
      where: { groupId: { in: groupIds } },
      select: { id: true, name: true },
    });
    if (subs.length) {
      await prisma.expectedScore.createMany({
        data: subs.map((s) => ({
          roleId,
          levelId: level.id,
          subSkillId: s.id,
          value: defaultExpected(orderIndex, s.name),
        })),
        skipDuplicates: true,
      });
    }
  }

  return NextResponse.json({ ok: true, id: level.id });
}
