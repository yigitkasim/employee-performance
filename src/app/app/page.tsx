import { getSession } from "@/lib/auth";
import { getTeamSummaries, getFramework } from "@/lib/data";
import { redirect } from "next/navigation";
import { TeamClient } from "@/components/team/TeamClient";

export default async function TeamPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [summaries, framework] = await Promise.all([
    getTeamSummaries(session.orgId),
    getFramework(session.orgId),
  ]);

  const roles = framework.roles.map((r) => ({
    id: r.id,
    name: r.name,
    icon: r.icon,
    levels: r.levels.map((l) => ({ id: l.id, name: l.name })),
  }));

  return (
    <TeamClient
      summaries={summaries}
      roles={roles}
      hasFramework={framework.skillGroups.length > 0}
    />
  );
}
