import { NextRequest, NextResponse } from "next/server";

/**
 * Edge middleware: two defences that belong in front of every request.
 *
 * 1. CSRF (defence in depth). The session cookie is SameSite=Lax, which already
 *    blocks cross-site XHR/fetch, but Lax still sends cookies on top-level GET
 *    navigations and browsers/proxies vary. Any state-changing request must
 *    therefore carry an Origin (or Referer) that matches this host.
 * 2. Cache hygiene. Responses from /api can contain personal data; make sure no
 *    shared cache or proxy is ever allowed to store them.
 */

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!host) return false;

  // Prefer Origin; fall back to Referer for clients that omit it.
  const candidate =
    origin ?? (req.headers.get("referer") || "").slice(0, 2048) ?? "";
  if (!candidate) {
    // No Origin and no Referer. Browsers always send Origin on cross-site
    // state-changing requests, so treat this as a non-browser client (curl,
    // server-to-server) and allow it — the session cookie still gates access.
    return true;
  }
  try {
    return new URL(candidate).host === host;
  } catch {
    return false;
  }
}

export function middleware(req: NextRequest) {
  const isApi = req.nextUrl.pathname.startsWith("/api/");

  if (MUTATING.has(req.method) && !sameOrigin(req)) {
    return NextResponse.json(
      { error: "Cross-site request blocked" },
      { status: 403 },
    );
  }

  const res = NextResponse.next();
  if (isApi) {
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    res.headers.set("Pragma", "no-cache");
  }
  return res;
}

export const config = {
  matcher: ["/api/:path*", "/app/:path*"],
};
