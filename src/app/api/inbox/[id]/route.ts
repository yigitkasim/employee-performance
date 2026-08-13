import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authed, notFound } from "@/lib/api-helpers";

// Archive (delete) an inbox item.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await authed();
  if (session instanceof NextResponse) return session;
  const { id } = await params;

  const item = await prisma.inboxItem.findFirst({
    where: { id, orgId: session.orgId },
  });
  if (!item) return notFound();

  await prisma.inboxItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
