import { describe, expect, it } from "vitest";
import {
  devicesForTransaction,
  summarizeAssignment,
  toDeviceRows,
} from "./transactionAssignment";

const assigned = (serialNumber, deviceType, status = true, id = serialNumber) => ({
  id,
  paymentIntent: "pi_1",
  device: { serialNumber, deviceType, status, deviceValue: 100 },
});

describe("devicesForTransaction", () => {
  it("returns the devices belonging to one payment intent", () => {
    const receivers = [
      assigned("A", "tablet"),
      { ...assigned("B", "tablet"), paymentIntent: "pi_2" },
    ];
    const rows = devicesForTransaction(receivers, "pi_1");
    expect(rows).toHaveLength(1);
    expect(rows[0].serialNumber).toBe("A");
  });

  it("keys each row by the receiver record so actions target the right row", () => {
    const rows = devicesForTransaction([assigned("A", "tablet", true, "rec-1")], "pi_1");
    expect(rows[0].key).toBe("rec-1");
  });

  it("carries the receiver id through for the update call", () => {
    const rows = devicesForTransaction([assigned("A", "tablet", true, "rec-1")], "pi_1");
    expect(rows[0].receiverId).toBe("rec-1");
  });

  it("also exposes the receiver id as `id` for the bulk modals", () => {
    // ReturningInBulkMethod and ExpressCheckInDevices key their chips off
    // `item.id`. The rows they were handed spread `receiver.device`, which has
    // no id, so every chip shared the key `undefined`.
    const rows = devicesForTransaction([assigned("A", "tablet", true, "rec-1")], "pi_1");
    expect(rows[0].id).toBe("rec-1");
  });

  it("returns an empty list when the transaction has no devices yet", () => {
    expect(devicesForTransaction([assigned("A", "tablet")], "pi_unknown")).toEqual([]);
  });

  it("survives a missing receiver list", () => {
    expect(devicesForTransaction(undefined, "pi_1")).toEqual([]);
    expect(devicesForTransaction(null, "pi_1")).toEqual([]);
  });

  it("keeps the last record when the same serial was re-assigned", () => {
    // Returning and re-assigning the same unit leaves two receiver rows for one
    // serial; the table has to show the live one, not the stale one.
    const rows = devicesForTransaction(
      [
        assigned("A", "tablet", false, "rec-old"),
        assigned("A", "tablet", true, "rec-new"),
      ],
      "pi_1"
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].receiverId).toBe("rec-new");
    expect(rows[0].status).toBe(true);
  });
});

describe("toDeviceRows", () => {
  it("maps receiver records to rows without filtering by payment intent", () => {
    // `/receiver/receiver-assigned` is already asked for one intent and its
    // records do not necessarily echo the field back; filtering again here
    // would empty the table.
    const rows = toDeviceRows([
      { id: "r1", device: { serialNumber: "A", deviceType: "tablet", status: true } },
      { id: "r2", device: { serialNumber: "B", deviceType: "tablet", status: true } },
    ]);
    expect(rows.map((row) => row.serialNumber)).toEqual(["A", "B"]);
  });

  it("keeps one row per serial, the newest record", () => {
    const rows = toDeviceRows([
      { id: "old", device: { serialNumber: "A", status: false } },
      { id: "new", device: { serialNumber: "A", status: true } },
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].receiverId).toBe("new");
  });

  it("survives a record with no device block", () => {
    const rows = toDeviceRows([{ id: "r1" }]);
    expect(rows).toHaveLength(1);
    expect(rows[0].serialNumber).toBeUndefined();
  });

  it("survives a missing list", () => {
    expect(toDeviceRows(undefined)).toEqual([]);
    expect(toDeviceRows(null)).toEqual([]);
  });
});

