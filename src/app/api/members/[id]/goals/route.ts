import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authed, badRequest, notFound } from "@/lib/api-helpers";

const schema = z.object({
  text: z.string().min(1).max(400),
  due: z.string().max(60).optional(),
});

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
  if (!parsed.success) return badRequest("Goal text is required");

  const count = await prisma.goal.count({ where: { memberId } });
  const goal = await prisma.goal.create({
    data: {
      memberId,
      text: parsed.data.text,
      due: parsed.data.due || "",
      orderIndex: count,
    },
  });
  return NextResponse.json({ ok: true, goal });
}
