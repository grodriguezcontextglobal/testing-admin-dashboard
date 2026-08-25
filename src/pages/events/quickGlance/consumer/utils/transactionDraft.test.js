import { describe, expect, it } from "vitest";
import {
  buildCashPaymentIntentId,
  buildDeviceSelection,
  buildFreePaymentIntentId,
  buildTransactionProfile,
  consumerDeviceOptions,
  validateDraft,
} from "./transactionDraft";
import { formatTransactionId } from "./transactionTable";

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

describe("consumerDeviceOptions", () => {
  it("offers only the groups consumers are allowed to take", () => {
    expect(consumerDeviceOptions(event).map((entry) => entry.group)).toEqual([
      "tablet",
      "headset",
    ]);
  });

  it("survives an event with no device setup", () => {
    expect(consumerDeviceOptions({})).toEqual([]);
    expect(consumerDeviceOptions(undefined)).toEqual([]);
  });

  it("drops a setup entry with no group name", () => {
    const noisy = { deviceSetup: [{ value: 10, consumerUses: true }] };
    expect(consumerDeviceOptions(noisy)).toEqual([]);
  });
});

describe("buildDeviceSelection", () => {
  it("builds the device block the transaction API expects", () => {
    expect(buildDeviceSelection({ group: "tablet", value: 250 }, 3)).toEqual({
      deviceType: "tablet",
      deviceValue: 250,
      deviceNeeded: 3,
    });
  });

  it("coerces a string price and a string quantity", () => {
    expect(buildDeviceSelection({ group: "tablet", value: "250" }, "2")).toEqual({
      deviceType: "tablet",
      deviceValue: 250,
      deviceNeeded: 2,
    });
  });

  it("defaults a missing quantity to one device", () => {
    expect(buildDeviceSelection({ group: "tablet", value: 250 }).deviceNeeded).toBe(1);
  });

  it("never emits NaN for an unpriced group", () => {
    const selection = buildDeviceSelection({ group: "tablet" }, 1);
    expect(selection.deviceValue).toBe(0);
    expect(Number.isNaN(selection.deviceValue)).toBe(false);
  });
});

describe("buildFreePaymentIntentId", () => {
  it("prefixes the generated id", () => {
    expect(buildFreePaymentIntentId("V1StGXR8Z5j")).toBe("pi_V1StGXR8Z5j");
  });

  it("stays short enough to be read as a non-card transaction", () => {
    // transactionTable.describeTransactionKind treats ids of 16 characters or
    // fewer as "no charge"; a longer id would be shown as a card charge and
    // offered a refund button.
    const id = buildFreePaymentIntentId("V1StGXR8Z5j");
    expect(id.length).toBeLessThanOrEqual(16);
  });
});

describe("buildCashPaymentIntentId", () => {
  const id = buildCashPaymentIntentId({
    amount: "50",
    adminEmail: "admin@devitrak.net",
    reference: "9xk",
  });

  it("records the amount and who took the money", () => {
    expect(id).toBe("pi_cash_amount:$50_received_by:**admin@devitrak.net**&9xk");
  });

  it("stays parseable by the transactions table", () => {
    // The table renders this id by splitting on "_" and reading the marked
    // segment; a shape change here silently breaks that column.
    expect(formatTransactionId(id)).toBe("cash_amount:$50_admin@devitrak.net");
  });

  it("is recognised as cash, not as a card charge", () => {
    expect(id.startsWith("pi_cash")).toBe(true);
  });
});

