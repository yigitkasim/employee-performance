// Pure score computations, ported from the GrowthMatrix prototype (gm/data.js).
// Works on both server and client. No DB access.

export type ScoreRow = {
  subSkillId: string;
  subSkillName: string;
  groupId: string;
  groupName: string;
  groupIcon: string;
  current: number;
  expected: number;
  self: number | null;
};

export type CatAvg = { cat: string; icon: string; cur: number; exp: number };

export function clampv(lo: number, hi: number, v: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function avgOf(scores: ScoreRow[]): number {
  if (!scores.length) return 0;
  return scores.reduce((s, v) => s + v.current, 0) / scores.length;
}

export function targetOf(scores: ScoreRow[]): number {
  if (!scores.length) return 0;
  return scores.reduce((s, v) => s + v.expected, 0) / scores.length;
}

export function gapOf(scores: ScoreRow[]): number {
  return Math.max(0, targetOf(scores) - avgOf(scores));
}

export function gapCount(scores: ScoreRow[]): number {
  return scores.filter((v) => v.expected - v.current >= 1).length;
}

/** Group scores by their skill group. Preserves group order of first appearance. */
export function skillsByCat(scores: ScoreRow[]): Record<string, ScoreRow[]> {
  const out: Record<string, ScoreRow[]> = {};
  for (const s of scores) {
    (out[s.groupName] ||= []).push(s);
  }
  return out;
}

export function catAvgs(scores: ScoreRow[]): CatAvg[] {
  const byCat = skillsByCat(scores);
  return Object.entries(byCat).map(([cat, sks]) => ({
    cat,
    icon: sks[0]?.groupIcon || "",
    cur: sks.reduce((s, x) => s + x.current, 0) / sks.length,
    exp: sks.reduce((s, x) => s + x.expected, 0) / sks.length,
  }));
}

export type Gap = { name: string; gap: number; cur: number; exp: number };

export function topGaps(scores: ScoreRow[], n = 5): Gap[] {
  return scores
    .map((v) => ({
      name: v.subSkillName,
      gap: v.expected - v.current,
      cur: v.current,
      exp: v.expected,
    }))
    .filter((x) => x.gap > 0)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, n);
}

/** Readiness 0–100 from current vs expected, with optional simulator overrides by sub-skill id. */
export function readinessOf(
  scores: ScoreRow[],
  overrides?: Record<string, number>,
): number {
  if (!scores.length) return 0;
  let cur = 0,
    exp = 0,
    n = 0;
  for (const v of scores) {
    const c =
      overrides && overrides[v.subSkillId] != null
        ? Math.max(v.current, overrides[v.subSkillId])
        : v.current;
    cur += c;
    exp += v.expected;
    n++;
  }
  const a = cur / n,
    t = exp / n;
  return clampv(0, 100, Math.round((100 * (a - 1)) / Math.max(0.1, t - 1)));
}

export function monthsToNext(
  scores: ScoreRow[],
  overrides?: Record<string, number>,
): number {
  if (!scores.length) return 1;
  let cur = 0,
    exp = 0,
    n = 0;
  for (const v of scores) {
    const c =
      overrides && overrides[v.subSkillId] != null
        ? Math.max(v.current, overrides[v.subSkillId])
        : v.current;
    cur += c;
    exp += v.expected;
    n++;
  }
  return Math.max(1, Math.round(Math.max(0, exp / n - cur / n) * 15));
}

export function bandOf(avg: number): "Low" | "Mid" | "High" | "Top" {
  return avg < 2.5 ? "Low" : avg < 3.5 ? "Mid" : avg < 4.2 ? "High" : "Top";
}

export function statusLabel(status: string): { cls: string; label: string } {
  const map: Record<string, [string, string]> = {
    ON_TRACK: ["bg-slate-100 text-slate-700", "On track"],
    PROMO_READY: [
      "bg-emerald-50 text-emerald-700 border border-emerald-200",
      "Promo ready",
    ],
    GROWING: ["bg-blue-50 text-blue-700 border border-blue-200", "Growing"],
    NEEDS_ATTENTION: [
      "bg-amber-50 text-amber-700 border border-amber-200",
      "Needs attention",
    ],
  };
  const [cls, label] = map[status] || map.ON_TRACK;
  return { cls, label };
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0];
}

const AVATAR_COLORS = [
  "bg-indigo-600",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-pink-500",
  "bg-teal-500",
];

export function pickColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function fmtToday(d = new Date()): string {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return months[d.getMonth()] + " " + String(d.getDate()).padStart(2, "0");
}

/** Human "2h ago"-style relative time. */
export function relativeTime(from: Date | string, now = new Date()): string {
  const then = typeof from === "string" ? new Date(from) : from;
  const secs = Math.max(0, Math.floor((now.getTime() - then.getTime()) / 1000));
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const mos = Math.floor(days / 30);
  return `${mos}mo ago`;
}
