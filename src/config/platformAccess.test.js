import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { ALL_ROLES, ROLE_TYPES, hasPlatformAccess, readPlatformAccess } from "./roles";

// Devitrak Admin Console (reports/FRONTEND_admin_console_plan_2026-11-11.md, F1).
// Access is decided by the SERVER (super_user of Context Global AND an
// @devitrak.com sign-in email) and arrives as `platformAccess: true`. The
// client never derives it: `super_user` is also set on every company creator.

describe("hasPlatformAccess", () => {
  it("is true when the server sent platformAccess: true for a devitrak address", () => {
    expect(hasPlatformAccess({ email: "super.user1@devitrak.com", platformAccess: true })).toBe(true);
  });

  it("is true when the server sent it inside the login payload (user.data)", () => {
    expect(
      hasPlatformAccess({ data: { platformAccess: true, email: "a@devitrak.com" } }),
    ).toBe(true);
  });

  // Both locks have to open. The server decides; the domain can only refuse.
  it("is false for any address outside devitrak.com, whatever the server said", () => {
    expect(hasPlatformAccess({ email: "someone@client.example", platformAccess: true })).toBe(false);
    expect(hasPlatformAccess({ platformAccess: true })).toBe(false);
    expect(hasPlatformAccess({ email: "", platformAccess: true })).toBe(false);
  });

  it("is false for a subdomain or a look-alike of devitrak.com", () => {
    const addresses = [
      "a@mail.devitrak.com",
      "a@devitrak.com.attacker.test",
      "a@devitrak.co",
      "a@notdevitrak.com",
      "a@devitrak.com.co",
      "devitrak.com@client.example",
    ];
    for (const email of addresses) {
      expect(hasPlatformAccess({ email, platformAccess: true }), email).toBe(false);
    }
  });

  it("ignores case and surrounding spaces in the address", () => {
    expect(hasPlatformAccess({ email: "  Super.User1@DeviTrak.COM ", platformAccess: true })).toBe(
      true,
    );
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
    const at = "a@devitrak.com";
    expect(hasPlatformAccess({ email: at, platformAccess: "true" })).toBe(false);
    expect(hasPlatformAccess({ email: at, platformAccess: 1 })).toBe(false);
    expect(hasPlatformAccess({ email: at, data: { platformAccess: "yes" } })).toBe(false);
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

// ─── The sample-data flag must never become a way in ─────────────────────────
// PLATFORM_CONSOLE_SAMPLE_DATA is allowed in a build so the prototype can be
// reviewed on a real URL. That is only safe while it stays a data source. If
// it ever appears in a place that decides access, a deployed build would open
// the console to every signed-in user, which is exactly what the split undid.
describe("the sample-data flag never decides access", () => {
  const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

  const GATEKEEPERS = [
    path.join("routes", "authorized", "PlatformGuard.jsx"),
    path.join("components", "navbar", "NavigationBarMain.jsx"),
  ];

  for (const file of GATEKEEPERS) {
    it(`${file} gates on the server's answer, not on sample data`, () => {
      const text = fs.readFileSync(path.join(SRC, file), "utf8");
      expect(text).toContain("hasPlatformAccess");
      expect(text).not.toContain("PLATFORM_CONSOLE_SAMPLE_DATA");
    });
  }

  it("the dev bypass is the only other way in, and only in a dev server", () => {
    const flags = fs.readFileSync(path.join(SRC, "config", "featureFlags.js"), "utf8");
    const bypass = flags.slice(flags.indexOf("export const PLATFORM_CONSOLE_DEV_BYPASS"));
    expect(bypass).toContain("import.meta.env.DEV === true");
  });
});
