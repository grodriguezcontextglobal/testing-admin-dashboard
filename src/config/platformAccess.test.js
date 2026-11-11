import { describe, it, expect } from "vitest";
import { ALL_ROLES, ROLE_TYPES, hasPlatformAccess, readPlatformAccess } from "./roles";

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

// F2: the login keeps the server's answer on the user it stores, whether the
// server sends it at the top of the login body or inside `entire`.
describe("readPlatformAccess", () => {
  it("reads platformAccess from the top of the login body", () => {
    expect(readPlatformAccess({ uid: "u1", platformAccess: true })).toBe(true);
  });

  it("reads it from the login body's entire record", () => {
    expect(readPlatformAccess({ entire: { platformAccess: true } })).toBe(true);
  });

  it("is false when the server did not send it, or sent anything but true", () => {
    expect(readPlatformAccess({ uid: "u1", entire: { super_user: true } })).toBe(false);
    expect(readPlatformAccess({ platformAccess: "true" })).toBe(false);
    expect(readPlatformAccess(undefined)).toBe(false);
  });

  it("lets hasPlatformAccess open the console for a user built with it", () => {
    const user = { email: "a@devitrak.com", platformAccess: readPlatformAccess({ platformAccess: true }) };
    expect(hasPlatformAccess(user)).toBe(true);
  });
});
