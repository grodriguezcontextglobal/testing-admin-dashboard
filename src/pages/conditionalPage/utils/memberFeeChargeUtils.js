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
