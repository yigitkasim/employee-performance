import "server-only";
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY || "";
const from = process.env.EMAIL_FROM || "GrowthMatrix <onboarding@resend.dev>";
const resend = apiKey ? new Resend(apiKey) : null;

export function appUrl(): string {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

/** Escapes untrusted values before interpolating them into HTML email bodies. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function send(to: string, subject: string, html: string, text: string) {
  if (!resend) {
    // Dev fallback: no provider configured, so log the link instead of failing.
    console.log(
      `\n[email:dev] to=${to}\n[email:dev] subject=${subject}\n[email:dev] ${text}\n`,
    );
    return { delivered: false as const };
  }
  try {
    await resend.emails.send({ from, to, subject, html, text });
    return { delivered: true as const };
  } catch (err) {
    console.error("[email] send failed:", err);
    return { delivered: false as const };
  }
}

function layout(heading: string, body: string, cta?: { url: string; label: string }) {
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f8fafc;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a">
  <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:28px">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
      <div style="width:30px;height:30px;border-radius:8px;background:#4f46e5;color:#fff;font-weight:700;text-align:center;line-height:30px">G</div>
      <strong style="font-size:15px">GrowthMatrix</strong>
    </div>
    <h1 style="font-size:18px;margin:0 0 12px">${heading}</h1>
    <div style="font-size:14px;line-height:1.6;color:#334155">${body}</div>
    ${
      cta
        ? `<p style="margin:24px 0"><a href="${cta.url}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:14px;font-weight:500">${esc(cta.label)}</a></p>
           <p style="font-size:12px;color:#64748b;word-break:break-all">Or paste this link into your browser:<br>${esc(cta.url)}</p>`
        : ""
    }
    <hr style="border:0;border-top:1px solid #e2e8f0;margin:24px 0">
    <p style="font-size:12px;color:#94a3b8;margin:0">You received this because someone used this address on GrowthMatrix. If it wasn't you, you can ignore this email.</p>
  </div></body></html>`;
}

export async function sendVerificationEmail(to: string, name: string, token: string) {
  const url = `${appUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  return send(
    to,
    "Confirm your email · GrowthMatrix",
    layout(
      `Welcome, ${esc(name)} 👋`,
      "<p>Confirm your email address to activate your GrowthMatrix workspace. This link expires in 24 hours.</p>",
      { url, label: "Confirm email address" },
    ),
    `Confirm your email address: ${url}`,
  );
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const url = `${appUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  return send(
    to,
    "Reset your password · GrowthMatrix",
    layout(
      "Reset your password",
      "<p>Click the button below to choose a new password. This link expires in 1 hour and can be used once. If you didn't request it, nothing has changed.</p>",
      { url, label: "Choose a new password" },
    ),
    `Reset your password: ${url}`,
  );
}
