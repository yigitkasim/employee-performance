import { describe, it, expect } from "vitest";
import {
  avgOf,
  targetOf,
  gapOf,
  gapCount,
  catAvgs,
  topGaps,
  readinessOf,
  monthsToNext,
  bandOf,
  initialsOf,
  firstName,
  clampv,
  type ScoreRow,
} from "./compute";

function row(
  name: string,
  current: number,
  expected: number,
  group = "Soft Skills",
): ScoreRow {
  return {
    subSkillId: `${group}:${name}`,
    subSkillName: name,
    groupId: group,
    groupName: group,
    groupIcon: "💬",
    current,
    expected,
    self: null,
  };
}

describe("score math", () => {
  const scores = [
    row("A", 2, 4),
    row("B", 3, 3),
    row("C", 1, 5, "Discovery"),
  ];

  it("averages current and expected", () => {
    expect(avgOf(scores)).toBeCloseTo(2);
    expect(targetOf(scores)).toBeCloseTo(4);
  });

  it("computes the gap and counts skills below target", () => {
    expect(gapOf(scores)).toBeCloseTo(2);
    expect(gapCount(scores)).toBe(2); // A (+2) and C (+4); B is at target
  });

  it("orders top gaps largest first", () => {
    const gaps = topGaps(scores, 2);
    expect(gaps.map((g) => g.name)).toEqual(["C", "A"]);
    expect(gaps[0].gap).toBe(4);
  });

  it("groups category averages", () => {
    const cats = catAvgs(scores);
    expect(cats).toHaveLength(2);
    expect(cats.find((c) => c.cat === "Discovery")?.cur).toBe(1);
  });

  it("keeps readiness within 0-100", () => {
    expect(readinessOf(scores)).toBeGreaterThanOrEqual(0);
    expect(readinessOf(scores)).toBeLessThanOrEqual(100);
  });

  it("raises readiness when simulator overrides improve scores", () => {
    const base = readinessOf(scores);
    const better = readinessOf(scores, { "Discovery:C": 5 });
    expect(better).toBeGreaterThan(base);
  });

  it("never returns a negative time-to-next-level", () => {
    expect(monthsToNext(scores)).toBeGreaterThanOrEqual(1);
  });

  it("bands by average", () => {
    expect(bandOf(2)).toBe("Low");
    expect(bandOf(3)).toBe("Mid");
    expect(bandOf(4)).toBe("High");
    expect(bandOf(4.5)).toBe("Top");
  });
});

describe("empty and edge data (clean-slate orgs)", () => {
  it("does not divide by zero with no scores", () => {
    expect(avgOf([])).toBe(0);
    expect(targetOf([])).toBe(0);
    expect(gapOf([])).toBe(0);
    expect(gapCount([])).toBe(0);
    expect(readinessOf([])).toBe(0);
    expect(catAvgs([])).toEqual([]);
    expect(topGaps([], 5)).toEqual([]);
    expect(monthsToNext([])).toBe(1);
  });

  it("handles a member already at target everywhere", () => {
    const maxed = [row("A", 5, 5), row("B", 5, 5)];
    expect(gapOf(maxed)).toBe(0);
    expect(topGaps(maxed, 5)).toEqual([]);
    expect(readinessOf(maxed)).toBe(100);
  });
});

describe("name helpers", () => {
  it("builds initials from one or many words", () => {
    expect(initialsOf("Priya Raman")).toBe("PR");
    expect(initialsOf("Cher")).toBe("CH");
    expect(initialsOf("Yağız Kılıç")).toBe("YK");
  });

  it("extracts the first name", () => {
    expect(firstName("Daniel Müller")).toBe("Daniel");
  });

  it("clamps values", () => {
    expect(clampv(1, 5, 9)).toBe(5);
    expect(clampv(1, 5, -3)).toBe(1);
  });
});
