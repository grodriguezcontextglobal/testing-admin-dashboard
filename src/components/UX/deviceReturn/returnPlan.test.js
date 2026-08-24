import { describe, expect, it } from "vitest";
import {
  buildBulkReturnPayloads,
  deviceKey,
  isSameDevice,
  isStillOut,
  pendingDevices,
  resolveScan,
  returnCacheKeys,
  returnableDevices,
  summarizeReturn,
} from "./returnPlan";

/** A table row as `toDeviceRows` builds it, or as FooterExpandedRow spreads it. */
const row = (serialNumber, deviceType = "tablet", status = true, id = serialNumber) => ({
  key: id,
  id,
  receiverId: id,
  serialNumber,
  deviceType,
  status,
});

describe("isStillOut", () => {
  it("counts a device as out only while its status says so", () => {
    expect(isStillOut(row("A", "tablet", true))).toBe(true);
    expect(isStillOut(row("A", "tablet", false))).toBe(false);
  });

  it("accepts the string the API sometimes sends instead of a boolean", () => {
    expect(isStillOut({ serialNumber: "A", status: "true" })).toBe(true);
    expect(isStillOut({ serialNumber: "A", status: "TRUE" })).toBe(true);
  });

  it("never treats a written-off device as returnable", () => {
    expect(isStillOut({ serialNumber: "A", status: "lost" })).toBe(false);
  });

  it("survives a missing device", () => {
    expect(isStillOut(undefined)).toBe(false);
    expect(isStillOut({})).toBe(false);
  });
});

describe("returnableDevices", () => {
  it("keeps only the devices that are still out", () => {
    const list = returnableDevices([
      row("A", "tablet", true),
      row("B", "tablet", false),
      row("C", "receiver", true),
    ]);
    expect(list.map((item) => item.serialNumber)).toEqual(["A", "C"]);
  });

  it("collapses the duplicate receiver rows one serial can have", () => {
    // Returning a unit and handing it out again leaves two receiver records for
    // the same physical device. Returning it twice is one request too many.
    const list = returnableDevices([
      row("A", "tablet", true, "rec-1"),
      row("a", "tablet", true, "rec-2"),
    ]);
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe("rec-1");
  });

  it("keeps a device that has no serial number rather than dropping it", () => {
    const list = returnableDevices([{ key: "rec-1", status: true }]);
    expect(list).toHaveLength(1);
  });

  it("survives a missing list", () => {
    expect(returnableDevices(undefined)).toEqual([]);
    expect(returnableDevices(null)).toEqual([]);
  });
});

describe("resolveScan", () => {
  const devices = [
    row("SN-1", "tablet", true),
    row("SN-2", "tablet", false),
    row("SN-3", "receiver", true),
  ];

  it("accepts a device that is out on this transaction", () => {
    const result = resolveScan({ serial: "SN-1", devices, picked: [] });
    expect(result.ok).toBe(true);
    expect(result.device.serialNumber).toBe("SN-1");
  });

  it("returns the inventory spelling of the serial, not what was typed", () => {
    const result = resolveScan({ serial: "  sn-1 ", devices, picked: [] });
    expect(result.ok).toBe(true);
    expect(result.serial).toBe("SN-1");
  });

  it("asks for input instead of failing silently on an empty scan", () => {
    const result = resolveScan({ serial: "   ", devices, picked: [] });
    expect(result).toMatchObject({ ok: false, code: "empty" });
  });

  it("says a serial is already on the list rather than adding it twice", () => {
    const result = resolveScan({
      serial: "SN-1",
      devices,
      picked: [row("SN-1")],
    });
    expect(result).toMatchObject({ ok: false, code: "duplicate" });
    expect(result.message).toContain("SN-1");
  });

  it("distinguishes a device already back from one that was never here", () => {
    // The old modal answered both with one sentence: "Serial number is not in
    // use or already scanned or invalid for this transaction."
    expect(resolveScan({ serial: "SN-2", devices, picked: [] })).toMatchObject({
      ok: false,
      code: "already_returned",
    });
    expect(resolveScan({ serial: "SN-9", devices, picked: [] })).toMatchObject({
      ok: false,
      code: "not_found",
    });
  });

  it("does not parse the serial as a number", () => {
    // Serials carry a trailing counter; `Number("SN-0012")` is NaN and
    // `Number("0012")` loses the padding.
    const padded = [row("0012", "tablet", true)];
    const result = resolveScan({ serial: "0012", devices: padded, picked: [] });
    expect(result.ok).toBe(true);
    expect(result.serial).toBe("0012");
  });

  it("survives a missing device list", () => {
    expect(resolveScan({ serial: "SN-1", devices: undefined, picked: undefined })).toMatchObject({
      ok: false,
      code: "not_found",
    });
  });
});