describe("summarizeAssignment", () => {
  const record = {
    paymentIntent: "pi_1",
    device: [
      { deviceType: "Event Inventory tablet", deviceNeeded: 3 },
      { deviceType: "Event Inventory headset", deviceNeeded: 1 },
    ],
  };

  it("reports requested, assigned and remaining per device type", () => {
    const summary = summarizeAssignment(record, [
      { deviceType: "tablet", status: true },
      { deviceType: "tablet", status: true },
    ]);

    const tablet = summary.rows.find((row) => row.deviceType === "tablet");
    expect(tablet).toEqual({
      deviceType: "tablet",
      requested: 3,
      assigned: 2,
      remaining: 1,
    });
  });

  it("strips the inventory prefix from the label a reader sees", () => {
    const summary = summarizeAssignment(record, []);
    expect(summary.rows.map((row) => row.deviceType).sort()).toEqual([
      "headset",
      "tablet",
    ]);
  });

  it("totals the whole transaction", () => {
    const summary = summarizeAssignment(record, [
      { deviceType: "tablet", status: true },
    ]);
    expect(summary.totals).toEqual({ requested: 4, assigned: 1, remaining: 3 });
  });

  it("reports a fully assigned transaction as complete", () => {
    const summary = summarizeAssignment(record, [
      { deviceType: "tablet", status: true },
      { deviceType: "tablet", status: true },
      { deviceType: "tablet", status: true },
      { deviceType: "headset", status: true },
    ]);
    expect(summary.totals.remaining).toBe(0);
    expect(summary.isComplete).toBe(true);
  });

  it("reports an under-assigned transaction as incomplete", () => {
    expect(summarizeAssignment(record, []).isComplete).toBe(false);
  });

  it("counts a returned device as still assigned to the transaction", () => {
    // A returned unit was handed over and came back; it is not an outstanding
    // assignment, so asking for a replacement would double-count the request.
    const summary = summarizeAssignment(record, [
      { deviceType: "tablet", status: false },
    ]);
    const tablet = summary.rows.find((row) => row.deviceType === "tablet");
    expect(tablet.assigned).toBe(1);
  });

  it("counts a lost device as assigned so it is never silently re-requested", () => {
    const summary = summarizeAssignment(record, [
      { deviceType: "tablet", status: "Lost" },
    ]);
    const tablet = summary.rows.find((row) => row.deviceType === "tablet");
    expect(tablet.assigned).toBe(1);
  });

  it("never reports a negative remaining count", () => {
    const summary = summarizeAssignment(
      { device: [{ deviceType: "tablet", deviceNeeded: 1 }] },
      [
        { deviceType: "tablet", status: true },
        { deviceType: "tablet", status: true },
      ]
    );
    expect(summary.rows[0].remaining).toBe(0);
    expect(summary.totals.remaining).toBe(0);
  });

  it("reads a nested device block from the API", () => {
    const nested = {
      device: [{ device: [{ deviceType: "tablet", deviceNeeded: 2 }] }],
    };
    expect(summarizeAssignment(nested, []).totals.requested).toBe(2);
  });

  it("ignores a request line with no quantity", () => {
    const noisy = {
      device: [
        { deviceType: "tablet", deviceNeeded: 0 },
        { deviceType: "undefined", deviceNeeded: 2 },
        { deviceType: "headset", deviceNeeded: 1 },
      ],
    };
    const summary = summarizeAssignment(noisy, []);
    expect(summary.rows.map((row) => row.deviceType)).toEqual(["headset"]);
  });

  it("surfaces a device that was assigned but never requested", () => {
    const summary = summarizeAssignment(
      { device: [{ deviceType: "tablet", deviceNeeded: 1 }] },
      [{ deviceType: "projector", status: true }]
    );
    const projector = summary.rows.find((row) => row.deviceType === "projector");
    expect(projector).toEqual({
      deviceType: "projector",
      requested: 0,
      assigned: 1,
      remaining: 0,
    });
  });

  it("sorts the largest request first", () => {
    const summary = summarizeAssignment(record, []);
    expect(summary.rows[0].deviceType).toBe("tablet");
  });

  it("survives a record with no device block", () => {
    const summary = summarizeAssignment({}, []);
    expect(summary.rows).toEqual([]);
    expect(summary.totals).toEqual({ requested: 0, assigned: 0, remaining: 0 });
    expect(summary.isComplete).toBe(true);
  });

  it("survives a missing record entirely", () => {
    expect(summarizeAssignment(undefined, undefined).totals.requested).toBe(0);
  });
});
