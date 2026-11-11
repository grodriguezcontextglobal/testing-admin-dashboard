import { describe, it, expect } from "vitest";
import { ALL_ROLES, ROLE_TYPES, hasPlatformAccess } from "./roles";

// Devitrak Admin Console (reports/FRONTEND_admin_console_plan_2026-11-11.md, F1).
// Access is decided by the SERVER (super_user of Context Global AND an
// @devitrak.com sign-in email) and arrives as `platformAccess: true`. The
// client never derives it: `super_user` is also set on every company creator.

describe("hasPlatformAccess", () => {
  it("is true when the server sent platformAccess: true on the user", () => {
    expect(hasPlatformAccess({ platformAccess: true })).toBe(true);
  });

  it("is true when the server sent it inside the login payload (user.data)", () => {
    expect(hasPlatformAccess({ data: { platformAccess: true } })).toBe(true);
  });

  it("is false for a client owner: super_user alone never grants access", () => {
    expect(
      hasPlatformAccess({ email: "owner@client.example", data: { super_user: true } }),
    ).toBe(false);
  });

  it("is false for super_user + @devitrak.com when the server did not grant it", () => {
    expect(
      hasPlatformAccess({ email: "someone@devitrak.com", data: { super_user: true } }),
    ).toBe(false);
  });

  it("accepts only the boolean true, not truthy look-alikes", () => {
    expect(hasPlatformAccess({ platformAccess: "true" })).toBe(false);
    expect(hasPlatformAccess({ platformAccess: 1 })).toBe(false);
    expect(hasPlatformAccess({ data: { platformAccess: "yes" } })).toBe(false);
  });

  it("is false for a missing or empty user", () => {
    expect(hasPlatformAccess(undefined)).toBe(false);
    expect(hasPlatformAccess(null)).toBe(false);
    expect(hasPlatformAccess([])).toBe(false);
    expect(hasPlatformAccess({})).toBe(false);
  });

  it("is not a role: nothing a client company can assign", () => {
    expect(Object.values(ROLE_TYPES)).not.toContain("platform_admin");
    expect(ALL_ROLES).not.toContain("platform_admin");
  });
});
