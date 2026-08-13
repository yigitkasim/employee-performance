import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getOrgContext, getInboxCount, getMembers } from "@/lib/data";
import { AppChrome } from "@/components/AppChrome";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const [{ org, cycles }, inboxCount, members] = await Promise.all([
    getOrgContext(session.orgId),
    getInboxCount(session.orgId),
    getMembers(session.orgId),
  ]);

  return (
    <AppChrome
      data={{
        orgName: org?.name ?? "Workspace",
        cycles: cycles.map((c) => ({ id: c.id, name: c.name, active: c.active })),
        userName: session.name,
        inboxCount,
        members: members.map((m) => ({ id: m.id, name: m.name, color: m.color })),
      }}
    >
      {children}
    </AppChrome>
  );
}
