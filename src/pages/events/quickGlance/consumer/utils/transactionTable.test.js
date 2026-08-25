import { describe, expect, it } from "vitest";
import {
  describeTransactionKind,
  describeTransactionState,
  filterTransactions,
  formatTransactionId,
  toTransactionRows,
} from "./transactionTable";

const cashIntent = "pi_cash_amount:$50_received_by:**admin@devitrak.net**&9xk";
const stripeIntent = "pi_3PabcdEFghIJklMN0pqRstU1";
const freeIntent = "pi_V1StGXR8Z5j";

describe("formatTransactionId", () => {
  it("shows a Stripe payment intent as it is", () => {
    expect(formatTransactionId(stripeIntent)).toBe(stripeIntent);
  });

  it("reduces a cash intent to the amount and who took it", () => {
    expect(formatTransactionId(cashIntent)).toBe(
      "cash_amount:$50_admin@devitrak.net"
    );
  });

  it("falls back to the raw id when a cash intent is truncated", () => {
    // The legacy renderer indexed straight into split("_")[4] and threw a
    // TypeError on any cash id that did not have five segments, which took the
    // whole transactions table down with it.
    expect(formatTransactionId("pi_cash_amount:$50")).toBe("pi_cash_amount:$50");
    expect(formatTransactionId("pi_cash")).toBe("pi_cash");
  });

  it("falls back to the raw id when a cash intent has no marker", () => {
    expect(formatTransactionId("pi_cash_a_b_no-marker-here")).toBe(
      "pi_cash_a_b_no-marker-here"
    );
  });

  it("renders an empty id as a dash rather than as the string undefined", () => {
    expect(formatTransactionId(undefined)).toBe("—");
    expect(formatTransactionId("")).toBe("—");
  });
});

describe("filterTransactions", () => {
  const list = [
    { paymentIntent: stripeIntent, device: [{ deviceType: "tablet", deviceNeeded: 2 }] },
    { paymentIntent: cashIntent, device: [{ deviceType: "headset", deviceNeeded: 1 }] },
    { paymentIntent: freeIntent, device: [{ deviceType: "radio", deviceNeeded: 3 }] },
  ];

  it("returns everything for an empty search", () => {
    expect(filterTransactions(list, "")).toHaveLength(3);
    expect(filterTransactions(list, undefined)).toHaveLength(3);
  });

  it("returns matches for a non-empty search", () => {
    // The legacy filter returned [] the moment the box had any content, so
    // typing anything emptied the table. This is the regression guard.
    const found = filterTransactions(list, "cash");
    expect(found).toHaveLength(1);
    expect(found[0].paymentIntent).toBe(cashIntent);
  });

  it("ignores case and surrounding spaces", () => {
    expect(filterTransactions(list, "  HEADSET ")).toHaveLength(1);
  });

  it("matches on device type", () => {
    expect(filterTransactions(list, "radio")[0].paymentIntent).toBe(freeIntent);
  });

  it("matches on the formatted id a reader can actually see", () => {
    // "admin@devitrak.net" only exists in the formatted label, not as its own
    // field, so searching what is on screen has to work.
    expect(filterTransactions(list, "admin@devitrak.net")).toHaveLength(1);
  });

  it("returns nothing for a term that is in no transaction", () => {
    expect(filterTransactions(list, "projector")).toHaveLength(0);
  });

  it("survives a missing list", () => {
    expect(filterTransactions(undefined, "cash")).toEqual([]);
    expect(filterTransactions(null, "")).toEqual([]);
  });
});

describe("toTransactionRows", () => {
  it("keys every row by its payment intent", () => {
    const rows = toTransactionRows([{ paymentIntent: "pi_a" }, { paymentIntent: "pi_b" }]);
    expect(rows.map((row) => row.key)).toEqual(["pi_a", "pi_b"]);
  });

  it("keeps the original fields on the row", () => {
    const rows = toTransactionRows([{ paymentIntent: "pi_a", active: true }]);
    expect(rows[0].active).toBe(true);
  });

  it("keeps rows unique per payment intent", () => {
    const rows = toTransactionRows([
      { paymentIntent: "pi_a" },
      { paymentIntent: "pi_a" },
    ]);
    expect(rows).toHaveLength(1);
  });

  it("still keys a row with no payment intent", () => {
    const rows = toTransactionRows([{}]);
    expect(rows[0].key).toBeTruthy();
  });

  it("survives a missing list", () => {
    expect(toTransactionRows(undefined)).toEqual([]);
  });
});

describe("describeTransactionState", () => {
  it("reads an active transaction as active", () => {
    expect(describeTransactionState({ active: true })).toEqual({
      key: "active",
      tone: "success",
      label: "Active",
    });
  });

  it("reads a closed transaction as closed", () => {
    expect(describeTransactionState({ active: false })).toEqual({
      key: "closed",
      tone: "neutral",
      label: "Closed",
    });
  });

  it("treats a record with no flag as active", () => {
    expect(describeTransactionState({}).key).toBe("active");
  });
});

describe("describeTransactionKind", () => {
  it("recognises a card deposit that can be captured or released", () => {
    const kind = describeTransactionKind({
      paymentIntent: stripeIntent,
      device: [{ deviceNeeded: 2 }],
    });
    expect(kind.key).toBe("deposit");
    expect(kind.canCaptureDeposit).toBe(true);
    expect(kind.canReleaseDeposit).toBe(true);
    expect(kind.canRefund).toBe(false);
  });

  it("recognises a straight card charge that can be refunded", () => {
    const kind = describeTransactionKind({
      paymentIntent: stripeIntent,
      device: [{ deviceNeeded: 0 }],
    });
    expect(kind.key).toBe("charge");
    expect(kind.canRefund).toBe(true);
    expect(kind.canCaptureDeposit).toBe(false);
  });

  it("offers no card action on a cash transaction", () => {
    // The legacy check was `paymentIntent.length > 16`, and a cash id is long,
    // so cash transactions were offered "Capture fund" and "Release deposit"
    // against a Stripe intent that does not exist.
    const kind = describeTransactionKind({
      paymentIntent: cashIntent,
      device: [{ deviceNeeded: 2 }],
    });
    expect(kind.key).toBe("cash");
    expect(kind.canCaptureDeposit).toBe(false);
    expect(kind.canReleaseDeposit).toBe(false);
    expect(kind.canRefund).toBe(false);
  });

  it("offers no card action on a free transaction", () => {
    const kind = describeTransactionKind({
      paymentIntent: freeIntent,
      device: [{ deviceNeeded: 2 }],
    });
    expect(kind.key).toBe("free");
    expect(kind.canRefund).toBe(false);
  });

  it("labels every kind for the reader", () => {
    expect(
      describeTransactionKind({ paymentIntent: cashIntent, device: [{}] }).label
    ).toBe("Cash");
    expect(
      describeTransactionKind({ paymentIntent: freeIntent, device: [{}] }).label
    ).toBe("No charge");
    expect(
      describeTransactionKind({
        paymentIntent: stripeIntent,
        device: [{ deviceNeeded: 1 }],
      }).label
    ).toBe("Card deposit");
  });

  it("survives a record with no device block", () => {
    expect(describeTransactionKind({ paymentIntent: stripeIntent }).key).toBe(
      "charge"
    );
    expect(describeTransactionKind({}).key).toBe("free");
    expect(describeTransactionKind(undefined).canRefund).toBe(false);
  });
});
