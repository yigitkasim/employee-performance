import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authed, badRequest } from "@/lib/api-helpers";

const schema = z.object({ label: z.string().min(1), enabled: z.boolean() });

// Toggle one inbox source integration on the org.
export async function PATCH(req: NextRequest) {
  const session = await authed();
  if (session instanceof NextResponse) return session;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Invalid input");

  const org = await prisma.organization.findUnique({
    where: { id: session.orgId },
    select: { sources: true },
  });
  const sources = { ...((org?.sources as Record<string, boolean>) || {}) };
  sources[parsed.data.label] = parsed.data.enabled;

  await prisma.organization.update({
    where: { id: session.orgId },
    data: { sources },
  });
  return NextResponse.json({ ok: true });
}
