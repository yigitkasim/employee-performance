import { redirect } from "next/navigation";
import { getVerifiedSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getOrgContext, getInboxCount, getMembers } from "@/lib/data";
import { AppChrome } from "@/components/AppChrome";
import { VerifyBanner } from "@/components/VerifyBanner";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Full check: rejects sessions issued before a password reset, and suspended users.
  const session = await getVerifiedSession();
  if (!session) redirect("/login");

  const [{ org, cycles }, inboxCount, members, user] = await Promise.all([
    getOrgContext(session.orgId),
    getInboxCount(session.orgId),
    getMembers(session.orgId),
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { email: true, emailVerifiedAt: true },
    }),
  ]);

  return (
    <>
      {user && !user.emailVerifiedAt && <VerifyBanner email={user.email} />}
      <AppChrome
        data={{
          orgName: org?.name ?? "Workspace",
          cycles: cycles.map((c) => ({
            id: c.id,
            name: c.name,
            active: c.active,
          })),
          userName: session.name,
          inboxCount,
          members: members.map((m) => ({
            id: m.id,
            name: m.name,
            color: m.color,
          })),
        }}
      >
        {children}
      </AppChrome>
    </>
  );
}
