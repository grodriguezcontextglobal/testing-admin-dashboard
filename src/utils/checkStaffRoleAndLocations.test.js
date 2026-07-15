import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { createElement } from "react";
import adminReducer from "../store/slices/adminSlice";
import { useStaffRoleAndLocations } from "./checkStaffRoleAndLocations";

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeStore({ roleType, role = "2", super_user = false, managerLocation = [] } = {}) {
  const user = {
    email: "emp@test.com",
    role,
    roleType,
    companyData: {
      employees: [
        {
          user: "emp@test.com",
          role,
          roleType,
          super_user,
          preference: { managerLocation },
        },
      ],
    },
  };
  return configureStore({
    reducer: { admin: adminReducer },
    preloadedState: {
      admin: {
        status: "authenticated",
        user,
        errorMessage: undefined,
        companyAccountStripe: undefined,
        companyInfo: undefined,
        mfaEnabled: false,
      },
    },
  });
}

function wrap(store) {
  return ({ children }) => createElement(Provider, { store }, children);
}

// ─── isAdmin ─────────────────────────────────────────────────────────────────

describe("useStaffRoleAndLocations — isAdmin", () => {
  it("isAdmin:true para roleType root_admin (sin role numérico '0')", () => {
    const store = makeStore({ roleType: "root_admin", role: undefined });
    const { result } = renderHook(() => useStaffRoleAndLocations(), { wrapper: wrap(store) });
    expect(result.current.isAdmin).toBe(true);
  });

  it("isAdmin:true para roleType admin", () => {
    const store = makeStore({ roleType: "admin", role: undefined });
    const { result } = renderHook(() => useStaffRoleAndLocations(), { wrapper: wrap(store) });
    expect(result.current.isAdmin).toBe(true);
  });

  // sale_manager (role 2) is NOT in the full-inventory-access set per SQL company_staff rules.
  it("isAdmin:false para roleType sale_manager (restricto por locaciones)", () => {
    const store = makeStore({ roleType: "sale_manager", role: undefined });
    const { result } = renderHook(() => useStaffRoleAndLocations(), { wrapper: wrap(store) });
    expect(result.current.isAdmin).toBe(false);
  });

  it("isAdmin:false para roleType event_manager", () => {
    const store = makeStore({ roleType: "event_manager", role: "3" });
    const { result } = renderHook(() => useStaffRoleAndLocations(), { wrapper: wrap(store) });
    expect(result.current.isAdmin).toBe(false);
  });

  // inventory_manager (role 4) has full inventory access per SQL company_staff rules (roles 0, 1, 4).
  it("isAdmin:true para roleType inventory_manager (acceso total a inventario)", () => {
    const store = makeStore({ roleType: "inventory_manager", role: "4" });
    const { result } = renderHook(() => useStaffRoleAndLocations(), { wrapper: wrap(store) });
    expect(result.current.isAdmin).toBe(true);
  });

  it("isAdmin:false para roleType assistant", () => {
    const store = makeStore({ roleType: "assistant", role: "5" });
    const { result } = renderHook(() => useStaffRoleAndLocations(), { wrapper: wrap(store) });
    expect(result.current.isAdmin).toBe(false);
  });

  it("backward-compat: isAdmin:true para role '0' sin roleType (MongoDB legacy)", () => {
    const store = makeStore({ role: "0", roleType: undefined });
    const { result } = renderHook(() => useStaffRoleAndLocations(), { wrapper: wrap(store) });
    expect(result.current.isAdmin).toBe(true);
  });

  it("super_user:true fuerza isAdmin:true sin importar roleType", () => {
    const store = makeStore({ roleType: "assistant", role: "5", super_user: true });
    const { result } = renderHook(() => useStaffRoleAndLocations(), { wrapper: wrap(store) });
    expect(result.current.isAdmin).toBe(true);
  });

  it("roleType coordinador prevalece sobre super_user:false", () => {
    const store = makeStore({ roleType: "admin", role: "1", super_user: false });
    const { result } = renderHook(() => useStaffRoleAndLocations(), { wrapper: wrap(store) });
    expect(result.current.isAdmin).toBe(true);
  });
});

// ─── isSuperUser ──────────────────────────────────────────────────────────────

