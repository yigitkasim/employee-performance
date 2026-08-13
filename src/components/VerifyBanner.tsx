"use client";

import { useState } from "react";
import { useToast } from "./ui/Toast";

/** Amber strip shown across the app until the signed-in user confirms their email. */
export function VerifyBanner({ email }: { email: string }) {
  const toast = useToast();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function resend() {
    setSending(true);
    const res = await fetch("/api/auth/verify-email", { method: "PUT" });
    const data = await res.json().catch(() => ({}));
    setSending(false);
    if (res.ok) {
      setSent(true);
      toast(
        data.delivered === false
          ? "Email provider not configured — link logged to the server console"
          : "Confirmation email sent",
      );
    } else {
      toast(data.error || "Could not send the email");
    }
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-900">
      <div className="px-6 py-2 flex items-center gap-3 text-sm">
        <span>
          Confirm your email address <strong>{email}</strong> to secure your
          account.
        </span>
        <button
          onClick={resend}
          disabled={sending || sent}
          className="ml-auto text-xs font-medium px-2.5 py-1 rounded-md border border-amber-300 hover:bg-amber-100 disabled:opacity-60"
        >
          {sending ? "Sending…" : sent ? "Sent ✓" : "Resend email"}
        </button>
      </div>
    </div>
  );
}
