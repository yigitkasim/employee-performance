"use client";

import { useMemo } from "react";
import { Card, PageHeader } from "@/components/primitives";
import { useToast } from "@/components/ui/Toast";
import { firstName } from "@/lib/compute";
import type { MemberWithScores } from "@/lib/data";

type TopGap = { name: string; avgGap: number; below: number };

/** First ~4 sub-skills of each skill group across the team, deduped by name. */
function heatmapSkills(members: MemberWithScores[]): string[] {
  const groups: { name: string; skills: string[] }[] = [];
  const byGroup = new Map<string, Set<string>>();
  const seen = new Set<string>();
  for (const m of members) {
    for (const s of m.scores) {
      let set = byGroup.get(s.groupName);
      if (!set) {
        set = new Set();
        byGroup.set(s.groupName, set);
        groups.push({ name: s.groupName, skills: [] });
      }
      if (!set.has(s.subSkillName)) {
        set.add(s.subSkillName);
        groups.find((g) => g.name === s.groupName)!.skills.push(s.subSkillName);
      }
    }
  }
  const out: string[] = [];
  for (const g of groups) {
    for (const name of g.skills.slice(0, 4)) {
      if (!seen.has(name)) {
        seen.add(name);
        out.push(name);
      }
    }
  }
  return out;
}

