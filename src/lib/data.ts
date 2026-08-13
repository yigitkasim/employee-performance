import "server-only";
import { prisma } from "./db";
import type { ScoreRow } from "./compute";
import {
  avgOf,
  targetOf,
  gapOf,
  gapCount,
  readinessOf,
  initialsOf,
} from "./compute";

// ─────────────────────────── Org context ───────────────────────────

export async function getOrgContext(orgId: string) {
  const [org, cycles] = await Promise.all([
    prisma.organization.findUnique({ where: { id: orgId } }),
    prisma.cycle.findMany({ where: { orgId }, orderBy: { name: "asc" } }),
  ]);
  return { org, cycles };
}

export async function getInboxCount(orgId: string): Promise<number> {
  return prisma.inboxItem.count({ where: { orgId } });
}

// ─────────────────────────── Members & scores ───────────────────────────

export type MemberBasic = {
  id: string;
  name: string;
  title: string;
  initials: string;
  color: string;
  status: string;
  roleId: string | null;
  levelId: string | null;
  roleName: string | null;
  levelName: string | null;
};

export type MemberWithScores = MemberBasic & { scores: ScoreRow[] };

export type MemberSummary = MemberBasic & {
  avg: number;
  target: number;
  gap: number;
  gaps: number;
  readiness: number;
  scoreCount: number;
};

function toScoreRows(
  scores: {
    current: number;
    expected: number;
    self: number | null;
    subSkill: {
      id: string;
      name: string;
      orderIndex: number;
      group: { id: string; name: string; icon: string; orderIndex: number };
    };
  }[],
): ScoreRow[] {
  return scores
    .map((s) => ({
      subSkillId: s.subSkill.id,
      subSkillName: s.subSkill.name,
      groupId: s.subSkill.group.id,
      groupName: s.subSkill.group.name,
      groupIcon: s.subSkill.group.icon,
      current: s.current,
      expected: s.expected,
      self: s.self,
      _g: s.subSkill.group.orderIndex,
      _s: s.subSkill.orderIndex,
    }))
    .sort((a, b) => a._g - b._g || a._s - b._s)
    .map(({ _g, _s, ...rest }) => rest);
}

const memberInclude = {
  role: { select: { name: true } },
  level: { select: { name: true } },
  scores: {
    include: {
      subSkill: {
        include: { group: true },
      },
    },
  },
} as const;

function shapeMember(m: {
  id: string;
  name: string;
  title: string;
  initials: string;
  color: string;
  status: string;
  roleId: string | null;
  levelId: string | null;
  role: { name: string } | null;
  level: { name: string } | null;
  scores: Parameters<typeof toScoreRows>[0];
}): MemberWithScores {
  return {
    id: m.id,
    name: m.name,
    title: m.title,
    initials: m.initials || initialsOf(m.name),
    color: m.color,
    status: m.status,
    roleId: m.roleId,
    levelId: m.levelId,
    roleName: m.role?.name ?? null,
    levelName: m.level?.name ?? null,
    scores: toScoreRows(m.scores),
  };
}

export async function getMember(
  orgId: string,
  memberId: string,
): Promise<MemberWithScores | null> {
  const m = await prisma.member.findFirst({
    where: { id: memberId, orgId },
    include: memberInclude,
  });
  return m ? shapeMember(m) : null;
}

export async function getMembers(orgId: string): Promise<MemberWithScores[]> {
  const rows = await prisma.member.findMany({
    where: { orgId },
    include: memberInclude,
    orderBy: { createdAt: "asc" },
  });
  return rows.map(shapeMember);
}

export function summarize(m: MemberWithScores): MemberSummary {
  const { scores, ...basic } = m;
  return {
    ...basic,
    avg: avgOf(scores),
    target: targetOf(scores),
    gap: gapOf(scores),
    gaps: gapCount(scores),
    readiness: readinessOf(scores),
    scoreCount: scores.length,
  };
}

export async function getTeamSummaries(orgId: string): Promise<MemberSummary[]> {
  const members = await getMembers(orgId);
  return members.map(summarize);
}

/** Lightweight member list for the header <select>. */
export async function getMemberOptions(orgId: string) {
  return prisma.member.findMany({
    where: { orgId },
    select: { id: true, name: true },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Resolve the "active" member for a per-member screen from a ?member= param,
 * falling back to the first member. Returns null when the org has no members.
 */
export async function resolveMember(
  orgId: string,
  requestedId?: string,
): Promise<MemberWithScores | null> {
  if (requestedId) {
    const m = await getMember(orgId, requestedId);
    if (m) return m;
  }
  const first = await prisma.member.findFirst({
    where: { orgId },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  return first ? getMember(orgId, first.id) : null;
}

// ─────────────────────────── Framework ───────────────────────────

export async function getFramework(orgId: string) {
  const [roles, skillGroups] = await Promise.all([
    prisma.jobRole.findMany({
      where: { orgId },
      orderBy: { orderIndex: "asc" },
      include: {
        levels: { orderBy: { orderIndex: "asc" } },
        skillGroups: { select: { groupId: true } },
        _count: { select: { members: true } },
      },
    }),
    prisma.skillGroup.findMany({
      where: { orgId },
      orderBy: { orderIndex: "asc" },
      include: {
        subSkills: { orderBy: { orderIndex: "asc" } },
        roles: { select: { roleId: true } },
      },
    }),
  ]);
  return { roles, skillGroups };
}

export async function getExpectedMatrix(orgId: string, roleId: string) {
  const rows = await prisma.expectedScore.findMany({
    where: { roleId, role: { orgId } },
  });
  const map: Record<string, number> = {};
  for (const r of rows) map[`${r.levelId}:${r.subSkillId}`] = r.value;
  return map;
}

// ─────────────────────────── Logs & inbox ───────────────────────────

export async function getLogs(orgId: string, memberId?: string) {
  return prisma.logEntry.findMany({
    where: { member: { orgId }, ...(memberId ? { memberId } : {}) },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true } } },
  });
}

export async function getInbox(orgId: string) {
  return prisma.inboxItem.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
    include: { member: { select: { id: true, name: true, color: true } } },
  });
}

export async function getOrgSources(orgId: string): Promise<Record<string, boolean>> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { sources: true },
  });
  return (org?.sources as Record<string, boolean>) || {};
}

// ─────────────────────────── Per-member extras ───────────────────────────

export async function getMemberExtras(memberId: string, userId: string) {
  const [goals, talkingPoints, checklist, note, simValues] = await Promise.all([
    prisma.goal.findMany({
      where: { memberId },
      orderBy: { orderIndex: "asc" },
    }),
    prisma.talkingPoint.findMany({
      where: { memberId },
      orderBy: { id: "asc" },
    }),
    prisma.checklistItem.findMany({
      where: { memberId },
      orderBy: { id: "asc" },
    }),
    prisma.memberNote.findUnique({
      where: { memberId_authorId: { memberId, authorId: userId } },
    }),
    prisma.simValue.findMany({ where: { memberId } }),
  ]);
  return { goals, talkingPoints, checklist, note, simValues };
}
