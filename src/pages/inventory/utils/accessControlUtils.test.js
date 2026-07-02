import { describe, it, expect } from "vitest";
import {
  checkRolePermission,
  getPreferenceLocation,
  filterDataByRoleAndPreference,
} from "./accessControlUtils";

// ─── checkRolePermission ──────────────────────────────────────────────────────

describe("checkRolePermission", () => {
  it("retorna true para roles con acceso completo", () => {
    expect(checkRolePermission("root_admin")).toBe(true);
    expect(checkRolePermission("admin")).toBe(true);
    expect(checkRolePermission("sale_manager")).toBe(true);
  });

  it("retorna true para inventory_manager sin locations asignadas (acceso general)", () => {
    expect(checkRolePermission("inventory_manager", [])).toBe(true);
    expect(checkRolePermission("inventory_manager", null)).toBe(true);
  });

  it("retorna false para inventory_manager con locations asignadas (acceso restringido)", () => {
    expect(checkRolePermission("inventory_manager", ["Warehouse A"])).toBe(false);
  });

  it("retorna false para roles que no gestionan inventario", () => {
    expect(checkRolePermission("event_manager")).toBe(false);
    expect(checkRolePermission("assistant")).toBe(false);
  });
});

// ─── getPreferenceLocation ────────────────────────────────────────────────────

describe("getPreferenceLocation", () => {
  it("retorna [] si user no tiene companyData", () => {
    expect(getPreferenceLocation({})).toEqual([]);
    expect(getPreferenceLocation(null)).toEqual([]);
  });

  it("extrae locations del employee record", () => {
    const user = {
      email: "mgr@test.com",
      companyData: {
        employees: [
          {
            user: "mgr@test.com",
            preference: {
              managerLocation: [
                { location: "Warehouse A" },
                { location: "Warehouse B" },
              ],
            },
          },
        ],
      },
    };
    expect(getPreferenceLocation(user)).toEqual(["Warehouse A", "Warehouse B"]);
  });

  it("retorna [] si el employee no tiene managerLocation", () => {
    const user = {
      email: "mgr@test.com",
      companyData: {
        employees: [{ user: "mgr@test.com", preference: {} }],
      },
    };
    expect(getPreferenceLocation(user)).toEqual([]);
  });
});

// ─── filterDataByRoleAndPreference ────────────────────────────────────────────

const items = [
  { location: "Warehouse A", company_id: "c1" },
  { location: "Warehouse B", company_id: "c1" },
  { location: "Warehouse C", company_id: "c1" },
];

const makeUser = (roleType, locations = []) => ({
  roleType,
  email: "test@test.com",
  sqlInfo: { company_id: "c1" },
  companyData: {
    employees: [
      {
        user: "test@test.com",
        preference: {
          managerLocation: locations.map((l) => ({ location: l })),
        },
      },
    ],
  },
});

describe("filterDataByRoleAndPreference", () => {
  it("root_admin ve todos los items", () => {
    expect(filterDataByRoleAndPreference(items, makeUser("root_admin"))).toHaveLength(3);
  });

  it("admin ve todos los items", () => {
    expect(filterDataByRoleAndPreference(items, makeUser("admin"))).toHaveLength(3);
  });

  it("sale_manager ve todos los items", () => {
    expect(filterDataByRoleAndPreference(items, makeUser("sale_manager"))).toHaveLength(3);
  });

  it("inventory_manager sin locations asignadas ve todos los items (acceso general)", () => {
    expect(filterDataByRoleAndPreference(items, makeUser("inventory_manager", []))).toHaveLength(3);
  });

  it("inventory_manager con locations ve solo sus items", () => {
    const user = makeUser("inventory_manager", ["Warehouse A"]);
    const result = filterDataByRoleAndPreference(items, user);
    expect(result).toHaveLength(1);
    expect(result[0].location).toBe("Warehouse A");
  });

  it("event_manager no ve items de inventario (acceso denegado)", () => {
    expect(filterDataByRoleAndPreference(items, makeUser("event_manager"))).toHaveLength(0);
  });

  it("assistant no ve items de inventario (acceso denegado)", () => {
    expect(filterDataByRoleAndPreference(items, makeUser("assistant"))).toHaveLength(0);
  });

  it("retorna [] si data no es array", () => {
    expect(filterDataByRoleAndPreference(null, makeUser("root_admin"))).toEqual([]);
  });
});
