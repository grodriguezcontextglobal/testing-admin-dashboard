import { describe, expect, it } from "vitest";
import {
  activeEventsForStaff,
  deviceRowsForStaff,
  formatAssignedAt,
  formatMoney,
  staffEventRows,
  summarizeStaffProfile,
} from "./staffProfileSummary";

const event = ({
  id = "e1",
  name = "Expo",
  active = true,
  dateBegin = "2026-06-01",
  adminUser = [],
  headsetAttendees = [],
}) => ({
  id,
  active,
  eventInfoDetail: { eventName: name, dateBegin },
  staff: { adminUser, headsetAttendees },
});

describe("staffEventRows", () => {
  const events = [
    event({ id: "e1", name: "Expo", adminUser: [{ email: "ada@x.com" }] }),
    event({
      id: "e2",
      name: "Summit",
      active: false,
      headsetAttendees: [{ email: "ada@x.com" }],
    }),
    event({ id: "e3", name: "Other", adminUser: [{ email: "bob@x.com" }] }),
  ];

  it("keeps only the events this person is on, with the role they hold there", () => {
    const rows = staffEventRows(events, "ada@x.com");
    expect(rows.map((row) => [row.event, row.role])).toEqual([
      ["Expo", "Administrator"],
      ["Summit", "Coordinator"],
    ]);
  });

  it("matches the email regardless of case or padding", () => {
    expect(staffEventRows(events, " ADA@X.COM ")).toHaveLength(2);
  });

  it("carries the event's own active flag, not the member's", () => {
    const rows = staffEventRows(events, "ada@x.com");
    expect(rows.map((row) => row.active)).toEqual([true, false]);
  });

  it("gives every row a key even when two events share a name", () => {
    const rows = staffEventRows(
      [
        event({ id: "e1", name: "Expo", adminUser: [{ email: "ada@x.com" }] }),
        event({ id: "e2", name: "Expo", adminUser: [{ email: "ada@x.com" }] }),
      ],
      "ada@x.com"
    );
    expect(rows[0].key).not.toBe(rows[1].key);
  });

  it("survives an event with no staff block and a missing list", () => {
    expect(staffEventRows([{ eventInfoDetail: { eventName: "X" } }], "a@x.com")).toEqual([]);
    expect(staffEventRows(undefined, "a@x.com")).toEqual([]);
    expect(staffEventRows([], "")).toEqual([]);
  });
});

describe("activeEventsForStaff", () => {
  it("returns only the live events, soonest first", () => {
    const events = [
      event({ id: "e1", name: "Later", dateBegin: "2026-09-01", adminUser: [{ email: "a@x.com" }] }),
      event({ id: "e2", name: "Sooner", dateBegin: "2026-07-01", adminUser: [{ email: "a@x.com" }] }),
      event({ id: "e3", name: "Closed", active: false, adminUser: [{ email: "a@x.com" }] }),
    ];
    expect(activeEventsForStaff(events, "a@x.com").map((row) => row.event)).toEqual([
      "Sooner",
      "Later",
    ]);
  });

  it("survives a missing list", () => {
    expect(activeEventsForStaff(undefined, "a@x.com")).toEqual([]);
  });
});