export function GapsClient({ members }: { members: MemberWithScores[] }) {
  const toast = useToast();

  const scoreMaps = useMemo(
    () =>
      members.map((m) => {
        const map = new Map<string, { c: number; e: number }>();
        for (const s of m.scores)
          map.set(s.subSkillName, { c: s.current, e: s.expected });
        return map;
      }),
    [members],
  );

  const top: TopGap[] = useMemo(() => {
    const agg: Record<string, { gapSum: number; below: number }> = {};
    scoreMaps.forEach((map) => {
      map.forEach((v, n) => {
        agg[n] = agg[n] || { gapSum: 0, below: 0 };
        const g = v.e - v.c;
        agg[n].gapSum += Math.max(0, g);
        if (g >= 1) agg[n].below++;
      });
    });
    return Object.entries(agg)
      .map(([name, a]) => ({
        name,
        avgGap: a.gapSum / members.length,
        below: a.below,
      }))
      .sort((a, b) => b.avgGap - a.avgGap)
      .slice(0, 5);
  }, [scoreMaps, members.length]);

  const maxGap = Math.max(0.1, top[0] ? top[0].avgGap : 1);

  const skills = useMemo(() => heatmapSkills(members), [members]);

  const coaching = useMemo(() => {
    const tips: string[] = [];
    // find mentors: someone at 5 on a skill where ≥2 others have gap ≥1
    const names: Record<string, { expert: string | null; needy: number }> = {};
    members.forEach((m, i) => {
      scoreMaps[i].forEach((v, n) => {
        names[n] = names[n] || { expert: null, needy: 0 };
        if (v.c >= 5) names[n].expert = names[n].expert || firstName(m.name);
        if (v.e - v.c >= 1) names[n].needy++;
      });
    });
    Object.entries(names)
      .filter(([, x]) => x.expert && x.needy >= 2)
      .sort((a, b) => b[1].needy - a[1].needy)
      .slice(0, 3)
      .forEach(([n, x]) => tips.push(`${x.expert} can mentor ${x.needy} on ${n}`));
    return tips.length
      ? tips
      : ["No clear mentor pairings yet — rate more skills."];
  }, [members, scoreMaps]);

  const wins = useMemo(() => {
    const out: string[] = [];
    const oneAway: Record<string, number> = {};
    scoreMaps.forEach((map) => {
      map.forEach((v, n) => {
        if (v.e - v.c === 1) oneAway[n] = (oneAway[n] || 0) + 1;
      });
    });
    Object.entries(oneAway)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .forEach(([n, c]) =>
        out.push(`${c} ${c > 1 ? "people are" : "person is"} 1pt from target on ${n}`),
      );
    return out.length ? out : ["Nothing within a 1-pt reach right now."];
  }, [scoreMaps]);

  const risks = useMemo(() => {
    const out: string[] = [];
    const atTarget: Record<string, number> = {};
    scoreMaps.forEach((map) => {
      map.forEach((v, n) => {
        atTarget[n] = atTarget[n] || 0;
        if (v.c >= v.e) atTarget[n]++;
      });
    });
    Object.entries(atTarget)
      .filter(([, c]) => c <= 1)
      .slice(0, 2)
      .forEach(([n, c]) => out.push(`${n}: only ${c} at target across the team`));
    return out.length ? out : ["No coverage risks right now."];
  }, [scoreMaps]);

  return (
    <>
      <PageHeader
        title="Skill gaps"
        subtitle="Live from current ratings — where coaching investment will pay off most."
        actions={
          <>
            <button
              onClick={() => toast("Role filter is not available yet")}
              className="text-sm border border-slate-200 rounded-md px-3 py-1.5"
            >
              Filter: All roles ▾
            </button>
            <button
              onClick={() => toast("Export is not available yet")}
              className="text-sm border border-slate-200 rounded-md px-3 py-1.5"
            >
              Export ↗
            </button>
          </>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-5">
        <Card className="p-5">
          <div className="font-semibold mb-3">Top team-wide gaps</div>
          <ul className="space-y-3">
            {top.map(({ name, avgGap, below }) => (
              <li key={name}>
                <div className="flex justify-between">
                  <span className="text-sm">{name}</span>
                  <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 rounded">
                    {below} below target
                  </span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-amber-500"
                    style={{ width: `${(avgGap / maxGap) * 100}%` }}
                  />
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  avg gap {avgGap.toFixed(1)} pts
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="col-span-2 p-5">
          <div className="flex justify-between items-center mb-3">
            <div className="font-semibold">Heatmap · skills × people</div>
            <div className="flex gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm" style={{ background: "#fee2e2" }} />
                Big gap
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm" style={{ background: "#fef3c7" }} />
                Some gap
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm" style={{ background: "#d1fae5" }} />
                At target
              </span>
            </div>
          </div>
          <div className="overflow-auto scroll-area">
            <table className="border-separate border-spacing-1 text-xs">
              <thead>
                <tr>
                  <th />
                  {members.map((m) => (
                    <th key={m.id} className="px-1 align-bottom">
                      <div
                        style={{
                          writingMode: "vertical-rl",
                          transform: "rotate(180deg)",
                          fontWeight: 500,
                          color: "#475569",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {firstName(m.name)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {skills.map((name) => (
                  <tr key={name}>
                    <td className="text-right pr-2 text-xs text-slate-700 whitespace-nowrap">
                      {name}
                    </td>
                    {members.map((m, i) => {
                      const v = scoreMaps[i].get(name);
                      if (!v) return <td key={m.id} />;
                      const gap = Math.max(0, Math.min(3, v.e - v.c));
                      const bg =
                        gap === 0
                          ? "#d1fae5"
                          : gap === 1
                            ? "#fef3c7"
                            : gap === 2
                              ? "#fed7aa"
                              : "#fee2e2";
                      return (
                        <td key={m.id}>
                          <div
                            className="heatcell"
                            style={{ background: bg }}
                            title={`${firstName(m.name)} · ${name}: ${v.c} of ${v.e}`}
                          >
                            {gap === 0 ? "✓" : gap}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="font-semibold mb-2 text-emerald-700">
            Coaching opportunities
          </div>
          <ul className="text-sm text-slate-700 space-y-1.5 list-disc list-inside">
            {coaching.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <div className="font-semibold mb-2 text-blue-700">Quick wins</div>
          <ul className="text-sm text-slate-700 space-y-1.5 list-disc list-inside">
            {wins.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <div className="font-semibold mb-2 text-amber-700">Risks</div>
          <ul className="text-sm text-slate-700 space-y-1.5 list-disc list-inside">
            {risks.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