describe("useStaffRoleAndLocations — isSuperUser", () => {
  it("isSuperUser:true cuando super_user es true, sin importar roleType", () => {
    const store = makeStore({ roleType: "assistant", role: "5", super_user: true });
    const { result } = renderHook(() => useStaffRoleAndLocations(), { wrapper: wrap(store) });
    expect(result.current.isSuperUser).toBe(true);
  });

  it("isSuperUser:false cuando super_user es false, incluso para root_admin", () => {
    const store = makeStore({ roleType: "root_admin", role: undefined, super_user: false });
    const { result } = renderHook(() => useStaffRoleAndLocations(), { wrapper: wrap(store) });
    expect(result.current.isSuperUser).toBe(false);
  });

  it("isSuperUser:false por defecto cuando no hay employee record", () => {
    const store = configureStore({
      reducer: { admin: adminReducer },
      preloadedState: {
        admin: {
          status: "authenticated",
          user: { email: "nope@test.com" },
          errorMessage: undefined,
          companyAccountStripe: undefined,
          companyInfo: undefined,
          mfaEnabled: false,
        },
      },
    });
    const { result } = renderHook(() => useStaffRoleAndLocations(), { wrapper: wrap(store) });
    expect(result.current.isSuperUser).toBe(false);
  });
});

// ─── roleType en el objeto retornado ─────────────────────────────────────────

describe("useStaffRoleAndLocations — expone roleType", () => {
  it("incluye roleType en el resultado para empleados con roleType explícito", () => {
    const store = makeStore({ roleType: "event_manager", role: "3" });
    const { result } = renderHook(() => useStaffRoleAndLocations(), { wrapper: wrap(store) });
    expect(result.current.roleType).toBe("event_manager");
  });

  it("deriva roleType desde role numérico si roleType no está presente", () => {
    const store = makeStore({ roleType: undefined, role: "2" });
    const { result } = renderHook(() => useStaffRoleAndLocations(), { wrapper: wrap(store) });
    expect(result.current.roleType).toBe("sale_manager");
  });
});

// ─── location permissions ─────────────────────────────────────────────────────

describe("useStaffRoleAndLocations — permisos de location", () => {
  it("isAdmin:true devuelve listas de location vacías (no se parsean)", () => {
    const store = makeStore({ roleType: "root_admin" });
    const { result } = renderHook(() => useStaffRoleAndLocations(), { wrapper: wrap(store) });
    expect(result.current.locationsCreatePermission).toEqual([]);
    expect(result.current.locationsUpdatePermission).toEqual([]);
  });

  it("parsea locationsCreatePermission para roles con restricción de locaciones (event_manager)", () => {
    const store = makeStore({
      roleType: "event_manager",
      role: "3",
      managerLocation: [
        { location: "Warehouse A", actions: { create: true, update: false, delete: false, view: true, assign: false, transfer: false } },
        { location: "Dock B",      actions: { create: false, update: true, delete: false, view: true, assign: false, transfer: false } },
      ],
    });
    const { result } = renderHook(() => useStaffRoleAndLocations(), { wrapper: wrap(store) });
    expect(result.current.locationsCreatePermission).toEqual(["Warehouse A"]);
    expect(result.current.locationsUpdatePermission).toEqual(["Dock B"]);
  });

  it("fallback: si todas las locations tienen view:false, locationsViewPermission incluye todas las locations asignadas", () => {
    const store = makeStore({
      roleType: "event_manager",
      role: "3",
      managerLocation: [
        { location: "Warehouse A", actions: { create: true, update: false, delete: false, view: false, assign: false, transfer: false } },
        { location: "Dock B",      actions: { create: false, update: true, delete: false, view: false, assign: false, transfer: false } },
      ],
    });
    const { result } = renderHook(() => useStaffRoleAndLocations(), { wrapper: wrap(store) });
    expect(result.current.locationsViewPermission).toEqual(["Warehouse A", "Dock B"]);
  });

  it("fallback: locations sin campo view (registros legacy) son visibles", () => {
    const store = makeStore({
      roleType: "event_manager",
      role: "3",
      managerLocation: [
        { location: "Old Storage", actions: { create: true, update: true } },
      ],
    });
    const { result } = renderHook(() => useStaffRoleAndLocations(), { wrapper: wrap(store) });
    expect(result.current.locationsViewPermission).toEqual(["Old Storage"]);
  });

  it("inventory_manager (isAdmin:true) no parsea managerLocation — listas de location vacías", () => {
    const store = makeStore({
      roleType: "inventory_manager",
      role: "4",
      managerLocation: [
        { location: "Warehouse A", actions: { create: true, view: true } },
      ],
    });
    const { result } = renderHook(() => useStaffRoleAndLocations(), { wrapper: wrap(store) });
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.locationsViewPermission).toEqual([]);
    expect(result.current.locationsCreatePermission).toEqual([]);
  });
});
