import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  getMembers,
  getMemberExtras,
  getLogs,
  getFramework,
} from "@/lib/data";
import { readinessOf, catAvgs, fmtToday } from "@/lib/compute";
import { NoMembers } from "@/components/NoMembers";
import { PromotionClient } from "@/components/promotion/PromotionClient";

export default async function PromotionPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [members, framework] = await Promise.all([
    getMembers(session.orgId),
    getFramework(session.orgId),
  ]);
  if (members.length === 0) return <NoMembers what="promotion readiness" />;

  function nextLevelName(
    roleId: string | null,
    levelId: string | null,
  ): string {
    if (!roleId || !levelId) return "next level";
    const role = framework.roles.find((r) => r.id === roleId);
    if (!role) return "next level";
    const idx = role.levels.findIndex((l) => l.id === levelId);
    if (idx < 0) return "next level";
    return role.levels[idx + 1]?.name ?? "—";
  }

  const ranked = members
    .map((m) => ({ m, r: readinessOf(m.scores) }))
    .sort((a, b) => b.r - a.r);
  const star = ranked[0].m;

  const [extras, logs] = await Promise.all([
    getMemberExtras(star.id, session.userId),
    getLogs(session.orgId, star.id),
  ]);

  const evidence = logs
    .filter((l) => l.toScore > l.fromScore)
    .slice(0, 3)
    .map((l) => ({
      id: l.id,
      note: l.note,
      skillName: l.skillName,
      fromScore: l.fromScore,
      toScore: l.toScore,
      date: fmtToday(l.createdAt),
    }));

  return (
    <PromotionClient
      star={{
        id: star.id,
        name: star.name,
        title: star.title,
        initials: star.initials,
        color: star.color,
        status: star.status,
        levelName: star.levelName,
        nextLevel: nextLevelName(star.roleId, star.levelId),
        readiness: ranked[0].r,
        cats: catAvgs(star.scores).map((c) => ({
          cat: c.cat,
          cur: +c.cur.toFixed(2),
          exp: +c.exp.toFixed(2),
        })),
      }}
      checklist={extras.checklist.map((c) => ({
        id: c.id,
        label: c.label,
        checked: c.checked,
      }))}
      evidence={evidence}
      others={ranked.slice(1, 4).map(({ m, r }) => ({
        id: m.id,
        name: m.name,
        levelName: m.levelName,
        nextLevel: nextLevelName(m.roleId, m.levelId),
        readiness: r,
      }))}
    />
  );
}
