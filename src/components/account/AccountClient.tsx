"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader, Card } from "@/components/primitives";
import { useToast } from "@/components/ui/Toast";

export type AccountProps = {
  name: string;
  email: string;
  role: string;
  orgName: string;
  createdAt: string;
  termsAcceptedAt: string | null;
  marketingOptIn: boolean;
  memberCount: number;
  isOnlyUser: boolean;
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function AccountClient({
  name,
  email,
  role,
  orgName,
  createdAt,
  termsAcceptedAt,
  marketingOptIn,
  memberCount,
  isOnlyUser,
}: AccountProps) {
  const toast = useToast();
  const [optIn, setOptIn] = useState(marketingOptIn);
  const [savingOptIn, setSavingOptIn] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function toggleOptIn(next: boolean) {
    setOptIn(next);
    setSavingOptIn(true);
    const res = await fetch("/api/account/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ marketingOptIn: next }),
    });
    setSavingOptIn(false);
    if (!res.ok) {
      setOptIn(!next);
      toast("Could not save your preference");
      return;
    }
    toast(next ? "You're subscribed to product updates" : "Unsubscribed");
  }

  return (
    <>
      <PageHeader
        title="Account & privacy"
        subtitle="Your profile, email preferences and data rights."
      />

      <div className="space-y-5 max-w-3xl">
        {/* ── Profile ───────────────────────────────────────────── */}
        <Card className="p-5">
          <div className="font-semibold text-base">Profile</div>
          <div className="text-xs text-slate-500 mt-0.5">
            Read-only. Contact support to change your email address.
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 mt-4">
            <Row label="Name" value={name} />
            <Row label="Email" value={email} />
            <Row label="Workspace" value={orgName} />
            <Row
              label="Role"
              value={role === "OWNER" ? "Owner" : "Manager"}
            />
            <Row label="Member since" value={formatDate(createdAt)} />
            <Row label="Terms accepted" value={formatDate(termsAcceptedAt)} />
          </dl>
        </Card>

        {/* ── Email preferences ─────────────────────────────────── */}
        <Card className="p-5">
          <div className="font-semibold text-base">Email preferences</div>
          <div className="text-xs text-slate-500 mt-0.5">
            You will always receive essential service emails — sign-in
            verification, password resets, security and billing notices.
          </div>
          <label className="flex items-start gap-3 mt-4 cursor-pointer">
            <input
              type="checkbox"
              checked={optIn}
              disabled={savingOptIn}
              onChange={(e) => toggleOptIn(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-200"
            />
            <span>
              <span className="text-sm text-slate-800">
                Send me occasional product updates by email
              </span>
              <span className="block text-xs text-slate-500 mt-0.5">
                Optional marketing consent. You can withdraw it at any time —
                withdrawing does not affect processing that already happened.
              </span>
            </span>
          </label>
        </Card>

        {/* ── Your data ─────────────────────────────────────────── */}
        <Card className="p-5">
          <div className="font-semibold text-base">Your data</div>
          <div className="text-xs text-slate-500 mt-0.5">
            Data portability under GDPR Art. 20, UK GDPR, KVKK Art. 11,
            CCPA/CPRA and PIPEDA.
          </div>
          <p className="text-sm text-slate-600 mt-3">
            Download a complete JSON copy of your profile and your entire
            workspace: organisation, cycles, job roles and levels, skill groups
            and sub-skills, expected scores, all {memberCount} team member
            {memberCount === 1 ? "" : "s"} with their scores, history log,
            inbox items, goals, talking points, checklists, notes and simulator
            values. Password hashes are never included.
          </p>
          <a
            href="/api/account/export"
            download
            className="inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700"
          >
            Download my data
          </a>
        </Card>

        {/* ── Danger zone ───────────────────────────────────────── */}
        <Card className="p-5 border-rose-200">
          <div className="font-semibold text-base text-rose-700">
            Danger zone
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Right to erasure — GDPR Art. 17, KVKK Art. 7, CCPA/CPRA.
          </div>
          <p className="text-sm text-slate-600 mt-3">
            Deleting your account is <strong>permanent and immediate</strong>.
            It cannot be undone and we cannot recover the data for you.
          </p>
          <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-3 py-2 mt-3">
            {isOnlyUser ? (
              <>
                You are the only user in <strong>{orgName}</strong>, so deleting
                your account also permanently deletes the whole workspace —
                including all {memberCount} team member
                {memberCount === 1 ? "" : "s"}, every rating, note, goal and log
                entry.
              </>
            ) : (
              <>
                Other users remain in <strong>{orgName}</strong>, so only your
                own user account will be deleted. The workspace and its team
                member records stay with the remaining users.
              </>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Tip: download your data first — the export above is the only copy
            you will get.
          </p>
          <button
            onClick={() => setDeleteOpen(true)}
            className="mt-4 px-3 py-1.5 rounded-md border border-rose-300 text-rose-700 text-sm hover:bg-rose-50"
          >
            Delete account
          </button>
        </Card>

        <p className="text-center text-xs text-slate-400 pb-2">
          <Link href="/terms" className="hover:text-slate-600 hover:underline">
            Terms of Service
          </Link>
          <span className="mx-2 text-slate-300">·</span>
          <Link href="/privacy" className="hover:text-slate-600 hover:underline">
            Privacy Policy
          </Link>
          <span className="mx-2 text-slate-300">·</span>
          <Link href="/dpa" className="hover:text-slate-600 hover:underline">
            Data Processing Addendum
          </Link>
        </p>
      </div>

      {deleteOpen && (
        <DeleteAccountModal
          orgName={orgName}
          isOnlyUser={isOnlyUser}
          memberCount={memberCount}
          onClose={() => setDeleteOpen(false)}
        />
      )}
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-800 mt-0.5 truncate">{value}</dd>
    </div>
  );
}

function DeleteAccountModal({
  orgName,
  isOnlyUser,
  memberCount,
  onClose,
}: {
  orgName: string;
  isOnlyUser: boolean;
  memberCount: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmDelete() {
    if (!password) {
      setError("Enter your password to confirm");
      return;
    }
    setDeleting(true);
    setError(null);
    const res = await fetch("/api/account/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Could not delete your account");
      setDeleting(false);
      return;
    }
    router.push("/login");
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
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="font-semibold text-base text-rose-700">
              Delete your account
            </div>
            <div className="text-xs text-slate-500">
              This is permanent. There is no undo and no recovery.
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            ✕
          </button>
        </div>

        <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
          {isOnlyUser ? (
            <>
              The workspace <strong>{orgName}</strong> and all {memberCount} team
              member{memberCount === 1 ? "" : "s"} — every rating, note, goal,
              inbox item and log entry — will be permanently deleted.
            </>
          ) : (
            <>
              Your user account will be permanently deleted. The workspace{" "}
              <strong>{orgName}</strong> will remain for its other users.
            </>
          )}
        </div>

        <label className="block mt-4">
          <span className="text-xs text-slate-500">
            Type your password to confirm
          </span>
          <input
            autoFocus
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") confirmDelete();
            }}
            placeholder="••••••••"
            className="w-full border border-slate-200 rounded-md px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400"
          />
        </label>

        {error && <div className="text-sm text-rose-600 mt-2">{error}</div>}

        <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-md border border-slate-200 text-sm hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={confirmDelete}
            disabled={deleting}
            className="px-3 py-1.5 rounded-md bg-rose-600 text-white text-sm hover:bg-rose-700 disabled:opacity-60"
          >
            {deleting ? "Deleting…" : "Permanently delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
