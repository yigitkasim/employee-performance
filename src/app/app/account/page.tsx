import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AccountClient } from "@/components/account/AccountClient";

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [user, org, memberCount, userCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        name: true,
        email: true,
        role: true,
        createdAt: true,
        marketingOptIn: true,
        termsAcceptedAt: true,
      },
    }),
    prisma.organization.findUnique({
      where: { id: session.orgId },
      select: { name: true },
    }),
    prisma.member.count({ where: { orgId: session.orgId } }),
    prisma.user.count({ where: { orgId: session.orgId } }),
  ]);

  if (!user) redirect("/login");

  return (
    <AccountClient
      name={user.name}
      email={user.email}
      role={user.role}
      orgName={org?.name ?? "Workspace"}
      createdAt={user.createdAt.toISOString()}
      termsAcceptedAt={user.termsAcceptedAt?.toISOString() ?? null}
      marketingOptIn={user.marketingOptIn}
      memberCount={memberCount}
      isOnlyUser={userCount <= 1}
    />
  );
}
