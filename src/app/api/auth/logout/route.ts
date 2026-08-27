import { NextResponse } from "next/server";
import {
  destroySession,
  getSession,
  revokeAllSessions,
  audit,
} from "@/lib/auth";

/**
 * Signing out must invalidate the token server-side, not just drop the cookie.
 *
 * Previously logout only cleared the browser cookie, so a copy of that token
 * (kiosk machine, backup, network capture) stayed valid for its full 30-day
 * life. Bumping `sessionsValidFrom` makes every previously issued token for this
 * user fail verification immediately.
 */
export async function POST() {
  const session = await getSession();
  if (session) {
    await revokeAllSessions(session.userId);
    await audit("logout", session.userId);
  }
  await destroySession();
  return NextResponse.json({ ok: true });
}
