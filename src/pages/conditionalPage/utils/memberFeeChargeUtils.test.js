import { describe, it, expect } from "vitest";
import {
  resolveFeePayer,
  toStripeAmount,
  formatStripeAmount,
  totalFeeCents,
  buildFeeChargeSummary,
  canSubmitFeeCharge,
  buildFeeSettlements,
  buildFeeReceiptNotification,
} from "./memberFeeChargeUtils";

const adult = {
  first_name: "Ada",
  last_name: "Lovelace",
  email: "ada@school.edu",
  minor: 0,
};
const teen = {
  first_name: "Blaise",
  last_name: "Pascal",
  email: "blaise@school.edu",
  minor: 1,
  parent_guardian_email: "parent@home.com",
};

describe("resolveFeePayer — a minor is never the payer", () => {
  it("bills the guardian for a minor, not the student", () => {
    const payer = resolveFeePayer(teen);
    expect(payer).toEqual({
      email: "parent@home.com",
      isGuardian: true,
      error: null,
    });
  });

  it("bills an adult member directly", () => {
    expect(resolveFeePayer(adult)).toEqual({
      email: "ada@school.edu",
      isGuardian: false,
      error: null,
    });
  });

  // SQL sends minor as 0/1; the boolean shape shows up elsewhere.
  it("treats both shapes of minor the same way", () => {
    expect(resolveFeePayer({ ...teen, minor: true }).isGuardian).toBe(true);
    expect(resolveFeePayer({ ...teen, minor: "1" }).isGuardian).toBe(true);
    expect(resolveFeePayer({ ...adult, minor: false }).isGuardian).toBe(false);
  });

  // Charging the student's own address for a minor would be the failure worth
  // preventing — better to refuse the charge than bill the wrong person.
  it("refuses rather than falling back to the minor's own email", () => {
    const payer = resolveFeePayer({ ...teen, parent_guardian_email: "" });
    expect(payer.email).toBeNull();
    expect(payer.error).toMatch(/guardian/i);
  });

  it("refuses when an adult member has no email", () => {
    const payer = resolveFeePayer({ ...adult, email: "" });
    expect(payer.email).toBeNull();
    expect(payer.error).toBeTruthy();
  });
});

describe("toStripeAmount — dollars to integer cents", () => {
  it("converts whole dollars", () => {
    expect(toStripeAmount(250)).toBe(25000);
  });

  // The bug this exists to prevent: 19.99 * 100 is 1998.9999999999998 in
  // binary floating point. Truncating gives 1998 — a cent short on every such
  // amount — and passing the raw float makes Stripe reject the intent.
  // Input contract is two decimals (the field is step="0.01"); a three-decimal
  // half-cent has no correct answer here because 1.005 is stored as slightly
  // less than 1.005 to begin with.
  it("does not leak floating-point dust", () => {
    expect(toStripeAmount(19.99)).toBe(1999);
    expect(toStripeAmount(0.29)).toBe(29);
    expect(toStripeAmount(8.7)).toBe(870);
    expect(toStripeAmount(1.1)).toBe(110);
    expect(Number.isInteger(toStripeAmount(19.99))).toBe(true);
  });

  it("accepts the string a number input produces", () => {
    expect(toStripeAmount("250.50")).toBe(25050);
  });

  it("returns 0 for anything that is not a chargeable amount", () => {
    for (const bad of [0, -5, "", null, undefined, "abc", NaN, Infinity]) {
      expect(toStripeAmount(bad)).toBe(0);
    }
  });
});

describe("formatStripeAmount — cents back to a readable amount", () => {
  it("always shows two decimals", () => {
    expect(formatStripeAmount(25000)).toBe("$250.00");
    expect(formatStripeAmount(1999)).toBe("$19.99");
    expect(formatStripeAmount(500)).toBe("$5.00");
  });

  // The copied source did String(total).slice(0, -2), which turns 99 cents into
  // an empty string and 5 cents into "-".
  it("handles amounts under a dollar", () => {
    expect(formatStripeAmount(99)).toBe("$0.99");
    expect(formatStripeAmount(5)).toBe("$0.05");
  });

  it("degrades to zero instead of printing NaN in the button", () => {
    for (const bad of [undefined, null, "abc", NaN]) {
      expect(formatStripeAmount(bad)).toBe("$0.00");
    }
  });
});

