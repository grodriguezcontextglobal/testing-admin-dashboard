import { describe, expect, it } from "vitest";
import { buildTransactionDeviceRows } from "./transactionDeviceRows";

// The device table inside a consumer's transaction row (ExpandedRow): one row
// per assigned receiver, valued from the event inventory of the transaction.
describe("buildTransactionDeviceRows", () => {
  const receiver = (id, serial, type, status = true) => ({
    _id: id,
    timeStamp: 1700000000000,
    device: { serialNumber: serial, deviceType: type, status },
  });
  const rowRecord = {
    key: "pi_1",
    eventInfo: [
      {
        type: "event",
        device: [
          { group: "Radio", value: 120, deviceValue: 99 },
          { group: "Radio", value: 150, deviceValue: 99 },
          { group: "Tablet", value: 300, deviceValue: 99 },
        ],
      },
    ],
  };

  it("builds one row per receiver, valued with the group's latest value", () => {
    const rows = buildTransactionDeviceRows([receiver("r1", "A-1", "Radio")], rowRecord);
    expect(rows).toEqual([
      {
        key: "r1",
        serial_number: "A-1",
        type: "Radio",
        deviceValue: 150,
        status: true,
        timeStamp: 1700000000000,
        entireData: receiver("r1", "A-1", "Radio"),
        transactionData: rowRecord,
      },
    ]);
  });

  it("falls back to the first device's value for a group the event does not list", () => {
    const rows = buildTransactionDeviceRows([receiver("r2", "H-1", "Headset")], rowRecord);
    expect(rows[0].deviceValue).toBe(99);
  });

  it("a lease takes the group's value and nothing else", () => {
    const lease = {
      ...rowRecord,
      eventInfo: [{ type: "lease", device: [{ group: "Radio", value: 80 }] }],
    };
    expect(buildTransactionDeviceRows([receiver("r3", "A-3", "Radio")], lease)[0].deviceValue).toBe(80);
  });

  it("is empty with nothing assigned", () => {
    expect(buildTransactionDeviceRows(undefined, rowRecord)).toEqual([]);
    expect(buildTransactionDeviceRows([], rowRecord)).toEqual([]);
  });
});
