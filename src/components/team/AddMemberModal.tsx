"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

export type RoleOption = {
  id: string;
  name: string;
  icon: string;
  levels: { id: string; name: string }[];
};

export function AddMemberModal({
  roles,
  onClose,
}: {
  roles: RoleOption[];
  onClose: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [roleId, setRoleId] = useState(roles[0]?.id ?? "");
  const [levelId, setLevelId] = useState(roles[0]?.levels[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeRole = roles.find((r) => r.id === roleId);

  async function save() {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        title: title.trim(),
        roleId: roleId || null,
        levelId: levelId || null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Could not add member");
      return;
    }
    onClose();
    toast("Member added");
    router.refresh();
  }

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-[480px] p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="font-semibold text-base">Add team member</div>
            <div className="text-xs text-slate-500">
              They&apos;ll start with target scores from the role&apos;s framework.
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="text-xs text-slate-500">Full name</span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-200 rounded-md px-3 py-2 mt-1 text-sm"
              placeholder="Priya Raman"
            />
          </label>
          <label className="block">
            <span className="text-xs text-slate-500">Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-slate-200 rounded-md px-3 py-2 mt-1 text-sm"
              placeholder="Product Manager"
            />
          </label>
          {roles.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs text-slate-500">Role</span>
                <select
                  value={roleId}
                  onChange={(e) => {
                    setRoleId(e.target.value);
                    const r = roles.find((x) => x.id === e.target.value);
                    setLevelId(r?.levels[0]?.id ?? "");
                  }}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 mt-1 text-sm bg-white"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.icon} {r.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs text-slate-500">Level</span>
                <select
                  value={levelId}
                  onChange={(e) => setLevelId(e.target.value)}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 mt-1 text-sm bg-white"
                >
                  {activeRole?.levels.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : (
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              No roles yet — this member will be added without a role. Set up your
              framework first for target scores.
            </div>
          )}
          {error && <div className="text-sm text-rose-600">{error}</div>}
        </div>

        <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-md border border-slate-200 text-sm hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? "Adding…" : "Add member"}
          </button>
        </div>
      </div>
    </div>
  );
}