describe("totalFeeCents", () => {
  const lines = [
    { serial_number: "SN-1", amount: 250, reason: "lost" },
    { serial_number: "SN-2", amount: 19.99, reason: "damaged" },
  ];

  it("sums the lines in cents", () => {
    expect(totalFeeCents(lines)).toBe(26999);
  });

  it("sums in cents rather than rounding a float total", () => {
    const dust = [{ amount: 0.1 }, { amount: 0.2 }];
    expect(totalFeeCents(dust)).toBe(30);
  });

  it("ignores lines with no chargeable amount", () => {
    expect(totalFeeCents([...lines, { amount: 0 }, { amount: "" }])).toBe(26999);
  });

  it("is 0 for an empty or missing list", () => {
    expect(totalFeeCents([])).toBe(0);
    expect(totalFeeCents(undefined)).toBe(0);
    expect(totalFeeCents(null)).toBe(0);
  });
});

describe("buildFeeChargeSummary — what goes on the payment intent", () => {
  const lines = [
    { serial_number: "SN-1", amount: 250, reason: "lost" },
    { serial_number: "SN-2", amount: 50, reason: "damaged screen" },
  ];

  it("describes every device being charged", () => {
    expect(buildFeeChargeSummary(lines)).toBe(
      "SN-1 (lost) | SN-2 (damaged screen)"
    );
  });

  it("falls back to the device label when there is no reason", () => {
    expect(buildFeeChargeSummary([{ serial_number: "SN-1" }])).toBe("SN-1");
  });

  it("names an unidentified device rather than rendering an empty label", () => {
    expect(buildFeeChargeSummary([{ amount: 10, reason: "lost" }])).toBe(
      "Device (lost)"
    );
  });

  it("is an empty string with nothing to charge", () => {
    expect(buildFeeChargeSummary([])).toBe("");
    expect(buildFeeChargeSummary(undefined)).toBe("");
  });
});

describe("canSubmitFeeCharge — the guard before hitting Stripe", () => {
  const lines = [{ serial_number: "SN-1", amount: 250, reason: "lost" }];

  it("allows a real charge to a resolvable payer", () => {
    expect(canSubmitFeeCharge({ lines, member: adult })).toEqual({
      ok: true,
      reason: null,
    });
  });

  it("blocks when there is nothing to charge", () => {
    const result = canSubmitFeeCharge({ lines: [], member: adult });
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/amount/i);
  });

  it("blocks a zero total even with lines present", () => {
    const result = canSubmitFeeCharge({
      lines: [{ serial_number: "SN-1", amount: 0 }],
      member: adult,
    });
    expect(result.ok).toBe(false);
  });

  // This is the case that must never silently proceed: a minor with no
  // guardian on file has nobody to bill.
  it("blocks when the payer cannot be resolved, and says why", () => {
    const result = canSubmitFeeCharge({
      lines,
      member: { ...teen, parent_guardian_email: "" },
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/guardian/i);
  });

  it("blocks with no member at all", () => {
    expect(canSubmitFeeCharge({ lines, member: null }).ok).toBe(false);
    expect(canSubmitFeeCharge({ lines }).ok).toBe(false);
  });
});

// ─── Lo que pasa DESPUÉS de que la tarjeta pasa ───────────────────────────────
// El cobro dejaba de existir en el momento en que Stripe decía "succeeded": no
// se registraba la deuda como saldada (B1.3) ni se le avisaba a quien pagó
// (B3.2). Ambos endpoints ya existen en el backend.

