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

import { getConfirmationRecipient } from "./eventRegistrationUtils";

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

/**
 * Whether closing this lease should offer to collect the fee straight away.
 *
 * Takes the object buildFeeFields produced, so the two can never disagree about
 * what counts as a fee: an empty object (plain return, fees flag off, or a blank
 * amount) must not pop a payment form at a staff member who was only recording
 * a return.
 *
 * @param {{fee_amount?: number}} fee
 * @returns {boolean}
 */
export const shouldOfferFeeCollection = (fee) => {
  const amount = Number(fee?.fee_amount);
  return Number.isFinite(amount) && amount > 0;
};

/**
 * Payload for POST /db_item/item-out-warehouse marking an item lost.
 *
 * Declaring a device lost used to touch nothing in inventory: the restock call
 * is skipped for `lost` (correctly — it never comes back), but no other write
 * took its place, so the item stayed `assigned` forever even though the lease
 * was closed. This is the missing write.
 *
 * warehouse stays 0 on purpose. The same endpoint the assignment flow uses to
 * hand a device out (with logistic_status "assigned") sets both fields, and a
 * lost device must be taken off the roster WITHOUT being restocked.
 *
 * Returns null when there is nothing identifiable to update, so the caller can
 * skip the request rather than send a payload with an empty serial list.
 *
 * @param {{record: object, companyId: number|string}} args
 * @returns {object|null}
 */
export const buildLostItemPayload = ({ record, companyId } = {}) => {
  const serial = `${record?.device_serial_number ?? ""}`.trim();
  if (!serial || !companyId) return null;
  return {
    warehouse: 0,
    logistic_status: "lost",
    company_id: companyId,
    item_group: record?.device_item_group,
    category_name: record?.device_category_name,
    data: [serial],
  };
};

/**
 * Payload for POST /nodemailer/member-lease-return-device-notification, sent to
 * whoever is responsible for the member.
 *
 * The return notice used to go to `member.email` unconditionally, which mailed a
 * 15-year-old about their own lost laptop instead of their guardian. Being a
 * minor — not being under 13 — is the gate here, and it is the same
 * getConfirmationRecipient the assignment and consent flows use, so the three
 * cannot disagree about who the responsible party is.
 *
 * The member's own NAME stays in the body: the guardian needs to know which
 * student this is about.
 *
 * Returns `{ payload: null, recipient }` when nobody can be resolved. Falling
 * back to the student's address is the bug being fixed, so it is not an option.
 *
 * @param {{member: object, record: object}} args
 * @returns {{payload: object|null, recipient: {email: string|null, isGuardian: boolean, error: string|null}}}
 */
export const buildReturnNotification = ({ member, record } = {}) => {
  const recipient = getConfirmationRecipient(member ?? {});
  if (!recipient.email) return { payload: null, recipient };
  return {
    payload: {
      member: {
        firstName: member?.first_name,
        lastName: member?.last_name,
        email: recipient.email,
      },
      devices: [
        {
          device: {
            serialNumber: record?.device_serial_number,
            deviceType: record?.device_category_name,
          },
        },
      ],
    },
    recipient,
  };
};
