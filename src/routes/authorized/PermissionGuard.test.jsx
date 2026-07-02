import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router";
import { configureStore } from "@reduxjs/toolkit";
import adminReducer from "../../store/slices/adminSlice";
import PermissionGuard from "./PermissionGuard";

function makeStore(roleType) {
  return configureStore({
    reducer: { admin: adminReducer },
    preloadedState: {
      admin: {
        status: "authenticated",
        user: { role: 0, roleType },
        errorMessage: undefined,
        companyAccountStripe: undefined,
        companyInfo: undefined,
        mfaEnabled: false,
      },
    },
  });
}

function renderGuard(roleType, action) {
  const store = makeStore(roleType);
  render(
    createElement(Provider, { store },
      createElement(MemoryRouter, { initialEntries: ["/protected"] },
        createElement(Routes, null,
          createElement(Route, { element: createElement(PermissionGuard, { action }) },
            createElement(Route, { path: "/protected", element: createElement("div", null, "Protected Content") })
          ),
          createElement(Route, { path: "/", element: createElement("div", null, "Home") })
        )
      )
    )
  );
}

// ─── acceso permitido ─────────────────────────────────────────────────────────

describe("PermissionGuard — acceso permitido", () => {
  it("root_admin pasa cualquier guard", () => {
    renderGuard("root_admin", "inventory:create");
    expect(screen.getByText("Protected Content")).toBeTruthy();
  });

  it("admin pasa inventory:create", () => {
    renderGuard("admin", "inventory:create");
    expect(screen.getByText("Protected Content")).toBeTruthy();
  });

  it("sale_manager pasa event:read (RU access)", () => {
    renderGuard("sale_manager", "event:read");
    expect(screen.getByText("Protected Content")).toBeTruthy();
  });

  it("inventory_manager pasa inventory:create", () => {
    renderGuard("inventory_manager", "inventory:create");
    expect(screen.getByText("Protected Content")).toBeTruthy();
  });

  it("event_manager pasa event:create", () => {
    renderGuard("event_manager", "event:create");
    expect(screen.getByText("Protected Content")).toBeTruthy();
  });

  it("event_manager pasa nav:consumers", () => {
    renderGuard("event_manager", "nav:consumers");
    expect(screen.getByText("Protected Content")).toBeTruthy();
  });

  it("assistant pasa transaction:create", () => {
    renderGuard("assistant", "transaction:create");
    expect(screen.getByText("Protected Content")).toBeTruthy();
  });
});

// ─── acceso denegado → redirect a "/" ────────────────────────────────────────

describe("PermissionGuard — acceso denegado", () => {
  it("event_manager no pasa inventory:create", () => {
    renderGuard("event_manager", "inventory:create");
    expect(screen.getByText("Home")).toBeTruthy();
    expect(screen.queryByText("Protected Content")).toBeNull();
  });

  it("inventory_manager no pasa event:create", () => {
    renderGuard("inventory_manager", "event:create");
    expect(screen.getByText("Home")).toBeTruthy();
  });

  it("assistant no pasa inventory:create", () => {
    renderGuard("assistant", "inventory:create");
    expect(screen.getByText("Home")).toBeTruthy();
  });

  it("assistant no pasa staff:create", () => {
    renderGuard("assistant", "staff:create");
    expect(screen.getByText("Home")).toBeTruthy();
  });

  it("roleType undefined con role 0 → resuelve a root_admin vía fallback (tiene acceso)", () => {
    // makeStore usa role:0 — resolveRoleType lo mapea a "root_admin" vía LEGACY_ROLE_MAP
    renderGuard(undefined, "inventory:create");
    expect(screen.getByText("Protected Content")).toBeTruthy();
  });

  it("sin roleType ni role válido → fallback a assistant → redirige", () => {
    const store = configureStore({
      reducer: { admin: adminReducer },
      preloadedState: {
        admin: {
          status: "authenticated",
          user: { role: undefined, roleType: undefined },
          errorMessage: undefined, companyAccountStripe: undefined,
          companyInfo: undefined, mfaEnabled: false,
        },
      },
    });
    render(
      createElement(Provider, { store },
        createElement(MemoryRouter, { initialEntries: ["/protected"] },
          createElement(Routes, null,
            createElement(Route, { element: createElement(PermissionGuard, { action: "inventory:create" }) },
              createElement(Route, { path: "/protected", element: createElement("div", null, "Protected Content") })
            ),
            createElement(Route, { path: "/", element: createElement("div", null, "Home") })
          )
        )
      )
    );
    expect(screen.getByText("Home")).toBeTruthy();
    expect(screen.queryByText("Protected Content")).toBeNull();
  });

  it("acción desconocida → redirige", () => {
    renderGuard("root_admin", "unknown:action");
    expect(screen.getByText("Home")).toBeTruthy();
  });
});
