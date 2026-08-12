/**
 * Pure logic for the transaction receipt: the QR link, the lookup identifier,
 * and the view model the printable receipt and the receipt page both render.
 *
 * Data source is the existing transaction document
 * (POST /transaction/save-transaction, read back with
 * GET /transaction/transaction?paymentIntent=...), whose relevant shape is:
 *
 *   { paymentIntent, device: [{ deviceNeeded, deviceType, deviceValue }],
 *     consumerInfo: { name, lastName, email }, provider, eventSelected,
 *     date, active }
 *
 * `active` is the void flag — StripeTransactionTable renders `!record.active`
 * as "Refunded". `deviceValue` is in DOLLARS, unlike the Stripe amounts
 * elsewhere in the app which are in cents; mixing those two up is the easiest
 * way to show a figure off by 100 on a document someone signs.
 */

/** Route the QR points at. Registered in both route trees — see ReceiptPage. */
export const RECEIPT_ROUTE = "/receipt";

export const RECEIPT_STATUS = {
  PAID: "paid",
  VOID: "void",
  UNKNOWN: "unknown",
  // Assignment receipts: the device is still out, or it came back. There is no
  // "void" for an assignment — a return is the closing event.
  OPEN: "open",
  RETURNED: "returned",
  // A closed lease whose hardware never came back. Distinct from RETURNED so a
  // declaration cannot print a band that says the device was returned.
  DECLARED_LOST: "declared_lost",
};

export const RECEIPT_KIND = {
  PAYMENT: "payment",
  ASSIGNMENT: "assignment",
  RETURN: "return",
};

/** Outcome labels for a return/lost declaration receipt. */
const RETURN_OUTCOME_LABEL = {
  returned: "Returned",
  damaged: "Returned damaged",
  lost: "Declared lost — device not recovered",
};

/**
 * Absolute URL encoded into the QR.
 *
 * Returns "" when there is nothing to link to, so callers can skip rendering a
 * QR that would scan into a dead page.
 *
 * @param {string} origin window.location.origin
 * @param {string} paymentIntent
 * @returns {string}
 */
export const buildReceiptUrl = (origin, paymentIntent) => {
  const base = `${origin ?? ""}`.replace(/\/+$/, "");
  const id = `${paymentIntent ?? ""}`.trim();
  if (!base || !id) return "";
  return `${base}${RECEIPT_ROUTE}?tx=${encodeURIComponent(id)}`;
};

/**
 * Pulls the transaction identifier back out of the URL the QR opened.
 *
 * @param {string} search location.search, with or without the leading "?"
 * @returns {string|null}
 */
export const readPaymentIntentFromSearch = (search) => {
  const raw = `${search ?? ""}`.replace(/^\?/, "");
  if (!raw) return null;
  const value = new URLSearchParams(raw).get("tx");
  const trimmed = `${value ?? ""}`.trim();
  return trimmed || null;
};

/**
 * Paid, void, or unknown — deliberately three states.
 *
 * Only an explicit boolean counts. Transaction documents written before
 * `active` existed have no flag, and guessing either way on a money document is
 * wrong in a way a user cannot detect: VOID on a good receipt tells a family a
 * real payment was reversed, PAID on a refunded one hides the reversal. This
 * diverges on purpose from StripeTransactionTable's `!record.active`, which
 * reads a missing flag as "Refunded".
 *
 * @param {object} transaction
 * @returns {"paid"|"void"|"unknown"}
 */
export const resolveReceiptStatus = (transaction) => {
  const active = transaction?.active;
  if (active === true) return RECEIPT_STATUS.PAID;
  if (active === false) return RECEIPT_STATUS.VOID;
  return RECEIPT_STATUS.UNKNOWN;
};

/** True only for a transaction explicitly marked inactive (refunded/voided). */
export const isTransactionVoided = (transaction) =>
  resolveReceiptStatus(transaction) === RECEIPT_STATUS.VOID;

/**
 * Money as it appears on the receipt. Input is dollars (see module note).
 *
 * @param {number|string} value
 * @returns {string} e.g. "$1,250.50"
 */
