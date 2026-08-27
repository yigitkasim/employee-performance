"use client";

import { useMemo, useState } from "react";
import { MemberSelect } from "@/components/MemberSelect";
import { PageHeader } from "@/components/primitives";
import { RadarChart } from "@/components/RadarChart";
import { useToast } from "@/components/ui/Toast";
import { skillsByCat, type ScoreRow } from "@/lib/compute";
import type { MemberWithScores } from "@/lib/data";

export function SkillsClient({
  member,
  members,
}: {
  member: MemberWithScores;
  members: { id: string; name: string }[];
}) {
  const toast = useToast();
  const [scores, setScores] = useState<ScoreRow[]>(member.scores);
  const [saveIndicator, setSaveIndicator] = useState(
    "All changes saved · autosaving",
  );

  const byCat = useMemo(() => skillsByCat(scores), [scores]);

  function onDotClick(subSkillId: string, v: number) {
    const row = scores.find((s) => s.subSkillId === subSkillId);
    if (!row) return;
    // Click same dot = step down (min 1)
    const target = row.current === v ? Math.max(1, v - 1) : v;
    if (row.current === target) return;

    // Optimistic local update — summaries + radar recompute from this state.
    setScores((prev) =>
      prev.map((s) =>
        s.subSkillId === subSkillId ? { ...s, current: target } : s,
      ),
    );
    setSaveIndicator("Saved just now · autosaving");

    fetch(`/api/members/${member.id}/scores`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subSkillId, current: target }),
    })
      .then((res) => {
        if (!res.ok) toast("Could not save score");
      })
      .catch(() => toast("Could not save score"));
  }

  return (
    <>
      <PageHeader
        title={`Rate skills · ${member.name}`}
        subtitle="Click a dot to set the score (click the same dot again to step down). Every change creates a log entry."
        actions={
          <>
            <MemberSelect members={members} currentId={member.id} />
            <span className="text-xs text-slate-500">{saveIndicator}</span>
            <button
              onClick={() => toast("Finalized — scores were already autosaved")}
              className="text-sm bg-indigo-600 text-white rounded-md px-3 py-1.5"
            >
              Save &amp; finalize
            </button>
          </>
        }
      />

      <div className="space-y-3">
        {Object.entries(byCat).map(([cat, sks]) => (
          <CategoryCard key={cat} cat={cat} sks={sks} onDotClick={onDotClick} />
        ))}
        {scores.length === 0 && (
          <div className="text-sm text-slate-500">
            No skills to rate yet — set up your framework first.
          </div>
        )}
      </div>
    </>
  );
}

function CategoryCard({
  cat,
  sks,
  onDotClick,
}: {
  cat: string;
  sks: ScoreRow[];
  onDotClick: (subSkillId: string, v: number) => void;
}) {
  const ac = sks.reduce((s, x) => s + x.current, 0) / sks.length;
  const ae = sks.reduce((s, x) => s + x.expected, 0) / sks.length;
  const gap = +(ae - ac).toFixed(1);

  return (
    <details
      open
      className="bg-white border border-slate-200 rounded-xl overflow-hidden"
    >
      <summary className="px-5 py-3 flex justify-between items-center bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <span className="font-semibold">{cat}</span>
          <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
            {sks.length}
          </span>
        </div>
        <div className="text-xs text-slate-500 flex gap-4">
          <span>
            avg <strong className="text-slate-700">{ac.toFixed(1)}</strong> →{" "}
            <strong className="text-indigo-700">{ae.toFixed(1)}</strong>
          </span>
          <span
            className={`${gap > 0 ? "text-amber-600" : "text-emerald-600"} font-medium`}
          >
            {gap > 0 ? `+${gap.toFixed(1)} gap` : "at target"}
          </span>
        </div>
      </summary>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 p-5">
        <div className="col-span-5">
          <RadarChart
            labels={sks.map((s) => s.subSkillName)}
            datasets={[
              {
                data: sks.map((s) => s.current),
                color: "#4f46e5",
                fill: "rgba(79,70,229,0.25)",
                pointRadius: 3,
              },
              {
                data: sks.map((s) => s.expected),
                color: "#a5b4fc",
                fill: "rgba(199,210,254,0.30)",
                dashed: true,
                pointRadius: 3,
              },
            ]}
            height={240}
          />
        </div>
        <div className="col-span-7">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 px-2 pb-2 text-[10px] uppercase tracking-wider text-slate-400 font-medium border-b border-slate-100">
            <div className="col-span-4">Skill</div>
            <div className="col-span-3">Current</div>
            <div className="col-span-3">Expected</div>
            <div className="col-span-2 text-right">Δ</div>
          </div>
          <div className="divide-y divide-slate-100">
            {sks.map((s) => (
              <SkillRow key={s.subSkillId} row={s} onDotClick={onDotClick} />
            ))}
          </div>
        </div>
      </div>
    </details>
  );
}

function SkillRow({
  row,
  onDotClick,
}: {
  row: ScoreRow;
  onDotClick: (subSkillId: string, v: number) => void;
}) {
  const d = row.expected - row.current;
  return (
    <div className="skill-row px-2 py-2 grid grid-cols-1 lg:grid-cols-12 gap-2 items-center text-sm">
      <div className="col-span-4 font-medium truncate">{row.subSkillName}</div>
      <div className="col-span-3">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((x) => (
            <button
              key={x}
              className="dotbtn"
              title={`Set ${row.subSkillName} to ${x}`}
              onClick={() => onDotClick(row.subSkillId, x)}
            >
              <span
                className={`dot ${x <= row.current ? "dot-on" : "dot-off"}`}
              />
            </button>
          ))}
        </div>
      </div>
      <div className="col-span-3">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((x) => (
            <span
              key={x}
              className={`dot ${x <= row.expected ? "dot-target" : "dot-off"}`}
            />
          ))}
        </div>
      </div>
      <div className="col-span-2 text-right">
        <span
          className={`text-xs ${
            d >= 2
              ? "text-amber-600"
              : d >= 1
                ? "text-amber-500"
                : "text-emerald-600"
          } font-medium`}
        >
          {d > 0 ? "+" : ""}
          {d}
        </span>
      </div>
    </div>
  );
}
