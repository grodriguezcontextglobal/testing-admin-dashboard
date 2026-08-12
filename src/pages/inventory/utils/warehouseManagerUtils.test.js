import { describe, it, expect } from "vitest";
import { findWarehouseManager } from "./warehouseManagerUtils";

const employee = (over = {}) => ({
  firstName: "Ana",
  lastName: "Ruiz",
  user: "ana@x.com",
  role: "4",
  active: true,
  status: "Active",
  ...over,
});

describe("findWarehouseManager — role matching", () => {
  it("finds the manager stored as the legacy numeric role", () => {
    expect(findWarehouseManager([employee({ role: "4" })])).toEqual({
      name: "Ana Ruiz",
      email: "ana@x.com",
    });
  });

  it("accepts a number as well as a numeric string", () => {
    expect(findWarehouseManager([employee({ role: 4 })])?.name).toBe("Ana Ruiz");
  });

  it("accepts the legacy and canonical role strings", () => {
    expect(
      findWarehouseManager([employee({ role: "inventory_manager" })])?.name
    ).toBe("Ana Ruiz");
    expect(
      findWarehouseManager([employee({ roleType: "manager_inventory" })])?.name
    ).toBe("Ana Ruiz");
  });

  it("prefers roleType over a stale numeric role", () => {
    // role 5 is assistant; roleType says inventory manager and should win.
    expect(
      findWarehouseManager([
        employee({ role: "5", roleType: "manager_inventory" }),
      ])?.name
    ).toBe("Ana Ruiz");
  });

  it("ignores every other role", () => {
    const others = ["0", "1", "2", "3", "5"].map((role) =>
      employee({ role, firstName: `R${role}` })
    );
    expect(findWarehouseManager(others)).toBeNull();
  });

  it("does not match scoped location managers", () => {
    expect(
      findWarehouseManager([
        employee({ role: "inventory_location_manager" }),
      ])
    ).toBeNull();
  });

  // Number("") and Number(null) are 0, and 0 maps to root_admin — a blank role
  // must not resolve to any concept.
  it("ignores employees with a blank role", () => {
    for (const role of ["", null, undefined]) {
      expect(findWarehouseManager([employee({ role })])).toBeNull();
    }
  });
});

describe("findWarehouseManager — only active staff", () => {
  it("skips a Pending invitation even with the right role", () => {
    expect(findWarehouseManager([employee({ status: "Pending" })])).toBeNull();
  });

  it("skips a deactivated manager", () => {
    expect(findWarehouseManager([employee({ active: false })])).toBeNull();
  });

  it("accepts the string forms of active the roster uses", () => {
    expect(findWarehouseManager([employee({ active: "active" })])?.name).toBe(
      "Ana Ruiz"
    );
    expect(findWarehouseManager([employee({ active: "true" })])?.name).toBe(
      "Ana Ruiz"
    );
  });

  it("picks the active manager over an inactive one", () => {
    const result = findWarehouseManager([
      employee({ firstName: "Aaron", active: false }),
      employee({ firstName: "Zoe", active: true }),
    ]);
    expect(result?.name).toBe("Zoe Ruiz");
  });
});

describe("findWarehouseManager — returns exactly one, chosen at random", () => {
  const roster = [
    employee({ firstName: "Ana", user: "a@x.com" }),
    employee({ firstName: "Bruno", user: "b@x.com" }),
    employee({ firstName: "Carla", user: "c@x.com" }),
  ];

  it("returns a single manager object, never a list", () => {
    const result = findWarehouseManager(roster);
    expect(Array.isArray(result)).toBe(false);
    expect(Object.keys(result).sort()).toEqual(["email", "name"]);
  });

  it("always returns one of the actual managers", () => {
    const valid = new Set(["Ana Ruiz", "Bruno Ruiz", "Carla Ruiz"]);
    for (let i = 0; i < 200; i += 1) {
      expect(valid.has(findWarehouseManager(roster).name)).toBe(true);
    }
  });

  it("keeps name and email from the same person, never mixed", () => {
    const emailByName = {
      "Ana Ruiz": "a@x.com",
      "Bruno Ruiz": "b@x.com",
      "Carla Ruiz": "c@x.com",
    };
    for (let i = 0; i < 200; i += 1) {
      const picked = findWarehouseManager(roster);
      expect(picked.email).toBe(emailByName[picked.name]);
    }
  });

  // Guards against "random" silently collapsing to index 0 — the odds of a
  // real random pick missing any of three across 300 draws are ~0.
  it("does not always return the same one", () => {
    const seen = new Set();
    for (let i = 0; i < 300; i += 1) {
      seen.add(findWarehouseManager(roster).name);
    }
    expect(seen.size).toBe(3);
  });

  it("is still deterministic when there is only one manager", () => {
    const single = [employee({ firstName: "Solo", user: "s@x.com" })];
    expect(findWarehouseManager(single)).toEqual({
      name: "Solo Ruiz",
      email: "s@x.com",
    });
  });
});

describe("findWarehouseManager — edge cases", () => {
  it("returns null for an empty or missing roster", () => {
    expect(findWarehouseManager([])).toBeNull();
    expect(findWarehouseManager(undefined)).toBeNull();
    expect(findWarehouseManager(null)).toBeNull();
  });

  it("skips a manager with no usable name rather than rendering a blank pill", () => {
    expect(
      findWarehouseManager([
        employee({ firstName: undefined, lastName: undefined }),
      ])
    ).toBeNull();
  });

  it("builds the name from whichever part exists", () => {
    expect(
      findWarehouseManager([employee({ lastName: undefined })])?.name
    ).toBe("Ana");
  });
});
