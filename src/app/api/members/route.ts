import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authed, badRequest, notFound } from "@/lib/api-helpers";
import { createMemberWithDefaults } from "@/lib/members";
import { ownedRoleId, ownedLevelId } from "@/lib/ownership";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  title: z.string().max(120).optional(),
  roleId: z.string().nullish(),
  levelId: z.string().nullish(),
});

export async function POST(req: NextRequest) {
  const session = await authed();
  if (session instanceof NextResponse) return session;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return badRequest(parsed.error?.issues[0]?.message || "Invalid input");

  // Body-supplied ids must belong to the caller's org, or they cross-link tenants.
  const roleId = await ownedRoleId(session.orgId, parsed.data.roleId);
  if (parsed.data.roleId && !roleId) return notFound("Role not found");
  const levelId = await ownedLevelId(session.orgId, parsed.data.levelId, roleId);
  if (parsed.data.levelId && !levelId) return notFound("Level not found");

  const member = await createMemberWithDefaults({
    orgId: session.orgId,
    name: parsed.data.name,
    title: parsed.data.title,
    roleId,
    levelId,
  });

  return NextResponse.json({ ok: true, id: member.id });
}
