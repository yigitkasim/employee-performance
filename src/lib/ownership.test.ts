import { describe, it, expect, vi, beforeEach } from "vitest";

// The ownership guards are the only thing standing between a caller and another
// tenant's records when an id arrives in a REQUEST BODY. These tests pin the
// contract: every guard must filter by orgId and return null on a miss.

const findFirst = {
  jobRole: vi.fn(),
  level: vi.fn(),
  subSkill: vi.fn(),
  skillGroup: vi.fn(),
};

vi.mock("server-only", () => ({}));
vi.mock("./db", () => ({
  prisma: {
    jobRole: { findFirst: (...a: unknown[]) => findFirst.jobRole(...a) },
    level: { findFirst: (...a: unknown[]) => findFirst.level(...a) },
    subSkill: { findFirst: (...a: unknown[]) => findFirst.subSkill(...a) },
    skillGroup: { findFirst: (...a: unknown[]) => findFirst.skillGroup(...a) },
  },
}));

const {
  ownedRoleId,
  ownedLevelId,
  ownedSubSkillId,
  ownedGroupId,
} = await import("./ownership");

beforeEach(() => {
  Object.values(findFirst).forEach((f) => f.mockReset());
});

describe("ownership guards", () => {
  it("returns the id when the row belongs to the org", async () => {
    findFirst.jobRole.mockResolvedValue({ id: "role-1" });
    await expect(ownedRoleId("org-1", "role-1")).resolves.toBe("role-1");
  });

  it("returns null when the row belongs to another org", async () => {
    findFirst.jobRole.mockResolvedValue(null); // scoped query finds nothing
    await expect(ownedRoleId("org-1", "role-of-org-2")).resolves.toBeNull();
  });

  it("always scopes the role lookup by orgId", async () => {
    findFirst.jobRole.mockResolvedValue({ id: "r" });
    await ownedRoleId("org-1", "r");
    expect(findFirst.jobRole).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "r", orgId: "org-1" }),
      }),
    );
  });

  it("scopes the level lookup through its role's org", async () => {
    findFirst.level.mockResolvedValue({ id: "l" });
    await ownedLevelId("org-1", "l");
    const arg = findFirst.level.mock.calls[0][0] as {
      where: { role: { orgId: string } };
    };
    expect(arg.where.role.orgId).toBe("org-1");
  });

  it("can additionally require the level to sit under a given role", async () => {
    findFirst.level.mockResolvedValue({ id: "l" });
    await ownedLevelId("org-1", "l", "role-9");
    const arg = findFirst.level.mock.calls[0][0] as {
      where: { role: { orgId: string; id?: string } };
    };
    expect(arg.where.role.id).toBe("role-9");
  });

  it("scopes the sub-skill lookup through its group's org", async () => {
    findFirst.subSkill.mockResolvedValue({ id: "s" });
    await ownedSubSkillId("org-1", "s");
    const arg = findFirst.subSkill.mock.calls[0][0] as {
      where: { group: { orgId: string } };
    };
    expect(arg.where.group.orgId).toBe("org-1");
  });

  it("scopes the group lookup by orgId", async () => {
    findFirst.skillGroup.mockResolvedValue({ id: "g" });
    await ownedGroupId("org-1", "g");
    expect(findFirst.skillGroup).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "g", orgId: "org-1" }),
      }),
    );
  });

  it("short-circuits on empty input without touching the database", async () => {
    await expect(ownedRoleId("org-1", null)).resolves.toBeNull();
    await expect(ownedLevelId("org-1", undefined)).resolves.toBeNull();
    await expect(ownedSubSkillId("org-1", "")).resolves.toBeNull();
    await expect(ownedGroupId("org-1", null)).resolves.toBeNull();
    expect(findFirst.jobRole).not.toHaveBeenCalled();
    expect(findFirst.level).not.toHaveBeenCalled();
    expect(findFirst.subSkill).not.toHaveBeenCalled();
    expect(findFirst.skillGroup).not.toHaveBeenCalled();
  });
});