describe("deviceRowsForStaff", () => {
  const leases = [
    {
      device_id: 11,
      subscription_initial_date: "2026-06-01T10:00:00.000Z",
      verification_id: "v1",
      active: 1,
    },
    {
      device_id: 12,
      subscription_initial_date: "2026-06-02T10:00:00.000Z",
      verification_id: "v2",
      active: 0,
    },
  ];
  const items = [
    { item_id: 11, item_group: "Radio", serial_number: "SN-1", cost: "120.50" },
    { item_id: 12, item_group: "Case", serial_number: "SN-2", cost: 40 },
  ];
  const images = [{ item_group: "Radio", source: "radio.png" }];

  it("joins the lease to its inventory record", () => {
    const rows = deviceRowsForStaff(leases, items, images);
    expect(rows[0]).toMatchObject({
      deviceId: 11,
      itemGroup: "Radio",
      serialNumber: "SN-1",
      cost: 120.5,
      photo: "radio.png",
      verificationId: "v1",
      isOut: true,
    });
  });

  it("does not throw when the item has no photo", () => {
    // The old row builder read `images[group].at(-1).source` with no guard, so
    // one item group without an image crashed the whole table.
    const rows = deviceRowsForStaff(leases, items, images);
    expect(rows[1].photo).toBeNull();
  });

  it("does not throw when the lease points at an item that is gone", () => {
    const rows = deviceRowsForStaff([{ device_id: 99 }], items, images);
    expect(rows[0]).toMatchObject({ itemGroup: "", serialNumber: "", cost: 0 });
  });

  it("treats active 0 as returned", () => {
    expect(deviceRowsForStaff(leases, items, images)[1].isOut).toBe(false);
  });

  it("keys a row by lease and date so one device can be assigned twice", () => {
    const rows = deviceRowsForStaff(
      [
        { device_id: 11, subscription_initial_date: "2026-06-01" },
        { device_id: 11, subscription_initial_date: "2026-07-01" },
      ],
      items,
      images
    );
    expect(rows[0].key).not.toBe(rows[1].key);
  });

  it("prefers the newest inventory record for a repeated item id", () => {
    const rows = deviceRowsForStaff(
      [{ device_id: 11 }],
      [
        { item_id: 11, item_group: "Radio", serial_number: "OLD" },
        { item_id: 11, item_group: "Radio", serial_number: "NEW" },
      ],
      []
    );
    expect(rows[0].serialNumber).toBe("NEW");
  });

  it("survives missing inputs", () => {
    expect(deviceRowsForStaff(undefined, undefined, undefined)).toEqual([]);
  });
});

describe("summarizeStaffProfile", () => {
  const deviceRows = [
    { cost: 120.5, isOut: true, verificationId: "v1" },
    { cost: 40, isOut: true, verificationId: "v2" },
    { cost: 10, isOut: false, verificationId: "v3" },
  ];

  it("counts what the person is holding and what it is worth", () => {
    const summary = summarizeStaffProfile({
      deviceRows,
      eventRows: [{ active: true }, { active: false }],
    });
    expect(summary).toMatchObject({
      devicesOut: 2,
      devicesTotal: 3,
      valueOut: 160.5,
      eventsActive: 1,
      eventsTotal: 2,
    });
  });

  it("counts the unsigned contracts, and flags them as the alarming stat", () => {
    const summary = summarizeStaffProfile({
      deviceRows,
      eventRows: [],
      signedByVerification: { v1: true, v2: false },
    });
    // v2 is explicitly unsigned; v3 is returned so it does not count.
    expect(summary.documentsPending).toBe(1);
    expect(summary.hasPendingDocuments).toBe(true);
  });

  it("does not count a verification whose documents have not loaded yet", () => {
    const summary = summarizeStaffProfile({ deviceRows, eventRows: [] });
    expect(summary.documentsPending).toBe(0);
    expect(summary.hasPendingDocuments).toBe(false);
  });

  it("survives being handed nothing", () => {
    expect(summarizeStaffProfile({})).toMatchObject({
      devicesOut: 0,
      devicesTotal: 0,
      valueOut: 0,
      eventsActive: 0,
    });
  });
});

describe("formatAssignedAt", () => {
  it("reads as a date and a time, not as a UTC header string", () => {
    // The column rendered `new Date(value).toUTCString()`:
    // "Mon, 01 Jun 2026 10:00:00 GMT".
    const formatted = formatAssignedAt("2026-06-01T10:00:00.000Z");
    expect(formatted).toMatch(/Jun/);
    expect(formatted).not.toMatch(/GMT/);
  });

  it("returns a dash rather than 'Invalid Date'", () => {
    expect(formatAssignedAt(undefined)).toBe("—");
    expect(formatAssignedAt("not a date")).toBe("—");
  });
});

describe("formatMoney", () => {
  it("formats an amount with two decimals and a thousands separator", () => {
    expect(formatMoney(1234.5)).toBe("$1,234.50");
    expect(formatMoney("40")).toBe("$40.00");
  });

  it("shows zero rather than NaN for a missing cost", () => {
    expect(formatMoney(undefined)).toBe("$0.00");
    expect(formatMoney("abc")).toBe("$0.00");
  });
});
