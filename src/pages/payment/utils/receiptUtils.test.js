import { describe, it, expect } from "vitest";
import {
  RECEIPT_ROUTE,
  RECEIPT_STATUS,
  buildReceiptUrl,
  readPaymentIntentFromSearch,
  resolveReceiptStatus,
  isTransactionVoided,
  formatReceiptAmount,
  formatReceiptDate,
  receiptTotal,
  mapTransactionToReceipt,
} from "./receiptUtils";

const transaction = {
  paymentIntent: "pi_3AbCdEfGhIjKlMnO",
  device: [
    { deviceNeeded: 0, deviceType: "Lost device fee", deviceValue: 250 },
    { deviceNeeded: 0, deviceType: "Damaged screen", deviceValue: 19.99 },
  ],
  consumerInfo: {
    name: "Ada",
    lastName: "Lovelace",
    email: "ada@school.edu",
  },
  provider: "Bridges Academy",
  eventSelected: "Fall Term",
  date: "2026-06-02T15:04:05.000Z",
  active: true,
};

describe("buildReceiptUrl", () => {
  it("points at the receipt route with the payment intent", () => {
    expect(buildReceiptUrl("https://admin.devitrak.net", "pi_123")).toBe(
      `https://admin.devitrak.net${RECEIPT_ROUTE}?tx=pi_123`
    );
  });

  it("drops a trailing slash on the origin instead of doubling it", () => {
    expect(buildReceiptUrl("https://x.com/", "pi_123")).toBe(
      `https://x.com${RECEIPT_ROUTE}?tx=pi_123`
    );
  });

  it("encodes the identifier so a scanner never gets a broken URL", () => {
    expect(buildReceiptUrl("https://x.com", "pi 12&3")).toContain(
      "tx=pi%2012%263"
    );
  });

  it("returns an empty string with nothing to link to", () => {
    expect(buildReceiptUrl("https://x.com", "")).toBe("");
    expect(buildReceiptUrl("https://x.com", null)).toBe("");
    expect(buildReceiptUrl("", "pi_123")).toBe("");
  });
});

describe("readPaymentIntentFromSearch", () => {
  it("reads the tx parameter", () => {
    expect(readPaymentIntentFromSearch("?tx=pi_123")).toBe("pi_123");
  });

  it("decodes an encoded identifier", () => {
    expect(readPaymentIntentFromSearch("?tx=pi%2012%263")).toBe("pi 12&3");
  });

  it("works without the leading question mark", () => {
    expect(readPaymentIntentFromSearch("tx=pi_123")).toBe("pi_123");
  });

  it("is null when absent or blank", () => {
    expect(readPaymentIntentFromSearch("?other=1")).toBeNull();
    expect(readPaymentIntentFromSearch("?tx=")).toBeNull();
    expect(readPaymentIntentFromSearch("")).toBeNull();
    expect(readPaymentIntentFromSearch(undefined)).toBeNull();
  });
});

describe("resolveReceiptStatus — three states, never a guess", () => {
  it("is paid when the transaction is active", () => {
    expect(resolveReceiptStatus({ active: true })).toBe(RECEIPT_STATUS.PAID);
  });

  it("is void when the transaction was refunded", () => {
    expect(resolveReceiptStatus({ active: false })).toBe(RECEIPT_STATUS.VOID);
  });

  // The whole reason for a third state. Legacy transaction documents predate
  // `active`; stamping VOID on one would tell a family a real payment was
  // reversed, and stamping PAID would hide a real reversal. Neither is
  // acceptable on a money document, so an absent flag says so out loud.
  // Note this diverges on purpose from StripeTransactionTable's `!record.active`,
  // which renders a missing flag as "Refunded".
  it("is unknown when the flag is absent, not paid and not void", () => {
    for (const tx of [{}, { active: undefined }, { active: null }, null]) {
      expect(resolveReceiptStatus(tx)).toBe(RECEIPT_STATUS.UNKNOWN);
    }
  });

  it("only accepts a real boolean, never a truthy string", () => {
    expect(resolveReceiptStatus({ active: "false" })).toBe(
      RECEIPT_STATUS.UNKNOWN
    );
    expect(resolveReceiptStatus({ active: 1 })).toBe(RECEIPT_STATUS.UNKNOWN);
  });
});

