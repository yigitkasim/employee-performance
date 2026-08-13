import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authed, badRequest, notFound } from "@/lib/api-helpers";

const schema = z.object({ note: z.string().max(1000) });

async function owned(orgId: string, id: string) {
  return prisma.logEntry.findFirst({ where: { id, member: { orgId } } });
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

  await prisma.logEntry.update({
    where: { id },
    data: { note: parsed.data.note },
  });
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

  await prisma.logEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
