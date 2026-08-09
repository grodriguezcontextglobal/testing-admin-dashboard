import { describe, expect, it } from "vitest";
import {
  buildCustodyTimeline,
  deriveDeviceState,
  parseAssignmentEventName,
  parseSubLocations,
  resolveLocation,
  summarizeUtilization,
} from "./deviceProfileModel";

const NOW = new Date("2026-08-07T12:00:00");

describe("resolveLocation", () => {
  it("names the warehouse and its sub-locations when the device is in stock", () => {
    expect(
      resolveLocation({
        warehouse: 1,
        location: "Central Warehouse",
        sub_location: '["Rack B3","Shelf 2"]',
      })
    ).toBe("Central Warehouse · Rack B3 · Shelf 2");
  });

  it("uses the event address when the device is out", () => {
    expect(
      resolveLocation({
        warehouse: 0,
        street_address: "1200 Oak St",
        city_address: "Summit",
        state_address: "CO",
        zip_address: "80487",
      })
    ).toBe("1200 Oak St, Summit, CO, 80487");
  });

  // The bug the old table shipped: a LEFT JOIN with no event row interpolated
  // four nulls straight into the cell.
  it("returns null instead of a string of nulls when nothing was recorded", () => {
    expect(
      resolveLocation({
        warehouse: 0,
        street_address: null,
        city_address: null,
        state_address: null,
        zip_address: null,
      })
    ).toBeNull();
  });

  it("treats the literal string 'null' as absent", () => {
    expect(
      resolveLocation({
        warehouse: 0,
        street_address: "null",
        city_address: "null",
        state_address: "null",
        zip_address: "null",
      })
    ).toBeNull();
  });

  it("falls back to the home warehouse when an assigned device has no address", () => {
    expect(
      resolveLocation({ warehouse: 0, location: "Central Warehouse" })
    ).toBe("Central Warehouse");
  });
});

describe("parseSubLocations", () => {
  it("parses a JSON-stringified array", () => {
    expect(parseSubLocations('["Rack B3","Shelf 2"]')).toEqual([
      "Rack B3",
      "Shelf 2",
    ]);
  });

  it("treats a bare string as a single sub-location", () => {
    expect(parseSubLocations("Rack B3")).toEqual(["Rack B3"]);
  });

  it("drops nulls and blanks", () => {
    expect(parseSubLocations('["Rack B3", "", null]')).toEqual(["Rack B3"]);
    expect(parseSubLocations(null)).toEqual([]);
  });
});

describe("parseAssignmentEventName", () => {
  it("pulls the person out of a fabricated assignment event", () => {
    expect(
      parseAssignmentEventName(
        "Marcus Webb / marcus@school.org / 7/21/2026 / reference: 1690000000"
      )
    ).toEqual({
      label: "Marcus Webb",
      email: "marcus@school.org",
      isPerson: true,
    });
  });

  it("falls back to the email when there is no name segment", () => {
    expect(
      parseAssignmentEventName("marcus@school.org / 7/21/2026")
    ).toMatchObject({ label: "marcus@school.org", isPerson: true });
  });

  it("marks a real event name as not-a-person", () => {
    expect(parseAssignmentEventName("Spring Robotics Meet")).toEqual({
      label: "Spring Robotics Meet",
      email: null,
      isPerson: false,
    });
  });

  it("returns null for empty input", () => {
    expect(parseAssignmentEventName("")).toBeNull();
    expect(parseAssignmentEventName(null)).toBeNull();
  });
});

describe("deriveDeviceState", () => {
  it("reports in-stock from the item row and ignores stale open leases", () => {
    const state = deriveDeviceState({
      item: { warehouse: 1, location: "Central Warehouse", ownership: "Permanent" },
      memberLeases: [
        { member_id: 4, assigned_date: "2026-07-21", returned: 0 },
      ],
      now: NOW,
    });
    expect(state.inStock).toBe(true);
    expect(state.statusLabel).toBe("In stock");
    expect(state.openLease).toBeNull();
  });

  it("finds the open member lease and classifies it as overdue", () => {
    const state = deriveDeviceState({
      item: { warehouse: 0, ownership: "Permanent" },
      memberLeases: [
        {
          member_id: 4,
          assigned_date: "2026-07-21",
          expected_return_date: "2026-08-04",
          returned: 0,
        },
      ],
      now: NOW,
    });
    expect(state.inStock).toBe(false);
    expect(state.openLease.personId).toBe(4);
    expect(state.loan.key).toBe("overdue");
    expect(state.loan.tone).toBe("critical");
  });

  it("treats a surviving staff lease row as an open loan", () => {
    const state = deriveDeviceState({
      item: { warehouse: 0 },
      staffLeases: [
        {
          staff_member_id: 9,
          subscription_initial_date: "2026-08-01",
          subscription_expected_return_data: "2026-08-12",
        },
      ],
      now: NOW,
    });
    expect(state.openLease.kind).toBe("staff");
    expect(state.loan.key).toBe("due-soon");
  });

  // DATE columns serialize as "YYYY-MM-DD"; parsed as UTC these land a day
  // early west of Greenwich, which used to turn "due today" into "overdue 1d".
  it("treats a date-only due date as local, not UTC", () => {
    const state = deriveDeviceState({
      item: { warehouse: 0 },
      memberLeases: [
        {
          member_id: 4,
          assigned_date: "2026-08-01",
          expected_return_date: "2026-08-07",
          returned: 0,
        },
      ],
      now: NOW,
    });
    expect(state.loan.key).toBe("due-soon");
    expect(state.loan.label).toBe("Due today");
  });

  it("renames Rent ownership to Leased", () => {
    expect(deriveDeviceState({ item: { warehouse: 1, ownership: "Rent" } }).ownership).toBe(
      "Leased"
    );
  });

  it("prefers the newest lease when several are open", () => {
    const state = deriveDeviceState({
      item: { warehouse: 0 },
      memberLeases: [
        { member_id: 1, assigned_date: "2026-06-01", returned: 0 },
        { member_id: 2, assigned_date: "2026-07-21", returned: 0 },
      ],
      now: NOW,
    });
    expect(state.openLease.personId).toBe(2);
  });
});

