import { describe, expect, it } from "vitest";
import { resolveScopedLocationNames } from "./scopedLocations";

// The SQL shape, as /db_staff/companies returns it at login and as the scope
// endpoint writes it (FRONTEND_INTEGRATION_scoped_roles.md §2).
const sqlScope = [
  { location_id: 3, location_name: "Main warehouse", can_create: true },
  { location_id: 7, location_name: "Aisle 3", can_create: false },
];

describe("resolveScopedLocationNames", () => {
  // R3: the scope-assignment UI writes locations to SQL, and every location
  // reader on this page was still looking at the Mongo preference the old UI
  // writes. A role scoped through the new UI therefore got no location
  // filtering at all — the client saw an empty legacy array and read it as
  // "no restrictions".
  it("prefers the scope the new UI writes", () => {
    expect(
      resolveScopedLocationNames({
        sqlLocations: sqlScope,
        legacyLocationNames: [],
      }),
    ).toEqual(["Main warehouse", "Aisle 3"]);
  });

  // The old UI is still in the app and still writes preference.managerLocation.
  // Nobody has migrated the records it wrote, so dropping the fallback would
  // unscope every staff member assigned before the new screen existed.
  it("falls back to what the legacy screen wrote", () => {
    expect(
      resolveScopedLocationNames({
        sqlLocations: [],
        legacyLocationNames: ["Back room"],
      }),
    ).toEqual(["Back room"]);
  });

  // Both stores hold a scope for the same person — the new UI assigned one and
  // an older record survives. SQL is the one the server enforces, so the client
  // has to agree with it rather than with the copy nobody writes any more.
  it("lets SQL win when the two disagree", () => {
    expect(
      resolveScopedLocationNames({
        sqlLocations: sqlScope,
        legacyLocationNames: ["Back room"],
      }),
    ).toEqual(["Main warehouse", "Aisle 3"]);
  });

  it("reads nothing as nothing, whatever shape it arrives in", () => {
    expect(resolveScopedLocationNames({})).toEqual([]);
    expect(
      resolveScopedLocationNames({ sqlLocations: null, legacyLocationNames: null }),
    ).toEqual([]);
    expect(
      resolveScopedLocationNames({
        sqlLocations: "Main warehouse",
        legacyLocationNames: undefined,
      }),
    ).toEqual([]);
  });

  // A row with no name is a row nothing can be filtered by. Keeping it would
  // put undefined into a list that gets compared against location strings.
  it("drops rows that carry no name", () => {
    expect(
      resolveScopedLocationNames({
        sqlLocations: [
          { location_id: 3 },
          { location_id: 7, location_name: "" },
          { location_id: 9, location_name: "Aisle 3" },
        ],
        legacyLocationNames: [],
      }),
    ).toEqual(["Aisle 3"]);
  });
});
