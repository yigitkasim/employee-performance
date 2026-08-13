"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSignup = mode === "signup";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const payload: Record<string, unknown> = Object.fromEntries(form.entries());
    if (isSignup) {
      // Checkboxes must go over the wire as real booleans.
      payload.acceptTerms = form.get("acceptTerms") === "on";
      payload.marketingOptIn = form.get("marketingOptIn") === "on";
    }
    try {
      const res = await fetch(`/api/auth/${isSignup ? "signup" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }
      router.push("/app");
      router.refresh();
    } catch {
      setError("Network error — please try again");
      setLoading(false);
    }
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
          <h1 className="text-lg font-semibold mb-1">
            {isSignup ? "Create your workspace" : "Welcome back"}
          </h1>
          <p className="text-slate-500 text-sm mb-5">
            {isSignup
              ? "Start evaluating and growing your team."
              : "Sign in to your GrowthMatrix workspace."}
          </p>

          <form onSubmit={onSubmit} className="space-y-3">
            {isSignup && (
              <>
                <Field label="Your name" name="name" type="text" placeholder="Jordan Lee" />
                <Field
                  label="Organization"
                  name="orgName"
                  type="text"
                  placeholder="Acme Corp"
                />
              </>
            )}
            <Field label="Email" name="email" type="email" placeholder="you@company.com" />
            <Field
              label="Password"
              name="password"
              type="password"
              placeholder={isSignup ? "At least 8 characters" : "••••••••"}
            />

            {!isSignup && (
              <div className="text-right -mt-1">
                <Link
                  href="/forgot-password"
                  className="text-xs text-indigo-600 hover:underline"
                >
                  Forgot your password?
                </Link>
              </div>
            )}

            {isSignup && (
              <div className="space-y-2 pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    name="acceptTerms"
                    type="checkbox"
                    required
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-200"
                  />
                  <span className="text-xs text-slate-600 leading-relaxed">
                    I agree to the{" "}
                    <Link
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    name="marketingOptIn"
                    type="checkbox"
                    defaultChecked={false}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-200"
                  />
                  <span className="text-xs text-slate-600 leading-relaxed">
                    Send me occasional product updates by email. Optional — you
                    can change this any time in Account &amp; privacy.
                  </span>
                </label>
              </div>
            )}

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
              {loading
                ? "Please wait…"
                : isSignup
                  ? "Create workspace"
                  : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-4">
          {isSignup ? (
            <>
              Already have an account?{" "}
              <Link href="/login" className="text-indigo-600 hover:underline">
                Sign in
              </Link>
            </>
          ) : (
            <>
              New to GrowthMatrix?{" "}
              <Link href="/signup" className="text-indigo-600 hover:underline">
                Create a workspace
              </Link>
            </>
          )}
        </p>

        <p className="text-center text-xs text-slate-400 mt-6">
          <Link href="/terms" className="hover:text-slate-600 hover:underline">
            Terms
          </Link>
          <span className="mx-2 text-slate-300">·</span>
          <Link href="/privacy" className="hover:text-slate-600 hover:underline">
            Privacy
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type,
  placeholder,
}: {
  label: string;
  name: string;
  type: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs text-slate-500">{label}</span>
      <input
        name={name}
        type={type}
        required
        placeholder={placeholder}
        className="w-full border border-slate-200 rounded-md px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
      />
    </label>
  );
}
