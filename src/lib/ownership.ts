import "server-only";
import { prisma } from "./db";

/**
 * Tenancy guards for IDs that arrive in a REQUEST BODY.
 *
 * Guarding the id in the URL is not enough: a caller can pass another
 * organisation's roleId / levelId / subSkillId inside the JSON payload. Left
 * unchecked that cross-links records between tenants — leaking one org's
 * framework names into another's UI, inflating member counts, and (because
 * Score.subSkill cascades on delete) letting one org destroy another's ratings
 * by deleting its own skill group.
 *
 * Every route that accepts one of these ids in a body must resolve it here
 * first and treat `null` as "not found".
 */

/** Returns the roleId if it belongs to this org, else null. */
export async function ownedRoleId(
  orgId: string,
  roleId: string | null | undefined,
): Promise<string | null> {
  if (!roleId) return null;
  const row = await prisma.jobRole.findFirst({
    where: { id: roleId, orgId },
    select: { id: true },
  });
  return row?.id ?? null;
}

/** Returns the levelId if it belongs to this org (optionally to a given role). */
export async function ownedLevelId(
  orgId: string,
  levelId: string | null | undefined,
  roleId?: string | null,
): Promise<string | null> {
  if (!levelId) return null;
  const row = await prisma.level.findFirst({
    where: {
      id: levelId,
      role: { orgId, ...(roleId ? { id: roleId } : {}) },
    },
    select: { id: true },
  });
  return row?.id ?? null;
}

/** Returns the subSkillId if it belongs to this org, else null. */
export async function ownedSubSkillId(
  orgId: string,
  subSkillId: string | null | undefined,
): Promise<string | null> {
  if (!subSkillId) return null;
  const row = await prisma.subSkill.findFirst({
    where: { id: subSkillId, group: { orgId } },
    select: { id: true },
  });
  return row?.id ?? null;
}

/** Returns the skill group id if it belongs to this org, else null. */
export async function ownedGroupId(
  orgId: string,
  groupId: string | null | undefined,
): Promise<string | null> {
  if (!groupId) return null;
  const row = await prisma.skillGroup.findFirst({
    where: { id: groupId, orgId },
    select: { id: true },
  });
  return row?.id ?? null;
}
