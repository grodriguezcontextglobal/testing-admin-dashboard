import { describe, it, expect } from "vitest";
import {
  RECEIPT_ROUTE,
  RECEIPT_STATUS,
  RECEIPT_KIND,
  mapAssignmentToReceipt,
  mapReturnToReceipt,
  buildReceiptUrl,
  readPaymentIntentFromSearch,
  readReceiptLogoFromSearch,
  resolveReceiptStatus,
  isTransactionVoided,
  formatReceiptAmount,
  formatReceiptDate,
  receiptTotal,
  mapTransactionToReceipt,
  mapFeeChargeToReceipt,
  mapLostFeeToReceipt,
  receiptSignatures,
  resolveReceiptLogo,
  readReceiptTokenFromSearch,
  receiptQrValue,
  publicReceiptToTransaction,
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

  // The link is built by someone who IS signed in, and opened by someone who is
  // not. Carrying the logo on the link is the only way the letterhead survives
  // that hand-off without the transaction response growing a field.
  it("carries the company logo so a scanned receipt keeps its letterhead", () => {
    expect(
      buildReceiptUrl("https://x.com", "pi_123", {
        companyLogo: "https://res.cloudinary.com/dsuynhcgd/image/upload/logo.png",
      })
    ).toBe(
      `https://x.com${RECEIPT_ROUTE}?tx=pi_123&logo=${encodeURIComponent(
        "https://res.cloudinary.com/dsuynhcgd/image/upload/logo.png"
      )}`
    );
  });

  it("leaves the parameter off when the company has no logo", () => {
    expect(buildReceiptUrl("https://x.com", "pi_123", { companyLogo: "" })).toBe(
      `https://x.com${RECEIPT_ROUTE}?tx=pi_123`
    );
    expect(buildReceiptUrl("https://x.com", "pi_123")).toBe(
      `https://x.com${RECEIPT_ROUTE}?tx=pi_123`
    );
  });

  it("refuses to link an image we did not host", () => {
    // Every logo in the app is uploaded through /cloudinary/upload-image, so a
    // URL anywhere else did not come from a company record.
    expect(
      buildReceiptUrl("https://x.com", "pi_123", {
        companyLogo: "https://tracker.example/pixel.png",
      })
    ).toBe(`https://x.com${RECEIPT_ROUTE}?tx=pi_123`);
    expect(
      buildReceiptUrl("https://x.com", "pi_123", {
        companyLogo: "http://res.cloudinary.com/x/logo.png",
      })
    ).toBe(`https://x.com${RECEIPT_ROUTE}?tx=pi_123`);
  });
});

