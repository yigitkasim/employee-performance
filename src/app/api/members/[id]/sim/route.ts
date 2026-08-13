import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authed, badRequest, notFound } from "@/lib/api-helpers";

const schema = z.object({
  subSkillId: z.string(),
  value: z.number().int().min(1).max(5),
});

async function ownMember(orgId: string, id: string) {
  return prisma.member.findFirst({ where: { id, orgId } });
}

// Set a simulated target value for one sub-skill (does not touch real scores).
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await authed();
  if (session instanceof NextResponse) return session;
  const { id: memberId } = await params;
  if (!(await ownMember(session.orgId, memberId))) return notFound();

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Invalid input");
  const { subSkillId, value } = parsed.data;

  await prisma.simValue.upsert({
    where: { memberId_subSkillId: { memberId, subSkillId } },
    update: { value },
    create: { memberId, subSkillId, value },
  });
  return NextResponse.json({ ok: true });
}

// Reset all simulator values for a member.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await authed();
  if (session instanceof NextResponse) return session;
  const { id: memberId } = await params;
  if (!(await ownMember(session.orgId, memberId))) return notFound();

  await prisma.simValue.deleteMany({ where: { memberId } });
  return NextResponse.json({ ok: true });
}
