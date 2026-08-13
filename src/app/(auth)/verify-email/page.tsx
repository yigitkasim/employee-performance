"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function VerifyInner() {
  const token = useSearchParams().get("token") || "";
  const [state, setState] = useState<"working" | "ok" | "bad">("working");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setState("bad");
      setMessage("This link is missing its confirmation token.");
      return;
    }
    (async () => {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setState("ok");
      } else {
        setState("bad");
        setMessage(data.error || "This confirmation link is invalid or expired.");
      }
    })();
  }, [token]);

  if (state === "working") {
    return <div className="text-sm text-slate-500">Confirming your email…</div>;
  }

  if (state === "ok") {
    return (
      <>
        <div className="text-2xl mb-2">✅</div>
        <h1 className="text-lg font-semibold mb-1">Email confirmed</h1>
        <p className="text-slate-500 text-sm mb-4">
          Your address is verified. You&apos;re all set.
        </p>
        <Link
          href="/app"
          className="inline-block w-full text-center bg-indigo-600 text-white rounded-md px-3 py-2 font-medium hover:bg-indigo-700"
        >
          Go to GrowthMatrix
        </Link>
      </>
    );
  }

  return (
    <>
      <div className="text-2xl mb-2">⚠️</div>
      <h1 className="text-lg font-semibold mb-1">Couldn&apos;t confirm</h1>
      <p className="text-slate-500 text-sm mb-4">{message}</p>
      <Link
        href="/app"
        className="inline-block w-full text-center border border-slate-200 rounded-md px-3 py-2 font-medium hover:bg-slate-50"
      >
        Open the app and resend
      </Link>
    </>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
            G
          </div>
          <div className="font-semibold text-lg">GrowthMatrix</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm text-center">
          <Suspense
            fallback={<div className="text-sm text-slate-500">Loading…</div>}
          >
            <VerifyInner />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
