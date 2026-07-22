/**
 * Pure helpers for the member device-return flow (school vertical, Phase 2 B1).
 *
 * Fees for lost/damaged devices are captured when closing a member lease. The
 * fee fields are only meaningful for the chargeable outcomes and only when a
 * positive amount was entered — otherwise nothing is sent, so a plain return
 * (or a zero/blank fee) never creates a spurious charge.
 *
 * Backend contract: FRONTEND_school_backend_asks.md §B1.1 — fee_amount /
 * fee_reason are added to the existing
 * POST /db_member/update-member-assigned-device-lease `update` object.
 */

/** Outcomes that can carry a fee (device not returned in good condition). */
export const isChargeableOutcome = (outcome) =>
  outcome === "damaged" || outcome === "lost";

/**
 * Builds the fee portion of the lease-close `update`. Returns an empty object
 * (no fee) unless the outcome is chargeable AND a positive, finite amount was
 * entered. The reason falls back to the condition note, then to the outcome.
 *
 * @param {{ outcome: string, feeAmount?: number|string, feeReason?: string }} args
 * @returns {{ fee_amount?: number, fee_reason?: string }}
 */
export const buildFeeFields = ({ outcome, feeAmount, feeReason } = {}) => {
  if (!isChargeableOutcome(outcome)) return {};
  const amount = Number(feeAmount);
  if (!Number.isFinite(amount) || amount <= 0) return {};
  const reason = String(feeReason ?? "").trim() || outcome;
  return { fee_amount: amount, fee_reason: reason };
};
