import { getSession } from "@/lib/auth";
import { getMembers } from "@/lib/data";
import { redirect } from "next/navigation";
import { NoMembers } from "@/components/NoMembers";
import { GapsClient } from "@/components/gaps/GapsClient";

export default async function GapsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const members = await getMembers(session.orgId);
  if (members.length === 0) return <NoMembers what="skill gaps" />;

  return <GapsClient members={members} />;
}