export const formatReceiptAmount = (value) => {
  const amount = Number(value);
  const safe = Number.isFinite(amount) ? amount : 0;
  return `$${safe.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Date as it appears on the receipt.
 *
 * Guards the invalid case explicitly: `new Date(undefined).toLocaleString()`
 * renders the literal string "Invalid Date", which is worse on a printed
 * document than an honest dash.
 *
 * @param {string|Date} value
 * @returns {string} formatted date, or "—" when unusable
 */
export const formatReceiptDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Sum of the transaction's device lines, in dollars.
 *
 * @param {object} transaction
 * @returns {number}
 */
export const receiptTotal = (transaction) => {
  const lines = Array.isArray(transaction?.device) ? transaction.device : [];
  return lines.reduce((sum, line) => {
    const value = Number(line?.deviceValue);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);
};

/**
 * Normalizes a transaction document into what the receipt renders, so neither
 * the printable receipt nor the receipt page has to know the document's shape.
 *
 * Tolerates a missing or malformed transaction: the receipt page is reached by
 * URL and will be opened with junk eventually, and an empty shell is a better
 * answer than a crash.
 *
 * @param {object} transaction
 * @returns {{paymentIntent: string, date: string, payer: {name: string, email: string},
 *   lines: Array<{label: string, amount: number}>, total: number,
 *   status: string, company: string, reference: string}}
 */
export const mapTransactionToReceipt = (transaction) => {
  const consumer = transaction?.consumerInfo ?? {};
  const lines = (Array.isArray(transaction?.device) ? transaction.device : []).map(
    (line) => ({
      label: `${line?.deviceType ?? ""}`.trim() || "Item",
      amount: Number.isFinite(Number(line?.deviceValue))
        ? Number(line.deviceValue)
        : 0,
    })
  );

  return {
    kind: RECEIPT_KIND.PAYMENT,
    title: "Transaction receipt",
    idLabel: "Transaction ID",
    partyLabel: "Billed to",
    paymentIntent: `${transaction?.paymentIntent ?? ""}`,
    id: `${transaction?.paymentIntent ?? ""}`,
    date: `${transaction?.date ?? ""}`,
    payer: {
      name: [consumer?.name, consumer?.lastName].filter(Boolean).join(" ").trim(),
      email: `${consumer?.email ?? ""}`,
    },
    lines,
    total: receiptTotal(transaction),
    status: resolveReceiptStatus(transaction),
    company: `${transaction?.provider ?? ""}`,
    reference: `${transaction?.eventSelected ?? ""}`,
  };
};

/**
 * Receipt for a device assignment (school vertical): what a student was handed,
 * when, and by whom.
 *
 * Not a payment, so there is no money column and no void — `total: null` tells
 * the document to leave the amount column out entirely, and the status is
 * open/returned rather than paid/void.
 *
 * Built from what the assignment flow already holds at the moment of handover
 * rather than read back from the server, so a receipt can be printed
 * immediately without waiting on a round trip.
 *
 * @param {object} args
 * @param {object} args.member member record (first_name, last_name, email)
 * @param {Array<object>} args.devices assigned items (serial_number, item_group)
 * @param {string} args.company company name
 * @param {string|Date} args.date handover time
 * @param {string} [args.staffName] who handed it over
 * @param {string} [args.reference] e.g. expected return date
 * @param {boolean} [args.returned] true once the device is back
 */
export const mapAssignmentToReceipt = ({
  member,
  devices,
  company,
  date,
  staffName,
  reference,
  returned = false,
} = {}) => {
  const items = Array.isArray(devices) ? devices : [];
  return {
    kind: RECEIPT_KIND.ASSIGNMENT,
    title: "Assignment receipt",
    idLabel: "Issued by",
    partyLabel: "Issued to",
    id: `${staffName ?? ""}`.trim() || "—",
    date: `${date ?? ""}`,
    payer: {
      name: [member?.first_name, member?.last_name]
        .filter(Boolean)
        .join(" ")
        .trim(),
      email: `${member?.email ?? ""}`,
    },
    lines: items.map((item) => ({
      label:
        [item?.serial_number, item?.item_group].filter(Boolean).join(" — ") ||
        "Item",
      // null, not 0: an assignment has no price, and a "$0.00" column on a
      // handover slip reads like the device was free rather than borrowed.
      amount: null,
    })),
    total: null,
    status: returned ? RECEIPT_STATUS.RETURNED : RECEIPT_STATUS.OPEN,
    company: `${company ?? ""}`,
    reference: `${reference ?? ""}`,
  };
};

/** Dollars → cents, rounded. 0 for anything unusable, never NaN. */
const dollarsToCents = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount * 100);
};

/**
 * Receipt for a device fee that was just paid by card.
 *
 * The counterpart to mapReturnToReceipt, which deliberately prints no money: the
 * declaration proves the device is gone, this proves the debt was settled.
 * Without it a family paid and got nothing to show for it, since the charge
 * flow's only trace was the Stripe dashboard and the activity log.
 *
 * Built from what the charge modal holds rather than read back from
 * /transaction/transaction, because the member fee charge does not write a
 * transaction document — so there is nothing to look up, and hence no QR (see
 * ReceiptModal callers).
 *
 * Amounts come in as DOLLARS (what staff typed), matching the rest of this
 * module and unlike the cents the Stripe layer speaks.
 *
 * @param {object} args
 * @param {object} args.member the student the fee is about
 * @param {Array<{serial_number?: string, reason?: string, amount?: number|string}>} args.lines
 * @param {string} args.paymentIntent Stripe payment intent id
 * @param {string} args.payerEmail address that was actually billed
 * @param {boolean} [args.billedGuardian] true when the guardian paid for a minor
 * @param {string} args.company company name
 * @param {string|Date} args.date
 */
export const mapFeeChargeToReceipt = ({
  member,
  lines,
  paymentIntent,
  payerEmail,
  billedGuardian = false,
  company,
  date,
} = {}) => {
  const items = Array.isArray(lines) ? lines : [];
  // Summed in cents and divided once: adding dollars first turns 19.99 × 3 into
  // 59.97000000000001, and a total a cent off on a signed document is a support
  // call nobody can explain.
  const totalCents = items.reduce(
    (sum, item) => sum + dollarsToCents(item?.amount),
    0
  );
  return {
    kind: RECEIPT_KIND.PAYMENT,
    title: "Device fee receipt",
    idLabel: "Transaction ID",
    partyLabel: "Billed to",
    paymentIntent: `${paymentIntent ?? ""}`,
    id: `${paymentIntent ?? ""}`.trim() || "—",
    date: `${date ?? ""}`,
    // The student's name with the guardian's address on purpose: the family
    // needs to know which child this is about, and the school needs to know
    // which address paid.
    payer: {
      name: [member?.first_name, member?.last_name]
        .filter(Boolean)
        .join(" ")
        .trim(),
      email: `${payerEmail ?? ""}`,
    },
    lines: items.map((item) => ({
      label:
        [`${item?.serial_number ?? ""}`.trim(), `${item?.reason ?? ""}`.trim()]
          .filter(Boolean)
          .join(" — ") || "Device fee",
      amount: dollarsToCents(item?.amount) / 100,
    })),
    total: totalCents / 100,
    status: RECEIPT_STATUS.PAID,
    company: `${company ?? ""}`,
    reference: billedGuardian ? "Paid by the guardian on file" : "",
  };
};

/**
 * Constancia for closing a lease: what was returned, in what state, and what it
 * was declared as.
 *
 * Exists because declaring a device lost produced no paper at all — the lease
 * row closes and disappears from the member's open-loans table, so staff had
 * nothing to hand over or file as proof of the declaration.
 *
 * Carries no money even when a fee was recorded: the fee is collected on its own
 * receipt, and printing an amount here would look like it had been paid.
 *
 * @param {object} args
 * @param {object} args.member member record
 * @param {object} args.record the closed lease row (device_serial_number, ...)
 * @param {string} args.outcome "returned" | "damaged" | "lost"
 * @param {string} [args.note] condition note
 * @param {string} args.company company name
 * @param {string|Date} args.date
 * @param {string} [args.staffName] who recorded it
 */
export const mapReturnToReceipt = ({
  member,
  record,
  outcome,
  note,
  company,
  date,
  staffName,
} = {}) => {
  const serial = `${record?.device_serial_number ?? ""}`.trim();
  const type = `${record?.device_category_name ?? ""}`.trim();
  return {
    kind: RECEIPT_KIND.RETURN,
    title:
      outcome === "lost" ? "Lost device declaration" : "Device return receipt",
    idLabel: "Recorded by",
    partyLabel: "Held by",
    id: `${staffName ?? ""}`.trim() || "—",
    date: `${date ?? ""}`,
    payer: {
      name: [member?.first_name, member?.last_name]
        .filter(Boolean)
        .join(" ")
        .trim(),
      email: `${member?.email ?? ""}`,
    },
    lines: [
      {
        label: [serial, type].filter(Boolean).join(" — ") || "Item",
        amount: null,
      },
      {
        label: `Outcome: ${RETURN_OUTCOME_LABEL[outcome] ?? outcome ?? "—"}`,
        amount: null,
      },
      ...(`${note ?? ""}`.trim()
        ? [{ label: `Condition: ${String(note).trim()}`, amount: null }]
        : []),
    ],
    total: null,
    status:
      outcome === "lost"
        ? RECEIPT_STATUS.DECLARED_LOST
        : RECEIPT_STATUS.RETURNED,
    company: `${company ?? ""}`,
    reference: "",
  };
};
