"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function ResetForm() {
  const token = useSearchParams().get("token") || "";
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") || "");
    const confirm = String(form.get("confirm") || "");
    if (password !== confirm) {
      setError("The two passwords don't match");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Could not reset the password");
      return;
    }
    setDone(true);
  }

  if (!token) {
    return (
      <>
        <h1 className="text-lg font-semibold mb-1">Link is missing a token</h1>
        <p className="text-slate-500 text-sm">
          Open the link exactly as it appears in the email, or request a new one.
        </p>
      </>
    );
  }

  if (done) {
    return (
      <>
        <h1 className="text-lg font-semibold mb-1">Password updated</h1>
        <p className="text-slate-500 text-sm mb-4">
          You&apos;ve been signed out everywhere else. Sign in with your new
          password.
        </p>
        <Link
          href="/login"
          className="inline-block w-full text-center bg-indigo-600 text-white rounded-md px-3 py-2 font-medium hover:bg-indigo-700"
        >
          Go to sign in
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="text-lg font-semibold mb-1">Choose a new password</h1>
      <p className="text-slate-500 text-sm mb-5">At least 8 characters.</p>
      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block">
          <span className="text-xs text-slate-500">New password</span>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoFocus
            className="w-full border border-slate-200 rounded-md px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
          />
        </label>
        <label className="block">
          <span className="text-xs text-slate-500">Confirm new password</span>
          <input
            name="confirm"
            type="password"
            required
            minLength={8}
            className="w-full border border-slate-200 rounded-md px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
          />
        </label>
        {error && (
          <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white rounded-md px-3 py-2 font-medium hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
            G
          </div>
          <div className="font-semibold text-lg">GrowthMatrix</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <Suspense
            fallback={<div className="text-sm text-slate-500">Loading…</div>}
          >
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