describe("readReceiptLogoFromSearch", () => {
  const logo = "https://res.cloudinary.com/dsuynhcgd/image/upload/logo.png";

  it("reads the logo back out of the link", () => {
    expect(
      readReceiptLogoFromSearch(`?tx=pi_123&logo=${encodeURIComponent(logo)}`)
    ).toBe(logo);
  });

  it("works without the leading question mark", () => {
    expect(readReceiptLogoFromSearch(`logo=${encodeURIComponent(logo)}`)).toBe(
      logo
    );
  });

  it("is null when the link carries no logo", () => {
    expect(readReceiptLogoFromSearch("?tx=pi_123")).toBeNull();
    expect(readReceiptLogoFromSearch("?logo=")).toBeNull();
    expect(readReceiptLogoFromSearch("")).toBeNull();
    expect(readReceiptLogoFromSearch(undefined)).toBeNull();
  });

  it("refuses an image from anywhere but our own host", () => {
    // This value arrives in a URL anyone can edit. Without the host check the
    // receipt page renders whatever image a stranger points it at, on a page
    // that is meant to look official.
    expect(
      readReceiptLogoFromSearch("?logo=https%3A%2F%2Ftracker.example%2Fpixel.png")
    ).toBeNull();
    expect(
      readReceiptLogoFromSearch(
        "?logo=https%3A%2F%2Fres.cloudinary.com.evil.test%2Flogo.png"
      )
    ).toBeNull();
    expect(readReceiptLogoFromSearch("?logo=javascript%3Aalert(1)")).toBeNull();
    expect(
      readReceiptLogoFromSearch("?logo=data%3Aimage%2Fpng%3Bbase64%2CAAA")
    ).toBeNull();
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

  it("labels itself as a payment receipt", () => {
    expect(receipt.kind).toBe(RECEIPT_KIND.PAYMENT);
    expect(receipt.partyLabel).toBe("Billed to");
    expect(receipt.total).not.toBeNull();
  });
});

describe("mapAssignmentToReceipt — a handover slip, not an invoice", () => {
  const args = {
    member: { first_name: "Blaise", last_name: "Pascal", email: "b@school.edu" },
    devices: [
      { serial_number: "SN-1", item_group: "Chromebook" },
      { serial_number: "SN-2", item_group: "Charger" },
    ],
    company: "Bridges Academy",
    date: "2026-06-02T15:04:05.000Z",
    staffName: "Ada Lovelace",
    reference: "Due 2026-06-16",
  };
  const receipt = mapAssignmentToReceipt(args);

  it("names who it was issued to", () => {
    expect(receipt.partyLabel).toBe("Issued to");
    expect(receipt.payer).toEqual({
      name: "Blaise Pascal",
      email: "b@school.edu",
    });
  });

  it("credits the staff member who handed it over", () => {
    expect(receipt.idLabel).toBe("Issued by");
    expect(receipt.id).toBe("Ada Lovelace");
  });

  it("lists each device with its serial and type", () => {
    expect(receipt.lines).toEqual([
      { label: "SN-1 — Chromebook", amount: null },
      { label: "SN-2 — Charger", amount: null },
    ]);
  });

  // The distinction that keeps a handover slip from reading like an invoice:
  // no amount column at all, rather than a column full of $0.00.
  it("carries no money", () => {
    expect(receipt.total).toBeNull();
    expect(receipt.lines.every((line) => line.amount === null)).toBe(true);
    expect(receipt.kind).toBe(RECEIPT_KIND.ASSIGNMENT);
  });

  it("is open while the device is out and returned once it is back", () => {
    expect(receipt.status).toBe(RECEIPT_STATUS.OPEN);
    expect(mapAssignmentToReceipt({ ...args, returned: true }).status).toBe(
      RECEIPT_STATUS.RETURNED
    );
  });

  it("falls back to a label when a device has no serial or type", () => {
    const mapped = mapAssignmentToReceipt({ ...args, devices: [{}] });
    expect(mapped.lines[0].label).toBe("Item");
  });

  it("shows a dash rather than a blank when the staff name is missing", () => {
    expect(mapAssignmentToReceipt({ ...args, staffName: "" }).id).toBe("—");
  });

  it("survives being called with nothing", () => {
    for (const bad of [undefined, {}]) {
      const mapped = mapAssignmentToReceipt(bad);
      expect(mapped.lines).toEqual([]);
      expect(mapped.payer.name).toBe("");
      expect(mapped.total).toBeNull();
    }
  });
});

describe("mapReturnToReceipt — constancia for closing a lease", () => {
  const base = {
    member: { first_name: "Blaise", last_name: "Pascal", email: "b@school.edu" },
    record: { device_serial_number: "SN-1", device_category_name: "Laptop" },
    company: "Bridges Academy",
    date: "2026-06-02T15:04:05.000Z",
    staffName: "Ada Lovelace",
  };

  it("titles a loss declaration differently from a plain return", () => {
    expect(mapReturnToReceipt({ ...base, outcome: "lost" }).title).toBe(
      "Lost device declaration"
    );
    expect(mapReturnToReceipt({ ...base, outcome: "returned" }).title).toBe(
      "Device return receipt"
    );
  });

  // A "Returned" band on a loss declaration would state the opposite of what
  // happened, which is why lost has its own status rather than reusing RETURNED.
  it("never says returned on a loss declaration", () => {
    expect(mapReturnToReceipt({ ...base, outcome: "lost" }).status).toBe(
      RECEIPT_STATUS.DECLARED_LOST
    );
    expect(mapReturnToReceipt({ ...base, outcome: "returned" }).status).toBe(
      RECEIPT_STATUS.RETURNED
    );
    expect(mapReturnToReceipt({ ...base, outcome: "damaged" }).status).toBe(
      RECEIPT_STATUS.RETURNED
    );
  });

  it("spells out the outcome in plain language", () => {
    const lost = mapReturnToReceipt({ ...base, outcome: "lost" });
    expect(lost.lines[1].label).toBe(
      "Outcome: Declared lost — device not recovered"
    );
  });

  it("lists the device and credits who recorded it", () => {
    const receipt = mapReturnToReceipt({ ...base, outcome: "lost" });
    expect(receipt.lines[0].label).toBe("SN-1 — Laptop");
    expect(receipt.idLabel).toBe("Recorded by");
    expect(receipt.id).toBe("Ada Lovelace");
    expect(receipt.partyLabel).toBe("Held by");
    expect(receipt.payer.name).toBe("Blaise Pascal");
  });

  it("includes the condition note only when there is one", () => {
    const withNote = mapReturnToReceipt({
      ...base,
      outcome: "lost",
      note: "Reported lost on 6/2",
    });
    expect(withNote.lines).toHaveLength(3);
    expect(withNote.lines[2].label).toBe("Condition: Reported lost on 6/2");
    expect(mapReturnToReceipt({ ...base, outcome: "lost" }).lines).toHaveLength(2);
    expect(
      mapReturnToReceipt({ ...base, outcome: "lost", note: "   " }).lines
    ).toHaveLength(2);
  });

  // The fee gets collected on its own receipt. An amount printed here would read
  // as already paid.
  it("carries no money even when a fee was recorded", () => {
    const receipt = mapReturnToReceipt({ ...base, outcome: "lost" });
    expect(receipt.total).toBeNull();
    expect(receipt.lines.every((line) => line.amount === null)).toBe(true);
    expect(receipt.kind).toBe(RECEIPT_KIND.RETURN);
  });

  it("survives an unknown outcome and an empty call", () => {
    expect(mapReturnToReceipt({ ...base, outcome: "weird" }).lines[1].label).toBe(
      "Outcome: weird"
    );
    const empty = mapReturnToReceipt();
    expect(empty.lines[0].label).toBe("Item");
    expect(empty.lines[1].label).toBe("Outcome: —");
    expect(empty.total).toBeNull();
  });
});

describe("mapFeeChargeToReceipt — proof that a device fee was settled", () => {
  const base = {
    member: { first_name: "Blaise", last_name: "Pascal", email: "b@school.edu" },
    lines: [{ serial_number: "SN-1", reason: "Lost — not recovered", amount: 250 }],
    paymentIntent: "pi_3AbCdEfGhIjKlMnO",
    payerEmail: "parent@home.com",
    billedGuardian: true,
    company: "Bridges Academy",
    date: "2026-06-02T15:04:05.000Z",
  };

  // The whole point of this document: the loss declaration prints no money, so
  // without this there was no paper anywhere saying the debt was settled.
  it("is a paid payment receipt, unlike the loss declaration", () => {
    const receipt = mapFeeChargeToReceipt(base);
    expect(receipt.kind).toBe(RECEIPT_KIND.PAYMENT);
    expect(receipt.status).toBe(RECEIPT_STATUS.PAID);
    expect(receipt.title).toBe("Device fee receipt");
  });

  it("carries the Stripe transaction id so the charge can be traced", () => {
    const receipt = mapFeeChargeToReceipt(base);
    expect(receipt.idLabel).toBe("Transaction ID");
    expect(receipt.id).toBe("pi_3AbCdEfGhIjKlMnO");
    expect(mapFeeChargeToReceipt({ ...base, paymentIntent: "" }).id).toBe("—");
  });

  // Names the student on the document but the guardian's address, because that
  // is who actually paid — a receipt that hides either one is useless to both.
  it("names the student and the address that was billed", () => {
    const receipt = mapFeeChargeToReceipt(base);
    expect(receipt.partyLabel).toBe("Billed to");
    expect(receipt.payer.name).toBe("Blaise Pascal");
    expect(receipt.payer.email).toBe("parent@home.com");
    expect(receipt.reference).toMatch(/guardian/i);
  });

  it("says nothing about a guardian when the member paid directly", () => {
    const receipt = mapFeeChargeToReceipt({
      ...base,
      billedGuardian: false,
      payerEmail: "b@school.edu",
    });
    expect(receipt.reference).toBe("");
    expect(receipt.payer.email).toBe("b@school.edu");
  });

  it("prints device, reason and amount per line, in dollars", () => {
    const receipt = mapFeeChargeToReceipt(base);
    expect(receipt.lines).toEqual([
      { label: "SN-1 — Lost — not recovered", amount: 250 },
    ]);
    expect(receipt.total).toBe(250);
  });

  it("drops the reason when there is none rather than printing an empty dash", () => {
    const receipt = mapFeeChargeToReceipt({
      ...base,
      lines: [{ serial_number: "SN-9", amount: "40" }],
    });
    expect(receipt.lines[0].label).toBe("SN-9");
    expect(receipt.total).toBe(40);
  });

  // Same trap as the Stripe amount: 19.99 * 3 in floats is 59.97000000000001,
  // and a total that renders a cent off on a signed document is a support call.
  it("totals through cents so float dust never reaches the paper", () => {
    const receipt = mapFeeChargeToReceipt({
      ...base,
      lines: [
        { serial_number: "A", amount: 19.99 },
        { serial_number: "B", amount: 19.99 },
        { serial_number: "C", amount: 19.99 },
      ],
    });
    expect(receipt.total).toBe(59.97);
  });

  it("ignores unusable amounts instead of printing NaN", () => {
    const receipt = mapFeeChargeToReceipt({
      ...base,
      lines: [
        { serial_number: "A", amount: "abc" },
        { serial_number: "B", amount: 30 },
      ],
    });
    expect(receipt.lines[0].amount).toBe(0);
    expect(receipt.total).toBe(30);
  });

  it("survives being called with nothing", () => {
    for (const bad of [undefined, {}]) {
      const receipt = mapFeeChargeToReceipt(bad);
      expect(receipt.lines).toEqual([]);
      expect(receipt.total).toBe(0);
      expect(receipt.status).toBe(RECEIPT_STATUS.PAID);
      expect(receipt.payer.name).toBe("");
    }
  });
});

// ─── the company logo ────────────────────────────────────────────────────────

describe("resolveReceiptLogo", () => {
  it("keeps the hosted logo url", () => {
    expect(resolveReceiptLogo("https://res.cloudinary.com/x/logo.png")).toBe(
      "https://res.cloudinary.com/x/logo.png"
    );
  });

  it("is null when the company has no logo", () => {
    // `company_logo` is stored as "" for a company that never uploaded one.
    expect(resolveReceiptLogo("")).toBeNull();
    expect(resolveReceiptLogo("   ")).toBeNull();
    expect(resolveReceiptLogo(null)).toBeNull();
    expect(resolveReceiptLogo(undefined)).toBeNull();
  });

  it("refuses anything that is not an http(s) url", () => {
    // The receipt is printed and can be opened from a scan; a javascript: or
    // data: src has no business in it.
    expect(resolveReceiptLogo("javascript:alert(1)")).toBeNull();
    expect(resolveReceiptLogo("data:image/png;base64,AAA")).toBeNull();
    expect(resolveReceiptLogo("/uploads/logo.png")).toBeNull();
  });
});

describe("mapAssignmentToReceipt logo", () => {
  it("carries the company logo onto the document", () => {
    const receipt = mapAssignmentToReceipt({
      member: { first_name: "Ana" },
      devices: [],
      company: "Context Global",
      companyLogo: "https://res.cloudinary.com/x/logo.png",
    });
    expect(receipt.logoUrl).toBe("https://res.cloudinary.com/x/logo.png");
  });

  it("leaves it null when there is none", () => {
    expect(mapAssignmentToReceipt({ devices: [] }).logoUrl).toBeNull();
  });
});

describe("mapReturnToReceipt logo", () => {
  it("carries the company logo onto the document", () => {
    const receipt = mapReturnToReceipt({
      record: {},
      companyLogo: "https://res.cloudinary.com/x/logo.png",
    });
    expect(receipt.logoUrl).toBe("https://res.cloudinary.com/x/logo.png");
  });
});

// ─── signatures ──────────────────────────────────────────────────────────────

describe("receiptSignatures", () => {
  /* A handover slip is the paper record of who took custody of a device. It is
     signed on both sides — without it the document asserts a transfer nobody
     agreed to. Payment receipts are not signed: the card transaction is the
     proof. */

  it("asks the holder and the issuer to sign a handover", () => {
    const receipt = mapAssignmentToReceipt({
      member: { first_name: "Ana", last_name: "Ruiz" },
      devices: [],
      staffName: "Gustavo R",
    });
    expect(receiptSignatures(receipt)).toEqual([
      { caption: "Received by", name: "Ana Ruiz" },
      { caption: "Issued by", name: "Gustavo R" },
    ]);
  });

  it("flips the captions for a return", () => {
    const receipt = mapReturnToReceipt({
      member: { first_name: "Ana", last_name: "Ruiz" },
      record: {},
      outcome: "returned",
      staffName: "Gustavo R",
    });
    expect(receiptSignatures(receipt)).toEqual([
      { caption: "Returned by", name: "Ana Ruiz" },
      { caption: "Received by", name: "Gustavo R" },
    ]);
  });

  it("still asks for both on a lost-device declaration", () => {
    // This is the document that says a device is gone; it is the one that most
    // needs a signature.
    const receipt = mapReturnToReceipt({
      member: { first_name: "Ana" },
      record: {},
      outcome: "lost",
      staffName: "Gustavo R",
    });
    expect(receiptSignatures(receipt)).toHaveLength(2);
    expect(receiptSignatures(receipt)[0].caption).toBe("Declared by");
  });

  it("leaves a payment receipt unsigned", () => {
    expect(receiptSignatures(mapTransactionToReceipt({ transaction }))).toEqual([]);
  });

  it("prints an empty line rather than a name it does not have", () => {
    const receipt = mapAssignmentToReceipt({ devices: [] });
    expect(receiptSignatures(receipt)).toEqual([
      { caption: "Received by", name: "" },
      { caption: "Issued by", name: "" },
    ]);
  });

  it("survives nothing at all", () => {
    expect(receiptSignatures(null)).toEqual([]);
    expect(receiptSignatures({})).toEqual([]);
  });
});

/**
 * The payment receipt was the only one with no letterhead. Handover and return
 * slips both take a companyLogo; this one never set logoUrl, so the one receipt
 * a paying customer actually sees carried no mark of who issued it.
 *
 * It cannot come from the session unconditionally: /receipt is registered in
 * both AuthRoutes and NoAuthRoutes and is opened from a QR scan by people
 * outside the company. So the caller passes it when there is a session, and the
 * page renders without one when there is not.
 */
describe("mapTransactionToReceipt — company letterhead", () => {
  const transaction = { paymentIntent: "pi_1", provider: "Bridges", device: [] };

  it("carries the logo when the caller has a session to read it from", () => {
    expect(
      mapTransactionToReceipt(transaction, {
        companyLogo: "https://res.cloudinary.com/x/logo.png",
      }).logoUrl
    ).toBe("https://res.cloudinary.com/x/logo.png");
  });

  it("renders without one for a viewer who is not signed in", () => {
    expect(mapTransactionToReceipt(transaction).logoUrl).toBeNull();
    expect(mapTransactionToReceipt(transaction, {}).logoUrl).toBeNull();
  });

  it("holds the logo to the same rule as every other receipt", () => {
    // resolveReceiptLogo: absolute http(s) only. A receipt is printed and can
    // be opened from a QR scan, so a javascript: or data: src has no business
    // being its letterhead.
    expect(
      mapTransactionToReceipt(transaction, { companyLogo: "javascript:alert(1)" })
        .logoUrl
    ).toBeNull();
    expect(
      mapTransactionToReceipt(transaction, { companyLogo: "/uploads/logo.png" })
        .logoUrl
    ).toBeNull();
  });

  it("leaves the rest of the receipt exactly as it was", () => {
    const withLogo = mapTransactionToReceipt(transaction, {
      companyLogo: "https://res.cloudinary.com/x/logo.png",
    });
    const without = mapTransactionToReceipt(transaction);
    expect({ ...withLogo, logoUrl: null }).toEqual(without);
  });
});

/* 2026-10-20, server FRONTEND_receipt_link_2026-10-20.md: the QR used to carry
   only the payment intent, and GET /transaction/transaction answered anyone who
   knew it with the consumer's name and email. The printed QR now carries a
   signed token (`rt`) and the public page reads a reduced receipt with it. */
describe("readReceiptTokenFromSearch", () => {
  it("reads the signed token the QR carries", () => {
    expect(readReceiptTokenFromSearch("?tx=pi_1&rt=abc.def")).toBe("abc.def");
    expect(readReceiptTokenFromSearch("tx=pi_1&rt=a%2Bb")).toBe("a+b");
  });

  it("is null when the link has no token, as on receipts printed before it", () => {
    expect(readReceiptTokenFromSearch("?tx=pi_1")).toBeNull();
    expect(readReceiptTokenFromSearch("?tx=pi_1&rt=%20")).toBeNull();
    expect(readReceiptTokenFromSearch("")).toBeNull();
    expect(readReceiptTokenFromSearch(undefined)).toBeNull();
  });
});

describe("receiptQrValue — what the printed QR encodes", () => {
  const url = "https://admin.devitrak.net/receipt?tx=pi_1";

  it("adds the signed token when receipt-link issued one", () => {
    expect(receiptQrValue(url, { status: 200, token: "a+b/c" })).toBe(
      `${url}&rt=a%2Bb%2Fc`
    );
  });

  it("prints the unsigned link when the event ended over 30 days ago (410)", () => {
    expect(receiptQrValue(url, { status: 410 })).toBe(url);
  });

  it("prints no QR when the payment is not the company's or does not exist (404)", () => {
    expect(receiptQrValue(url, { status: 404 })).toBe("");
  });

  it("falls back to the unsigned link on any other failure: only staff can open it", () => {
    expect(receiptQrValue(url, { status: 500 })).toBe(url);
    expect(receiptQrValue(url, { status: 403 })).toBe(url);
    expect(receiptQrValue(url, undefined)).toBe(url);
    expect(receiptQrValue(url, { status: 200 })).toBe(url);
  });

  it("stays empty when there was nothing to link to", () => {
    expect(receiptQrValue("", { status: 200, token: "t" })).toBe("");
  });
});

describe("publicReceiptToTransaction — the reduced receipt a scan reads", () => {
  const publicReceipt = {
    paymentIntent: "pi_3AbCdEfGhIjKlMnOpQrStUvW",
    active: true,
    status: "active",
    device: [{ deviceType: "iPad", deviceNeeded: 2, deviceValue: 150 }],
    amount: 300,
    currency: "usd",
    provider: "Lincoln High",
    eventSelected: "Science Fair",
    date: "2026-10-20T12:00:00.000Z",
    type: "event",
  };

  it("renders as a receipt with no consumer on it", () => {
    const receipt = mapTransactionToReceipt(publicReceiptToTransaction(publicReceipt));
    expect(receipt.payer).toEqual({ name: "", email: "" });
    // Devices requested on a card: a deposit hold, not a charge.
    expect(receipt.status).toBe(RECEIPT_STATUS.DEPOSIT_HELD);
    expect(receipt.total).toBe(150);
    expect(receipt.company).toBe("Lincoln High");
    expect(receipt.reference).toBe("Science Fair");
    expect(receipt.lines).toEqual([{ label: "iPad", amount: 150 }]);
  });

  it("reads the void flag from `status` when `active` is missing", () => {
    const { active, ...rest } = publicReceipt;
    expect(active).toBe(true);
    expect(publicReceiptToTransaction({ ...rest, status: "refunded" }).active).toBe(false);
    expect(publicReceiptToTransaction({ ...rest, status: "active" }).active).toBe(true);
    expect(publicReceiptToTransaction({ ...rest, status: "odd" }).active).toBeUndefined();
  });

  it("drops any consumer data the server might add later", () => {
    const tx = publicReceiptToTransaction({
      ...publicReceipt,
      consumerInfo: { name: "Ada", email: "ada@example.com" },
    });
    expect(tx.consumerInfo).toBeUndefined();
  });

  it("is null for a missing receipt", () => {
    expect(publicReceiptToTransaction(null)).toBeNull();
    expect(publicReceiptToTransaction(undefined)).toBeNull();
  });
});

/* 2026-10-20, Gustavo: the receipt has to say what the payment intent is.
   Every transaction used to print as "Paid" or "Voided", so a free checkout
   and a card hold printed as if money had been taken. The shapes are the ones
   describeTransactionKind already tells apart for the transactions table. */
describe("mapTransactionToReceipt — status follows the payment intent", () => {
  const CARD = "pi_3AbCdEfGhIjKlMnOpQrStUvW";
  const FREE = "pi_AbCdEfGhIjKl";
  const CASH = "pi_cash_amount:$50_received_by:**staff@school.edu**&abc";
  const deposit = (paymentIntent, active) => ({
    paymentIntent,
    active,
    device: [{ deviceType: "iPad", deviceNeeded: 2, deviceValue: 150 }],
  });
  const charge = (paymentIntent, active) => ({
    paymentIntent,
    active,
    device: [{ deviceType: "Lost device fee", deviceNeeded: 0, deviceValue: 150 }],
  });

  it("prints a short id as no charge, whatever the device value", () => {
    const receipt = mapTransactionToReceipt(deposit(FREE, true));
    expect(receipt.status).toBe(RECEIPT_STATUS.NO_CHARGE);
    expect(receipt.paymentMethod).toBe("No charge");
    expect(mapTransactionToReceipt(deposit(FREE, false)).status).toBe(
      RECEIPT_STATUS.NO_CHARGE
    );
  });

  it("prints a pi_cash id as a cash deposit", () => {
    const receipt = mapTransactionToReceipt(deposit(CASH, true));
    expect(receipt.status).toBe(RECEIPT_STATUS.CASH_RECEIVED);
    expect(receipt.paymentMethod).toBe("Cash deposit");
    expect(mapTransactionToReceipt(deposit(CASH, false)).status).toBe(
      RECEIPT_STATUS.CLOSED
    );
  });

  it("shows the readable cash id, not the raw string", () => {
    expect(mapTransactionToReceipt(deposit(CASH, true)).id).toBe(
      "cash_amount:$50_staff@school.edu"
    );
    expect(mapTransactionToReceipt(deposit(CASH, true)).paymentIntent).toBe(CASH);
  });

  it("prints a card deposit as held, and closed once captured or released", () => {
    const receipt = mapTransactionToReceipt(deposit(CARD, true));
    expect(receipt.status).toBe(RECEIPT_STATUS.DEPOSIT_HELD);
    expect(receipt.paymentMethod).toBe("Card deposit");
    // A capture and a release both save active: false, so it cannot say which.
    expect(mapTransactionToReceipt(deposit(CARD, false)).status).toBe(
      RECEIPT_STATUS.CLOSED
    );
  });

  it("prints a card charge as paid, and void once refunded", () => {
    const receipt = mapTransactionToReceipt(charge(CARD, true));
    expect(receipt.status).toBe(RECEIPT_STATUS.PAID);
    expect(receipt.paymentMethod).toBe("Card charge");
    expect(mapTransactionToReceipt(charge(CARD, false)).status).toBe(
      RECEIPT_STATUS.VOID
    );
  });

  it("still refuses to guess when the active flag is missing", () => {
    expect(mapTransactionToReceipt(deposit(CARD, undefined)).status).toBe(
      RECEIPT_STATUS.UNKNOWN
    );
    expect(mapTransactionToReceipt(deposit(CASH, undefined)).status).toBe(
      RECEIPT_STATUS.UNKNOWN
    );
  });

  it("does the same for the reduced receipt a scan reads", () => {
    const scanned = publicReceiptToTransaction({
      paymentIntent: CARD,
      status: "refunded",
      device: [{ deviceType: "iPad", deviceNeeded: 2, deviceValue: 150 }],
    });
    expect(mapTransactionToReceipt(scanned).status).toBe(RECEIPT_STATUS.CLOSED);
  });
});

describe("mapLostFeeToReceipt — every lost-device charge leaves a receipt", () => {
  const base = {
    consumer: { name: "Ana", lastName: "Ruiz", email: "ana@x.co" },
    device: { serialNumber: "RRRRR001", deviceType: "Tablet" },
    amount: "250",
    method: "Cash",
    paymentIntent: "pi_parent",
    company: "Context Global",
    date: "2026-10-21T15:00:00.000Z",
    admin: { name: "Sam", lastName: "Lee", email: "staff@x.co" },
  };

  it("bills the consumer for the device that did not come back", () => {
    const receipt = mapLostFeeToReceipt(base);
    expect(receipt).toMatchObject({
      kind: RECEIPT_KIND.PAYMENT,
      title: "Lost device fee receipt",
      status: RECEIPT_STATUS.PAID,
      paymentMethod: "Cash",
      payer: { name: "Ana Ruiz", email: "ana@x.co" },
      lines: [{ label: "Tablet RRRRR001 — not returned", amount: 250 }],
      total: 250,
      id: "pi_parent",
      company: "Context Global",
      reference: "Collected by Sam Lee",
    });
  });

  it("names a card charge by its own payment intent, and the transaction it settles", () => {
    const receipt = mapLostFeeToReceipt({
      ...base,
      method: "Credit Card",
      feePaymentIntent: "pi_fee",
    });
    expect(receipt).toMatchObject({
      paymentMethod: "Card",
      id: "pi_fee",
      reference: "Collected by Sam Lee · for transaction pi_parent",
    });
  });

  it("prints a waiver as a zero charge, with who waived it and why", () => {
    const receipt = mapLostFeeToReceipt({
      ...base,
      method: "Waived",
      amount: "250",
      waiverReason: "Faulty unit",
    });
    expect(receipt).toMatchObject({
      title: "Lost device — fee waived",
      status: RECEIPT_STATUS.WAIVED,
      paymentMethod: "Waived",
      lines: [{ label: "Tablet RRRRR001 — not returned", amount: 0 }],
      total: 0,
      reference: "Waived by Sam Lee (staff@x.co): Faulty unit",
    });
  });

  it("totals in cents, so a price with cents is not off by one", () => {
    expect(mapLostFeeToReceipt({ ...base, amount: "19.99" }).total).toBe(19.99);
  });
});
