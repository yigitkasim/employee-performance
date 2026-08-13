import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authed, badRequest } from "@/lib/api-helpers";
import { createMemberWithDefaults } from "@/lib/members";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  title: z.string().max(120).optional(),
  roleId: z.string().nullish(),
  levelId: z.string().nullish(),
});

export async function POST(req: NextRequest) {
  const session = await authed();
  if (session instanceof NextResponse) return session;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return badRequest(parsed.error?.issues[0]?.message || "Invalid input");

  const member = await createMemberWithDefaults({
    orgId: session.orgId,
    name: parsed.data.name,
    title: parsed.data.title,
    roleId: parsed.data.roleId ?? null,
    levelId: parsed.data.levelId ?? null,
  });

  return NextResponse.json({ ok: true, id: member.id });
}
