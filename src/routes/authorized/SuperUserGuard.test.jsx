import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router";
import { configureStore } from "@reduxjs/toolkit";
import adminReducer from "../../store/slices/adminSlice";
import SuperUserGuard from "./SuperUserGuard";

function makeStore({ super_user = false, email = "emp@test.com" } = {}) {
  return configureStore({
    reducer: { admin: adminReducer },
    preloadedState: {
      admin: {
        status: "authenticated",
        user: {
          email,
          role: "1",
          roleType: "admin",
          companyData: {
            employees: [{ user: email, role: "1", roleType: "admin", super_user }],
          },
        },
        errorMessage: undefined,
        companyAccountStripe: undefined,
        companyInfo: undefined,
        mfaEnabled: false,
      },
    },
  });
}

function renderGuard(store) {
  render(
    createElement(Provider, { store },
      createElement(MemoryRouter, { initialEntries: ["/protected"] },
        createElement(Routes, null,
          createElement(Route, { element: createElement(SuperUserGuard) },
            createElement(Route, { path: "/protected", element: createElement("div", null, "Protected Content") })
          ),
          createElement(Route, { path: "/", element: createElement("div", null, "Home") })
        )
      )
    )
  );
}

// ─── acceso permitido ─────────────────────────────────────────────────────────

describe("SuperUserGuard — acceso permitido", () => {
  it("super_user:true pasa el guard", () => {
    renderGuard(makeStore({ super_user: true }));
    expect(screen.getByText("Protected Content")).toBeTruthy();
  });
});

// ─── acceso denegado → redirect a "/" ────────────────────────────────────────

describe("SuperUserGuard — acceso denegado", () => {
  it("super_user:false redirige a /, incluso siendo admin", () => {
    renderGuard(makeStore({ super_user: false }));
    expect(screen.getByText("Home")).toBeTruthy();
    expect(screen.queryByText("Protected Content")).toBeNull();
  });

  it("sin employee record (usuario no encontrado en la compañía) redirige a /", () => {
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
    renderGuard(store);
    expect(screen.getByText("Home")).toBeTruthy();
    expect(screen.queryByText("Protected Content")).toBeNull();
  });
});