describe("buildFeeSettlements — reportar el cobro contra el lease", () => {
  const args = {
    member: { member_id: 158 },
    companyId: 62,
    paymentIntent: "pi_3AbCdEfGhIjKlMnO",
    lines: [
      { serial_number: "SN-1", device_id: 900, amount: 250, reason: "Lost" },
    ],
  };

  it("arma un payload por dispositivo cobrado", () => {
    expect(buildFeeSettlements(args)).toEqual([
      {
        company_id: 62,
        member_id: 158,
        device_id: 900,
        paid_amount: 250,
        payment_intent: "pi_3AbCdEfGhIjKlMnO",
        payment_method: "credit_card",
        status: "paid",
      },
    ]);
  });

  // Un cobro puede cubrir varios equipos; el endpoint identifica UN lease, así
  // que hace falta una llamada por línea, cada una con su propio monto.
  it("divide un cobro de varios equipos por lease, no manda el total en cada uno", () => {
    const settlements = buildFeeSettlements({
      ...args,
      lines: [
        { serial_number: "SN-1", device_id: 900, amount: 250 },
        { serial_number: "SN-2", device_id: 901, amount: 40 },
      ],
    });
    expect(settlements).toHaveLength(2);
    expect(settlements.map((s) => s.device_id)).toEqual([900, 901]);
    expect(settlements.map((s) => s.paid_amount)).toEqual([250, 40]);
  });

  it("redondea a centavos: nunca manda 19.990000000000002", () => {
    const [settlement] = buildFeeSettlements({
      ...args,
      lines: [{ device_id: 900, amount: "19.99" }],
    });
    expect(settlement.paid_amount).toBe(19.99);
  });

  // Sin device_id no hay lease que saldar. Mandarlo igual haría que el backend
  // creara o tocara la fila equivocada.
  it("descarta líneas sin device_id en lugar de mandar un lease indefinido", () => {
    expect(
      buildFeeSettlements({
        ...args,
        lines: [{ serial_number: "SN-9", amount: 50 }],
      })
    ).toEqual([]);
  });

  it("no arma nada sin member, sin company o sin payment intent", () => {
    expect(buildFeeSettlements({ ...args, member: {} })).toEqual([]);
    expect(buildFeeSettlements({ ...args, companyId: null })).toEqual([]);
    expect(buildFeeSettlements({ ...args, paymentIntent: "" })).toEqual([]);
    expect(buildFeeSettlements()).toEqual([]);
  });
});

describe("buildFeeReceiptNotification — el correo de multa pagada", () => {
  const args = {
    member: { first_name: "Blaise", last_name: "Pascal" },
    payer: { email: "parent@home.com", isGuardian: true },
    lines: [
      { serial_number: "SN-1", amount: 250, reason: "Lost — not recovered" },
    ],
    paymentIntent: "pi_3AbCdEfGhIjKlMnO",
    company: "Bridges Academy",
    date: "2026-08-13T20:15:00.000Z",
  };

  it("manda al correo que realmente se cobró, no al del alumno", () => {
    const payload = buildFeeReceiptNotification(args);
    expect(payload.member.email).toBe("parent@home.com");
    expect(payload.billedGuardian).toBe(true);
  });

  it("nombra al alumno para que el guardián sepa de quién se trata", () => {
    const payload = buildFeeReceiptNotification(args);
    expect(payload.member.firstName).toBe("Blaise");
    expect(payload.member.lastName).toBe("Pascal");
  });

  it("manda montos en dólares y un total que cuadra con las líneas", () => {
    const payload = buildFeeReceiptNotification({
      ...args,
      lines: [
        { serial_number: "SN-1", amount: 19.99 },
        { serial_number: "SN-2", amount: 19.99 },
        { serial_number: "SN-3", amount: 19.99 },
      ],
    });
    expect(payload.lines.map((l) => l.amount)).toEqual([19.99, 19.99, 19.99]);
    expect(payload.total).toBe(59.97);
  });

  it("incluye el payment intent como referencia de disputa", () => {
    expect(buildFeeReceiptNotification(args).paymentIntent).toBe(
      "pi_3AbCdEfGhIjKlMnO"
    );
  });

  it("no arma payload sin destinatario — no hay a quién mandarlo", () => {
    expect(
      buildFeeReceiptNotification({ ...args, payer: { email: null } })
    ).toBeNull();
    expect(buildFeeReceiptNotification()).toBeNull();
  });
});
