import "server-only";
import { prisma } from "./db";
import { initialsOf, pickColor } from "./compute";
import {
  PROMOTION_CHECKLIST_ITEMS,
  DEFAULT_TALKING_POINTS,
} from "./framework-template";
import type { Prisma } from "@prisma/client";

/**
 * Determine which sub-skills apply to a member given their role, and the
 * expected score for each (from the expected matrix, falling back to 3).
 *
 * Every query below is org-scoped. Without that, a caller passing another
 * organisation's roleId would seed the member with foreign sub-skills — which
 * leaks that org's framework and, because Score.subSkill cascades on delete,
 * lets the other org destroy these ratings.
 */
async function resolveScoreSeeds(
  orgId: string,
  roleId: string | null,
  levelId: string | null,
): Promise<{ subSkillId: string; expected: number }[]> {
  // Groups linked to the role; if none linked (or no role), use all org groups.
  let groupIds: string[] = [];
  if (roleId) {
    const links = await prisma.skillGroupOnRole.findMany({
      where: { roleId, role: { orgId }, group: { orgId } },
      select: { groupId: true },
    });
    groupIds = links.map((l) => l.groupId);
  }
  if (groupIds.length === 0) {
    const groups = await prisma.skillGroup.findMany({
      where: { orgId },
      select: { id: true },
    });
    groupIds = groups.map((g) => g.id);
  }

  const subSkills = await prisma.subSkill.findMany({
    where: { groupId: { in: groupIds }, group: { orgId } },
    select: { id: true },
  });

  const expectedRows =
    roleId && levelId
      ? await prisma.expectedScore.findMany({
          where: { roleId, levelId, role: { orgId } },
          select: { subSkillId: true, value: true },
        })
      : [];
  const expectedMap = new Map(expectedRows.map((e) => [e.subSkillId, e.value]));

  return subSkills.map((s) => ({
    subSkillId: s.id,
    expected: expectedMap.get(s.id) ?? 3,
  }));
}

export async function createMemberWithDefaults(params: {
  orgId: string;
  name: string;
  title?: string;
  roleId?: string | null;
  levelId?: string | null;
  status?: Prisma.MemberCreateInput["status"];
}) {
  const { orgId, name } = params;
  const roleId = params.roleId || null;
  const levelId = params.levelId || null;

  const seeds = await resolveScoreSeeds(orgId, roleId, levelId);

  return prisma.member.create({
    data: {
      orgId,
      name,
      title: params.title || "",
      initials: initialsOf(name),
      color: pickColor(name),
      status: params.status || "ON_TRACK",
      roleId,
      levelId,
      scores: {
        create: seeds.map((s) => ({
          subSkillId: s.subSkillId,
          current: 1,
          expected: s.expected,
        })),
      },
      checklist: {
        create: PROMOTION_CHECKLIST_ITEMS.map((label) => ({
          label,
          checked: true,
        })),
      },
      talkingPoints: {
        create: DEFAULT_TALKING_POINTS.map((text) => ({
          text,
          checked: false,
          isCustom: false,
        })),
      },
    },
    include: { scores: true },
  });
}

/**
 * Re-sync a member's Score rows to their role's sub-skills (used when role/level
 * changes). Adds missing sub-skills, updates expected values, keeps current.
 */
export async function resyncMemberScores(
  orgId: string,
  memberId: string,
  roleId: string | null,
  levelId: string | null,
) {
  const seeds = await resolveScoreSeeds(orgId, roleId, levelId);
  const existing = await prisma.score.findMany({
    where: { memberId },
    select: { subSkillId: true },
  });
  const existingIds = new Set(existing.map((e) => e.subSkillId));

  await prisma.$transaction(
    seeds.map((s) =>
      existingIds.has(s.subSkillId)
        ? prisma.score.update({
            where: {
              memberId_subSkillId: { memberId, subSkillId: s.subSkillId },
            },
            data: { expected: s.expected },
          })
        : prisma.score.create({
            data: {
              memberId,
              subSkillId: s.subSkillId,
              current: 1,
              expected: s.expected,
            },
          }),
    ),
  );
}
