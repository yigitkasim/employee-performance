"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MemberSelect } from "@/components/MemberSelect";
import { PageHeader } from "@/components/primitives";
import { useToast } from "@/components/ui/Toast";
import { firstName, type Gap } from "@/lib/compute";

type LogRow = {
  id: string;
  date: string;
  skillName: string | null;
  fromScore: number | null;
  toScore: number | null;
  note: string;
};

type TalkingPointRow = { id: string; text: string; checked: boolean };

type GoalRow = { id: string; text: string; done: boolean };

const GOAL_DEFAULTS = [50, 20, 15];

export function OneOnOneClient({
  member,
  members,
  wins,
  gaps,
  talkingPoints,
  noteBody,
  logs,
  goals,
}: {
  member: { id: string; name: string };
  members: { id: string; name: string }[];
  wins: LogRow[];
  gaps: Gap[];
  talkingPoints: TalkingPointRow[];
  noteBody: string;
  logs: LogRow[];
  goals: GoalRow[];
}) {
  const router = useRouter();
  const toast = useToast();

  const [points, setPoints] = useState(talkingPoints);
  useEffect(() => setPoints(talkingPoints), [talkingPoints]);
  const [newPoint, setNewPoint] = useState("");
  const [adding, setAdding] = useState(false);

  const [notes, setNotes] = useState(noteBody);
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (noteTimer.current) clearTimeout(noteTimer.current);
    },
    [],
  );
  // Re-seed the textarea when switching members.
  const seededFor = useRef(member.id);
  useEffect(() => {
    if (seededFor.current !== member.id) {
      seededFor.current = member.id;
      setNotes(noteBody);
    }
  }, [member.id, noteBody]);

  function onNotesChange(v: string) {
    setNotes(v);
    if (noteTimer.current) clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => {
      fetch(`/api/members/${member.id}/note`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: v }),
      });
    }, 500);
  }

  async function togglePoint(tp: TalkingPointRow, checked: boolean) {
    setPoints((prev) =>
      prev.map((p) => (p.id === tp.id ? { ...p, checked } : p)),
    );
    await fetch(`/api/talking-points/${tp.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checked }),
    });
  }

  async function addPoint() {
    const text = newPoint.trim();
    if (!text || adding) return;
    setAdding(true);
    const res = await fetch(`/api/members/${member.id}/talking-points`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    setAdding(false);
    if (res.ok) {
      setNewPoint("");
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      toast(d.error || "Could not add talking point");
    }
  }

  function copyNotes() {
    const txt = `1:1 prep — ${member.name}\n\nCelebrate:\n${wins
      .map((l) => `- ${l.skillName} ${l.fromScore}→${l.toScore}: ${l.note}`)
      .join("\n")}\n\nAddress:\n${gaps
      .map((g) => `- ${g.name} at ${g.cur}, target ${g.exp}`)
      .join("\n")}\n\nNotes: ${notes}`;
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(txt)
        .then(() => toast("Copied 1:1 notes to clipboard"))
        .catch(() => toast("Copy failed — clipboard unavailable"));
    } else {
      toast("Copy failed — clipboard unavailable");
    }
  }

  return (
    <>
      <PageHeader
        title={`1:1 prep · ${firstName(member.name)}`}
        subtitle="Auto-built from logs, goals, and recent score changes."
        actions={
          <>
            <MemberSelect members={members} currentId={member.id} />
            <button
              onClick={copyNotes}
              className="text-sm border border-slate-200 rounded-md px-3 py-1.5 hover:bg-slate-50"
            >
              Copy as notes ↗
            </button>
            <button
              onClick={() => toast("Live 1:1 mode is stubbed in this prototype")}
              className="text-sm bg-indigo-600 text-white rounded-md px-3 py-1.5 hover:bg-indigo-700"
            >
              Open during 1:1 →
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="font-semibold mb-3 text-emerald-700">
              🎉 Celebrate
            </div>
            {wins.length ? (
              <ul className="text-sm space-y-2 list-disc list-inside text-slate-700">
                {wins.map((l) => (
                  <li key={l.id}>
                    <strong>{l.skillName}</strong> moved{" "}
                    <strong>
                      {l.fromScore} → {l.toScore}
                    </strong>{" "}
                    ({l.date}) — {l.note}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-slate-500">
                No recent score increases — rate skills or file observations
                first.
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="font-semibold mb-3 text-amber-700">🧭 Address</div>
            {gaps.length ? (
              <ul className="text-sm space-y-2 list-disc list-inside text-slate-700">
                {gaps.map((g) => (
                  <li key={g.name}>
                    <strong>{g.name}</strong> at {g.cur}, target {g.exp} —
                    biggest open gap ({g.gap.toFixed(0)} pts).
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-slate-500">
                No open gaps to address. 🎉
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="font-semibold mb-3">Talking points</div>
            <div className="space-y-1">
              {points.map((tp) => (
                <label
                  key={tp.id}
                  className="flex items-start gap-2.5 text-sm py-1.5 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={tp.checked}
                    onChange={(e) => togglePoint(tp, e.target.checked)}
                  />
                  <span
                    className={tp.checked ? "line-through text-slate-400" : ""}
                  >
                    {tp.text}
                  </span>
                </label>
              ))}
              {!points.length && (
                <div className="text-sm text-slate-500 py-1.5">
                  No talking points yet — add one below.
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-3">
              <input
                value={newPoint}
                onChange={(e) => setNewPoint(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addPoint();
                }}
                className="flex-1 text-sm border border-slate-200 rounded-md px-3 py-1.5"
                placeholder="Add a talking point…"
              />
              <button
                onClick={addPoint}
                disabled={adding}
                className="text-sm text-indigo-600 border border-indigo-200 rounded-md px-3 py-1.5 hover:bg-indigo-50 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
              Your private notes · autosaved
            </div>
            <textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              className="w-full bg-transparent text-sm border-0 outline-none resize-none"
              rows={3}
              placeholder="Lead with the recent win. Ask, don't tell, on the stuck skill."
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="font-semibold mb-1">Since last 1:1</div>
            <div className="text-xs text-slate-500 mb-3">
              {logs.length} log {logs.length === 1 ? "entry" : "entries"}
            </div>
            {logs.length ? (
              <ul className="text-sm divide-y divide-slate-100">
                {logs.slice(0, 5).map((l) => (
                  <li key={l.id} className="grid grid-cols-1 lg:grid-cols-12 py-2 gap-2">
                    <span className="col-span-3 text-xs text-slate-500">
                      {l.date}
                    </span>
                    <span className="col-span-6 truncate">{l.skillName}</span>
                    <span className="col-span-3 text-right font-medium">
                      {l.fromScore !== l.toScore
                        ? `${l.fromScore}→${l.toScore}`
                        : "·"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-slate-500">Nothing logged yet.</div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="font-semibold mb-3">Goals progress</div>
            {goals.length ? (
              goals.map((g, i) => {
                const p = g.done ? 100 : GOAL_DEFAULTS[i % GOAL_DEFAULTS.length];
                return (
                  <div key={g.id} className="mb-3 last:mb-0">
                    <div className="flex justify-between text-sm mb-1">
                      <span>{g.text}</span>
                      <span className="text-slate-500">{p}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${p === 100 ? "bg-emerald-500" : "bg-indigo-600"}`}
                        style={{ width: `${p}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-sm text-slate-500">
                No goals yet — set them on the profile screen.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
