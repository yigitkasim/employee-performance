import { getSession } from "@/lib/auth";
import { getMembers } from "@/lib/data";
import { redirect } from "next/navigation";
import { NoMembers } from "@/components/NoMembers";
import { CompareClient } from "@/components/compare/CompareClient";

export default async function ComparePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const members = await getMembers(session.orgId);
  if (members.length === 0) return <NoMembers what="a comparison" />;

  return <CompareClient members={members} />;
}
