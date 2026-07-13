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
});

describe("permissionsSlice — onClearPermissions", () => {
  it("resetea todo a valores iniciales", () => {
    const filled = reducer(
      initialState,
      setPermissions({ role: 0, roleType: "root_admin", companyName: "X", locations: [{ location_id: "1" }] })
    );
    const cleared = reducer(filled, onClearPermissions());
    expect(cleared.role).toBeNull();
    expect(cleared.roleType).toBeNull();
    expect(cleared.locations).toEqual([]);
    expect(cleared.companyName).toBe("");
  });
});
