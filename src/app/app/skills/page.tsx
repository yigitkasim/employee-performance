import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { resolveMember, getMemberOptions } from "@/lib/data";
import { NoMembers } from "@/components/NoMembers";
import { SkillsClient } from "@/components/skills/SkillsClient";

export default async function SkillsPage({
  searchParams,
}: {
  searchParams: Promise<{ member?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { member: memberId } = await searchParams;
  const m = await resolveMember(session.orgId, memberId);
  if (!m) return <NoMembers what="their skill ratings" />;

  const members = await getMemberOptions(session.orgId);

  return <SkillsClient key={m.id} member={m} members={members} />;
}
