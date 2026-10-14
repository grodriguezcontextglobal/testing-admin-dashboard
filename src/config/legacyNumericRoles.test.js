import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  isCompanyAdmin,
  isRootAdmin,
  legacyRoleType,
  resolveRoleType,
  roleLevelOf,
} from "./roles";

// F1.1 — the numeric role stays on the wire (Company.employees[].role,
// role_level, the inventory scope body) until backend retires it. What goes
// is the client deciding anything off that number outside config/roles.js.

describe("legacyRoleType(value)", () => {
  it("maps the six legacy levels, as number or numeric string", () => {
    expect(legacyRoleType(0)).toBe("root_admin");
    expect(legacyRoleType("1")).toBe("admin");
    expect(legacyRoleType("5")).toBe("assistant");
  });

  it("never reads a blank as level 0", () => {
    // Number("") and Number(null) are both 0: a blank role used to resolve
    // to root_admin, the most privileged role there is.
    expect(legacyRoleType("")).toBeUndefined();
    expect(legacyRoleType("  ")).toBeUndefined();
    expect(legacyRoleType(null)).toBeUndefined();
    expect(legacyRoleType(undefined)).toBeUndefined();
    expect(legacyRoleType(false)).toBeUndefined();
  });

  it("returns undefined for anything that is not a legacy level", () => {
    expect(legacyRoleType("99")).toBeUndefined();
    expect(legacyRoleType("1.5")).toBeUndefined();
    expect(legacyRoleType("category_manager")).toBeUndefined();
  });
});

describe("resolveRoleType — blanks and roles stored as strings", () => {
  it("a blank role with no roleType is the safe default, not root_admin", () => {
    expect(resolveRoleType({ role: "" })).toBe("assistant");
    expect(resolveRoleType({ role: null })).toBe("assistant");
  });

  it("reads a role type written into `role` (UpdateRoleInCompany does it for scoped roles)", () => {
    expect(resolveRoleType({ role: "category_manager" })).toBe("category_manager");
    expect(resolveRoleType({ role: "root_administrator" })).toBe("root_administrator");
  });

  it("an explicit roleType still wins over the number", () => {
    expect(resolveRoleType({ role: "0", roleType: "assistant" })).toBe("assistant");
  });
});

describe("roleLevelOf / isCompanyAdmin / isRootAdmin", () => {
  it("rank by role type, numeric or not", () => {
    expect(roleLevelOf({ role: "0" })).toBe(0);
    expect(roleLevelOf({ roleType: "manager_event" })).toBe(3);
    // Scoped roles carry no level on purpose (R1); they rank last.
    expect(roleLevelOf({ role: "category_manager" })).toBe(99);
  });

  it("admins are levels 0–1, whichever field says so", () => {
    expect(isCompanyAdmin({ role: "1" })).toBe(true);
    expect(isCompanyAdmin({ role: "4", roleType: "root_administrator" })).toBe(true);
    expect(isCompanyAdmin({ role: "" })).toBe(false);
    expect(isCompanyAdmin({ role: "category_manager" })).toBe(false);
    expect(isCompanyAdmin(undefined)).toBe(false);
  });

  it("root admin is level 0 only", () => {
    expect(isRootAdmin({ role: "0" })).toBe(true);
    expect(isRootAdmin({ roleType: "root_administrator", role: "" })).toBe(true);
    expect(isRootAdmin({ role: "1" })).toBe(false);
    expect(isRootAdmin({ role: "" })).toBe(false);
  });
});

// ─── Guard: no numeric role decisions outside config/roles.js ───────────────

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROLES_FILE = path.join(SRC, "config", "roles.js");

const sourceFiles = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "docs" ? [] : sourceFiles(full);
    if (!/\.(js|jsx)$/.test(entry.name) || /\.test\.(js|jsx)$/.test(entry.name)) return [];
    return full === ROLES_FILE ? [] : [full];
  });

const offenders = (pattern) =>
  sourceFiles(SRC).flatMap((file) =>
    fs
      .readFileSync(file, "utf8")
      .split("\n")
      .map((line, i) => ({ line, at: `${path.relative(SRC, file)}:${i + 1}` }))
      .filter(({ line }) => !/^\s*(\/\/|\*|\/\*)/.test(line) && pattern.test(line))
      .map(({ at }) => at),
  );

describe("guard — the numeric role is decided only in config/roles.js", () => {
  it("no Number(x.role) outside config/roles.js", () => {
    expect(offenders(/Number\(\s*[\w?.]*\.role\s*\)/)).toEqual([]);
  });

  it("no LEGACY_ROLE_MAP lookups outside config/roles.js", () => {
    expect(offenders(/LEGACY_ROLE_MAP\[/)).toEqual([]);
  });

  it("config/roleCapabilities.js is gone (it was never imported)", () => {
    expect(fs.existsSync(path.join(SRC, "config", "roleCapabilities.js"))).toBe(false);
  });
});
