"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { StatusBadge } from "@/components/StatusBadge";
import { PageHeader } from "@/components/primitives";
import { RadarChart } from "@/components/RadarChart";
import { useToast } from "@/components/ui/Toast";
import { firstName } from "@/lib/compute";

type Star = {
  id: string;
  name: string;
  title: string;
  initials: string;
  color: string;
  status: string;
  levelName: string | null;
  nextLevel: string;
  readiness: number;
  cats: { cat: string; cur: number; exp: number }[];
};

type ChecklistRow = { id: string; label: string; checked: boolean };

type Evidence = {
  id: string;
  note: string;
  skillName: string | null;
  fromScore: number | null;
  toScore: number | null;
  date: string;
};

type Other = {
  id: string;
  name: string;
  levelName: string | null;
  nextLevel: string;
  readiness: number;
};

function shortName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1
    ? `${parts[0]} ${parts[parts.length - 1][0]}.`
    : parts[0];
}

export function PromotionClient({
  star,
  checklist,
  evidence,
  others,
}: {
  star: Star;
  checklist: ChecklistRow[];
  evidence: Evidence[];
  others: Other[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [items, setItems] = useState(checklist);
  useEffect(() => setItems(checklist), [checklist]);

  const met = items.filter((x) => x.checked).length;
  const remaining = items.length - met;

  async function toggle(item: ChecklistRow) {
    const next = !item.checked;
    setItems((prev) =>
      prev.map((x) => (x.id === item.id ? { ...x, checked: next } : x)),
    );
    await fetch(`/api/checklist/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checked: next }),
    });
    router.refresh();
  }

  return (
    <>
      <PageHeader
        title="Promotion readiness"
        subtitle="Auto-evaluated from live skills + checklist + log evidence. Yours to override."
        actions={
          <>
            <button
              onClick={() => toast("Shared with HR (stubbed)")}
              className="text-sm border border-slate-200 rounded-md px-3 py-1.5 hover:bg-slate-50"
            >
              Share with HR ↗
            </button>
            <button
              onClick={() =>
                toast(`Promotion case started for ${firstName(star.name)}`)
              }
              className="text-sm bg-indigo-600 text-white rounded-md px-3 py-1.5 hover:bg-indigo-700"
            >
              Start promotion case →
            </button>
          </>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-3">
              <Avatar
                name={star.name}
                color={star.color}
                initials={star.initials}
                size="md"
              />
              <div>
                <div className="font-medium">{star.name}</div>
                <div className="text-xs text-slate-500">
                  {star.title} {star.levelName ?? ""} → {star.nextLevel}
                </div>
              </div>
            </div>
            <StatusBadge status={star.status} />
          </div>
          <div className="flex justify-between items-end mb-3">
            <div>
              <div className="text-xs text-slate-500">Readiness</div>
              <div className="text-3xl font-semibold">
                {star.readiness}
                <span className="text-base text-slate-400">/100</span>
              </div>
            </div>
            <div className="w-[120px]">
              <RadarChart
                labels={star.cats.map((c) => c.cat.replace(" Skills", ""))}
                datasets={[
                  {
                    data: star.cats.map((c) => c.cur),
                    color: "#4f46e5",
                    fill: "rgba(79,70,229,0.25)",
                    pointRadius: 0,
                  },
                  {
                    data: star.cats.map((c) => c.exp),
                    color: "#a5b4fc",
                    fill: "rgba(199,210,254,0.20)",
                    dashed: true,
                    pointRadius: 0,
                  },
                ]}
                height={120}
                showPointLabels={false}
              />
            </div>
          </div>
          <div className="text-sm text-slate-700">
            <strong>
              {met} of {items.length}
            </strong>{" "}
            checklist items met ·{" "}
            <span
              className={remaining > 0 ? "text-amber-600" : "text-emerald-600"}
            >
              {remaining > 0 ? `${remaining} gaps remaining` : "all clear"}
            </span>
          </div>
        </div>

        <div className="col-span-2 bg-white border border-slate-200 rounded-xl p-5">
          <div className="font-semibold mb-1">
            Promotion checklist · {star.levelName ?? "—"} → {star.nextLevel}
          </div>
          <div className="text-xs text-slate-500 mb-3">
            Click to toggle — your call, not the system&apos;s.
          </div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => toggle(item)}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded hover:bg-slate-50 text-left"
              >
                <span
                  className={`w-4 h-4 rounded ${
                    item.checked
                      ? "bg-emerald-500 text-white"
                      : "border border-slate-300"
                  } flex items-center justify-center text-xs shrink-0`}
                >
                  {item.checked ? "✓" : ""}
                </span>
                <span
                  className={`text-sm ${item.checked ? "" : "text-slate-500"}`}
                >
                  {item.label}
                </span>
              </button>
            ))}
          </div>
          <div className="border-t border-slate-100 pt-3">
            <div className="text-sm font-medium mb-2">
              Auto-evidence (from logs)
            </div>
            {evidence.length ? (
              <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
                {evidence.map((l) => (
                  <li key={l.id}>
                    &quot;{l.note}&quot; · {l.date} log ({l.skillName}{" "}
                    {l.fromScore}→{l.toScore})
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-slate-500">
                No positive log entries yet — file observations to build the
                case.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="font-semibold mb-3">Others on the path</div>
        {others.length ? (
          <div className="grid grid-cols-3 gap-4">
            {others.map((t) => (
              <Link
                key={t.id}
                href={`/app/profile?member=${t.id}`}
                className="block border border-slate-200 rounded-lg p-4 cursor-pointer hover:bg-slate-50"
              >
                <div className="flex justify-between items-start">
                  <div className="font-medium">{shortName(t.name)}</div>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {t.readiness >= 65
                      ? "Close"
                      : t.readiness >= 45
                        ? "On track"
                        : "Early"}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {t.levelName ?? "—"} → {t.nextLevel}
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-3">
                  <div
                    className="h-full bg-indigo-600"
                    style={{ width: `${t.readiness}%` }}
                  />
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {t.readiness}/100 readiness
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-sm text-slate-500">
            No other members yet — add teammates to see who&apos;s next.
          </div>
        )}
      </div>
    </>
  );
}