describe("buildTransactionProfile", () => {
  const profile = buildTransactionProfile({
    paymentIntent: "pi_abc",
    clientSecret: "secret_1",
    deviceSelection: { deviceType: "tablet", deviceValue: 250, deviceNeeded: 2 },
    consumer: { id: "c1", email: "guest@example.com" },
    event,
    companyId: "cmp_1",
    date: "Fri Aug 21 2026",
  });

  it("carries the identifiers the API keys on", () => {
    expect(profile).toMatchObject({
      paymentIntent: "pi_abc",
      clientSecret: "secret_1",
      eventSelected: "Expo 2026",
      event_id: "evt_1",
      company: "cmp_1",
      provider: "Context Global",
    });
  });

  it("carries the device block and the consumer", () => {
    expect(profile.device.deviceNeeded).toBe(2);
    expect(profile.consumerInfo.email).toBe("guest@example.com");
  });

  it("falls back to a known marker when Stripe returned no secret", () => {
    const noSecret = buildTransactionProfile({
      paymentIntent: "pi_abc",
      clientSecret: undefined,
      deviceSelection: { deviceType: "tablet", deviceValue: 1, deviceNeeded: 1 },
      consumer: {},
      event,
      companyId: "cmp_1",
      date: "d",
    });
    expect(noSecret.clientSecret).toBe("unknown");
  });
});

describe("validateDraft", () => {
  const base = {
    group: "tablet",
    quantity: 2,
    serials: ["RRRRR001", "RRRRR002"],
    availableCount: 10,
    requiresAmount: false,
  };

  it("passes a complete draft", () => {
    expect(validateDraft(base)).toEqual({ ok: true, problems: [] });
  });

  it("requires a device type", () => {
    const result = validateDraft({ ...base, group: null });
    expect(result.ok).toBe(false);
    expect(result.problems[0]).toMatch(/device type/i);
  });

  it("requires at least one serial", () => {
    const result = validateDraft({ ...base, serials: [] });
    expect(result.ok).toBe(false);
    expect(result.problems.join(" ")).toMatch(/scan/i);
  });

  it("requires as many serials as devices requested", () => {
    // This is the failure the old flow shipped silently: a transaction saved
    // with deviceNeeded: 2 and one device actually assigned.
    const result = validateDraft({ ...base, serials: ["RRRRR001"] });
    expect(result.ok).toBe(false);
    expect(result.problems.join(" ")).toMatch(/1 of 2/);
  });

  it("rejects a quantity larger than what the event has free", () => {
    const result = validateDraft({ ...base, quantity: 12, availableCount: 10 });
    expect(result.ok).toBe(false);
    expect(result.problems.join(" ")).toMatch(/only 10/i);
  });

  it("rejects a zero or negative quantity", () => {
    expect(validateDraft({ ...base, quantity: 0 }).ok).toBe(false);
    expect(validateDraft({ ...base, quantity: -1 }).ok).toBe(false);
  });

  it("rejects a non-numeric quantity instead of writing NaN", () => {
    const result = validateDraft({ ...base, quantity: "many" });
    expect(result.ok).toBe(false);
    expect(result.problems.join(" ")).toMatch(/quantity/i);
  });

  it("rejects duplicate serials", () => {
    const result = validateDraft({
      ...base,
      serials: ["RRRRR001", "RRRRR001"],
    });
    expect(result.ok).toBe(false);
    expect(result.problems.join(" ")).toMatch(/same serial/i);
  });

  it("requires an amount when the payment method needs one", () => {
    const result = validateDraft({ ...base, requiresAmount: true, amount: "" });
    expect(result.ok).toBe(false);
    expect(result.problems.join(" ")).toMatch(/amount/i);
  });

  it("rejects a non-positive amount when one is required", () => {
    expect(
      validateDraft({ ...base, requiresAmount: true, amount: "0" }).ok
    ).toBe(false);
    expect(
      validateDraft({ ...base, requiresAmount: true, amount: "-5" }).ok
    ).toBe(false);
  });

  it("accepts a valid amount when one is required", () => {
    expect(
      validateDraft({ ...base, requiresAmount: true, amount: "150" })
    ).toEqual({ ok: true, problems: [] });
  });

  it("reports every problem at once rather than one at a time", () => {
    const result = validateDraft({
      group: null,
      quantity: 0,
      serials: [],
      availableCount: 0,
      requiresAmount: true,
      amount: "",
    });
    expect(result.problems.length).toBeGreaterThan(1);
  });
});
