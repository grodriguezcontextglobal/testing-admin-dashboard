import { describe, it, expect } from "vitest";
import {
  getUserPermissions,
  checkPermission,
  getPermittedLocations,
} from "./permissionUtils";

// ─── helpers ─────────────────────────────────────────────────────────────────

const makeUser = (overrides = {}) => ({
  email: "user@test.com",
  companyData: {
    employees: [
      {
        user: "user@test.com",
        role: "2",
        preference: { managerLocation: [] },
        ...overrides,
      },
    ],
  },
});

const makeUserWithLocations = (roleOverrides, locations) =>
  makeUser({
    ...roleOverrides,
    preference: {
      managerLocation: locations.map((loc) => ({
        location: loc.name,
        actions: loc.actions ?? { create: false, update: false, delete: false },
      })),
    },
  });

// ─── getUserPermissions ───────────────────────────────────────────────────────

describe("getUserPermissions", () => {
  // ── Coordinator roles (full access) ──────────────────────────────────────

  it("retorna hasFullAccess para roleType: root_admin (nuevo SQL)", () => {
    const user = makeUser({ role: undefined, roleType: "root_admin" });
    expect(getUserPermissions(user)).toMatchObject({
      hasFullAccess: true,
      permittedLocations: null,
    });
  });

  it("retorna hasFullAccess para roleType: admin (nuevo SQL)", () => {
    const user = makeUser({ role: undefined, roleType: "admin" });
    expect(getUserPermissions(user)).toMatchObject({ hasFullAccess: true });
  });

  it("retorna hasFullAccess:false para roleType: sale_manager (RU restringido)", () => {
    const user = makeUser({ role: undefined, roleType: "sale_manager" });
    expect(getUserPermissions(user)).toMatchObject({ hasFullAccess: false });
  });

  it("mantiene backward-compat: role '0' sin roleType → hasFullAccess (MongoDB legacy)", () => {
    const user = makeUser({ role: "0" });
    expect(getUserPermissions(user)).toMatchObject({ hasFullAccess: true });
  });

  it("mantiene backward-compat: role 0 (número) sin roleType → hasFullAccess", () => {
    const user = makeUser({ role: 0 });
    expect(getUserPermissions(user)).toMatchObject({ hasFullAccess: true });
  });

  it("roleType explícito tiene prioridad sobre role numérico", () => {
    // role "0" pero roleType es "assistant" — roleType gana
    const user = makeUser({ role: "0", roleType: "assistant" });
    expect(getUserPermissions(user)).toMatchObject({ hasFullAccess: false });
  });

  // ── Restricted roles ──────────────────────────────────────────────────────

  it("retorna hasFullAccess:false para roleType: event_manager", () => {
    const user = makeUser({ roleType: "event_manager" });
    expect(getUserPermissions(user)).toMatchObject({ hasFullAccess: false });
  });

  it("retorna hasFullAccess:false para roleType: inventory_manager", () => {
    const user = makeUser({ roleType: "inventory_manager" });
    expect(getUserPermissions(user)).toMatchObject({ hasFullAccess: false });
  });

  it("retorna hasFullAccess:false para roleType: assistant", () => {
    const user = makeUser({ roleType: "assistant" });
    expect(getUserPermissions(user)).toMatchObject({ hasFullAccess: false });
  });

  // ── Error paths ───────────────────────────────────────────────────────────

  it("retorna error si user es null", () => {
    expect(getUserPermissions(null).error).toBeDefined();
  });

  it("retorna error si no hay companyData", () => {
    expect(getUserPermissions({ email: "x@test.com" }).error).toBeDefined();
  });

  it("retorna error si el email no está en employees", () => {
    const user = {
      email: "other@test.com",
      companyData: {
        employees: [{ user: "user@test.com", role: "0" }],
      },
    };
    expect(getUserPermissions(user).error).toBeDefined();
  });

  // ── Location data for restricted roles ───────────────────────────────────

  it("devuelve permittedLocations para role no-coordinador con locations", () => {
    const user = makeUserWithLocations(
      { roleType: "inventory_manager" },
      [{ name: "Warehouse A" }, { name: "Warehouse B" }],
    );
    const result = getUserPermissions(user);
    expect(result.hasFullAccess).toBe(false);
    expect(result.permittedLocations).toEqual(["Warehouse A", "Warehouse B"]);
  });
});

// ─── getPermittedLocations ────────────────────────────────────────────────────

describe("getPermittedLocations", () => {
  it("retorna null para roleType coordinador (acceso total)", () => {
    const user = makeUser({ roleType: "root_admin" });
    expect(getPermittedLocations(user, "create")).toBeNull();
  });

  it("retorna locations con create:true para role no-coordinador", () => {
    const user = makeUserWithLocations({ roleType: "inventory_manager" }, [
      { name: "A", actions: { create: true, update: false, delete: false } },
      { name: "B", actions: { create: false, update: true, delete: false } },
    ]);
    expect(getPermittedLocations(user, "create")).toEqual(["A"]);
  });

  it("retorna [] si ninguna location tiene el action solicitado", () => {
    const user = makeUserWithLocations({ roleType: "inventory_manager" }, [
      { name: "A", actions: { create: false, update: false, delete: false } },
    ]);
    expect(getPermittedLocations(user, "create")).toEqual([]);
  });
});

// ─── checkPermission ─────────────────────────────────────────────────────────

describe("checkPermission", () => {
  it("permite cualquier acción para roleType coordinador", () => {
    const user = makeUser({ roleType: "root_admin" });
    expect(checkPermission(user, "create", "Warehouse A").allowed).toBe(true);
  });

  it("permite acción si location tiene el permiso correcto", () => {
    const user = makeUserWithLocations({ roleType: "inventory_manager" }, [
      { name: "Dock B", actions: { create: true, update: false, delete: false } },
    ]);
    expect(checkPermission(user, "create", "Dock B").allowed).toBe(true);
  });

  it("deniega acción si location no tiene el permiso", () => {
    const user = makeUserWithLocations({ roleType: "inventory_manager" }, [
      { name: "Dock B", actions: { create: false, update: false, delete: false } },
    ]);
    expect(checkPermission(user, "create", "Dock B").allowed).toBe(false);
  });
});
