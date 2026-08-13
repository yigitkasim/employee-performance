import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  resolveMember,
  getMemberOptions,
  getMemberExtras,
  getLogs,
  getFramework,
} from "@/lib/data";
import { NoMembers } from "@/components/NoMembers";
import { ProfileClient } from "@/components/profile/ProfileClient";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ member?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { member: memberId } = await searchParams;
  const m = await resolveMember(session.orgId, memberId);
  if (!m) return <NoMembers what="their profile" />;

  const [members, extras, logs, framework] = await Promise.all([
    getMemberOptions(session.orgId),
    getMemberExtras(m.id, session.userId),
    getLogs(session.orgId, m.id),
    getFramework(session.orgId),
  ]);

  const roles = framework.roles.map((r) => ({
    id: r.id,
    name: r.name,
    icon: r.icon,
    levels: r.levels.map((l) => ({ id: l.id, name: l.name })),
  }));

  const goals = extras.goals.map((g) => ({
    id: g.id,
    text: g.text,
    due: g.due,
    done: g.done,
  }));

  const recentLogs = logs.slice(0, 3).map((l) => ({
    id: l.id,
    skillName: l.skillName,
    fromScore: l.fromScore,
    toScore: l.toScore,
    note: l.note,
    createdAt: l.createdAt.toISOString(),
  }));

  return (
    <ProfileClient
      key={m.id}
      member={m}
      members={members}
      goals={goals}
      logs={recentLogs}
      roles={roles}
    />
  );
}
