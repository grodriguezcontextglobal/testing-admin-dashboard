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

describe("findWarehouseManager — returns exactly one, deterministically", () => {
  it("returns a single manager, not a list", () => {
    const result = findWarehouseManager([
      employee({ firstName: "Bruno" }),
      employee({ firstName: "Ana" }),
    ]);
    expect(result).toEqual({ name: "Ana Ruiz", email: "ana@x.com" });
  });

  it("picks the same one regardless of roster order", () => {
    const a = employee({ firstName: "Bruno", user: "b@x.com" });
    const b = employee({ firstName: "Ana", user: "a@x.com" });
    expect(findWarehouseManager([a, b])).toEqual(findWarehouseManager([b, a]));
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
