import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authed } from "@/lib/api-helpers";

/**
 * Data portability endpoint — GDPR Art. 20, UK GDPR Art. 20, KVKK Art. 11,
 * CCPA/CPRA right to know, PIPEDA Principle 9.
 *
 * Returns a complete, machine-readable JSON copy of the caller's profile and
 * their whole organisation's data as a file download.
 */
export async function GET() {
  const session = await authed();
  if (session instanceof NextResponse) return session;

  const orgId = session.orgId;

  const [
    user,
    organization,
    cycles,
    jobRoles,
    skillGroups,
    expectedScores,
    members,
    logEntries,
    inboxItems,
    goals,
    talkingPoints,
    checklistItems,
    memberNotes,
    simValues,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      // Explicitly selected — passwordHash is never exported.
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        emailVerifiedAt: true,
        termsAcceptedAt: true,
        marketingOptIn: true,
        suspendedAt: true,
        orgId: true,
      },
    }),
    prisma.organization.findUnique({ where: { id: orgId } }),
    prisma.cycle.findMany({ where: { orgId }, orderBy: { name: "asc" } }),
    prisma.jobRole.findMany({
      where: { orgId },
      orderBy: { orderIndex: "asc" },
      include: {
        levels: { orderBy: { orderIndex: "asc" } },
        skillGroups: { select: { groupId: true } },
      },
    }),
    prisma.skillGroup.findMany({
      where: { orgId },
      orderBy: { orderIndex: "asc" },
      include: { subSkills: { orderBy: { orderIndex: "asc" } } },
    }),
    prisma.expectedScore.findMany({ where: { role: { orgId } } }),
    prisma.member.findMany({
      where: { orgId },
      orderBy: { createdAt: "asc" },
      include: { scores: true },
    }),
    prisma.logEntry.findMany({
      where: { member: { orgId } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.inboxItem.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.goal.findMany({ where: { member: { orgId } } }),
    prisma.talkingPoint.findMany({ where: { member: { orgId } } }),
    prisma.checklistItem.findMany({ where: { member: { orgId } } }),
    prisma.memberNote.findMany({ where: { member: { orgId } } }),
    prisma.simValue.findMany({ where: { member: { orgId } } }),
  ]);

  const exportedAt = new Date();

  const payload = {
    meta: {
      product: "GrowthMatrix",
      format: "growthmatrix.export.v1",
      exportedAt: exportedAt.toISOString(),
      requestedBy: { userId: session.userId, email: session.email },
      note:
        "Complete machine-readable copy of your account and your organisation's data (GDPR Art. 20 / KVKK Art. 11 / CCPA / PIPEDA). Password hashes are never included.",
    },
    user,
    organization,
    cycles,
    jobRoles,
    skillGroups,
    expectedScores,
    members,
    logEntries,
    inboxItems,
    goals,
    talkingPoints,
    checklistItems,
    memberNotes,
    simValues,
  };

  await prisma.auditLog.create({
    data: {
      action: "data.export",
      detail: `org:${orgId}`,
      actorId: session.userId,
    },
  });

  const stamp = exportedAt.toISOString().slice(0, 10);

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="growthmatrix-export-${stamp}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
