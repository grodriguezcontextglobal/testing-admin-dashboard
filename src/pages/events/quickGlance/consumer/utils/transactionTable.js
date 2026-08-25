/**
 * Reading a consumer's transactions: what each one is, what state it is in, and
 * what a search box should match.
 *
 * Payment intent shapes in play, all stored in the same column:
 *   card   `pi_` + 24 Stripe chars               → refundable / capturable
 *   cash   `pi_cash_amount:$50_received_by:**x**&id`
 *   free   `pi_` + 12 nanoid chars               → nothing to charge
 *
 * The legacy code told them apart with `paymentIntent.length > 16`. A cash id is
 * long, so cash transactions were offered "Capture fund" and "Release deposit"
 * against a Stripe intent that does not exist. The prefix is the real signal.
 */

const CASH_PREFIX = "pi_cash";
const STRIPE_ID_LENGTH = 16;

const asId = (record) => String(record?.paymentIntent ?? "");

/**
 * The id as a reader should see it. A cash id is machine-readable noise; what
 * matters in it is the amount and who took the money.
 */
export function formatTransactionId(paymentIntent) {
  const raw = String(paymentIntent ?? "");
  if (!raw) return "—";
  if (!raw.startsWith(CASH_PREFIX)) return raw;

  // Legacy renderer indexed straight into segments[4] and threw a TypeError on
  // any cash id that did not have five of them, taking the table down with it.
  const segments = raw.split("_");
  const marked = segments[4]?.split("**")?.[1];
  if (segments.length < 5 || !marked) return raw;

  return `${segments[1]}_${segments[2]}_${marked}`;
}

/**
 * Everything about a transaction a reader could plausibly type, including the
 * formatted id — "admin@devitrak.net" is only visible in the rendered label, so
 * searching what is on screen has to work.
 */
const haystack = (record) =>
  [
    asId(record),
    formatTransactionId(record?.paymentIntent),
    record?.date,
    ...(Array.isArray(record?.device)
      ? record.device.flatMap((entry) => [entry?.deviceType, entry?.deviceNeeded])
      : []),
  ]
    .filter((value) => value !== null && value !== undefined && value !== "")
    .join(" ")
    .toLowerCase();

/**
 * The legacy filter returned `[]` the moment the box had any content — typing a
 * single character emptied the table and there was no way to tell that from
 * "no results". Searching now actually searches.
 */
export function filterTransactions(transactions, searchValue) {
  const list = Array.isArray(transactions) ? transactions : [];
  const term = String(searchValue ?? "").trim().toLowerCase();
  if (!term) return list;
  return list.filter((record) => haystack(record).includes(term));
}

/** antd needs a stable row key; the payment intent is the natural one. */
export function toTransactionRows(transactions) {
  const list = Array.isArray(transactions) ? transactions : [];
  const byKey = new Map();
  list.forEach((record, index) => {
    const key = asId(record) || `transaction-${index}`;
    byKey.set(key, { ...record, key });
  });
  return Array.from(byKey.values());
}

export function describeTransactionState(record) {
  if (record?.active === false) {
    return { key: "closed", tone: "neutral", label: "Closed" };
  }
  return { key: "active", tone: "success", label: "Active" };
}

/**
 * Which money actions a transaction can actually support. Returning the
 * capabilities rather than the raw shape keeps the decision in one tested place
 * instead of repeated inline conditions in the table's action column.
 */
export function describeTransactionKind(record) {
  const id = asId(record);
  const requested = Number(record?.device?.[0]?.deviceNeeded) || 0;

  const none = {
    canRefund: false,
    canCaptureDeposit: false,
    canReleaseDeposit: false,
  };

  if (id.startsWith(CASH_PREFIX)) {
    return { key: "cash", label: "Cash", ...none };
  }
  if (id.length <= STRIPE_ID_LENGTH) {
    return { key: "free", label: "No charge", ...none };
  }
  if (requested > 0) {
    return {
      key: "deposit",
      label: "Card deposit",
      canRefund: false,
      canCaptureDeposit: true,
      canReleaseDeposit: true,
    };
  }
  return {
    key: "charge",
    label: "Card charge",
    canRefund: true,
    canCaptureDeposit: false,
    canReleaseDeposit: false,
  };
}
