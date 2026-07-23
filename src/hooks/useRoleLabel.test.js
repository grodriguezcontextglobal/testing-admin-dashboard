import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { createElement } from "react";
import adminReducer from "../store/slices/adminSlice";
import { useRoleLabel } from "./useRoleLabel";

function makeStore(companyData) {
  return configureStore({
    reducer: { admin: adminReducer },
    preloadedState: {
      admin: {
        status: "authenticated",
        user: { role: 0, roleType: "root_admin", companyData },
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

describe("useRoleLabel", () => {
  it("devuelve el label default cuando la compañía no tiene overrides", () => {
    const store = makeStore({ id: "c1" });
    const { result } = renderHook(() => useRoleLabel(), {
      wrapper: wrapper(store),
    });
    expect(result.current("root_admin")).toBe("Root Administrator");
  });

  it("devuelve el override de la compañía cuando existe", () => {
    const store = makeStore({ id: "c1", roleLabels: { root_admin: "Presidente" } });
    const { result } = renderHook(() => useRoleLabel(), {
      wrapper: wrapper(store),
    });
    expect(result.current("root_admin")).toBe("Presidente");
  });

  it("el override aplica también al string canónico del mismo grupo", () => {
    const store = makeStore({ id: "c1", roleLabels: { root_admin: "Presidente" } });
    const { result } = renderHook(() => useRoleLabel(), {
      wrapper: wrapper(store),
    });
    expect(result.current("root_administrator")).toBe("Presidente");
  });

  it("un rol sin override propio sigue usando su default aunque otros roles tengan override", () => {
    const store = makeStore({ id: "c1", roleLabels: { root_admin: "Presidente" } });
    const { result } = renderHook(() => useRoleLabel(), {
      wrapper: wrapper(store),
    });
    expect(result.current("event_manager")).toBe("Event Manager");
  });

  it("un override vacío ('') cae al default en vez de mostrarse en blanco", () => {
    const store = makeStore({ id: "c1", roleLabels: { root_admin: "" } });
    const { result } = renderHook(() => useRoleLabel(), {
      wrapper: wrapper(store),
    });
    expect(result.current("root_admin")).toBe("Root Administrator");
  });

  it("sin companyData no rompe, usa defaults", () => {
    const store = makeStore(undefined);
    const { result } = renderHook(() => useRoleLabel(), {
      wrapper: wrapper(store),
    });
    expect(result.current("assistant")).toBe("Assistant");
  });
});
