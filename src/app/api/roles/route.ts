import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authed, badRequest } from "@/lib/api-helpers";

const schema = z.object({
  name: z.string().min(1).max(120),
  icon: z.string().max(8).optional(),
  description: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  const session = await authed();
  if (session instanceof NextResponse) return session;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Role name is required");

  const count = await prisma.jobRole.count({ where: { orgId: session.orgId } });
  const role = await prisma.jobRole.create({
    data: {
      orgId: session.orgId,
      name: parsed.data.name,
      icon: parsed.data.icon || "📦",
      description: parsed.data.description || "",
      orderIndex: count,
    },
  });
  return NextResponse.json({ ok: true, id: role.id });
}
