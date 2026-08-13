import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authed, badRequest, notFound } from "@/lib/api-helpers";
import { defaultExpected } from "@/lib/framework-template";

const schema = z.object({ name: z.string().min(1).max(120) });

// Add a sub-skill to a group and seed expected-matrix rows for every
// (role, level) that uses this group.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await authed();
  if (session instanceof NextResponse) return session;
  const { id: groupId } = await params;

  const group = await prisma.skillGroup.findFirst({
    where: { id: groupId, orgId: session.orgId },
    include: { roles: { select: { roleId: true } } },
  });
  if (!group) return notFound();

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Sub-skill name is required");

  const orderIndex = await prisma.subSkill.count({ where: { groupId } });
  const sub = await prisma.subSkill.create({
    data: { groupId, name: parsed.data.name, orderIndex },
  });

  const roleIds = group.roles.map((r) => r.roleId);
  if (roleIds.length) {
    const levels = await prisma.level.findMany({
      where: { roleId: { in: roleIds } },
      select: { id: true, roleId: true, orderIndex: true },
    });
    if (levels.length) {
      await prisma.expectedScore.createMany({
        data: levels.map((lvl) => ({
          roleId: lvl.roleId,
          levelId: lvl.id,
          subSkillId: sub.id,
          value: defaultExpected(lvl.orderIndex, parsed.data.name),
        })),
        skipDuplicates: true,
      });
    }
  }

  return NextResponse.json({ ok: true, id: sub.id });
}
