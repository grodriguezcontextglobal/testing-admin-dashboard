/**
 * Pure logic for charging a device fee to a member (school vertical).
 *
 * Scope note, because it is easy to conflate the two halves of B1: this module
 * is about COLLECTING the money through Stripe. Recording the amount owed on
 * the lease row is the other half (`buildFeeFields` in leaseReturnUtils.js,
 * gated by FEATURE_MEMBER_FEES) and still waits on the backend to persist
 * fee_amount / fee_reason — see FRONTEND_school_backend_asks.md §B1.1. A charge
 * can succeed today; the ledger entry lights up when that ships.
 *
 * The Stripe mechanics mirror the event Services flow
 * (ServicesTransaction.jsx → /stripe/create-payment-intent-subscription), which
 * is the live direct-charge path the two existing lost-fee screens also use.
 */

import { getConfirmationRecipient } from "./eventRegistrationUtils";

/**
 * Who to bill for a member's device fee.
 *
 * A minor is never the payer — the guardian on file is. That is the same rule
 * the attendance/consent emails already resolve, so it delegates to the same
 * helper rather than growing a second copy that could drift apart. Kept as a
 * named export anyway: if billing ever diverges from notification (a separate
 * billing contact, say), this is the one place to change.
 *
 * Returns `{ email: null, error }` instead of throwing, and deliberately does
 * NOT fall back to the student's own address when a guardian is missing —
 * billing a minor directly is worse than refusing the charge.
 *
 * @param {object} member member record from /db_member/consulting-member
 * @returns {{ email: string|null, isGuardian: boolean, error: string|null }}
 */
export const resolveFeePayer = (member) => getConfirmationRecipient(member ?? {});

/**
 * Dollars → integer cents for the Stripe amount.
 *
 * Rounds rather than multiplying straight through: `19.99 * 100` is
 * 1998.9999999999998, which Stripe rejects outright as a non-integer and which
 * truncation would quietly turn into a cent short.
 *
 * Returns 0 — not NaN — for anything unchargeable, so callers can treat 0 as
 * "nothing to charge" without a second validity check.
 *
 * @param {number|string} dollars
 * @returns {number} integer cents, 0 when not a positive finite amount
 */
export const toStripeAmount = (dollars) => {
  const amount = Number(dollars);
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return Math.round(amount * 100);
};

/**
 * Integer cents → the amount shown on the submit button.
 *
 * Replaces the `String(total).slice(0, -2)` used by the copied checkout, which
 * renders 99 cents as an empty string and 5 cents as "-".
 *
 * @param {number} cents
 * @returns {string} e.g. "$250.00"
 */
export const formatStripeAmount = (cents) => {
  const value = Number(cents);
  if (!Number.isFinite(value)) return "$0.00";
  return `$${(value / 100).toFixed(2)}`;
};

/**
 * Total to charge, summed in cents.
 *
 * Each line is converted before adding, so the rounding happens per line and
 * the total can never carry float dust from summing dollars first.
 *
 * @param {Array<{amount: number|string}>} lines
 * @returns {number} integer cents
 */
export const totalFeeCents = (lines) =>
  (Array.isArray(lines) ? lines : []).reduce(
    (sum, line) => sum + toStripeAmount(line?.amount),
    0
  );

/**
 * Human-readable description of what is being charged, for the payment record
 * and the Redux transaction entry.
 *
 * @param {Array<{serial_number?: string, reason?: string}>} lines
 * @returns {string} e.g. "SN-1 (lost) | SN-2 (damaged screen)"
 */
export const buildFeeChargeSummary = (lines) =>
  (Array.isArray(lines) ? lines : [])
    .map((line) => {
      const label = `${line?.serial_number ?? ""}`.trim() || "Device";
      const reason = `${line?.reason ?? ""}`.trim();
      return reason ? `${label} (${reason})` : label;
    })
    .join(" | ");

