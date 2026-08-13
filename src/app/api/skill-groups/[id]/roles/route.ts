import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authed, badRequest, notFound } from "@/lib/api-helpers";
import { defaultExpected } from "@/lib/framework-template";

const schema = z.object({ roleId: z.string(), enabled: z.boolean() });

// Link or unlink a skill group to a role. Linking seeds expected-matrix rows.
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await authed();
  if (session instanceof NextResponse) return session;
  const { id: groupId } = await params;

  const group = await prisma.skillGroup.findFirst({
    where: { id: groupId, orgId: session.orgId },
    include: { subSkills: { select: { id: true, name: true } } },
  });
  if (!group) return notFound();

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Invalid input");
  const { roleId, enabled } = parsed.data;

  const role = await prisma.jobRole.findFirst({
    where: { id: roleId, orgId: session.orgId },
    include: { levels: { select: { id: true, orderIndex: true } } },
  });
  if (!role) return notFound();

  if (enabled) {
    await prisma.skillGroupOnRole.upsert({
      where: { groupId_roleId: { groupId, roleId } },
      update: {},
      create: { groupId, roleId },
    });
    if (role.levels.length && group.subSkills.length) {
      const data = role.levels.flatMap((lvl) =>
        group.subSkills.map((s) => ({
          roleId,
          levelId: lvl.id,
          subSkillId: s.id,
          value: defaultExpected(lvl.orderIndex, s.name),
        })),
      );
      await prisma.expectedScore.createMany({ data, skipDuplicates: true });
    }
  } else {
    await prisma.skillGroupOnRole
      .delete({ where: { groupId_roleId: { groupId, roleId } } })
      .catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
