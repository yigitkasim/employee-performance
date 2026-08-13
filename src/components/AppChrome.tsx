"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icons } from "./Icons";
import { ToastProvider, useToast } from "./ui/Toast";
import { firstName } from "@/lib/compute";

export type NavMember = { id: string; name: string; color: string };

type ChromeData = {
  orgName: string;
  cycles: { id: string; name: string; active: boolean }[];
  userName: string;
  inboxCount: number;
  members: NavMember[];
};

const NAV = [
  { href: "/app", label: "Team", icon: "users", exact: true },
  { href: "/app/profile", label: "Profile", icon: "user" },
  { href: "/app/skills", label: "Skills (rate)", icon: "sliders" },
  { href: "/app/gaps", label: "Skill gaps", icon: "grid" },
  { href: "/app/simulator", label: "Growth simulator", icon: "trending" },
  { href: "/app/self", label: "Self vs manager", icon: "split" },
  { href: "/app/compare", label: "Compare members", icon: "compare" },
  { href: "/app/promotion", label: "Promotion", icon: "trophy" },
  { href: "/app/one-on-one", label: "1:1 prep", icon: "chat" },
  { href: "/app/history", label: "History & log", icon: "clock" },
  { href: "/app/inbox", label: "Capture inbox", icon: "inbox", badge: true },
  { href: "/app/framework", label: "Roles & skills", icon: "cog" },
];

export function AppChrome({
  data,
  children,
}: {
  data: ChromeData;
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <Chrome data={data}>{children}</Chrome>
    </ToastProvider>
  );
}

function Chrome({ data, children }: { data: ChromeData; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [captureOpen, setCaptureOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "l") {
        e.preventDefault();
        setCaptureOpen(true);
      }
      if (e.key === "Escape") setCaptureOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const userInitial = (data.userName || "?").charAt(0).toUpperCase();

  return (
    <>
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
              G
            </div>
            <div className="font-semibold">GrowthMatrix</div>
            <span className="text-slate-300">/</span>
            <span className="text-sm border border-slate-200 rounded-md px-2 py-1">
              {data.orgName}
            </span>
            <span className="text-slate-300">/</span>
            {/* Shown as a label, not a picker: scores are not yet snapshotted
                per cycle, so offering a switcher would imply filtering that
                doesn't happen. */}
            <span
              className="text-sm border border-slate-200 rounded-md px-2 py-1 text-slate-600"
              title="The review cycle currently in progress"
            >
              {data.cycles.find((c) => c.active)?.name ??
                data.cycles[0]?.name ??
                "Current cycle"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm relative">
            <button
              onClick={() => setCaptureOpen(true)}
              className="px-3 py-1.5 rounded-md text-slate-600 hover:bg-slate-100 flex items-center gap-1.5"
            >
              <Icons.plus />
              Quick capture
              <kbd className="ml-1 text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">
                ⌘⇧L
              </kbd>
            </button>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-medium"
              title={data.userName}
            >
              {userInitial}
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-11 bg-white border border-slate-200 rounded-lg shadow-lg py-1 w-48 z-40">
                <div className="px-3 py-2 border-b border-slate-100">
                  <div className="font-medium text-sm truncate">{data.userName}</div>
                  <div className="text-xs text-slate-500 truncate">{data.orgName}</div>
                </div>
                <Link
                  href="/app/account"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2 text-sm hover:bg-slate-50 text-slate-700"
                >
                  Account &amp; privacy
                </Link>
                <button
                  onClick={logout}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 text-slate-700"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-60 border-r border-slate-200 bg-white min-h-[calc(100vh-3.5rem)] p-3 sticky top-14 self-start">
          <nav className="space-y-0.5 text-sm">
            {NAV.map((n) => {
              const active = n.exact
                ? pathname === n.href
                : pathname === n.href || pathname.startsWith(n.href + "/");
              const Icon = Icons[n.icon];
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`nav-item ${active ? "active" : ""} w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-slate-700 hover:bg-slate-50 text-left`}
                >
                  <Icon />
                  <span className="flex-1">{n.label}</span>
                  {n.badge && data.inboxCount > 0 && (
                    <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-semibold">
                      {data.inboxCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">
              Cycle progress
            </div>
            <div className="px-3">
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>Team members</span>
                <span className="font-medium">{data.members.length}</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600"
                  style={{
                    width: `${Math.min(100, data.members.length * 12.5)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">
          <div className="max-w-[1400px] mx-auto px-6 py-6">{children}</div>
        </main>
      </div>

      {captureOpen && (
        <QuickCapture
          members={data.members}
          onClose={() => setCaptureOpen(false)}
        />
      )}
    </>
  );
}

function QuickCapture({
  members,
  onClose,
}: {
  members: NavMember[];
  onClose: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  function detect(t: string): NavMember | null {
    const lower = t.toLowerCase();
    return (
      members.find((m) => lower.includes(firstName(m.name).toLowerCase())) || null
    );
  }
  const detected = detect(text);

  async function save() {
    if (!text.trim()) {
      onClose();
      return;
    }
    setSaving(true);
    await fetch("/api/inbox", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.trim() }),
    });
    setSaving(false);
    onClose();
    toast("Captured to inbox");
    router.refresh();
  }

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-[560px] p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="font-semibold text-base">Quick capture</div>
            <div className="text-xs text-slate-500">
              Drop an observation now, file it later.
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            ✕
          </button>
        </div>
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") save();
          }}
          className="w-full border border-slate-200 rounded-md p-3 h-24 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
          placeholder="Describe what happened — mention a first name to auto-tag…"
        />
        <div className="flex gap-2 mt-2 min-h-[26px]">
          {detected ? (
            <>
              <span className="text-xs px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                @{firstName(detected.name).toLowerCase()}
              </span>
              <span className="text-xs text-slate-400 self-center">
                auto-detected
              </span>
            </>
          ) : (
            <span className="text-xs text-slate-400 self-center">
              Mention a first name (e.g. &quot;Priya…&quot;) to auto-tag
            </span>
          )}
        </div>
        <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100">
          <span className="text-xs text-slate-500">
            Auto-files to inbox · ⌘+↵ to save
          </span>
          <div className="flex gap-2">
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
              Save to inbox
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
