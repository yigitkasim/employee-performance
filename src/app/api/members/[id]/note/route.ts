import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authed, badRequest, notFound } from "@/lib/api-helpers";

const schema = z.object({ body: z.string().max(5000) });

// Upsert the current user's private 1:1 note for a member.
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await authed();
  if (session instanceof NextResponse) return session;
  const { id: memberId } = await params;

  const member = await prisma.member.findFirst({
    where: { id: memberId, orgId: session.orgId },
  });
  if (!member) return notFound();

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Invalid input");

  await prisma.memberNote.upsert({
    where: { memberId_authorId: { memberId, authorId: session.userId } },
    update: { body: parsed.data.body },
    create: { memberId, authorId: session.userId, body: parsed.data.body },
  });
  return NextResponse.json({ ok: true });
}
