import { describe, expect, it } from "vitest";
import {
  LOST_FEE_METHOD,
  buildLostFeeReport,
  buildLostReceiverUpdate,
  describeLostComment,
  describeSettleFailure,
  formatCurrency,
  staffName,
  validateWaiverReason,
  normalizeAssignedReceiver,
  resolveLostDeviceFee,
} from "./lostFee";

const event = {
  id: "evt_1",
  company: "Context Global",
  eventInfoDetail: { eventName: "Expo 2026" },
  deviceSetup: [
    { group: "tablet", value: 250, consumerUses: true },
    { group: "headset", value: 80, consumerUses: true },
    { group: "rigging", value: 999, consumerUses: false },
  ],
};

describe("resolveLostDeviceFee", () => {
  it("finds the replacement value configured for the device type", () => {
    expect(resolveLostDeviceFee(event, "tablet")).toEqual({
      amount: 250,
      found: true,
    });
  });

  it("ignores a group the consumer never uses", () => {
    // rigging is staff-only kit; billing a consumer from its price list would
    // charge them $999 for a device they were never handed.
    expect(resolveLostDeviceFee(event, "rigging")).toEqual({
      amount: 0,
      found: false,
    });
  });

  it("reports not-found instead of throwing on an unknown device type", () => {
    // The legacy helper returned undefined and the caller read `.value` off it,
    // so the whole lost-fee screen crashed before it ever rendered.
    expect(resolveLostDeviceFee(event, "projector")).toEqual({
      amount: 0,
      found: false,
    });
  });

  it("matches a device type regardless of casing or padding", () => {
    expect(resolveLostDeviceFee(event, " Tablet ").amount).toBe(250);
  });

  it("survives an event with no device setup", () => {
    expect(resolveLostDeviceFee({}, "tablet")).toEqual({ amount: 0, found: false });
    expect(resolveLostDeviceFee(undefined, "tablet").found).toBe(false);
  });

  it("survives a missing device type", () => {
    expect(resolveLostDeviceFee(event, undefined).found).toBe(false);
    expect(resolveLostDeviceFee(event, "").found).toBe(false);
  });

  it("coerces a string price from the event setup", () => {
    const stringPriced = { deviceSetup: [{ group: "tablet", value: "250", consumerUses: true }] };
    expect(resolveLostDeviceFee(stringPriced, "tablet").amount).toBe(250);
  });
});

describe("normalizeAssignedReceiver", () => {
  const receiver = { id: "rec-1", paymentIntent: "pi_1" };

  it("unwraps the array form the store sometimes holds", () => {
    expect(normalizeAssignedReceiver([receiver])).toBe(receiver);
  });

  it("passes a bare object through", () => {
    expect(normalizeAssignedReceiver(receiver)).toBe(receiver);
  });

  it("takes the live record when several are stored for one serial", () => {
    const stale = { id: "rec-0", paymentIntent: "pi_1" };
    expect(normalizeAssignedReceiver([stale, receiver])).toBe(receiver);
  });

  it("returns null rather than undefined for nothing", () => {
    expect(normalizeAssignedReceiver(undefined)).toBeNull();
    expect(normalizeAssignedReceiver([])).toBeNull();
    expect(normalizeAssignedReceiver(null)).toBeNull();
  });
});

describe("formatCurrency", () => {
  it("renders a whole-dollar amount", () => {
    expect(formatCurrency(250)).toBe("$250");
  });

  it("renders a string amount", () => {
    expect(formatCurrency("80")).toBe("$80");
  });

  it("renders zero rather than a blank", () => {
    expect(formatCurrency(0)).toBe("$0");
  });

  it("renders nothing-known as zero", () => {
    expect(formatCurrency(undefined)).toBe("$0");
    expect(formatCurrency("abc")).toBe("$0");
  });

  it("groups thousands", () => {
    expect(formatCurrency(1250)).toBe("$1,250");
  });
});

describe("buildLostFeeReport", () => {
  const base = {
    amount: "250",
    method: "Cash",
    device: { serialNumber: "SN-4471", deviceType: "tablet" },
    paymentIntent: "pi_1",
    consumer: { email: "guest@example.com" },
    admin: { email: "admin@devitrak.net" },
    event,
    companyId: "cmp_1",
  };

  it("builds the cash-report payload the API expects", () => {
    expect(buildLostFeeReport(base)).toEqual({
      attendee: "guest@example.com",
      admin: "admin@devitrak.net",
      deviceLost: [{ label: "SN-4471", deviceType: "tablet" }],
      amount: "250",
      event: "evt_1",
      company: "cmp_1",
      typeCollection: "Cash",
      paymentIntent_charge_transaction: "pi_1",
    });
  });

  it("records the collection method it was given", () => {
    expect(buildLostFeeReport({ ...base, method: "Credit Card" }).typeCollection).toBe(
      "Credit Card"
    );
  });

  it("survives a report with no receiver on hand", () => {
    const report = buildLostFeeReport({ ...base, device: null, paymentIntent: null });
    expect(report.deviceLost).toEqual([{ label: null, deviceType: null }]);
    expect(report.paymentIntent_charge_transaction).toBeNull();
  });
});

