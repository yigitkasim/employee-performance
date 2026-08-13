import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authed, badRequest } from "@/lib/api-helpers";
import { firstName } from "@/lib/compute";

const schema = z.object({
  text: z.string().min(1).max(1000),
  source: z.string().optional(),
});

/** Detect which member a note mentions by first name. */
async function detectMember(orgId: string, text: string): Promise<string | null> {
  const members = await prisma.member.findMany({
    where: { orgId },
    select: { id: true, name: true },
  });
  const lower = text.toLowerCase();
  const hit = members.find((m) => lower.includes(firstName(m.name).toLowerCase()));
  return hit?.id ?? null;
}

export async function POST(req: NextRequest) {
  const session = await authed();
  if (session instanceof NextResponse) return session;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("A note is required");

  const memberId = await detectMember(session.orgId, parsed.data.text);
  const item = await prisma.inboxItem.create({
    data: {
      orgId: session.orgId,
      text: parsed.data.text,
      source: parsed.data.source || "⌨ Quick",
      memberId,
    },
  });
  return NextResponse.json({ ok: true, item });
}
