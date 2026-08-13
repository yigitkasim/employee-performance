"use client";

import { useEffect, useState } from "react";
import { relativeTime } from "@/lib/compute";

/**
 * Renders a "2h ago" style timestamp without a hydration mismatch.
 *
 * `relativeTime` depends on the current clock, so the server and the client can
 * land in different buckets ("just now" vs "1m ago") and React throws away the
 * tree. Render a stable absolute date first, then swap to the relative form
 * once mounted — the client-only value never takes part in hydration.
 */
export function RelativeTime({ iso }: { iso: string }) {
  const [rel, setRel] = useState<string | null>(null);

  useEffect(() => {
    setRel(relativeTime(iso));
    const t = setInterval(() => setRel(relativeTime(iso)), 60_000);
    return () => clearInterval(t);
  }, [iso]);

  const absolute = new Date(iso).toISOString().slice(0, 10);
  return <time dateTime={iso} title={absolute}>{rel ?? absolute}</time>;
}
