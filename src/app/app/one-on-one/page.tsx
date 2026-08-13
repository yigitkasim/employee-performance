import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { resolveMember, getMemberOptions, getMemberExtras, getLogs } from "@/lib/data";
import { topGaps, fmtToday } from "@/lib/compute";
import { NoMembers } from "@/components/NoMembers";
import { OneOnOneClient } from "@/components/oneone/OneOnOneClient";

export default async function OneOnOnePage({
  searchParams,
}: {
  searchParams: Promise<{ member?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { member: memberId } = await searchParams;
  const m = await resolveMember(session.orgId, memberId);
  if (!m) return <NoMembers what="their 1:1 prep" />;

  const [members, extras, logs] = await Promise.all([
    getMemberOptions(session.orgId),
    getMemberExtras(m.id, session.userId),
    getLogs(session.orgId, m.id),
  ]);

  const logRows = logs.map((l) => ({
    id: l.id,
    date: fmtToday(l.createdAt),
    skillName: l.skillName,
    fromScore: l.fromScore,
    toScore: l.toScore,
    note: l.note,
  }));

  return (
    <OneOnOneClient
      member={{ id: m.id, name: m.name }}
      members={members}
      wins={logRows
        .filter((l) => l.fromScore != null && l.toScore != null && l.toScore > l.fromScore)
        .slice(0, 2)}
      gaps={topGaps(m.scores, 2)}
      talkingPoints={extras.talkingPoints.map((t) => ({
        id: t.id,
        text: t.text,
        checked: t.checked,
      }))}
      noteBody={extras.note?.body ?? ""}
      logs={logRows}
      goals={extras.goals.map((g) => ({ id: g.id, text: g.text, done: g.done }))}
    />
  );
}
