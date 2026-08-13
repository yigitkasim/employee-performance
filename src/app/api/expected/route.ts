import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authed, badRequest, notFound } from "@/lib/api-helpers";

const schema = z.object({
  roleId: z.string(),
  levelId: z.string(),
  subSkillId: z.string(),
  value: z.number().int().min(1).max(5),
});

// Upsert one expected-matrix cell.
export async function PUT(req: NextRequest) {
  const session = await authed();
  if (session instanceof NextResponse) return session;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Invalid input");
  const { roleId, levelId, subSkillId, value } = parsed.data;

  // Verify the role belongs to the caller's org.
  const role = await prisma.jobRole.findFirst({
    where: { id: roleId, orgId: session.orgId },
    select: { id: true },
  });
  if (!role) return notFound();

  await prisma.expectedScore.upsert({
    where: { roleId_levelId_subSkillId: { roleId, levelId, subSkillId } },
    update: { value },
    create: { roleId, levelId, subSkillId, value },
  });
  return NextResponse.json({ ok: true });
}