describe("buildLostReceiverUpdate", () => {
  // The consumer page hands over a flattened table row (toDeviceRows) with no
  // `.device`, so the write used to send `device: { status: "Lost" }` and the
  // record lost its serial and type — the unit vanished from the transaction
  // and its slot reopened.
  it("rebuilds the device block from a flattened table row", () => {
    expect(
      buildLostReceiverUpdate({
        id: "rcv_1",
        serialNumber: "RRRRR001",
        deviceType: "tablet",
        deviceValue: 250,
        status: true,
        paymentIntent: "pi_1",
      })
    ).toEqual({
      id: "rcv_1",
      device: { serialNumber: "RRRRR001", deviceType: "tablet", deviceValue: 250, status: "Lost" },
      active: false,
    });
  });

  it("keeps every field of a raw receiver record's device", () => {
    expect(
      buildLostReceiverUpdate({
        id: "rcv_2",
        device: { serialNumber: "A1", deviceType: "headset", status: true, extra: "kept" },
      })
    ).toEqual({
      id: "rcv_2",
      device: { serialNumber: "A1", deviceType: "headset", extra: "kept", status: "Lost" },
      active: false,
    });
  });

  it("leaves out a value the row does not carry", () => {
    expect(
      buildLostReceiverUpdate({ id: "rcv_3", serialNumber: "B2", deviceType: "tablet" }).device
    ).toEqual({ serialNumber: "B2", deviceType: "tablet", status: "Lost" });
  });

  it("refuses a record without the serial and type, rather than wiping them", () => {
    expect(buildLostReceiverUpdate({ id: "rcv_4" })).toBeNull();
    expect(buildLostReceiverUpdate({ serialNumber: "B2", deviceType: "tablet" })).toBeNull();
    expect(buildLostReceiverUpdate(null)).toBeNull();
  });
});

describe("buildLostFeeReport — waiver", () => {
  const args = {
    device: { serialNumber: "RRRRR001", deviceType: "tablet" },
    paymentIntent: "pi_parent",
    consumer: { email: "ana@x.co" },
    admin: { email: "staff@x.co", name: "Sam", lastName: "Lee" },
    event,
    companyId: "co_1",
  };

  it("records a waiver as a zero charge, with who waived it and why", () => {
    const report = buildLostFeeReport({
      ...args,
      amount: "250",
      method: LOST_FEE_METHOD.WAIVED,
      waiverReason: "  Device was faulty on hand-out ",
    });
    expect(report).toMatchObject({
      amount: "0",
      typeCollection: "Waived",
      admin: "staff@x.co",
      waivedBy: { name: "Sam Lee", email: "staff@x.co" },
      waiverReason: "Device was faulty on hand-out",
      paymentIntent_charge_transaction: "pi_parent",
    });
  });

  it("adds no waiver fields to a paid fee", () => {
    const report = buildLostFeeReport({ ...args, amount: "250", method: LOST_FEE_METHOD.CASH });
    expect(report.amount).toBe("250");
    expect(report).not.toHaveProperty("waivedBy");
    expect(report).not.toHaveProperty("waiverReason");
  });

  it("keeps the card charge's own payment intent next to the transaction's", () => {
    const report = buildLostFeeReport({
      ...args,
      amount: "250",
      method: LOST_FEE_METHOD.CARD,
      feePaymentIntent: "pi_fee",
    });
    expect(report).toMatchObject({
      typeCollection: "Credit Card",
      paymentIntent_charge_transaction: "pi_parent",
      feePaymentIntent: "pi_fee",
    });
  });
});

describe("validateWaiverReason", () => {
  it("requires a reason", () => {
    expect(validateWaiverReason("")).toBe("Write why the fee is being waived.");
    expect(validateWaiverReason("   ")).toBe("Write why the fee is being waived.");
    expect(validateWaiverReason(undefined)).toBe("Write why the fee is being waived.");
  });

  it("accepts a short sentence and refuses an essay", () => {
    expect(validateWaiverReason("Faulty unit")).toBe(true);
    expect(validateWaiverReason("x".repeat(501))).toBe("Keep the reason under 500 characters.");
  });
});

describe("describeLostComment", () => {
  it("says only that the device is lost when a fee was paid", () => {
    expect(describeLostComment({ method: LOST_FEE_METHOD.CASH })).toBe("Device lost");
  });

  it("names who waived the fee, and why", () => {
    expect(
      describeLostComment({
        method: LOST_FEE_METHOD.WAIVED,
        admin: { name: "Sam", lastName: "Lee", email: "staff@x.co" },
        waiverReason: "Faulty unit",
      })
    ).toBe("Device lost — fee waived by Sam Lee (staff@x.co): Faulty unit");
  });
});

describe("staffName", () => {
  it("joins the name, or falls back to the email", () => {
    expect(staffName({ name: "Sam", lastName: "Lee", email: "s@x.co" })).toBe("Sam Lee");
    expect(staffName({ email: "s@x.co" })).toBe("s@x.co");
    expect(staffName(null)).toBe("");
  });
});

describe("describeSettleFailure", () => {
  it("says the device is still live when the write-off failed", () => {
    expect(describeSettleFailure({ step: "writeOff" })).toBe(
      "Nothing was recorded. The device is still marked as in use."
    );
    expect(describeSettleFailure(new Error("x"), { charged: true })).toMatch(/card was charged but the device was not written off/);
  });

  it("says the fee needs recording by hand when only the report failed", () => {
    expect(describeSettleFailure({ step: "report" })).toBe(
      "The device was written off, but the fee was not recorded. Record it manually."
    );
    expect(describeSettleFailure({ step: "report" }, { charged: true })).toMatch(/do not charge again/);
  });
});
