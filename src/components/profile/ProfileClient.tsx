"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { StatusBadge } from "@/components/StatusBadge";
import { MemberSelect } from "@/components/MemberSelect";
import { StatCard, Card } from "@/components/primitives";
import { RadarChart } from "@/components/RadarChart";
import { useToast } from "@/components/ui/Toast";
import {
  avgOf,
  targetOf,
  gapOf,
  readinessOf,
  catAvgs,
  topGaps,
  relativeTime,
  firstName,
} from "@/lib/compute";
import type { MemberWithScores } from "@/lib/data";
import { ManageMemberModal, type RoleOption } from "./ManageMemberModal";

export type GoalItem = { id: string; text: string; due: string; done: boolean };
export type LogItem = {
  id: string;
  skillName: string;
  fromScore: number;
  toScore: number;
  note: string;
  createdAt: string;
};

export function ProfileClient({
  member,
  members,
  goals,
  logs,
  roles,
}: {
  member: MemberWithScores;
  members: { id: string; name: string }[];
  goals: GoalItem[];
  logs: LogItem[];
  roles: RoleOption[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [managing, setManaging] = useState(false);

  const avg = avgOf(member.scores);
  const target = targetOf(member.scores);
  const gap = gapOf(member.scores);
  const readiness = readinessOf(member.scores);
  const cats = catAvgs(member.scores);
  const gaps = topGaps(member.scores, 5);

  async function toggleGoal(g: GoalItem) {
    const res = await fetch(`/api/goals/${g.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !g.done }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      toast("Could not update goal");
    }
  }

  async function addGoal() {
    const text = window.prompt(`New goal for ${firstName(member.name)}:`);
    if (!text || !text.trim()) return;
    const res = await fetch(`/api/members/${member.id}/goals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.trim() }),
    });
    if (res.ok) {
      toast("Goal added");
      router.refresh();
    } else {
      toast("Could not add goal");
    }
  }

  const subtitle = [member.title, member.levelName, "Reports to you"]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <div className="flex justify-between items-start mb-5">
        <div className="flex items-center gap-4">
          <Avatar
            name={member.name}
            color={member.color}
            initials={member.initials}
            size="lg"
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {member.name}
            </h1>
            <p className="text-slate-500 text-sm">{subtitle}</p>
          </div>
          <StatusBadge status={member.status} />
        </div>
        <div className="flex gap-2 items-center">
          <MemberSelect members={members} currentId={member.id} />
          <Link
            href={`/app/skills?member=${member.id}`}
            className="text-sm border border-slate-200 rounded-md px-3 py-1.5 hover:bg-slate-50"
          >
            Rate skills
          </Link>
          <button
            onClick={() => setManaging(true)}
            className="text-sm border border-slate-200 rounded-md px-3 py-1.5 hover:bg-slate-50"
            title="Edit details, role and level, or remove this member"
          >
            Manage
          </button>
          <Link
            href={`/app/one-on-one?member=${member.id}`}
            className="text-sm border border-slate-200 rounded-md px-3 py-1.5 hover:bg-slate-50"
          >
            Prep 1:1
          </Link>
          <button
            onClick={() => toast("Log entries are captured from the inbox")}
            className="text-sm bg-indigo-600 text-white rounded-md px-3 py-1.5 hover:bg-indigo-700"
          >
            + Log entry
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-5">
        <StatCard label="Average current" value={avg.toFixed(1)} sub="/ 5" />
        <StatCard label="Average expected" value={target.toFixed(1)} sub="/ 5" />
        <StatCard
          label="Avg gap"
          value={`+${gap.toFixed(1)}`}
          sub="open"
          valueClass="text-amber-600"
        />
        <StatCard label="Readiness" value={readiness} sub="/100" />
      </div>

      <div className="grid grid-cols-5 gap-4 mb-5">
        <Card className="col-span-3 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold">Current vs expected</div>
            <div className="text-xs text-slate-500 flex gap-3">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm bg-indigo-600"></span>
                Current
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm bg-indigo-200"></span>
                Expected
              </span>
            </div>
          </div>
          <RadarChart
            labels={cats.map((c) => c.cat)}
            datasets={[
              {
                data: cats.map((c) => +c.cur.toFixed(2)),
                color: "#4f46e5",
                fill: "rgba(79,70,229,0.25)",
              },
              {
                data: cats.map((c) => +c.exp.toFixed(2)),
                color: "#a5b4fc",
                fill: "rgba(199,210,254,0.30)",
                dashed: true,
              },
            ]}
            height={300}
            showTicks
            pointLabelSize={12}
          />
        </Card>
        <Card className="col-span-2 p-5">
          <div className="font-semibold mb-3">Top growth opportunities</div>
          <ul className="space-y-3">
            {gaps.length ? (
              gaps.map((g) => (
                <li key={g.name}>
                  <div className="flex justify-between">
                    <span>{g.name}</span>
                    <span className="text-amber-600 font-medium">
                      +{g.gap.toFixed(1)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full bg-amber-500"
                      style={{ width: `${Math.min(100, (g.gap / 3) * 100)}%` }}
                    />
                  </div>
                </li>
              ))
            ) : (
              <li className="text-sm text-slate-500">
                No open gaps — everything at target. 🎉
              </li>
            )}
          </ul>
        </Card>
      </div>

      <Card className="p-5 mb-5">
        <div className="font-semibold mb-3">Category breakdown</div>
        <div className="grid grid-cols-5 gap-4">
          {cats.map((c) => (
            <Link
              key={c.cat}
              href={`/app/skills?member=${member.id}`}
              className="block text-center p-3 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              <div className="text-xs text-slate-500">{c.cat}</div>
              <div className="text-2xl font-semibold mt-1">
                {c.cur.toFixed(1)}
              </div>
              <div className="text-xs text-emerald-600">
                → {c.exp.toFixed(1)}
              </div>
            </Link>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="font-semibold mb-3">Development goals · H1 2026</div>
          {goals.length ? (
            <ul className="space-y-2.5">
              {goals.map((g) => (
                <li
                  key={g.id}
                  className="flex items-start gap-3 cursor-pointer"
                  onClick={() => toggleGoal(g)}
                >
                  <span
                    className={`mt-1 w-4 h-4 rounded border ${
                      g.done
                        ? "border-emerald-500 bg-emerald-50 text-emerald-600"
                        : "border-slate-300"
                    } flex items-center justify-center text-xs shrink-0`}
                  >
                    {g.done ? "✓" : ""}
                  </span>
                  <div>
                    <div className={g.done ? "line-through text-slate-400" : ""}>
                      {g.text}
                    </div>
                    <div className="text-xs text-slate-500">
                      {g.due}
                      {g.done ? `${g.due ? " · " : ""}done` : ""}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-slate-500">
              No goals yet — add the first development goal for{" "}
              {firstName(member.name)}.
            </div>
          )}
          <button
            onClick={addGoal}
            className="text-sm text-indigo-600 hover:underline mt-3"
          >
            + Add goal
          </button>
        </Card>
        <Card className="p-5">
          <div className="font-semibold mb-3">Recent activity</div>
          {logs.length ? (
            <ul className="space-y-3 text-sm">
              {logs.map((l) => (
                <li
                  key={l.id}
                  className="flex gap-3 pb-3 border-b border-slate-100 last:border-0"
                >
                  <div className="text-xs text-slate-500 w-12 shrink-0 pt-0.5">
                    {relativeTime(l.createdAt)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{l.skillName}</span>
                      <span
                        className={`text-xs px-2 py-0.5 ${
                          l.toScore > l.fromScore
                            ? "bg-emerald-50 text-emerald-700"
                            : l.toScore < l.fromScore
                              ? "bg-rose-50 text-rose-700"
                              : "bg-slate-100 text-slate-500"
                        } rounded`}
                      >
                        {l.fromScore} → {l.toScore}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">{l.note}</div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-slate-500">
              No entries yet. Rate a skill or file an observation to start the
              history.
            </div>
          )}
          <Link
            href={`/app/history?member=${member.id}`}
            className="inline-block text-sm text-indigo-600 hover:underline mt-3"
          >
            View full log →
          </Link>
        </Card>
      </div>

      {managing && (
        <ManageMemberModal
          member={{
            id: member.id,
            name: member.name,
            title: member.title,
            status: member.status,
            roleId: member.roleId,
            levelId: member.levelId,
          }}
          roles={roles}
          onClose={() => setManaging(false)}
        />
      )}
    </>
  );
}
