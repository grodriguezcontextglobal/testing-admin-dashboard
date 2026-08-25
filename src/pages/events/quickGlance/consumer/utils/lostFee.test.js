import { describe, expect, it } from "vitest";
import {
  buildLostFeeReport,
  formatCurrency,
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
