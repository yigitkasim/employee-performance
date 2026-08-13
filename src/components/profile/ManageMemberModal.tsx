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

const STATUSES = [
  ["ON_TRACK", "On track"],
  ["GROWING", "Growing"],
  ["PROMO_READY", "Promo ready"],
  ["NEEDS_ATTENTION", "Needs attention"],
] as const;

/**
 * Edit or remove a team member. Deletion matters beyond convenience: the
 * customer org is the controller for its team members' data, so it needs a way
 * to rectify (GDPR Art. 16 / KVKK Art. 11) and erase (Art. 17) their records.
 */
export function ManageMemberModal({
  member,
  roles,
  onClose,
}: {
  member: {
    id: string;
    name: string;
    title: string;
    status: string;
    roleId: string | null;
    levelId: string | null;
  };
  roles: RoleOption[];
  onClose: () => void;
}) {
  const router = useRouter();
  const toast = useToast();

  const [name, setName] = useState(member.name);
  const [title, setTitle] = useState(member.title);
  const [status, setStatus] = useState(member.status);
  const [roleId, setRoleId] = useState(member.roleId ?? "");
  const [levelId, setLevelId] = useState(member.levelId ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const activeRole = roles.find((r) => r.id === roleId);
  const roleChanged = roleId !== (member.roleId ?? "");
  const levelChanged = levelId !== (member.levelId ?? "");

  async function save() {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/members/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        title: title.trim(),
        status,
        roleId: roleId || null,
        levelId: levelId || null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Could not save changes");
      return;
    }
    onClose();
    toast("Member updated");
    router.refresh();
  }

  async function remove() {
    setSaving(true);
    const res = await fetch(`/api/members/${member.id}`, { method: "DELETE" });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Could not delete this member");
      return;
    }
    onClose();
    toast(`${member.name} was permanently deleted`);
    router.push("/app");
    router.refresh();
  }

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-[520px] max-h-[90vh] overflow-auto scroll-area"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="font-semibold text-base">Manage member</div>
              <div className="text-xs text-slate-500">
                Correct their details, move them to a new level, or remove them.
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3">
            <label className="block">
              <span className="text-xs text-slate-500">Full name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-2 mt-1 text-sm"
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

            {roles.length > 0 && (
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
                    <option value="">— none —</option>
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
                    disabled={!activeRole}
                    className="w-full border border-slate-200 rounded-md px-3 py-2 mt-1 text-sm bg-white disabled:bg-slate-50"
                  >
                    <option value="">— none —</option>
                    {activeRole?.levels.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            <label className="block">
              <span className="text-xs text-slate-500">Status</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-2 mt-1 text-sm bg-white"
              >
                {STATUSES.map(([v, label]) => (
                  <option key={v} value={v}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            {(roleChanged || levelChanged) && (
              <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                Changing role or level re-applies the expected scores from the
                framework. Their current ratings and history are kept.
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
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>

        {/* Danger zone */}
        <div className="border-t border-slate-200 bg-rose-50/40 p-5 rounded-b-xl">
          <div className="font-semibold text-sm text-rose-700 mb-1">
            Remove from the team
          </div>
          <p className="text-xs text-slate-600 mb-3">
            Permanently deletes {member.name}&apos;s ratings, history log,
            goals, notes and checklist. This cannot be undone — use it when
            someone leaves or asks you to erase their record.
          </p>

          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-sm px-3 py-1.5 rounded-md border border-rose-300 text-rose-700 hover:bg-rose-100"
            >
              Delete member…
            </button>
          ) : (
            <div className="space-y-2">
              <label className="block">
                <span className="text-xs text-slate-600">
                  Type <strong>{member.name}</strong> to confirm
                </span>
                <input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  autoFocus
                  className="w-full border border-rose-200 rounded-md px-3 py-2 mt-1 text-sm"
                />
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setConfirmDelete(false);
                    setConfirmText("");
                  }}
                  className="px-3 py-1.5 rounded-md border border-slate-200 text-sm hover:bg-white"
                >
                  Cancel
                </button>
                <button
                  onClick={remove}
                  disabled={saving || confirmText !== member.name}
                  className="px-3 py-1.5 rounded-md bg-rose-600 text-white text-sm hover:bg-rose-700 disabled:opacity-50"
                >
                  {saving ? "Deleting…" : "Permanently delete"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
