import { NextResponse } from "next/server";
import { getVerifiedSession, type SessionPayload } from "./auth";

/**
 * Guard for API route handlers. Returns either the session or a NextResponse
 * (401) to return early. Usage:
 *   const s = await authed(); if (s instanceof NextResponse) return s;
 *
 * Uses the fully verified session: a cookie is rejected once the account is
 * suspended or its sessions have been revoked (password reset / sign-out
 * everywhere), not merely when the JWT signature expires.
 */
export async function authed(): Promise<SessionPayload | NextResponse> {
  const session = await getVerifiedSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session;
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}