/**
 * Guard run before creating a payment intent.
 *
 * Returns a reason rather than a bare false so the modal can say what is wrong
 * instead of leaving a dead button — the failure mode of the flow this was
 * copied from, where the submit handler swallowed its error and nothing
 * happened on click.
 *
 * @param {{lines: Array<object>, member: object}} args
 * @returns {{ok: boolean, reason: string|null}}
 */
/** Cents back to dollars, which is what both server contracts speak. */
const centsToDollars = (cents) => Number(cents) / 100;

/**
 * Payloads for POST /db_member/settle-member-fee — one per device charged.
 *
 * Until this existed the charge vanished the moment Stripe said "succeeded":
 * the money moved and the lease row still read as owing it, which is the worst
 * of the three possible states (worse than no record at all, because the school
 * chases a family that already paid).
 *
 * One call per line, not one per charge: the endpoint identifies a single lease
 * by member + device, and a charge can cover several devices at once. Lines with
 * no device_id are dropped rather than sent — a settlement with an undefined
 * lease would land on the wrong row or create a phantom one.
 *
 * NOTE for the server contract: idempotency must key on
 * (payment_intent, device_id), not payment_intent alone. A two-device charge
 * sends the same intent twice by design, and deduping on the intent would settle
 * the first device and silently swallow the second.
 *
 * @param {{member: object, companyId: number|string, lines: Array<object>, paymentIntent: string}} args
 * @returns {Array<object>} empty when anything required is missing
 */
export const buildFeeSettlements = ({
  member,
  companyId,
  lines,
  paymentIntent,
} = {}) => {
  const memberId = member?.member_id ?? member?.id;
  const intent = `${paymentIntent ?? ""}`.trim();
  if (!memberId || !companyId || !intent) return [];
  return (Array.isArray(lines) ? lines : [])
    .filter((line) => line?.device_id !== undefined && line?.device_id !== null)
    .map((line) => ({
      company_id: companyId,
      member_id: memberId,
      device_id: line.device_id,
      // Rounded through cents so a typed "19.99" cannot arrive as
      // 19.990000000000002 on a row someone reconciles against a bank statement.
      paid_amount: centsToDollars(toStripeAmount(line.amount)),
      payment_intent: intent,
      payment_method: "credit_card",
      status: "paid",
    }));
};

/**
 * Payload for POST /nodemailer/member-device-fee-receipt-notification.
 *
 * A receipt, not an invoice — the money is already captured. Goes to the address
 * that was actually charged, which for a minor is the guardian, while the body
 * names the STUDENT so the family knows which child it is about.
 *
 * Returns null when there is no recipient: the charge still succeeded and the
 * printable receipt still prints, so the caller reports the gap rather than
 * failing the flow.
 *
 * @param {{member: object, payer: object, lines: Array<object>, paymentIntent: string,
 *   company: string, date: string}} args
 * @returns {object|null}
 */
export const buildFeeReceiptNotification = ({
  member,
  payer,
  lines,
  paymentIntent,
  company,
  date,
} = {}) => {
  if (!payer?.email) return null;
  const items = Array.isArray(lines) ? lines : [];
  return {
    member: {
      firstName: member?.first_name,
      lastName: member?.last_name,
      email: payer.email,
    },
    billedGuardian: Boolean(payer.isGuardian),
    lines: items.map((line) => ({
      serialNumber: `${line?.serial_number ?? ""}`.trim(),
      reason: `${line?.reason ?? ""}`.trim(),
      amount: centsToDollars(toStripeAmount(line?.amount)),
    })),
    // Summed in cents for the same reason the receipt document is: three lines
    // of 19.99 added as dollars is 59.97000000000001.
    total: centsToDollars(totalFeeCents(items)),
    paymentIntent: `${paymentIntent ?? ""}`,
    company: `${company ?? ""}`,
    date: `${date ?? ""}`,
  };
};

export const canSubmitFeeCharge = ({ lines, member } = {}) => {
  if (totalFeeCents(lines) <= 0) {
    return { ok: false, reason: "Enter a fee amount greater than $0." };
  }
  const payer = resolveFeePayer(member);
  if (!payer.email) {
    return { ok: false, reason: payer.error };
  }
  return { ok: true, reason: null };
};