describe("isTransactionVoided", () => {
  it("is true only for an explicit false", () => {
    expect(isTransactionVoided({ active: false })).toBe(true);
  });

  it("is false for active and for a missing flag alike", () => {
    expect(isTransactionVoided({ active: true })).toBe(false);
    expect(isTransactionVoided({})).toBe(false);
    expect(isTransactionVoided(null)).toBe(false);
  });
});

describe("formatReceiptAmount — transaction values are dollars, not cents", () => {
  it("formats to two decimals", () => {
    expect(formatReceiptAmount(250)).toBe("$250.00");
    expect(formatReceiptAmount(19.99)).toBe("$19.99");
    expect(formatReceiptAmount(0)).toBe("$0.00");
  });

  it("groups thousands so a large fee stays readable", () => {
    expect(formatReceiptAmount(1250.5)).toBe("$1,250.50");
  });

  it("shows $0.00 rather than NaN for unusable input", () => {
    for (const bad of [undefined, null, "", "abc", NaN, Infinity]) {
      expect(formatReceiptAmount(bad)).toBe("$0.00");
    }
  });
});

describe("formatReceiptDate", () => {
  it("renders a readable date from the stored ISO string", () => {
    const formatted = formatReceiptDate("2026-06-02T15:04:05.000Z");
    expect(formatted).toMatch(/Jun/);
    expect(formatted).toMatch(/2026/);
  });

  it("accepts a Date object too", () => {
    expect(formatReceiptDate(new Date("2026-06-02T15:04:05.000Z"))).toMatch(
      /Jun/
    );
  });

  // new Date(undefined).toLocaleString() prints the literal "Invalid Date",
  // which must never reach a printed receipt.
  it("prints a dash instead of Invalid Date", () => {
    for (const bad of [undefined, null, "", "not-a-date", NaN]) {
      expect(formatReceiptDate(bad)).toBe("—");
    }
  });
});

describe("receiptTotal", () => {
  it("sums the device lines", () => {
    expect(receiptTotal(transaction)).toBeCloseTo(269.99, 2);
  });

  it("ignores lines with no usable value", () => {
    expect(
      receiptTotal({ device: [{ deviceValue: 10 }, { deviceValue: "x" }] })
    ).toBe(10);
  });

  it("is 0 with no lines at all", () => {
    expect(receiptTotal({})).toBe(0);
    expect(receiptTotal({ device: [] })).toBe(0);
    expect(receiptTotal(null)).toBe(0);
  });
});

describe("mapTransactionToReceipt", () => {
  const receipt = mapTransactionToReceipt(transaction);

  it("carries the identifier used for lookup and on the QR", () => {
    expect(receipt.paymentIntent).toBe("pi_3AbCdEfGhIjKlMnO");
  });

  it("names the payer from consumerInfo", () => {
    expect(receipt.payer).toEqual({
      name: "Ada Lovelace",
      email: "ada@school.edu",
    });
  });

  it("turns each device into a receipt line", () => {
    expect(receipt.lines).toEqual([
      { label: "Lost device fee", amount: 250 },
      { label: "Damaged screen", amount: 19.99 },
    ]);
  });

  it("carries the total and the resolved status", () => {
    expect(receipt.total).toBeCloseTo(269.99, 2);
    expect(receipt.status).toBe(RECEIPT_STATUS.PAID);
  });

  it("marks a refunded transaction as void", () => {
    expect(mapTransactionToReceipt({ ...transaction, active: false }).status).toBe(
      RECEIPT_STATUS.VOID
    );
  });

  it("keeps the issuing context", () => {
    expect(receipt.company).toBe("Bridges Academy");
    expect(receipt.reference).toBe("Fall Term");
  });

  it("labels an unnamed line rather than rendering a blank row", () => {
    const mapped = mapTransactionToReceipt({
      device: [{ deviceValue: 5 }],
    });
    expect(mapped.lines[0].label).toBe("Item");
  });

  // A receipt page is reached by URL, so it will be opened with junk sooner or
  // later; it must render an empty shell, not throw.
  it("survives a missing or empty transaction", () => {
    for (const bad of [null, undefined, {}]) {
      const mapped = mapTransactionToReceipt(bad);
      expect(mapped.lines).toEqual([]);
      expect(mapped.total).toBe(0);
      expect(mapped.status).toBe(RECEIPT_STATUS.UNKNOWN);
      expect(mapped.payer.name).toBe("");
    }
  });
});
