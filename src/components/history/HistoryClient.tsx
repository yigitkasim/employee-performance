"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MemberSelect } from "@/components/MemberSelect";
import { PageHeader } from "@/components/primitives";
import { useToast } from "@/components/ui/Toast";
import { firstName, fmtToday } from "@/lib/compute";

type LogRow = {
  id: string;
  skillName: string | null;
  fromScore: number | null;
  toScore: number | null;
  note: string;
  author: string | null;
  createdAt: string;
};

export function HistoryClient({
  member,
  members,
  logs,
}: {
  member: { id: string; name: string };
  members: { id: string; name: string }[];
  logs: LogRow[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [filter, setFilter] = useState("all");

  const skillNames = useMemo(
    () => [...new Set(logs.map((l) => l.skillName).filter((n): n is string => !!n))],
    [logs],
  );
  const shown =
    filter === "all" ? logs : logs.filter((l) => l.skillName === filter);

  async function editNote(l: LogRow) {
    const nv = prompt("Edit note:", l.note);
    if (nv == null) return;
    await fetch(`/api/logs/${l.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: nv.trim() }),
    });
    router.refresh();
  }

  async function deleteLog(id: string) {
    await fetch(`/api/logs/${id}`, { method: "DELETE" });
    toast("Entry deleted");
    router.refresh();
  }

  return (
    <>
      <PageHeader
        title={`History & log · ${firstName(member.name)}`}
        subtitle="Every score change + observation, newest first. Rating changes land here automatically."
        actions={
          <>
            <MemberSelect members={members} currentId={member.id} />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-md px-3 py-1.5 bg-white"
            >
              <option value="all">All skills</option>
              {skillNames.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <Link
              href="/app/inbox"
              className="text-sm bg-indigo-600 text-white rounded-md px-3 py-1.5 hover:bg-indigo-700"
            >
              + New entry
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="col-span-2 space-y-3">
          {shown.length ? (
            shown.map((l) => {
              const hasScore = l.fromScore != null && l.toScore != null;
              const same = hasScore && l.fromScore === l.toScore;
              return (
                <div
                  key={l.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 lg:grid-cols-12 gap-4"
                >
                  <div className="col-span-2">
                    <div className="font-medium text-sm">
                      {fmtToday(new Date(l.createdAt))}
                    </div>
                    <div className="text-xs text-slate-500">
                      by {l.author || "You"}
                    </div>
                  </div>
                  <div className="col-span-10">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        {l.skillName ?? "Observation"}
                      </span>
                      {!hasScore ? null : same ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                          no change · {l.fromScore}
                        </span>
                      ) : (
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            l.toScore! > l.fromScore!
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {l.fromScore} → {l.toScore}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-700">{l.note}</div>
                    <div className="flex gap-2 mt-2 text-xs text-slate-500">
                      <button
                        onClick={() => editNote(l)}
                        className="hover:text-slate-700"
                      >
                        Edit note
                      </button>
                      <span>·</span>
                      <button
                        onClick={() => deleteLog(l.id)}
                        className="hover:text-rose-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
              No entries yet. Rate a skill or file an observation from the
              inbox.
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="font-semibold mb-1">Trend by skill</div>
            <div className="text-xs text-slate-500 mb-3">
              Reconstructed from the log
            </div>
            <TrendRows logs={logs} />
          </div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-sm text-indigo-900">
            Entries auto-feed promotion cases &amp; 1:1 prep. No double-entry,
            no lost context.
          </div>
        </div>
      </div>
    </>
  );
}

function TrendRows({ logs }: { logs: LogRow[] }) {
  const names = [...new Set(logs.map((l) => l.skillName))].slice(0, 5);
  if (!names.length)
    return <div className="text-sm text-slate-500">No history yet.</div>;

  return (
    <>
      {names.map((n) => {
        // Oldest first (logs arrive newest-first).
        const changes = logs
          .filter(
            (l) => l.skillName === n && l.fromScore != null && l.toScore != null,
          )
          .slice()
          .reverse();
        if (!changes.length) return null;
        let series: number[] = [
          changes[0].fromScore!,
          ...changes.map((c) => c.toScore!),
        ];
        while (series.length < 4) series.unshift(series[0]);
        series = series.slice(-6);
        const pts = series
          .map(
            (v, i) =>
              `${(i / (series.length - 1)) * 60 + 2},${22 - ((v - 1) / 4) * 18}`,
          )
          .join(" ");
        return (
          <div
            key={n}
            className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 last:border-0"
          >
            <span className="text-sm flex-1 min-w-0 truncate">{n}</span>
            <svg width="64" height="24">
              <polyline
                points={pts}
                fill="none"
                stroke="#4f46e5"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-xs text-slate-500 tabular-nums">
              {series[0]}→{series[series.length - 1]}
            </span>
          </div>
        );
      })}
    </>
  );
}
