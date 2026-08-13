"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { StatusBadge } from "@/components/StatusBadge";
import { GapBar, StatCard, PageHeader } from "@/components/primitives";
import { AddMemberModal, type RoleOption } from "./AddMemberModal";
import { useToast } from "@/components/ui/Toast";
import { firstName } from "@/lib/compute";
import type { MemberSummary } from "@/lib/data";

type Sort = "gap" | "avg" | "name";

export function TeamClient({
  summaries,
  roles,
  hasFramework,
}: {
  summaries: MemberSummary[];
  roles: RoleOption[];
  hasFramework: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("gap");
  const [showAdd, setShowAdd] = useState(false);
  const [importing, setImporting] = useState(false);

  const rows = useMemo(() => {
    let r = [...summaries];
    const q = query.toLowerCase();
    if (q)
      r = r.filter((m) =>
        `${m.name} ${m.title} ${m.levelName ?? ""}`.toLowerCase().includes(q),
      );
    r.sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : sort === "avg"
          ? b.avg - a.avg
          : b.gap - a.gap,
    );
    return r;
  }, [summaries, query, sort]);

  const teamAvg = summaries.length
    ? summaries.reduce((s, m) => s + m.avg, 0) / summaries.length
    : 0;
  const openGaps = summaries.reduce((s, m) => s + m.gaps, 0);
  const ready = summaries.filter((m) => m.readiness >= 75);

  async function importStarter() {
    setImporting(true);
    const res = await fetch("/api/framework/import-starter", { method: "POST" });
    setImporting(false);
    if (res.ok) {
      toast("Product Manager framework loaded");
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      toast(d.error || "Import failed");
    }
  }

  if (summaries.length === 0) {
    return (
      <>
        <Onboarding
          hasFramework={hasFramework}
          importing={importing}
          onImport={importStarter}
          onAdd={() => setShowAdd(true)}
        />
        {showAdd && (
          <AddMemberModal roles={roles} onClose={() => setShowAdd(false)} />
        )}
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Your team"
        subtitle={`${summaries.length} member${summaries.length === 1 ? "" : "s"} · cycle H1 2026`}
        actions={
          <>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="text-sm border border-slate-200 rounded-md px-3 py-1.5 w-56"
              placeholder="Search team…"
            />
            <button
              onClick={() =>
                setSort((s) => (s === "gap" ? "avg" : s === "avg" ? "name" : "gap"))
              }
              className="text-sm border border-slate-200 rounded-md px-3 py-1.5 hover:bg-slate-50"
            >
              Sort: {sort} ▾
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="text-sm bg-indigo-600 text-white rounded-md px-3 py-1.5 hover:bg-indigo-700"
            >
              + Add member
            </button>
          </>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Team avg current"
          value={teamAvg.toFixed(1)}
          sub="across all members"
        />
        <StatCard
          label="Total open gaps"
          value={openGaps}
          sub="≥ 1 pt below target"
        />
        <StatCard
          label="Promotion ready"
          value={ready.length}
          sub={ready.map((m) => firstName(m.name)).join(", ") || "—"}
          subClass="text-emerald-600"
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="text-left py-3 px-4 font-medium">Member</th>
              <th className="text-left py-3 px-4 font-medium">Status</th>
              <th className="text-left py-3 px-4 font-medium">Avg → target</th>
              <th className="text-left py-3 px-4 font-medium w-48">Progress</th>
              <th className="text-left py-3 px-4 font-medium">Gaps</th>
              <th className="text-left py-3 px-4 font-medium">Readiness</th>
              <th className="py-3 px-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((m) => (
              <tr
                key={m.id}
                className="hover:bg-slate-50 cursor-pointer"
                onClick={() => router.push(`/app/profile?member=${m.id}`)}
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={m.name} color={m.color} initials={m.initials} size="sm" />
                    <div>
                      <div className="font-medium">{m.name}</div>
                      <div className="text-xs text-slate-500">
                        {m.title}
                        {m.levelName ? ` · ${m.levelName}` : ""}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <StatusBadge status={m.status} />
                </td>
                <td className="py-3 px-4 font-medium">
                  {m.avg.toFixed(1)} <span className="text-slate-400">→</span>{" "}
                  {m.target.toFixed(1)}
                </td>
                <td className="py-3 px-4">
                  <GapBar cur={m.avg} target={m.target} />
                </td>
                <td className="py-3 px-4 text-slate-600">{m.gaps}</td>
                <td className="py-3 px-4 text-slate-600">{m.readiness}/100</td>
                <td className="py-3 px-4 text-right text-slate-400">›</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <AddMemberModal roles={roles} onClose={() => setShowAdd(false)} />
      )}
    </>
  );
}

function Onboarding({
  hasFramework,
  importing,
  onImport,
  onAdd,
}: {
  hasFramework: boolean;
  importing: boolean;
  onImport: () => void;
  onAdd: () => void;
}) {
  return (
    <div className="max-w-2xl mx-auto mt-8">
      <h1 className="text-2xl font-semibold tracking-tight">
        Welcome to GrowthMatrix 👋
      </h1>
      <p className="text-slate-500 mt-1">
        Two quick steps and your workspace is live.
      </p>

      <div className="mt-6 space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-semibold">
              1
            </span>
            <div className="font-semibold">Build your skill framework</div>
            {hasFramework && (
              <span className="text-xs text-emerald-600 ml-auto">✓ done</span>
            )}
          </div>
          <p className="text-sm text-slate-500 mb-3 ml-8">
            Roles, levels, and the skills you evaluate against. Start from a
            Product-Manager template or build your own.
          </p>
          <div className="flex gap-2 ml-8">
            <button
              onClick={onImport}
              disabled={importing || hasFramework}
              className="text-sm bg-indigo-600 text-white rounded-md px-3 py-1.5 hover:bg-indigo-700 disabled:opacity-50"
            >
              {importing ? "Loading…" : "Load PM starter framework"}
            </button>
            <a
              href="/app/framework"
              className="text-sm border border-slate-200 rounded-md px-3 py-1.5 hover:bg-slate-50"
            >
              Build from scratch →
            </a>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-6 rounded-full bg-slate-300 text-white text-xs flex items-center justify-center font-semibold">
              2
            </span>
            <div className="font-semibold">Add your team members</div>
          </div>
          <p className="text-sm text-slate-500 mb-3 ml-8">
            Each member starts at the target scores for their role and level —
            then you rate them up.
          </p>
          <div className="ml-8">
            <button
              onClick={onAdd}
              className="text-sm bg-indigo-600 text-white rounded-md px-3 py-1.5 hover:bg-indigo-700"
            >
              + Add member
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