describe("pendingDevices", () => {
  it("lists what is still out and not yet on the return list", () => {
    const devices = [row("A"), row("B"), row("C", "tablet", false)];
    const pending = pendingDevices(devices, [row("A")]);
    expect(pending.map((item) => item.serialNumber)).toEqual(["B"]);
  });

  it("matches a picked device by serial regardless of which record it came from", () => {
    const pending = pendingDevices(
      [row("A", "tablet", true, "rec-1")],
      [row("a", "tablet", true, "rec-2")]
    );
    expect(pending).toEqual([]);
  });
});

describe("isSameDevice", () => {
  it("matches on the serial number when both have one", () => {
    expect(isSameDevice(row("A", "tablet", true, "rec-1"), row("a", "tablet", true, "rec-2"))).toBe(
      true
    );
  });

  it("falls back to the record id when a serial is missing", () => {
    expect(isSameDevice({ key: "rec-1" }, { key: "rec-1" })).toBe(true);
    expect(isSameDevice({ key: "rec-1" }, { key: "rec-2" })).toBe(false);
  });
});

describe("summarizeReturn", () => {
  it("counts what is picked against what is still out", () => {
    expect(summarizeReturn({ picked: [row("A")], returnable: [row("A"), row("B")] })).toEqual({
      picked: 1,
      total: 2,
      remaining: 1,
      isComplete: false,
      canSubmit: true,
    });
  });

  it("is complete once everything still out is on the list", () => {
    const both = [row("A"), row("B")];
    expect(summarizeReturn({ picked: both, returnable: both })).toMatchObject({
      remaining: 0,
      isComplete: true,
    });
  });

  it("refuses to submit an empty return", () => {
    // The old confirm button read "Total items to return: 0" and fired anyway.
    expect(summarizeReturn({ picked: [], returnable: [row("A")] })).toMatchObject({
      canSubmit: false,
    });
  });

  it("survives missing lists", () => {
    expect(summarizeReturn({})).toMatchObject({ picked: 0, total: 0, canSubmit: false });
  });
});

describe("buildBulkReturnPayloads", () => {
  it("keeps the exact body both endpoints already accept", () => {
    const devices = [row("A")];
    const payloads = buildBulkReturnPayloads({
      devices,
      companyId: "company-1",
      eventSelected: "Expo 2026",
      timeStamp: 1700000000000,
    });

    expect(payloads.transaction).toEqual({
      timeStamp: 1700000000000,
      device: devices,
    });
    expect(payloads.pool).toEqual({
      device: devices,
      company: "company-1",
      activity: false,
      eventSelected: "Expo 2026",
    });
  });

  it("passes the device records through untouched", () => {
    // The endpoints read fields off these objects; reshaping them here would be
    // a server-side change in disguise.
    const devices = [row("A")];
    const payloads = buildBulkReturnPayloads({ devices, timeStamp: 1 });
    expect(payloads.transaction.device[0]).toBe(devices[0]);
    expect(payloads.pool.device).toBe(payloads.transaction.device);
  });

  it("normalizes a missing device list to an array", () => {
    const payloads = buildBulkReturnPayloads({ devices: undefined, timeStamp: 1 });
    expect(payloads.transaction.device).toEqual([]);
  });
});

describe("returnCacheKeys", () => {
  it("clears the event name, event id and event detail id keys", () => {
    expect(
      returnCacheKeys({
        event: { id: "event-1", eventInfoDetail: { eventName: "Expo 2026", id: "detail-1" } },
        companyId: "company-1",
      })
    ).toEqual([
      "eventSelected=Expo 2026&company=company-1",
      "eventSelected=event-1&company=company-1",
      "eventSelected=detail-1&company=company-1",
    ]);
  });

  it("skips the keys an event shape does not carry", () => {
    // The consumers table builds a partial event object with no detail id, so
    // the old code sent `eventSelected=undefined`.
    expect(
      returnCacheKeys({
        event: { id: "event-1", eventInfoDetail: { eventName: "Expo 2026" } },
        companyId: "company-1",
      })
    ).toEqual([
      "eventSelected=Expo 2026&company=company-1",
      "eventSelected=event-1&company=company-1",
    ]);
  });

  it("does not repeat a key when two ids are the same value", () => {
    expect(
      returnCacheKeys({
        event: { id: "event-1", eventInfoDetail: { eventName: "Expo", id: "event-1" } },
        companyId: "c1",
      })
    ).toEqual(["eventSelected=Expo&company=c1", "eventSelected=event-1&company=c1"]);
  });

  it("survives a missing event", () => {
    expect(returnCacheKeys({ event: undefined, companyId: "c1" })).toEqual([]);
  });
});

describe("deviceKey", () => {
  it("prefers the receiver record id so chips do not share a React key", () => {
    expect(deviceKey(row("A", "tablet", true, "rec-1"), 0)).toBe("rec-1");
  });

  it("falls back to the serial and index when there is no id", () => {
    expect(deviceKey({ serialNumber: "A" }, 2)).toBe("A-2");
  });
});