describe("summarizeUtilization", () => {
  it("counts calendar days a closed lease covered inside the window", () => {
    const { daysOut } = summarizeUtilization({
      memberLeases: [
        {
          assigned_date: "2026-08-01",
          returned_date: "2026-08-05",
          returned: 1,
        },
      ],
      windowDays: 30,
      now: NOW,
    });
    expect(daysOut).toBe(5); // Aug 1–5 inclusive
  });

  it("counts an open lease up to today, never past it", () => {
    const { daysOut } = summarizeUtilization({
      memberLeases: [{ assigned_date: "2026-08-05", returned: 0 }],
      windowDays: 30,
      now: NOW,
    });
    expect(daysOut).toBe(3); // Aug 5, 6, 7
  });

  it("does not double-count overlapping leases", () => {
    const { daysOut } = summarizeUtilization({
      memberLeases: [
        { assigned_date: "2026-08-01", returned_date: "2026-08-05", returned: 1 },
        { assigned_date: "2026-08-03", returned_date: "2026-08-06", returned: 1 },
      ],
      windowDays: 30,
      now: NOW,
    });
    expect(daysOut).toBe(6); // Aug 1–6, not 5 + 4
  });

  it("clips a lease that started before the window", () => {
    const { daysOut, ratio } = summarizeUtilization({
      memberLeases: [{ assigned_date: "2020-01-01", returned: 0 }],
      windowDays: 30,
      now: NOW,
    });
    expect(daysOut).toBe(30);
    expect(ratio).toBe(1);
  });

  it("reports nothing when there are no leases", () => {
    expect(summarizeUtilization({ now: NOW })).toEqual({
      daysOut: 0,
      windowDays: 30,
      ratio: 0,
    });
  });
});

describe("buildCustodyTimeline", () => {
  it("emits an assign and a return entry per closed lease, newest first", () => {
    const entries = buildCustodyTimeline({
      item: { item_id: 7, create_at: "2026-06-12", cost: 90 },
      memberLeases: [
        {
          id: 1,
          member_id: 4,
          assigned_date: "2026-07-21",
          expected_return_date: "2026-08-04",
          returned_date: "2026-08-06",
          returned: 1,
        },
      ],
      resolvePersonLabel: () => "Marcus Webb",
    });

    expect(entries.map((entry) => entry.kind)).toEqual([
      "returned",
      "assigned",
      "created",
    ]);
    expect(entries[0].personLabel).toBe("Marcus Webb");
    expect(entries[1].dueDate).toBe("2026-08-04");
  });

  it("falls back to tracking rows only when no leases exist", () => {
    const entries = buildCustodyTimeline({
      item: {},
      trackingRows: [
        {
          event_id: 3,
          event_name: "Priya Anand / priya@school.org / 6/30/2026 / reference: 1",
          warehouse: 0,
          street_address: "1200 Oak St",
          city_address: "Summit",
          state_address: "CO",
          zip_address: "80487",
        },
      ],
    });
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      kind: "assigned",
      personLabel: "Priya Anand",
      legacy: true,
      location: "1200 Oak St, Summit, CO, 80487",
    });
  });

  it("ignores tracking rows once real leases are present", () => {
    const entries = buildCustodyTimeline({
      item: {},
      memberLeases: [{ id: 1, member_id: 4, assigned_date: "2026-07-21", returned: 0 }],
      trackingRows: [
        { event_id: 3, event_name: "Priya Anand / priya@school.org / 6/30/2026" },
      ],
    });
    expect(entries).toHaveLength(1);
    expect(entries[0].legacy).toBeUndefined();
  });

  it("sinks undated entries to the bottom instead of the top", () => {
    const entries = buildCustodyTimeline({
      item: { item_id: 7, create_at: "2026-06-12" },
      memberLeases: [
        { id: 1, member_id: 4, assigned_date: null, returned: 0 },
        { id: 2, member_id: 5, assigned_date: "2026-07-21", returned: 0 },
      ],
    });
    expect(entries[0].date).toBe("2026-07-21");
    expect(entries.at(-1).kind).toBe("created");
  });
});
