import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getInbox, getOrgSources, getLogs } from "@/lib/data";
import { InboxClient } from "@/components/inbox/InboxClient";

export default async function InboxPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [items, sources, logs] = await Promise.all([
    getInbox(session.orgId),
    getOrgSources(session.orgId),
    getLogs(session.orgId),
  ]);

  // "This week" — real numbers derived from the log (last 7 days).
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recent = logs.filter((l) => l.createdAt.getTime() >= weekAgo);
  const filed = recent.length;
  const bumped = recent.filter((l) => l.toScore !== l.fromScore).length;

  return (
    <InboxClient
      items={items.map((i) => ({
        id: i.id,
        source: i.source,
        text: i.text,
        skillName: i.skillName,
        createdAt: i.createdAt.toISOString(),
        member: i.member
          ? { id: i.member.id, name: i.member.name, color: i.member.color }
          : null,
      }))}
      sources={sources}
      stats={{ filed, bumped }}
    />
  );
}
