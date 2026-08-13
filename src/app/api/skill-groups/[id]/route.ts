import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authed, badRequest, notFound } from "@/lib/api-helpers";

const schema = z.object({
  name: z.string().min(1).max(120).optional(),
  icon: z.string().max(8).optional(),
});

async function owned(orgId: string, id: string) {
  return prisma.skillGroup.findFirst({ where: { id, orgId } });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await authed();
  if (session instanceof NextResponse) return session;
  const { id } = await params;
  if (!(await owned(session.orgId, id))) return notFound();

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Invalid input");

  await prisma.skillGroup.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await authed();
  if (session instanceof NextResponse) return session;
  const { id } = await params;
  if (!(await owned(session.orgId, id))) return notFound();

  await prisma.skillGroup.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
