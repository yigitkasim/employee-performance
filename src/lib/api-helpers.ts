import { NextResponse } from "next/server";
import { getSession, type SessionPayload } from "./auth";

/**
 * Guard for API route handlers. Returns either the session or a NextResponse
 * (401) to return early. Usage:
 *   const s = await authed(); if (s instanceof NextResponse) return s;
 */
export async function authed(): Promise<SessionPayload | NextResponse> {
  const session = await getSession();
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
