import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authed, badRequest, notFound } from "@/lib/api-helpers";

const schema = z.object({ text: z.string().min(1).max(400) });

export async function POST(
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
  if (!parsed.success) return badRequest("Talking point text is required");

  const tp = await prisma.talkingPoint.create({
    data: { memberId, text: parsed.data.text, isCustom: true, checked: false },
  });
  return NextResponse.json({ ok: true, talkingPoint: tp });
}
