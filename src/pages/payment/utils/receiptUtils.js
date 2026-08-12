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
    paymentIntent: `${transaction?.paymentIntent ?? ""}`,
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
