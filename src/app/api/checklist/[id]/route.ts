import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authed, badRequest, notFound } from "@/lib/api-helpers";

const schema = z.object({ checked: z.boolean() });

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await authed();
  if (session instanceof NextResponse) return session;
  const { id } = await params;

  const item = await prisma.checklistItem.findFirst({
    where: { id, member: { orgId: session.orgId } },
  });
  if (!item) return notFound();

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Invalid input");

  await prisma.checklistItem.update({
    where: { id },
    data: { checked: parsed.data.checked },
  });
  return NextResponse.json({ ok: true });
}
