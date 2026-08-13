"use client";

import { useState } from "react";

/**
 * Amber strip shown across the app until the signed-in user confirms their
 * email. Self-contained (no toast context) so it can render outside AppChrome.
 */
export function VerifyBanner({ email }: { email: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [note, setNote] = useState("");

  async function resend() {
    setStatus("sending");
    try {
      const res = await fetch("/api/auth/verify-email", { method: "PUT" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setNote(data.error || "Could not send the email");
        return;
      }
      setStatus("sent");
      setNote(
        data.delivered === false
          ? "Email provider not configured — the link was written to the server log."
          : "Confirmation email sent.",
      );
    } catch {
      setStatus("error");
      setNote("Network error — please try again");
    }
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-900">
      <div className="px-6 py-2 flex items-center gap-3 text-sm flex-wrap">
        <span>
          Confirm your email address <strong>{email}</strong> to secure your
          account.
        </span>
        {note && <span className="text-xs text-amber-700">{note}</span>}
        <button
          onClick={resend}
          disabled={status === "sending" || status === "sent"}
          className="ml-auto text-xs font-medium px-2.5 py-1 rounded-md border border-amber-300 hover:bg-amber-100 disabled:opacity-60"
        >
          {status === "sending"
            ? "Sending…"
            : status === "sent"
              ? "Sent ✓"
              : "Resend email"}
        </button>
      </div>
    </div>
  );
}
