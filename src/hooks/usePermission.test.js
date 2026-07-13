import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { createElement } from "react";
import adminReducer from "../store/slices/adminSlice";
import { usePermission } from "./usePermission";

function makeStore(roleType) {
  return configureStore({
    reducer: { admin: adminReducer },
    preloadedState: {
      admin: {
        status: "authenticated",
        user: { role: 2, roleType },
        errorMessage: undefined,
        companyAccountStripe: undefined,
        companyInfo: undefined,
        mfaEnabled: false,
      },
    },
  });
}

function wrapper(store) {
  return ({ children }) => createElement(Provider, { store }, children);
}

describe("usePermission", () => {
  it("retorna true cuando roleType tiene el permiso", () => {
    const store = makeStore("inventory_manager");
    const { result } = renderHook(() => usePermission("inventory:create"), {
      wrapper: wrapper(store),
    });
    expect(result.current).toBe(true);
  });

  it("retorna false cuando roleType no tiene el permiso", () => {
    const store = makeStore("event_manager");
    const { result } = renderHook(() => usePermission("inventory:create"), {
      wrapper: wrapper(store),
    });
    expect(result.current).toBe(false);
  });

  it("retorna false para acción desconocida", () => {
    const store = makeStore("root_admin");
    const { result } = renderHook(() => usePermission("fake:action"), {
      wrapper: wrapper(store),
    });
    expect(result.current).toBe(false);
  });

  it("hace fallback a LEGACY_ROLE_MAP cuando roleType está ausente (role:2 → sale_manager)", () => {
    const store = makeStore(undefined); // user.role=2, roleType=undefined → resolves to "sale_manager"
    const { result } = renderHook(() => usePermission("inventory:read"), {
      wrapper: wrapper(store),
    });
    expect(result.current).toBe(true); // sale_manager tiene R/U en inventory (no Create)
  });

  it("assistant puede transaction:create pero no inventory:create", () => {
    const store = makeStore("assistant");
    const { result: canTx } = renderHook(() => usePermission("transaction:create"), {
      wrapper: wrapper(store),
    });
    const { result: canInv } = renderHook(() => usePermission("inventory:create"), {
      wrapper: wrapper(store),
    });
    expect(canTx.current).toBe(true);
    expect(canInv.current).toBe(false);
  });
});
