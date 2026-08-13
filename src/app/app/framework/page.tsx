import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getFramework } from "@/lib/data";
import { prisma } from "@/lib/db";
import { FrameworkClient } from "@/components/framework/FrameworkClient";

export default async function FrameworkPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const { roles, skillGroups } = await getFramework(session.orgId);

  // Expected-matrix values for all of the org's roles, keyed level:subSkill.
  const expectedRows = await prisma.expectedScore.findMany({
    where: { role: { orgId: session.orgId } },
    select: { roleId: true, levelId: true, subSkillId: true, value: true },
  });
  const expected: Record<string, number> = {};
  for (const r of expectedRows) {
    expected[`${r.roleId}:${r.levelId}:${r.subSkillId}`] = r.value;
  }

  const rolesData = roles.map((r) => ({
    id: r.id,
    name: r.name,
    icon: r.icon,
    description: r.description,
    memberCount: r._count.members,
    levels: r.levels.map((l) => ({ id: l.id, name: l.name, orderIndex: l.orderIndex })),
    groupIds: r.skillGroups.map((g) => g.groupId),
  }));

  const groupsData = skillGroups.map((g) => ({
    id: g.id,
    name: g.name,
    icon: g.icon,
    subSkills: g.subSkills.map((s) => ({ id: s.id, name: s.name })),
    roleIds: g.roles.map((r) => r.roleId),
  }));

  return (
    <FrameworkClient
      roles={rolesData}
      groups={groupsData}
      expected={expected}
    />
  );
}
