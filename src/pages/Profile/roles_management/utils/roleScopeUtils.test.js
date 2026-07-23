import { describe, it, expect } from "vitest";
import { ROLE_LABEL_GROUPS, PERMISSIONS } from "../../../../config/roles";
import {
  getRoleScope,
  getReadableActionLabel,
  ROLE_SUMMARIES,
  DOMAIN_LABELS,
} from "./roleScopeUtils";

describe("getRoleScope", () => {
  it("returns a non-empty scope for every ROLE_LABEL_GROUPS key", () => {
    for (const groupKey of Object.keys(ROLE_LABEL_GROUPS)) {
      const scope = getRoleScope(groupKey);
      expect(scope).toBeTypeOf("object");
      // At least one domain, and every domain has allowed/denied arrays.
      const domains = Object.keys(scope);
      expect(domains.length).toBeGreaterThan(0);
      for (const domain of domains) {
        expect(Array.isArray(scope[domain].allowed)).toBe(true);
        expect(Array.isArray(scope[domain].denied)).toBe(true);
      }
    }
  });

  it("root_admin has every permission allowed and nothing denied", () => {
    const scope = getRoleScope("root_admin");
    const allDenied = Object.values(scope).flatMap((d) => d.denied);
    // root_admin is only excluded from actions whose array is empty for everyone
    // (the F-01 placeholder keys with []). Those are denied for all roles.
    const emptyKeys = Object.entries(PERMISSIONS)
      .filter(([, roles]) => roles.length === 0)
      .map(([key]) => key);
    expect(allDenied.sort()).toEqual(emptyKeys.sort());
  });

  it("assistant cannot create staff", () => {
    const scope = getRoleScope("assistant");
    expect(scope.staff.allowed).not.toContain("staff:create");
    expect(scope.staff.denied).toContain("staff:create");
  });

  it("sale_manager can read inventory but not create it", () => {
    const scope = getRoleScope("sale_manager");
    expect(scope.inventory.allowed).toContain("inventory:read");
    expect(scope.inventory.allowed).not.toContain("inventory:create");
    expect(scope.inventory.denied).toContain("inventory:create");
  });

  it("groups actions under their domain prefix", () => {
    const scope = getRoleScope("event_manager");
    // event_manager can delete events (EVENT_D includes event_manager)
    expect(scope.event.allowed).toContain("event:delete");
    // but has no global inventory create access
    expect(scope.inventory.allowed).not.toContain("inventory:create");
  });

  it("a member roleType matching triggers allowed (any-member semantics)", () => {
    // admin group has only ['admin']; admin is in ADMIN_FULL for staff:create
    expect(getRoleScope("admin").staff.allowed).toContain("staff:create");
  });
});

describe("ROLE_SUMMARIES", () => {
  it("has an entry for every ROLE_LABEL_GROUPS key", () => {
    for (const groupKey of Object.keys(ROLE_LABEL_GROUPS)) {
      expect(typeof ROLE_SUMMARIES[groupKey]).toBe("string");
      expect(ROLE_SUMMARIES[groupKey].length).toBeGreaterThan(0);
    }
  });
});

describe("getReadableActionLabel", () => {
  it("maps known action keys to readable verbs", () => {
    expect(getReadableActionLabel("event:create")).toBe("Create events");
    expect(getReadableActionLabel("inventory:delete")).toBe("Delete inventory");
    expect(getReadableActionLabel("staff:assign_role")).toBe("Assign staff roles");
  });

  it("falls back to a generated label for unmapped keys", () => {
    // Never throws, always returns a non-empty string.
    for (const key of Object.keys(PERMISSIONS)) {
      const label = getReadableActionLabel(key);
      expect(typeof label).toBe("string");
      expect(label.length).toBeGreaterThan(0);
    }
  });
});

describe("DOMAIN_LABELS", () => {
  it("provides a readable label for every domain present in the matrix", () => {
    const domains = new Set(
      Object.keys(PERMISSIONS).map((key) => key.split(":")[0])
    );
    for (const domain of domains) {
      expect(typeof DOMAIN_LABELS[domain]).toBe("string");
      expect(DOMAIN_LABELS[domain].length).toBeGreaterThan(0);
    }
  });
});
