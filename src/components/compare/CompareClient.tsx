"use client";

import { useMemo, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { Card, PageHeader } from "@/components/primitives";
import { RadarChart } from "@/components/RadarChart";
import { useToast } from "@/components/ui/Toast";
import { avgOf, targetOf, gapOf, catAvgs } from "@/lib/compute";
import type { MemberWithScores } from "@/lib/data";

const GRID_COLS: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
};

/** First 3 sub-skills of each skill group, from any selected member's scores. */
function catalogRows(selected: MemberWithScores[]) {
  const groups: { cat: string; names: string[] }[] = [];
  const byGroup = new Map<string, Set<string>>();
  for (const m of selected) {
    for (const s of m.scores) {
      let set = byGroup.get(s.groupName);
      if (!set) {
        set = new Set();
        byGroup.set(s.groupName, set);
        groups.push({ cat: s.groupName, names: [] });
      }
      if (!set.has(s.subSkillName)) {
        set.add(s.subSkillName);
        groups.find((g) => g.cat === s.groupName)!.names.push(s.subSkillName);
      }
    }
  }
  return groups.flatMap(({ cat, names }) =>
    names.slice(0, 3).map((name) => ({ cat, name })),
  );
}

export function CompareClient({ members }: { members: MemberWithScores[] }) {
  const toast = useToast();
  const [ids, setIds] = useState<string[]>(() =>
    members.slice(0, 3).map((m) => m.id),
  );

  const selected = useMemo(
    () =>
      ids
        .map((id) => members.find((m) => m.id === id))
        .filter((m): m is MemberWithScores => !!m),
    [ids, members],
  );
  const remaining = members.filter((m) => !ids.includes(m.id));

  const scoreMaps = useMemo(
    () =>
      selected.map((m) => {
        const map = new Map<string, { c: number; e: number }>();
        for (const s of m.scores)
          map.set(s.subSkillName, { c: s.current, e: s.expected });
        return map;
      }),
    [selected],
  );

  const rows = useMemo(() => catalogRows(selected), [selected]);

  function addCompare(id: string) {
    setIds((cur) => (cur.includes(id) || cur.length >= 4 ? cur : [...cur, id]));
  }
  function removeCompare(id: string) {
    setIds((cur) => {
      const next = cur.filter((x) => x !== id);
      return next.length ? next : [members[0].id];
    });
  }

  return (
    <>
      <PageHeader
        title="Compare members"
        subtitle="Side-by-side, live scores. Add up to 4."
        actions={
          <>
            {ids.length < 4 && remaining.length > 0 && (
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) addCompare(e.target.value);
                }}
                className="text-sm border border-slate-200 rounded-md px-3 py-1.5 bg-white"
              >
                <option value="">+ Add member…</option>
                {remaining.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={() => toast("Export is not available yet")}
              className="text-sm border border-slate-200 rounded-md px-3 py-1.5"
            >
              Export ↗
            </button>
          </>
        }
      />

      <div
        className={`grid ${GRID_COLS[Math.min(4, Math.max(2, selected.length))]} gap-4 mb-5`}
      >
        {selected.map((m) => {
          const cats = catAvgs(m.scores);
          return (
            <Card key={m.id} className="p-5">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <Avatar
                    name={m.name}
                    color={m.color}
                    initials={m.initials}
                    size="sm"
                  />
                  <div>
                    <div className="font-medium">{m.name}</div>
                    <div className="text-xs text-slate-500">
                      {m.title}
                      {m.levelName ? ` · ${m.levelName}` : ""}
                    </div>
                  </div>
                </div>
                {selected.length > 1 && (
                  <button
                    onClick={() => removeCompare(m.id)}
                    className="text-slate-300 hover:text-slate-500"
                    title="Remove"
                  >
                    ✕
                  </button>
                )}
              </div>
              <RadarChart
                labels={cats.map((x) => x.cat.replace(" Skills", ""))}
                datasets={[
                  {
                    data: cats.map((x) => +x.cur.toFixed(2)),
                    color: "#4f46e5",
                    fill: "rgba(79,70,229,0.25)",
                  },
                  {
                    data: cats.map((x) => +x.exp.toFixed(2)),
                    color: "#a5b4fc",
                    fill: "rgba(199,210,254,0.30)",
                    dashed: true,
                  },
                ]}
                height={180}
                pointLabelSize={9}
              />
              <div className="flex justify-between text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
                <span>
                  avg{" "}
                  <strong className="text-slate-700">
                    {avgOf(m.scores).toFixed(1)}
                  </strong>
                </span>
                <span>
                  target{" "}
                  <strong className="text-slate-700">
                    {targetOf(m.scores).toFixed(1)}
                  </strong>
                </span>
                <span>
                  gap{" "}
                  <strong className="text-amber-600">
                    {gapOf(m.scores).toFixed(1)}
                  </strong>
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 font-semibold">
          Side-by-side · top skills per category
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="text-left py-2 px-4 font-medium">Skill</th>
              {selected.map((m) => (
                <th key={m.id} className="text-center py-2 px-4 font-medium">
                  {m.initials}
                </th>
              ))}
              <th className="text-center py-2 px-4 font-medium text-slate-400">
                Target
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(({ cat, name }) => {
              const target = scoreMaps
                .map((map) => map.get(name))
                .find((v) => v != null)?.e;
              return (
                <tr key={name} className="hover:bg-slate-50">
                  <td className="py-2 px-4">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400">
                      {cat}
                    </div>
                    {name}
                  </td>
                  {selected.map((m, i) => {
                    const v = scoreMaps[i].get(name);
                    if (!v)
                      return (
                        <td
                          key={m.id}
                          className="py-2 px-4 text-center text-slate-300"
                        >
                          —
                        </td>
                      );
                    const tone =
                      v.c >= v.e
                        ? "bg-emerald-50 text-emerald-700"
                        : v.c < v.e - 1
                          ? "bg-amber-50 text-amber-700"
                          : "";
                    return (
                      <td key={m.id} className="py-2 px-4 text-center">
                        <span
                          className={`inline-block min-w-[28px] py-0.5 rounded ${tone}`}
                        >
                          {v.c}
                        </span>
                      </td>
                    );
                  })}
                  <td className="py-2 px-4 text-center text-slate-400">
                    {target ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </>
  );
}
