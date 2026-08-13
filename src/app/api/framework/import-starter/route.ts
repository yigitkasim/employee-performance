import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authed } from "@/lib/api-helpers";
import {
  PM_LEVELS,
  STARTER_SKILL_GROUPS,
  defaultExpected,
} from "@/lib/framework-template";

// Seed a Product-Manager framework (role, levels, skill groups, sub-skills,
// and the expected-score matrix) into the current org. Explicit, user-invoked.
export async function POST() {
  const session = await authed();
  if (session instanceof NextResponse) return session;
  const orgId = session.orgId;

  const existing = await prisma.jobRole.count({ where: { orgId } });
  if (existing > 0) {
    return NextResponse.json(
      { error: "Framework already has roles — import skipped" },
      { status: 409 },
    );
  }

  await prisma.$transaction(async (tx) => {
    // Role + levels
    const role = await tx.jobRole.create({
      data: {
        orgId,
        name: "Product Manager",
        icon: "📦",
        description:
          "Owns the discovery → delivery → adoption lifecycle for a product area.",
        orderIndex: 0,
      },
    });
    const levels = await Promise.all(
      PM_LEVELS.map((name, i) =>
        tx.level.create({ data: { roleId: role.id, name, orderIndex: i } }),
      ),
    );

    // Skill groups + sub-skills, linked to the role
    for (let gi = 0; gi < STARTER_SKILL_GROUPS.length; gi++) {
      const g = STARTER_SKILL_GROUPS[gi];
      const group = await tx.skillGroup.create({
        data: { orgId, name: g.name, icon: g.icon, orderIndex: gi },
      });
      await tx.skillGroupOnRole.create({
        data: { groupId: group.id, roleId: role.id },
      });
      for (let si = 0; si < g.subSkills.length; si++) {
        const subName = g.subSkills[si];
        const sub = await tx.subSkill.create({
          data: { groupId: group.id, name: subName, orderIndex: si },
        });
        // Expected matrix: one row per level
        await tx.expectedScore.createMany({
          data: levels.map((lvl, li) => ({
            roleId: role.id,
            levelId: lvl.id,
            subSkillId: sub.id,
            value: defaultExpected(li, subName),
          })),
        });
      }
    }
  });

  return NextResponse.json({ ok: true });
}
