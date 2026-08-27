import { describe, it, expect, vi, beforeAll } from "vitest";

// auth.ts is server-only and reads AUTH_SECRET at import time; satisfy both so
// the pure policy function can be exercised in isolation.
vi.mock("server-only", () => ({}));
vi.mock("./db", () => ({ prisma: {} }));

let passwordProblem: (
  pw: string,
  ctx?: { email?: string; name?: string; orgName?: string },
) => string | null;

beforeAll(async () => {
  process.env.AUTH_SECRET = "test-secret-value-at-least-32-characters-long";
  ({ passwordProblem } = await import("./auth"));
});

describe("passwordProblem — NIST 800-63B style policy", () => {
  it("accepts a strong passphrase", () => {
    expect(passwordProblem("Str0ng!Passphrase42")).toBeNull();
  });

  it("rejects short passwords", () => {
    expect(passwordProblem("short7!")).toMatch(/at least 8/);
  });

  it("rejects common/breached passwords", () => {
    for (const pw of ["password", "12345678", "qwerty123", "iloveyou"]) {
      expect(passwordProblem(pw)).toMatch(/too common/);
    }
  });

  it("rejects a single repeated character", () => {
    expect(passwordProblem("aaaaaaaa")).toBeTruthy();
  });

  it("rejects the password equal to the email or its local part", () => {
    expect(passwordProblem("user@acme.test", { email: "user@acme.test" })).toMatch(
      /email/,
    );
    expect(passwordProblem("useruser", { email: "useruser@acme.test" })).toMatch(
      /email/,
    );
  });

  it("rejects the password equal to the name or org name", () => {
    expect(passwordProblem("acme corp", { orgName: "Acme Corp" })).toMatch(
      /name/,
    );
  });

  it("rejects passwords longer than 72 bytes (bcrypt's limit)", () => {
    expect(passwordProblem("A".repeat(73))).toMatch(/at most 72/);
  });
});
