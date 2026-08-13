import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authed, badRequest, notFound } from "@/lib/api-helpers";
import {
  ownedRoleId,
  ownedLevelId,
  ownedSubSkillId,
} from "@/lib/ownership";

const schema = z.object({
  roleId: z.string(),
  levelId: z.string(),
  subSkillId: z.string(),
  value: z.number().int().min(1).max(5),
});

// Upsert one expected-matrix cell.
export async function PUT(req: NextRequest) {
  const session = await authed();
  if (session instanceof NextResponse) return session;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Invalid input");
  const { roleId, levelId, subSkillId, value } = parsed.data;

  // All three ids arrive in the body, so all three must be org-scoped —
  // validating only the role would let a caller write a matrix row pointing at
  // another tenant's level or sub-skill.
  const [ownRole, ownLevel, ownSub] = await Promise.all([
    ownedRoleId(session.orgId, roleId),
    ownedLevelId(session.orgId, levelId, roleId),
    ownedSubSkillId(session.orgId, subSkillId),
  ]);
  if (!ownRole) return notFound("Role not found");
  if (!ownLevel) return notFound("Level not found");
  if (!ownSub) return notFound("Sub-skill not found");

  await prisma.expectedScore.upsert({
    where: { roleId_levelId_subSkillId: { roleId, levelId, subSkillId } },
    update: { value },
    create: { roleId, levelId, subSkillId, value },
  });
  return NextResponse.json({ ok: true });
}
