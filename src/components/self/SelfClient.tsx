"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MemberSelect } from "@/components/MemberSelect";
import { Card, PageHeader, StatCard } from "@/components/primitives";
import { firstName } from "@/lib/compute";
import type { MemberWithScores } from "@/lib/data";

type WorkSkill = { id: string; name: string; mgr: number; t: number };
type Row = WorkSkill & { self: number | null };

const DELTA_TONES: Record<string, string> = {
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  slate: "bg-slate-50 text-slate-700 border-slate-200",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

function deltaTone(d: number): string {
  return d > 1 ? "amber" : d < -1 ? "blue" : d !== 0 ? "slate" : "emerald";
}

export function SelfClient({
  member,
  members,
}: {
  member: MemberWithScores;
  members: { id: string; name: string }[];
}) {
  const first = firstName(member.name);

  // Working set of ~8 skills: prefer sub-skills with a self-assessment, fill
  // with the member's other sub-skills. Stable per member.
  const workingSet = useMemo<WorkSkill[]>(() => {
    const withSelf = member.scores.filter((s) => s.self != null);
    const withoutSelf = member.scores.filter((s) => s.self == null);
    return [...withSelf, ...withoutSelf].slice(0, 8).map((s) => ({
      id: s.subSkillId,
      name: s.subSkillName,
      mgr: s.current,
      t: s.expected,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member.id]);

  const [selfMap, setSelfMap] = useState<Record<string, number | null>>(() => {
    const out: Record<string, number | null> = {};
    for (const s of member.scores) out[s.subSkillId] = s.self;
    return out;
  });

  function setSelf(subSkillId: string, self: number | null) {
    setSelfMap((prev) => ({ ...prev, [subSkillId]: self }));
    fetch(`/api/members/${member.id}/self`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subSkillId, self }),
    }).catch(() => {});
  }

  // Sorted by delta (biggest disagreement first); skills without a self value
  // yet sink to the bottom.
  const rows = useMemo<Row[]>(() => {
    return workingSet
      .map((w) => ({ ...w, self: selfMap[w.id] ?? null }))
      .sort((a, b) => {
        const da = a.self == null ? -1 : Math.abs(a.self - a.mgr);
        const db = b.self == null ? -1 : Math.abs(b.self - b.mgr);
        return db - da;
      });
  }, [workingSet, selfMap]);

  const rated = rows.filter((r) => r.self != null);
  const aligned = rated.filter((r) => r.self === r.mgr);
  const selfHi = rated.filter((r) => (r.self as number) > r.mgr);
  const mgrHi = rated.filter((r) => (r.self as number) < r.mgr);
  const disagree = rated.filter((r) => r.self !== r.mgr);

  return (
    <>
      <PageHeader
        title={`Self vs manager · ${first}`}
        subtitle="Both filled blind. Deltas show where to align before the next 1:1."
        actions={
          <>
            <MemberSelect members={members} currentId={member.id} />
            <Link
              href={`/app/one-on-one?member=${member.id}`}
              className="text-sm bg-indigo-600 text-white rounded-md px-3 py-1.5 hover:bg-indigo-700"
            >
              Discuss in 1:1 →
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-5">
        <StatCard
          label="Aligned"
          value={aligned.length}
          valueClass="text-emerald-600"
          sub={`of ${rated.length} skills`}
          subClass="text-slate-400"
        />
        <StatCard
          label="Self higher"
          value={selfHi.length}
          valueClass="text-amber-600"
          sub="overestimating"
          subClass="text-slate-400"
        />
        <StatCard
          label="Manager higher"
          value={mgrHi.length}
          valueClass="text-blue-600"
          sub="underestimating"
          subClass="text-slate-400"
        />
      </div>

      <Card className="p-5">
        <div className="flex justify-between items-center mb-4">
          <div className="font-semibold">Where you disagree (sorted by delta)</div>
          <div className="flex gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
              Manager
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              Self
            </span>
          </div>
        </div>

        {rated.length < rows.length && (
          <div className="text-xs text-slate-500 mb-4">
            {rated.length === 0
              ? `No self-assessments yet — enter what ${first} rated themselves (1–5) in the Self column to compare against your scores.`
              : `Some skills have no self-rating yet — enter what ${first} rated themselves (1–5) in the Self column.`}
          </div>
        )}

        <div className="grid grid-cols-12 gap-3 pb-2 text-[10px] uppercase tracking-wider text-slate-400 font-medium">
          <div className="col-span-3">Skill</div>
          <div className="col-span-1 text-center">Self</div>
          <div className="col-span-1 text-center">Mgr</div>
          <div className="col-span-1 text-center">Δ</div>
          <div className="col-span-5"></div>
          <div className="col-span-1"></div>
        </div>
        <div className="space-y-3">
          {rows.map((r) => {
            const d = r.self != null ? r.self - r.mgr : null;
            return (
              <div
                key={r.id}
                className="grid grid-cols-12 gap-3 items-center text-sm"
              >
                <div className="col-span-3 font-medium">{r.name}</div>
                <div className="col-span-1 text-center">
                  <select
                    value={r.self ?? ""}
                    onChange={(e) =>
                      setSelf(
                        r.id,
                        e.target.value === "" ? null : Number(e.target.value),
                      )
                    }
                    className="text-sm border border-slate-200 rounded-md px-1 py-0.5 bg-white text-center"
                    aria-label={`${first}'s self rating for ${r.name}`}
                  >
                    <option value="">—</option>
                    {[1, 2, 3, 4, 5].map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-1 text-center">{r.mgr}</div>
                <div className="col-span-1 text-center">
                  {d == null ? (
                    <span className="text-xs text-slate-400">—</span>
                  ) : (
                    <span
                      className={`text-xs px-2 py-0.5 rounded border font-medium ${DELTA_TONES[deltaTone(d)]}`}
                    >
                      {d > 0 ? "+" : ""}
                      {d}
                    </span>
                  )}
                </div>
                <div className="col-span-5">
                  <div className="relative h-2 bg-slate-100 rounded-full">
                    <div
                      className="absolute top-[-3px] w-2.5 h-2.5 rounded-full bg-indigo-600 border-2 border-white"
                      style={{ left: `calc(${(r.mgr / 5) * 100}% - 5px)` }}
                    />
                    {r.self != null && (
                      <div
                        className="absolute top-[-3px] w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-white"
                        style={{ left: `calc(${(r.self / 5) * 100}% - 5px)` }}
                      />
                    )}
                    <div
                      className="absolute top-[-3px] bottom-[-3px] w-0.5 bg-slate-700"
                      style={{ left: `${(r.t / 5) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="col-span-1 text-right text-xs text-slate-500">
                  target {r.t}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="font-semibold mb-2 text-amber-700">
            Biggest perception gaps to address
          </div>
          <ul className="text-sm space-y-2">
            {rated.length === 0 ? (
              <li className="text-slate-500">
                Collect self-assessments to compare.
              </li>
            ) : disagree.length === 0 ? (
              <li className="text-slate-500">Fully aligned — rare and great.</li>
            ) : (
              disagree.slice(0, 3).map((r) => (
                <li key={r.id}>
                  <strong>{r.name}</strong> — they see {r.self}, you see {r.mgr}.{" "}
                  <span className="text-slate-500">
                    {(r.self as number) > r.mgr
                      ? "Bring specific examples to calibrate."
                      : "Tell them why you rate them higher."}
                  </span>
                </li>
              ))
            )}
          </ul>
        </Card>
        <Card className="p-5">
          <div className="font-semibold mb-2 text-emerald-700">
            Confidence builders
          </div>
          <ul className="text-sm space-y-2">
            {rated.length === 0 ? (
              <li className="text-slate-500">
                Collect self-assessments to compare.
              </li>
            ) : aligned.length === 0 ? (
              <li className="text-slate-500">No aligned skills this round.</li>
            ) : (
              aligned.slice(0, 3).map((r) => (
                <li key={r.id}>
                  You both agree on <strong>{r.name}</strong> at {r.mgr}
                  {r.mgr >= r.t ? " — strength." : "."}
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>
    </>
  );
}
