import { describe, it, expect } from "vitest";
import reducer, { setPermissions, onClearPermissions } from "./permissions";

const initialState = reducer(undefined, { type: "@@INIT" });

describe("permissionsSlice — estado inicial", () => {
  it("role es null", () => {
    expect(initialState.role).toBeNull();
  });

  it("roleType es null", () => {
    expect(initialState.roleType).toBeNull();
  });

  it("locations es array vacío", () => {
    expect(initialState.locations).toEqual([]);
  });

  it("categories es array vacío", () => {
    expect(initialState.categories).toEqual([]);
  });
});

describe("permissionsSlice — setPermissions", () => {
  it("persiste role y roleType", () => {
    const state = reducer(
      initialState,
      setPermissions({ role: 2, roleType: "event_manager", companyName: "Acme", locations: [] })
    );
    expect(state.role).toBe(2);
    expect(state.roleType).toBe("event_manager");
    expect(state.companyName).toBe("Acme");
  });

  it("persiste locations con estructura {location_id, can_create, can_update, can_delete}", () => {
    const locations = [
      { location_id: "loc-1", location: "Warehouse A", can_create: true, can_update: true, can_delete: false },
    ];
    const state = reducer(
      initialState,
      setPermissions({ role: 2, roleType: "inventory_manager", companyName: "X", locations })
    );
    expect(state.locations).toHaveLength(1);
    expect(state.locations[0].can_create).toBe(true);
    expect(state.locations[0].can_delete).toBe(false);
  });

  it("persiste categories con estructura {category_id, category_name, can_*}", () => {
    const categories = [
      { category_id: 11, category_name: "Audio", can_create: true, can_update: true, can_delete: true },
    ];
    const state = reducer(
      initialState,
      setPermissions({ role: 8, roleType: "category_manager", companyName: "X", categories })
    );
    expect(state.categories).toHaveLength(1);
    expect(state.categories[0].category_name).toBe("Audio");
    expect(state.categories[0].can_delete).toBe(true);
  });

  it("usa [] cuando categories/locations están ausentes en el payload", () => {
    const state = reducer(
      initialState,
      setPermissions({ role: 5, roleType: "assistant", companyName: "X" })
    );
    expect(state.locations).toEqual([]);
    expect(state.categories).toEqual([]);
  });
});

describe("permissionsSlice — onClearPermissions", () => {
  it("resetea todo a valores iniciales", () => {
    const filled = reducer(
      initialState,
      setPermissions({ role: 0, roleType: "root_admin", companyName: "X", locations: [{ location_id: "1" }], categories: [{ category_id: 1 }] })
    );
    const cleared = reducer(filled, onClearPermissions());
    expect(cleared.role).toBeNull();
    expect(cleared.roleType).toBeNull();
    expect(cleared.locations).toEqual([]);
    expect(cleared.categories).toEqual([]);
    expect(cleared.companyName).toBe("");
  });
});
