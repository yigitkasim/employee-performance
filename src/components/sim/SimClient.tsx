"use client";

import { useMemo, useRef, useState } from "react";
import { MemberSelect } from "@/components/MemberSelect";
import { Card, PageHeader, StatCard } from "@/components/primitives";
import { RadarChart } from "@/components/RadarChart";
import { useToast } from "@/components/ui/Toast";
import {
  avgOf,
  bandOf,
  clampv,
  firstName,
  monthsToNext,
  readinessOf,
  topGaps,
} from "@/lib/compute";
import type { MemberWithScores } from "@/lib/data";

type SimSkill = { id: string; name: string; c: number; e: number };

export function SimClient({
  member,
  members,
  savedSim,
}: {
  member: MemberWithScores;
  members: { id: string; name: string }[];
  savedSim: { subSkillId: string; value: number }[];
}) {
  const toast = useToast();
  const first = firstName(member.name);

  // The 6 biggest-gap sub-skills (stable order for this render of the member).
  const skills = useMemo<SimSkill[]>(() => {
    return topGaps(member.scores, 6).map((g) => {
      const row = member.scores.find((s) => s.subSkillName === g.name)!;
      return { id: row.subSkillId, name: g.name, c: g.cur, e: g.exp };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member.id]);

  const [sim, setSimState] = useState<Record<string, number>>(() => {
    const out: Record<string, number> = {};
    for (const s of savedSim) out[s.subSkillId] = s.value;
    return out;
  });
  const simRef = useRef(sim);

  function setSimVal(skill: SimSkill, v: number) {
    const cur = simRef.current[skill.id] ?? skill.c;
    if (cur === v) return;
    const next = { ...simRef.current, [skill.id]: v };
    simRef.current = next;
    setSimState(next);
    // Fire-and-forget persistence — values survive reloads.
    fetch(`/api/members/${member.id}/sim`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subSkillId: skill.id, value: v }),
    }).catch(() => {});
  }

  function resetSim() {
    simRef.current = {};
    setSimState({});
    fetch(`/api/members/${member.id}/sim`, { method: "DELETE" }).catch(() => {});
  }

  function onTrackPointerDown(
    e: React.PointerEvent<HTMLDivElement>,
    skill: SimSkill,
  ) {
    e.preventDefault();
    const track = e.currentTarget;
    track.setPointerCapture(e.pointerId);
    const setFrom = (clientX: number) => {
      const r = track.getBoundingClientRect();
      let v = Math.round(((clientX - r.left) / r.width) * 5);
      v = clampv(skill.c, 5, v);
      setSimVal(skill, v);
    };
    setFrom(e.clientX);
    const move = (e2: PointerEvent) => setFrom(e2.clientX);
    const up = () => {
      track.removeEventListener("pointermove", move);
      track.removeEventListener("pointerup", up);
    };
    track.addEventListener("pointermove", move);
    track.addEventListener("pointerup", up);
  }

  // Simulated value for a skill (never below today's score).
  const simOf = (s: SimSkill) => Math.max(s.c, sim[s.id] ?? s.c);

  // Overrides passed to readinessOf / monthsToNext: only where sim > current.
  const overrides = useMemo(() => {
    const out: Record<string, number> = {};
    for (const s of skills) {
      const v = sim[s.id];
      if (v != null && v > s.c) out[s.id] = v;
    }
    return out;
  }, [skills, sim]);

  const boosted = skills.filter((s) => simOf(s) > s.c);

  // KPIs
  const rNow = readinessOf(member.scores);
  const rSim = readinessOf(member.scores, overrides);
  const moNow = monthsToNext(member.scores);
  const moSim = monthsToNext(member.scores, overrides);
  const avgNow = avgOf(member.scores);
  const avgSim = member.scores.length
    ? member.scores.reduce(
        (s, v) => s + (overrides[v.subSkillId] ?? v.current),
        0,
      ) / member.scores.length
    : 0;
  const bandNow = bandOf(avgNow);
  const bandSim = bandOf(avgSim);
  const bandPrefix = member.levelName ? `${member.levelName} · ` : "";

  const nowSim = (now: React.ReactNode, simVal: React.ReactNode) => (
    <span className="flex items-baseline gap-1.5">
      <span className="text-slate-400">{now}</span>
      <span className="text-slate-300">→</span>
      <span className="text-indigo-600">{simVal}</span>
    </span>
  );

  return (
    <>
      <PageHeader
        title={`Growth simulator · ${first}`}
        subtitle="Drag any dot to see how readiness, time-to-promo, and band move. Nothing here changes real scores."
        actions={
          <>
            <MemberSelect members={members} currentId={member.id} />
            <button
              onClick={resetSim}
              className="text-sm border border-slate-200 rounded-md px-3 py-1.5 hover:bg-slate-50"
            >
              Reset
            </button>
            <button
              onClick={() => toast("Plan saved — it persists across reloads")}
              className="text-sm bg-indigo-600 text-white rounded-md px-3 py-1.5 hover:bg-indigo-700"
            >
              Save as plan
            </button>
          </>
        }
      />

      <div className="grid grid-cols-4 gap-4 mb-5">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">Readiness</div>
          <div className="mt-1 text-xl font-semibold flex items-baseline gap-1.5">
            <span className="text-slate-400">{rNow}</span>
            <span className="text-slate-300">→</span>
            <span className="text-indigo-600">{rSim}</span>
            <span className="text-xs text-slate-400 font-normal">/100</span>
          </div>
          <div className="mt-2 relative h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-indigo-600 rounded-full transition-all"
              style={{ width: `${rSim}%` }}
            />
            <div
              className="absolute inset-y-0 left-0 bg-slate-300 rounded-full"
              style={{ width: `${rNow}%` }}
            />
          </div>
        </div>
        <StatCard
          label="Est. time to next level"
          value={nowSim(`~${moNow} mo`, `~${moSim} mo`)}
          sub="at sim pace"
          subClass="text-slate-400"
        />
        <StatCard
          label="Avg score"
          value={nowSim(avgNow.toFixed(1), avgSim.toFixed(1))}
          sub="/ 5"
          subClass="text-slate-400"
        />
        <StatCard
          label="Band"
          value={nowSim(bandPrefix + bandNow, bandPrefix + bandSim)}
          sub={bandSim !== bandNow ? "+1 internal" : "no band change"}
          subClass="text-slate-400"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="col-span-2 p-5">
          <div className="font-semibold mb-1">Drag the dot to simulate</div>
          <div className="text-xs text-slate-500 mb-4">
            {`Showing the 6 biggest gaps for ${first} · dot can't go below today's score`}
          </div>
          <div className="space-y-5">
            {skills.map((skill) => {
              const s = simOf(skill);
              return (
                <div key={skill.id}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium">{skill.name}</span>
                    <span className="text-xs text-slate-500">
                      {skill.c} <span className="text-slate-300">→</span>{" "}
                      <strong className="text-indigo-700">{s}</strong> · target{" "}
                      {skill.e}
                    </span>
                  </div>
                  <div
                    className="sim-track relative h-2 bg-slate-100 rounded-full"
                    style={{ touchAction: "none", cursor: "pointer" }}
                    onPointerDown={(e) => onTrackPointerDown(e, skill)}
                  >
                    <div
                      className="absolute inset-y-0 left-0 bg-slate-300 rounded-full pointer-events-none"
                      style={{ width: `${(skill.c / 5) * 100}%` }}
                    />
                    <div
                      className="absolute inset-y-0 left-0 bg-indigo-200 rounded-full pointer-events-none"
                      style={{ width: `${(s / 5) * 100}%` }}
                    />
                    <div
                      className="absolute top-[-3px] bottom-[-3px] w-0.5 bg-slate-700 pointer-events-none"
                      style={{ left: `${(skill.e / 5) * 100}%` }}
                    />
                    <div
                      className={`absolute top-[-5px] w-3.5 h-3.5 rounded-full ${
                        s > skill.c ? "bg-indigo-600" : "bg-slate-400"
                      } border-2 border-white shadow`}
                      style={{
                        left: `calc(${(s / 5) * 100}% - 7px)`,
                        cursor: "grab",
                      }}
                    />
                  </div>
                  <div className="text-xs text-slate-500 mt-1.5 min-h-[18px]">
                    {s > skill.c && (
                      <>
                        ≈ {(s - skill.c) * 6} weeks of focused work ·{" "}
                        <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">
                          pair with a senior
                        </span>{" "}
                        <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">
                          stretch project
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            {skills.length === 0 && (
              <div className="text-sm text-slate-500">
                No gaps to simulate — all skills at target.
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="font-semibold mb-2">What changes</div>
            <RadarChart
              height={220}
              pointLabelSize={9}
              labels={skills.map((s) =>
                s.name.length > 14 ? s.name.slice(0, 13) + "…" : s.name,
              )}
              datasets={[
                {
                  data: skills.map((s) => s.c),
                  color: "#94a3b8",
                  fill: "rgba(148,163,184,0.20)",
                },
                {
                  data: skills.map((s) => simOf(s)),
                  color: "#4f46e5",
                  fill: "rgba(79,70,229,0.25)",
                },
              ]}
            />
            <div className="flex justify-center gap-3 text-xs text-slate-500 mt-2">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm bg-slate-300"></span>Now
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm bg-indigo-600"></span>Sim
              </span>
            </div>
          </Card>

          <Card className="p-5">
            <div className="font-semibold mb-2">Recommended path</div>
            <ul className="text-sm text-slate-700 space-y-2">
              {boosted.length === 0 ? (
                <li className="text-slate-500">
                  Drag a dot up to build a path.
                </li>
              ) : (
                boosted.map((skill, i) => (
                  <li key={skill.id}>
                    <strong>
                      Mo {i * 2 + 1}–{i * 2 + 2}:
                    </strong>{" "}
                    {skill.name} {skill.c} → {simOf(skill)} — shadow, then own
                    it solo
                  </li>
                ))
              )}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
