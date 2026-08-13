"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const email = new FormData(e.currentTarget).get("email");
    await fetch("/api/auth/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => {});
    setLoading(false);
    setSent(true);
  }

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
          {sent ? (
            <>
              <h1 className="text-lg font-semibold mb-1">Check your inbox</h1>
              <p className="text-slate-500 text-sm">
                If that email has an account, we&apos;ve sent a link to reset your
                password. It expires in one hour.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-lg font-semibold mb-1">Forgot your password?</h1>
              <p className="text-slate-500 text-sm mb-5">
                Enter your email and we&apos;ll send you a reset link.
              </p>
              <form onSubmit={onSubmit} className="space-y-3">
                <label className="block">
                  <span className="text-xs text-slate-500">Email</span>
                  <input
                    name="email"
                    type="email"
                    required
                    autoFocus
                    placeholder="you@company.com"
                    className="w-full border border-slate-200 rounded-md px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                  />
                </label>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white rounded-md px-3 py-2 font-medium hover:bg-indigo-700 disabled:opacity-60"
                >
                  {loading ? "Sending…" : "Send reset link"}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-slate-500 mt-4">
          <Link href="/login" className="text-indigo-600 hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
