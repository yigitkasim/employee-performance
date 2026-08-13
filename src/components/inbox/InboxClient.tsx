"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/primitives";
import { useToast } from "@/components/ui/Toast";
import { firstName, relativeTime } from "@/lib/compute";

type InboxRow = {
  id: string;
  source: string;
  text: string;
  skillName: string | null;
  createdAt: string;
  member: { id: string; name: string; color: string } | null;
};

export function InboxClient({
  items,
  sources,
  stats,
}: {
  items: InboxRow[];
  sources: Record<string, boolean>;
  stats: { filed: number; bumped: number };
}) {
  const router = useRouter();
  const toast = useToast();
  const jotRef = useRef<HTMLTextAreaElement>(null);
  const [jot, setJot] = useState("");
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [srcState, setSrcState] = useState(sources);
  useEffect(() => setSrcState(sources), [sources]);

  async function jotSave() {
    const text = jot.trim();
    if (!text || saving) return;
    setSaving(true);
    const res = await fetch("/api/inbox", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    setSaving(false);
    if (res.ok) {
      setJot("");
      toast("Captured to inbox");
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      toast(d.error || "Could not save");
    }
  }

  async function archive(id: string) {
    setBusy(id);
    await fetch(`/api/inbox/${id}`, { method: "DELETE" });
    setBusy(null);
    toast("Archived");
    router.refresh();
  }

  async function file(item: InboxRow, bump: boolean) {
    setBusy(item.id);
    const res = await fetch(`/api/inbox/${item.id}/file`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bump }),
    });
    setBusy(null);
    const d = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast(d.error || "Could not file");
      return;
    }
    if (bump) {
      if (d.bumped && item.member) {
        toast(
          `${firstName(item.member.name)} · ${item.skillName} bumped to ${d.toScore}`,
        );
      } else {
        toast("Already at 5 — filed as observation instead");
      }
    } else {
      toast("Filed as observation");
    }
    router.refresh();
  }

  async function toggleSource(label: string, enabled: boolean) {
    setSrcState((prev) => ({ ...prev, [label]: enabled }));
    await fetch("/api/org/sources", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, enabled }),
    });
  }

  return (
    <>
      <PageHeader
        title="Capture inbox"
        subtitle={
          items.length
            ? `${items.length} unsorted observation${items.length > 1 ? "s" : ""} · drop now, file later.`
            : "Inbox zero — nice."
        }
        actions={
          <>
            <span className="text-xs px-2 py-1 rounded-md bg-slate-100 text-slate-600 self-center">
              ⌘⇧L global capture
            </span>
            <button
              onClick={() => toast("Slack connection is stubbed in this prototype")}
              className="text-sm border border-slate-200 rounded-md px-3 py-1.5 hover:bg-slate-50"
            >
              Connect Slack
            </button>
            <button
              onClick={() => jotRef.current?.focus()}
              className="text-sm bg-indigo-600 text-white rounded-md px-3 py-1.5 hover:bg-indigo-700"
            >
              + Quick note
            </button>
          </>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-3">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <textarea
              ref={jotRef}
              value={jot}
              onChange={(e) => setJot(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") jotSave();
              }}
              className="w-full text-sm border-0 outline-none resize-none"
              rows={2}
              placeholder="Just jot it — mention a first name to auto-suggest, e.g. 'Priya ran a great retro'…"
            />
            <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs">
              <div className="flex gap-1.5">
                <span className="px-2 py-0.5 rounded bg-slate-100">@</span>
                <span className="px-2 py-0.5 rounded bg-slate-100">#skill</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">
                  <kbd className="px-1.5 py-0.5 bg-slate-100 rounded">⌘</kbd>+
                  <kbd className="px-1.5 py-0.5 bg-slate-100 rounded">↵</kbd>
                </span>
                <button
                  onClick={jotSave}
                  disabled={saving}
                  className="px-2.5 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  Save
                </button>
              </div>
            </div>
          </div>

          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-200 rounded-xl p-4"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {item.source}
                </span>
                <span className="text-xs text-slate-500">
                  {relativeTime(item.createdAt)}
                </span>
              </div>
              <div className="text-sm text-slate-700">{item.text}</div>
              <div className="flex flex-wrap gap-1.5 items-center mt-3">
                <span className="text-xs text-slate-500">Files to:</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {item.member ? item.member.name : "Unassigned"}
                </span>
                {item.skillName ? (
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {item.skillName}
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                    no skill
                  </span>
                )}
              </div>
              <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-slate-100">
                <button
                  onClick={() => archive(item.id)}
                  disabled={busy === item.id}
                  className="text-xs px-2 py-1 rounded text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                >
                  Archive
                </button>
                <button
                  onClick={() => file(item, false)}
                  disabled={busy === item.id}
                  className="text-xs px-2 py-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
                >
                  File as observation
                </button>
                {item.skillName && item.member && (
                  <button
                    onClick={() => file(item, true)}
                    disabled={busy === item.id}
                    className="text-xs px-2 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    File &amp; bump score
                  </button>
                )}
              </div>
            </div>
          ))}
          {!items.length && (
            <div className="bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center text-sm text-slate-500">
              Everything filed. New captures land here.
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="font-semibold mb-2">Sources</div>
            <div className="space-y-2 text-sm">
              {Object.entries(srcState).map(([label, enabled]) => (
                <label
                  key={label}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => toggleSource(label, e.target.checked)}
                  />{" "}
                  <span>{label}</span>
                </label>
              ))}
              {!Object.keys(srcState).length && (
                <div className="text-slate-500">No sources connected yet.</div>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="font-semibold mb-3">This week</div>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <span className="text-slate-500">In inbox</span>
              <span className="text-right font-semibold">{items.length}</span>
              <span className="text-slate-500">Filed</span>
              <span className="text-right font-semibold">{stats.filed}</span>
              <span className="text-slate-500">Score changes</span>
              <span className="text-right font-semibold">{stats.bumped}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
