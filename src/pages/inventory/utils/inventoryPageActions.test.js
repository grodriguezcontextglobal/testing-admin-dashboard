import { describe, expect, it } from "vitest";
import { inventoryPageActions } from "./inventoryPageActions";

const loc = (can_create, can_update, can_delete) => ({
  location_id: 1,
  location: "Main",
  can_create,
  can_update,
  can_delete,
});
const ALL = { canCreate: true, canUpdate: true, canManageDevices: true };
const NONE = { canCreate: false, canUpdate: false, canManageDevices: false };

describe("inventory page actions", () => {
  it("gives the admins everything, whatever their location rows say", () => {
    expect(inventoryPageActions({ roleType: "root_admin", locations: [] })).toEqual(ALL);
    expect(
      inventoryPageActions({ roleType: "admin", locations: [loc(false, false, false)] })
    ).toEqual(ALL);
  });

  /* The reported bug: an inventory manager with no location rows — the
     company-wide case — saw no Add, Import, Update, Check in, Delete, Ship out
     or Shipment record, because every gate asked for a location flag first. */
  it("gives a company-wide inventory manager what the permission matrix grants", () => {
    expect(inventoryPageActions({ roleType: "inventory_manager", locations: [] })).toEqual(ALL);
    expect(inventoryPageActions({ roleType: "inventory_manager" })).toEqual(ALL);
  });

  it("gives a sale manager update only, as the matrix says", () => {
    expect(inventoryPageActions({ roleType: "sale_manager", locations: [] })).toEqual({
      canCreate: false,
      canUpdate: true,
      canManageDevices: false,
    });
  });

  it("restricts an inventory manager who has location rows to what those rows allow", () => {
    expect(
      inventoryPageActions({
        roleType: "inventory_manager",
        locations: [loc(true, false, false), loc(false, false, false)],
      })
    ).toEqual({ canCreate: true, canUpdate: false, canManageDevices: false });
    expect(
      inventoryPageActions({ roleType: "inventory_manager", locations: [loc(true, true, true)] })
    ).toEqual(ALL);
  });

  it("never lets location rows grant what the role does not have", () => {
    expect(
      inventoryPageActions({ roleType: "sale_manager", locations: [loc(true, true, true)] })
    ).toEqual({ canCreate: false, canUpdate: true, canManageDevices: false });
    expect(
      inventoryPageActions({ roleType: "event_manager", locations: [loc(true, true, true)] })
    ).toEqual(NONE);
  });

  it("gives roles without inventory permissions nothing", () => {
    expect(inventoryPageActions({ roleType: "event_manager", locations: [] })).toEqual(NONE);
    expect(inventoryPageActions({ roleType: "assistant", locations: [] })).toEqual(NONE);
    expect(inventoryPageActions({ roleType: null, locations: [] })).toEqual(NONE);
  });

  it("keeps a scoped role to its assigned locations: none assigned is nothing", () => {
    expect(
      inventoryPageActions({ roleType: "inventory_location_manager", locations: [] })
    ).toEqual(NONE);
    expect(
      inventoryPageActions({
        roleType: "inventory_location_manager",
        locations: [loc(true, true, true)],
      })
    ).toEqual(ALL);
    expect(
      inventoryPageActions({
        roleType: "inventory_location_assistant",
        locations: [loc(true, true, true)],
      })
    ).toEqual({ canCreate: false, canUpdate: true, canManageDevices: false });
  });
});
