import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { resolveMember, getMemberOptions, getMemberExtras } from "@/lib/data";
import { NoMembers } from "@/components/NoMembers";
import { SimClient } from "@/components/sim/SimClient";

export default async function SimulatorPage({
  searchParams,
}: {
  searchParams: Promise<{ member?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { member: memberId } = await searchParams;
  const m = await resolveMember(session.orgId, memberId);
  if (!m) return <NoMembers what="the growth simulator" />;

  const [members, extras] = await Promise.all([
    getMemberOptions(session.orgId),
    getMemberExtras(m.id, session.userId),
  ]);

  return (
    <SimClient
      key={m.id}
      member={m}
      members={members}
      savedSim={extras.simValues.map((s) => ({
        subSkillId: s.subSkillId,
        value: s.value,
      }))}
    />
  );
}
