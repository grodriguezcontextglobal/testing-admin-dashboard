import { describe, it, expect } from "vitest";
import {
  checkRolePermission,
  getPreferenceLocation,
  filterDataByRoleAndPreference,
  isCategoryScopedRole,
  filterInventoryByCategoryScope,
  hasEmptyScope,
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

// ─── isCategoryScopedRole ─────────────────────────────────────────────────────

describe("isCategoryScopedRole", () => {
  it("true para roles de categoría", () => {
    expect(isCategoryScopedRole("category_manager")).toBe(true);
    expect(isCategoryScopedRole("category_assistant")).toBe(true);
  });

  it("false para roles de ubicación y no-scoped", () => {
    expect(isCategoryScopedRole("inventory_location_manager")).toBe(false);
    expect(isCategoryScopedRole("root_admin")).toBe(false);
    expect(isCategoryScopedRole("inventory_manager")).toBe(false);
    expect(isCategoryScopedRole(undefined)).toBe(false);
  });
});

// ─── filterInventoryByCategoryScope ───────────────────────────────────────────

const catItems = [
  { item_id: 1, category_name: "Audio" },
  { item_id: 2, category_name: "Lighting" },
  { item_id: 3, category_name: "Audio" },
  { item_id: 4, category_name: null },
];

describe("filterInventoryByCategoryScope", () => {
  it("mantiene solo los items cuyas categorías están asignadas", () => {
    const result = filterInventoryByCategoryScope(catItems, ["Audio"]);
    expect(result).toHaveLength(2);
    expect(result.every((i) => i.category_name === "Audio")).toBe(true);
  });

  it("hace match case-insensitive del category_name", () => {
    expect(filterInventoryByCategoryScope(catItems, ["audio"])).toHaveLength(2);
  });

  it("FAIL-CLOSED: scope vacío retorna [] (sin inventario)", () => {
    expect(filterInventoryByCategoryScope(catItems, [])).toEqual([]);
    expect(filterInventoryByCategoryScope(catItems, null)).toEqual([]);
  });

  it("ignora items sin category_name", () => {
    const result = filterInventoryByCategoryScope(catItems, ["Audio", "Lighting"]);
    expect(result.find((i) => i.item_id === 4)).toBeUndefined();
  });

  it("retorna [] si data no es array", () => {
    expect(filterInventoryByCategoryScope(null, ["Audio"])).toEqual([]);
  });
});

// ─── hasEmptyScope (R6) ───────────────────────────────────────────────────────

describe("hasEmptyScope", () => {
  it("rol de categoría sin categorías asignadas → true", () => {
    expect(hasEmptyScope("category_manager", { categories: [] })).toBe(true);
    expect(hasEmptyScope("category_assistant", {})).toBe(true);
  });

  it("rol de categoría con categorías asignadas → false", () => {
    expect(hasEmptyScope("category_manager", { categories: [{ category_id: 1 }] })).toBe(false);
  });

  it("rol de ubicación sin ubicaciones asignadas → true", () => {
    expect(hasEmptyScope("inventory_location_manager", { locations: [] })).toBe(true);
  });

  it("rol de ubicación con ubicaciones asignadas → false", () => {
    expect(hasEmptyScope("inventory_location_manager", { locations: [{ location_id: 3 }] })).toBe(false);
  });

  it("roles no-scoped siempre → false, aun con scope vacío", () => {
    expect(hasEmptyScope("root_admin", { locations: [], categories: [] })).toBe(false);
    expect(hasEmptyScope("inventory_manager", {})).toBe(false);
  });
});
