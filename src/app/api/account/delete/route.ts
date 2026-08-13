import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authed, badRequest } from "@/lib/api-helpers";
import { verifyPassword, destroySession } from "@/lib/auth";

const schema = z.object({
  password: z.string().min(1, "Password is required"),
});

/**
 * Right to erasure — GDPR/UK GDPR Art. 17, KVKK Art. 7 & 11, CCPA/CPRA right to
 * delete, PIPEDA withdrawal of consent.
 *
 * Deleting the last remaining user of an organisation deletes the whole
 * organisation, which cascades to every member, score, log and note.
 */
export async function POST(req: NextRequest) {
  const session = await authed();
  if (session instanceof NextResponse) return session;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message || "Invalid input");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, orgId: true, passwordHash: true },
  });
  if (!user) {
    await destroySession();
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) {
    return NextResponse.json(
      { error: "That password is not correct. Your account was not deleted." },
      { status: 403 },
    );
  }

  const userCount = await prisma.user.count({ where: { orgId: user.orgId } });
  const deleteWholeOrg = userCount <= 1;

  // Written BEFORE the delete so the record exists. actorId is set to NULL by
  // the SetNull relation when the user row goes — intended: the audit entry
  // survives, the identity does not.
  await prisma.auditLog.create({
    data: {
      action: "account.delete",
      detail: user.orgId,
      actorId: user.id,
    },
  });

  if (deleteWholeOrg) {
    await prisma.organization.delete({ where: { id: user.orgId } });
  } else {
    await prisma.user.delete({ where: { id: user.id } });
  }

  await destroySession();

  return NextResponse.json({ ok: true });
}
