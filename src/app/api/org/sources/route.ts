import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authed, badRequest } from "@/lib/api-helpers";
import { DEFAULT_INBOX_SOURCES } from "@/lib/framework-template";

// The label is written straight into a JSON column, so it must be one of the
// known integrations. Previously any caller could invent unlimited keys of
// unlimited length and grow the row without bound.
const ALLOWED = Object.keys(DEFAULT_INBOX_SOURCES);

const schema = z
  .object({
    label: z.enum(ALLOWED as [string, ...string[]]),
    enabled: z.boolean(),
  })
  .strict();

export async function PATCH(req: NextRequest) {
  const session = await authed();
  if (session instanceof NextResponse) return session;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Unknown capture source");

  const org = await prisma.organization.findUnique({
    where: { id: session.orgId },
    select: { sources: true },
  });
  // Rebuild from the known set so unknown keys can never accumulate.
  const stored = (org?.sources as Record<string, boolean>) || {};
  const sources: Record<string, boolean> = {};
  for (const key of ALLOWED) {
    sources[key] = key in stored ? !!stored[key] : DEFAULT_INBOX_SOURCES[key];
  }
  sources[parsed.data.label] = parsed.data.enabled;

  await prisma.organization.update({
    where: { id: session.orgId },
    data: { sources },
  });
  return NextResponse.json({ ok: true });
}
