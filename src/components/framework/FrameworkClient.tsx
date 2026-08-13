"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/primitives";
import { defaultExpected } from "@/lib/framework-template";

type Level = { id: string; name: string; orderIndex: number };
type Role = {
  id: string;
  name: string;
  icon: string;
  description: string;
  memberCount: number;
  levels: Level[];
  groupIds: string[];
};
type Group = {
  id: string;
  name: string;
  icon: string;
  subSkills: { id: string; name: string }[];
  roleIds: string[];
};

type Tab = "matrix" | "roles" | "skills";

export function FrameworkClient({
  roles,
  groups,
  expected,
}: {
  roles: Role[];
  groups: Group[];
  expected: Record<string, number>;
}) {
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("matrix");
  const [activeRoleId, setActiveRoleId] = useState(roles[0]?.id ?? "");
  const [activeGroupId, setActiveGroupId] = useState(groups[0]?.id ?? "");
  // Local optimistic overrides for matrix cells (already persisted server-side).
  const [ov, setOv] = useState<Record<string, number>>({});

  // Keep active selections valid as data changes.
  useEffect(() => {
    if (roles.length && !roles.some((r) => r.id === activeRoleId))
      setActiveRoleId(roles[0].id);
  }, [roles, activeRoleId]);
  useEffect(() => {
    if (groups.length && !groups.some((g) => g.id === activeGroupId))
      setActiveGroupId(groups[0].id);
  }, [groups, activeGroupId]);

  async function api(url: string, method: string, body?: unknown) {
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      toast(d.error || "Something went wrong");
      return null;
    }
    return res.json().catch(() => ({}));
  }

  async function mutate(url: string, method: string, body?: unknown) {
    const r = await api(url, method, body);
    if (r) router.refresh();
    return r;
  }

  const activeRole = roles.find((r) => r.id === activeRoleId) ?? roles[0];

  const hasFramework = roles.length > 0 || groups.length > 0;

  return (
    <>
      <PageHeader
        title="Roles & skills framework"
        subtitle="Build roles, levels, and the expected score for every sub-skill at every level."
        actions={
          <>
            <button
              onClick={() => toast("CSV import is not available yet")}
              className="text-sm border border-slate-200 rounded-md px-3 py-1.5 hover:bg-slate-50"
            >
              Import CSV
            </button>
            {/* Every edit on this screen saves immediately, so there is nothing
                to publish — say so rather than claiming a save that never ran. */}
            <span className="text-xs text-slate-500 px-2">
              Changes save automatically
            </span>
          </>
        }
      />

      {!hasFramework ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center">
          <div className="text-2xl mb-2">🧱</div>
          <div className="font-semibold">Your framework is empty</div>
          <p className="text-sm text-slate-500 mt-1 mb-4">
            Create your first role and a skill group to get started — or load the
            Product-Manager starter from the Team page.
          </p>
          <div className="flex gap-2 justify-center">
            <NewRoleButton onCreate={mutate} />
            <NewGroupButton onCreate={mutate} />
          </div>
        </div>
      ) : (
        <>
          <div className="flex gap-1 border-b border-slate-200 mb-5 text-sm">
            {(
              [
                ["matrix", "Expected matrix"],
                ["roles", "Roles & levels"],
                ["skills", "Skills & sub-skills"],
              ] as [Tab, string][]
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`px-4 py-2.5 border-b-2 ${
                  tab === id
                    ? "border-indigo-600 text-indigo-700 font-medium"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "matrix" && activeRole && (
            <MatrixTab
              roles={roles}
              groups={groups}
              activeRole={activeRole}
              setActiveRoleId={setActiveRoleId}
              expected={expected}
              ov={ov}
              setOv={setOv}
              api={api}
              toast={toast}
            />
          )}
          {tab === "roles" && (
            <RolesTab
              roles={roles}
              activeRoleId={activeRoleId}
              setActiveRoleId={setActiveRoleId}
              mutate={mutate}
            />
          )}
          {tab === "skills" && (
            <SkillsTab
              roles={roles}
              groups={groups}
              activeGroupId={activeGroupId}
              setActiveGroupId={setActiveGroupId}
              mutate={mutate}
            />
          )}
        </>
      )}
    </>
  );
}

/* ─────────────────────────── Matrix tab ─────────────────────────── */

function cellValue(
  role: Role,
  groups: Group[],
  levelId: string,
  levelIdx: number,
  subId: string,
  subName: string,
  expected: Record<string, number>,
  ov: Record<string, number>,
) {
  const key = `${role.id}:${levelId}:${subId}`;
  if (ov[key] != null) return ov[key];
  if (expected[key] != null) return expected[key];
  return defaultExpected(levelIdx, subName);
}

function MatrixTab({
  roles,
  groups,
  activeRole,
  setActiveRoleId,
  expected,
  ov,
  setOv,
  api,
  toast,
}: {
  roles: Role[];
  groups: Group[];
  activeRole: Role;
  setActiveRoleId: (id: string) => void;
  expected: Record<string, number>;
  ov: Record<string, number>;
  setOv: (fn: (o: Record<string, number>) => Record<string, number>) => void;
  api: (url: string, method: string, body?: unknown) => Promise<unknown>;
  toast: (m: string) => void;
}) {
  // Only groups linked to the active role are shown.
  const roleGroups = groups.filter((g) => activeRole.groupIds.includes(g.id));
  const editedCount = Object.keys(ov).length;

  function cycle(levelId: string, levelIdx: number, subId: string, subName: string) {
    const key = `${activeRole.id}:${levelId}:${subId}`;
    const cur = cellValue(
      activeRole,
      groups,
      levelId,
      levelIdx,
      subId,
      subName,
      expected,
      ov,
    );
    const next = cur >= 5 ? 1 : cur + 1;
    setOv((o) => ({ ...o, [key]: next }));
    api("/api/expected", "PUT", {
      roleId: activeRole.id,
      levelId,
      subSkillId: subId,
      value: next,
    });
  }

  return (
    <>
      <div className="flex gap-3 mb-4 items-center">
        <span className="text-sm text-slate-500">Role:</span>
        <div className="flex gap-1 flex-wrap">
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => setActiveRoleId(r.id)}
              className={`text-sm px-3 py-1.5 rounded-md border ${
                activeRole.id === r.id
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              {r.icon} {r.name}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500 ml-auto">
          Click any cell to cycle the expected score 1 → 5
        </span>
      </div>

      {activeRole.levels.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
          This role has no levels yet. Add levels in the “Roles &amp; levels” tab.
        </div>
      ) : roleGroups.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
          No skill groups are applied to this role yet. Link them in the “Skills
          &amp; sub-skills” tab.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-auto scroll-area" style={{ maxHeight: "70vh" }}>
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 bg-slate-50 z-10">
                <tr className="border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-medium text-xs uppercase tracking-wider text-slate-500 sticky left-0 bg-slate-50 z-20 min-w-[220px]">
                    Sub-skill
                  </th>
                  {activeRole.levels.map((l, i) => (
                    <th key={l.id} className="px-3 py-3 text-center font-medium" style={{ minWidth: 96 }}>
                      <div className="text-xs text-slate-500 uppercase tracking-wider">
                        L{i + 1}
                      </div>
                      <div className="text-sm text-slate-800 mt-0.5 font-semibold">
                        {l.name}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roleGroups.map((g) => (
                  <MatrixGroupRows
                    key={g.id}
                    group={g}
                    role={activeRole}
                    groups={groups}
                    expected={expected}
                    ov={ov}
                    onCycle={cycle}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div className="bg-white border border-slate-200 rounded-lg p-3">
          <div className="text-xs text-slate-500 mb-2">Score legend</div>
          <div className="flex flex-wrap gap-2">
            {[
              ["1", "No skill", "bg-slate-50 text-slate-400"],
              ["2", "Beginner", "bg-slate-100 text-slate-700"],
              ["3", "Competent", "bg-indigo-100 text-indigo-800"],
              ["4", "Strong", "bg-indigo-600 text-white"],
              ["5", "Expert / can teach", "bg-indigo-600 text-white"],
            ].map(([n, label, cls]) => (
              <span key={n} className="flex items-center gap-1.5">
                <span className={`w-5 h-5 rounded ${cls} flex items-center justify-center text-xs font-semibold`}>
                  {n}
                </span>
                <span className="text-xs">{label}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3">
          <div className="text-xs text-slate-500 mb-1">Bulk actions</div>
          <div className="flex gap-2 mt-1.5">
            <button
              onClick={() => toast("Copy-from-role is not available yet")}
              className="text-xs px-2.5 py-1.5 border border-slate-200 rounded hover:bg-slate-50"
            >
              Copy from another role
            </button>
          </div>
        </div>
        <div
          className={`${
            editedCount
              ? "bg-amber-50 border-amber-200 text-amber-900"
              : "bg-white border-slate-200 text-slate-500"
          } border rounded-lg p-3`}
        >
          <div className="text-xs font-semibold mb-1">
            {editedCount ? "Saved this session" : "No pending edits"}
          </div>
          <div className="text-xs">
            {editedCount
              ? `${editedCount} cell${editedCount > 1 ? "s" : ""} changed and saved.`
              : "Click cells in the matrix to adjust expectations."}
          </div>
        </div>
      </div>
    </>
  );
}

function MatrixGroupRows({
  group,
  role,
  groups,
  expected,
  ov,
  onCycle,
}: {
  group: Group;
  role: Role;
  groups: Group[];
  expected: Record<string, number>;
  ov: Record<string, number>;
  onCycle: (levelId: string, levelIdx: number, subId: string, subName: string) => void;
}) {
  return (
    <>
      <tr className="bg-slate-50/60">
        <td colSpan={role.levels.length + 1} className="px-4 py-2 sticky left-0 bg-slate-50/60">
          <div className="flex items-center gap-2">
            <span>{group.icon}</span>
            <span className="font-semibold text-xs uppercase tracking-wider text-slate-700">
              {group.name}
            </span>
            <span className="text-xs text-slate-400">· {group.subSkills.length}</span>
          </div>
        </td>
      </tr>
      {group.subSkills.map((sub) => (
        <tr key={sub.id} className="border-t border-slate-100 hover:bg-indigo-50/30">
          <td className="px-4 py-2 sticky left-0 bg-white font-medium text-slate-800">
            {sub.name}
          </td>
          {role.levels.map((l, li) => {
            const v = cellValue(role, groups, l.id, li, sub.id, sub.name, expected, ov);
            const tone =
              v >= 4
                ? "bg-indigo-600 text-white"
                : v >= 3
                  ? "bg-indigo-100 text-indigo-800"
                  : v >= 2
                    ? "bg-slate-100 text-slate-700"
                    : "bg-slate-50 text-slate-400";
            const key = `${role.id}:${l.id}:${sub.id}`;
            const edited = ov[key] != null;
            return (
              <td key={l.id} className="px-3 py-2 text-center">
                <button
                  onClick={() => onCycle(l.id, li, sub.id, sub.name)}
                  title={`${sub.name} — ${l.name}: expected ${v}/5 (click to cycle)`}
                  className={`w-12 h-9 rounded ${tone} ${
                    edited ? "ring-2 ring-amber-400" : ""
                  } text-sm font-semibold hover:ring-2 hover:ring-indigo-400 transition`}
                >
                  {v}
                </button>
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}

/* ─────────────────────────── Roles tab ─────────────────────────── */

function RolesTab({
  roles,
  activeRoleId,
  setActiveRoleId,
  mutate,
}: {
  roles: Role[];
  activeRoleId: string;
  setActiveRoleId: (id: string) => void;
  mutate: (url: string, method: string, body?: unknown) => Promise<unknown>;
}) {
  const role = roles.find((r) => r.id === activeRoleId) ?? roles[0];

  return (
    <div className="grid grid-cols-12 gap-5">
      <div className="col-span-4 bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex justify-between items-baseline mb-3">
          <div className="font-semibold">Roles</div>
          <span className="text-xs text-slate-500">{roles.length} active</span>
        </div>
        <div className="space-y-1">
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => setActiveRoleId(r.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left ${
                activeRoleId === r.id ? "bg-indigo-50 text-indigo-900" : "hover:bg-slate-50"
              }`}
            >
              <span className="text-lg">{r.icon}</span>
              <div className="flex-1">
                <div className="font-medium text-sm">{r.name}</div>
                <div className="text-xs text-slate-500">
                  {r.levels.length} levels · {r.memberCount} members
                </div>
              </div>
            </button>
          ))}
        </div>
        <div className="mt-3">
          <NewRoleButton onCreate={mutate} full />
        </div>
      </div>

      {role && (
        <div className="col-span-8 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex justify-between items-center mb-3">
              <div className="font-semibold">Role details</div>
              <button
                onClick={() => {
                  if (confirm(`Delete role “${role.name}”? Members keep their scores.`))
                    mutate(`/api/roles/${role.id}`, "DELETE");
                }}
                className="text-sm text-rose-600 hover:underline"
              >
                Delete role
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <TextField
                label="Name"
                value={role.name}
                onSave={(v) => mutate(`/api/roles/${role.id}`, "PATCH", { name: v })}
              />
              <TextField
                label="Icon / emoji"
                value={role.icon}
                onSave={(v) => mutate(`/api/roles/${role.id}`, "PATCH", { icon: v })}
              />
              <label className="block col-span-2">
                <span className="text-xs text-slate-500">Description</span>
                <textarea
                  defaultValue={role.description}
                  onBlur={(e) =>
                    e.target.value !== role.description &&
                    mutate(`/api/roles/${role.id}`, "PATCH", { description: e.target.value })
                  }
                  className="w-full border border-slate-200 rounded-md px-3 py-2 mt-1 text-sm"
                  rows={2}
                />
              </label>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex justify-between items-baseline mb-3">
              <div className="font-semibold">Levels</div>
              <span className="text-xs text-slate-500">low → high</span>
            </div>
            <div className="space-y-2">
              {role.levels.map((l, i) => (
                <div
                  key={l.id}
                  className="flex items-center gap-3 px-3 py-2 border border-slate-200 rounded-md hover:bg-slate-50 group"
                >
                  <span className="w-7 h-7 rounded-md bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-semibold">
                    L{i + 1}
                  </span>
                  <input
                    defaultValue={l.name}
                    onBlur={(e) =>
                      e.target.value.trim() &&
                      e.target.value !== l.name &&
                      mutate(`/api/levels/${l.id}`, "PATCH", { name: e.target.value.trim() })
                    }
                    className="flex-1 bg-transparent border-0 outline-none text-sm font-medium"
                  />
                  <button
                    onClick={() =>
                      confirm(`Remove level “${l.name}”?`) &&
                      mutate(`/api/levels/${l.id}`, "DELETE")
                    }
                    className="text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <AddInline
              placeholder="New level name (e.g. Senior)…"
              buttonLabel="+ Add level"
              onAdd={(v) => mutate(`/api/roles/${role.id}/levels`, "POST", { name: v })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── Skills tab ─────────────────────────── */

function SkillsTab({
  roles,
  groups,
  activeGroupId,
  setActiveGroupId,
  mutate,
}: {
  roles: Role[];
  groups: Group[];
  activeGroupId: string;
  setActiveGroupId: (id: string) => void;
  mutate: (url: string, method: string, body?: unknown) => Promise<unknown>;
}) {
  const group = groups.find((g) => g.id === activeGroupId) ?? groups[0];

  return (
    <div className="grid grid-cols-12 gap-5">
      <div className="col-span-4 bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex justify-between items-baseline mb-3">
          <div className="font-semibold">Skill groups</div>
          <span className="text-xs text-slate-500">{groups.length}</span>
        </div>
        <div className="space-y-1">
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => setActiveGroupId(g.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left ${
                activeGroupId === g.id ? "bg-indigo-50 text-indigo-900" : "hover:bg-slate-50"
              }`}
            >
              <span className="text-lg">{g.icon}</span>
              <div className="flex-1">
                <div className="font-medium text-sm">{g.name}</div>
                <div className="text-xs text-slate-500">
                  {g.subSkills.length} sub-skills
                </div>
              </div>
            </button>
          ))}
        </div>
        <div className="mt-3">
          <NewGroupButton onCreate={mutate} full />
        </div>
      </div>

      {group && (
        <div className="col-span-8 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <TextField
                  label="Icon"
                  value={group.icon}
                  compact
                  onSave={(v) => mutate(`/api/skill-groups/${group.id}`, "PATCH", { icon: v })}
                />
                <TextField
                  label="Group name"
                  value={group.name}
                  onSave={(v) => mutate(`/api/skill-groups/${group.id}`, "PATCH", { name: v })}
                />
              </div>
              <button
                onClick={() =>
                  confirm(`Delete group “${group.name}” and its sub-skills?`) &&
                  mutate(`/api/skill-groups/${group.id}`, "DELETE")
                }
                className="text-sm text-rose-600 hover:underline"
              >
                Delete group
              </button>
            </div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Sub-skills
            </div>
            <div className="space-y-2">
              {group.subSkills.map((s, i) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 px-3 py-2 border border-slate-200 rounded-md hover:bg-slate-50 group"
                >
                  <span className="w-6 h-6 rounded bg-slate-100 text-slate-600 flex items-center justify-center text-xs">
                    {i + 1}
                  </span>
                  <input
                    defaultValue={s.name}
                    onBlur={(e) =>
                      e.target.value.trim() &&
                      e.target.value !== s.name &&
                      mutate(`/api/subskills/${s.id}`, "PATCH", { name: e.target.value.trim() })
                    }
                    className="flex-1 bg-transparent border-0 outline-none text-sm font-medium"
                  />
                  <button
                    onClick={() =>
                      confirm(`Remove sub-skill “${s.name}”?`) &&
                      mutate(`/api/subskills/${s.id}`, "DELETE")
                    }
                    className="text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <AddInline
              placeholder="New sub-skill name…"
              buttonLabel="+ Add sub-skill"
              onAdd={(v) => mutate(`/api/skill-groups/${group.id}/subskills`, "POST", { name: v })}
            />
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="font-semibold mb-3">Applied to roles</div>
            {roles.length === 0 ? (
              <div className="text-sm text-slate-500">
                No roles yet — create one in the “Roles &amp; levels” tab.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {roles.map((r) => {
                  const on = group.roleIds.includes(r.id);
                  return (
                    <label
                      key={r.id}
                      className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-md cursor-pointer hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={(e) =>
                          mutate(`/api/skill-groups/${group.id}/roles`, "PUT", {
                            roleId: r.id,
                            enabled: e.target.checked,
                          })
                        }
                      />
                      <span className="text-sm">
                        {r.icon} {r.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── Small helpers ─────────────────────────── */

function TextField({
  label,
  value,
  onSave,
  compact,
}: {
  label: string;
  value: string;
  onSave: (v: string) => void;
  compact?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs text-slate-500">{label}</span>
      <input
        defaultValue={value}
        onBlur={(e) => {
          const v = e.target.value.trim();
          if (v && v !== value) onSave(v);
        }}
        className={`border border-slate-200 rounded-md px-3 py-2 mt-1 text-sm ${
          compact ? "w-16 text-center" : "w-full"
        }`}
      />
    </label>
  );
}

function AddInline({
  placeholder,
  buttonLabel,
  onAdd,
}: {
  placeholder: string;
  buttonLabel: string;
  onAdd: (v: string) => void;
}) {
  const [v, setV] = useState("");
  function submit() {
    if (!v.trim()) return;
    onAdd(v.trim());
    setV("");
  }
  return (
    <div className="flex gap-2 mt-3">
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder={placeholder}
        className="flex-1 text-sm border border-slate-200 rounded-md px-3 py-2"
      />
      <button
        onClick={submit}
        className="text-sm text-indigo-600 border border-indigo-200 rounded-md px-3 py-2 hover:bg-indigo-50 whitespace-nowrap"
      >
        {buttonLabel}
      </button>
    </div>
  );
}

function NewRoleButton({
  onCreate,
  full,
}: {
  onCreate: (url: string, method: string, body?: unknown) => Promise<unknown>;
  full?: boolean;
}) {
  return (
    <button
      onClick={() => {
        const name = prompt("New role name (e.g. Designer):");
        if (name?.trim())
          onCreate("/api/roles", "POST", { name: name.trim() });
      }}
      className={`${
        full ? "w-full" : ""
      } px-3 py-2.5 border border-dashed border-slate-300 rounded-md text-sm text-slate-600 hover:bg-slate-50 hover:text-indigo-700 hover:border-indigo-300`}
    >
      + New role
    </button>
  );
}

function NewGroupButton({
  onCreate,
  full,
}: {
  onCreate: (url: string, method: string, body?: unknown) => Promise<unknown>;
  full?: boolean;
}) {
  return (
    <button
      onClick={() => {
        const name = prompt("New skill group name (e.g. Leadership):");
        if (name?.trim())
          onCreate("/api/skill-groups", "POST", { name: name.trim() });
      }}
      className={`${
        full ? "w-full" : ""
      } px-3 py-2.5 border border-dashed border-slate-300 rounded-md text-sm text-slate-600 hover:bg-slate-50 hover:text-indigo-700 hover:border-indigo-300`}
    >
      + New skill group
    </button>
  );
}
