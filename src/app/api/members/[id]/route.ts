import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authed, badRequest, notFound } from "@/lib/api-helpers";
import { resyncMemberScores } from "@/lib/members";
import { ownedRoleId, ownedLevelId } from "@/lib/ownership";
import { initialsOf } from "@/lib/compute";

const schema = z.object({
  name: z.string().min(1).max(120).optional(),
  title: z.string().max(120).optional(),
  roleId: z.string().nullish(),
  levelId: z.string().nullish(),
  status: z
    .enum(["ON_TRACK", "PROMO_READY", "GROWING", "NEEDS_ATTENTION"])
    .optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await authed();
  if (session instanceof NextResponse) return session;
  const { id } = await params;

  const existing = await prisma.member.findFirst({
    where: { id, orgId: session.orgId },
  });
  if (!existing) return notFound();

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Invalid input");
  const d = parsed.data;

  // Body-supplied ids must belong to the caller's org, or they cross-link tenants.
  let nextRoleId = existing.roleId;
  if (d.roleId !== undefined) {
    nextRoleId = await ownedRoleId(session.orgId, d.roleId);
    if (d.roleId && !nextRoleId) return notFound("Role not found");
  }
  let nextLevelId = existing.levelId;
  if (d.levelId !== undefined) {
    nextLevelId = await ownedLevelId(session.orgId, d.levelId, nextRoleId);
    if (d.levelId && !nextLevelId) return notFound("Level not found");
  }

  const roleChanged = d.roleId !== undefined && nextRoleId !== existing.roleId;
  const levelChanged = d.levelId !== undefined && nextLevelId !== existing.levelId;

  const updated = await prisma.member.update({
    where: { id },
    data: {
      ...(d.name !== undefined ? { name: d.name, initials: initialsOf(d.name) } : {}),
      ...(d.title !== undefined ? { title: d.title } : {}),
      ...(d.roleId !== undefined ? { roleId: nextRoleId } : {}),
      ...(d.levelId !== undefined ? { levelId: nextLevelId } : {}),
      ...(d.status !== undefined ? { status: d.status } : {}),
    },
  });

  if (roleChanged || levelChanged) {
    await resyncMemberScores(
      session.orgId,
      id,
      updated.roleId,
      updated.levelId,
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await authed();
  if (session instanceof NextResponse) return session;
  const { id } = await params;

  const existing = await prisma.member.findFirst({
    where: { id, orgId: session.orgId },
  });
  if (!existing) return notFound();

  await prisma.member.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
