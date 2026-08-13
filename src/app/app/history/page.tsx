import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { resolveMember, getMemberOptions, getLogs } from "@/lib/data";
import { NoMembers } from "@/components/NoMembers";
import { HistoryClient } from "@/components/history/HistoryClient";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ member?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { member: memberId } = await searchParams;
  const m = await resolveMember(session.orgId, memberId);
  if (!m) return <NoMembers what="their history" />;

  const [members, logs] = await Promise.all([
    getMemberOptions(session.orgId),
    getLogs(session.orgId, m.id),
  ]);

  return (
    <HistoryClient
      member={{ id: m.id, name: m.name }}
      members={members}
      logs={logs.map((l) => ({
        id: l.id,
        skillName: l.skillName,
        fromScore: l.fromScore,
        toScore: l.toScore,
        note: l.note,
        author: l.author?.name ?? null,
        createdAt: l.createdAt.toISOString(),
      }))}
    />
  );
}
