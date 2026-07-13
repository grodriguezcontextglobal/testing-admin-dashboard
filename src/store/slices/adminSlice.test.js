import { describe, it, expect } from "vitest";
import reducer, { onLogin, onLogout, onChecking } from "./adminSlice";

const initialState = reducer(undefined, { type: "@@INIT" });

describe("adminSlice — estado inicial", () => {
  it("status es 'checking'", () => {
    expect(initialState.status).toBe("checking");
  });

  it("user.role es undefined", () => {
    expect(initialState.user.role).toBeUndefined();
  });

  it("user.roleType es undefined", () => {
    expect(initialState.user.roleType).toBeUndefined();
  });
});

describe("adminSlice — onLogin", () => {
  it("persiste role y roleType del payload", () => {
    const payload = {
      name: "Ana",
      email: "ana@test.com",
      role: 2,
      roleType: "inventory_manager",
    };
    const state = reducer(initialState, onLogin(payload));
    expect(state.user.role).toBe(2);
    expect(state.user.roleType).toBe("inventory_manager");
    expect(state.status).toBe("authenticated");
  });

  it("acepta roleType para los 6 tipos de rol", () => {
    const types = [
      "root_admin", "admin", "sale_manager",
      "event_manager", "inventory_manager", "assistant",
    ];
    types.forEach((roleType) => {
      const state = reducer(initialState, onLogin({ roleType }));
      expect(state.user.roleType).toBe(roleType);
    });
  });
});

describe("adminSlice — onLogout", () => {
  it("limpia role y roleType", () => {
    const loggedIn = reducer(initialState, onLogin({ role: 1, roleType: "admin" }));
    const state = reducer(loggedIn, onLogout());
    expect(state.user.role).toBe("");
    expect(state.user.roleType).toBe("");
    expect(state.status).toBe("not-authenticated");
  });
});
