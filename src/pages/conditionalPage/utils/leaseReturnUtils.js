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
 * Payload that puts devices back in stock after an assignment failed partway.
 *
 * Both assignment surfaces take the device out of the warehouse and THEN create
 * the lease. When the lease is rejected — a minor without recorded consent
 * returns `CONSENT_REQUIRED` — the device was left at logistic_status "assigned"
 * with warehouse 0 and no lease row anywhere: in use, unavailable, and no record
 * of who has it. This is the undo.
 *
 * Same endpoint as the hand-out (`/db_item/item-out-warehouse`), which despite
 * its name just sets warehouse + logistic_status for a list of serials.
 * `in-stock` is the canonical available status in logisticStatusConfig — not
 * "available", which is not a status the config knows.
 *
 * Returns null when there is nothing safely identifiable to restore, so the
 * caller skips the request rather than posting a payload that could touch rows
 * belonging to another company.
 *
 * @param {{serials: Array<string>, itemGroup?: string, categoryName?: string, companyId: number|string}} args
 * @returns {object|null}
 */
export const buildAssignmentRollbackPayload = ({
  serials,
  itemGroup,
  categoryName,
  companyId,
} = {}) => {
  const data = (Array.isArray(serials) ? serials : [])
    .map((serial) => `${serial ?? ""}`.trim())
    .filter(Boolean);
  if (data.length === 0 || !companyId) return null;
  return {
    warehouse: 1,
    logistic_status: "in-stock",
    company_id: companyId,
    item_group: itemGroup,
    category_name: categoryName,
    data,
  };
};

/** Confirmation that a device came back. Live template. */
export const RETURN_NOTIFICATION_ENDPOINT =
  "/nodemailer/member-lease-return-device-notification";

/**
 * A device that did NOT come back in one piece — lost or damaged. Separate
 * endpoint because the template has to say something else entirely; see
 * FRONTEND_school_backend_asks.md §B3.
 */
export const INCIDENT_NOTIFICATION_ENDPOINT =
  "/nodemailer/member-device-incident-notification";

/** Same wording the printed declaration uses, so paper and email agree. */
const OUTCOME_LABEL = {
  returned: "Returned",
  damaged: "Returned damaged",
  lost: "Declared lost — device not recovered",
};

/**
 * Notification for a closed lease: which endpoint to call, and with what.
 *
 * Routed by outcome. Every outcome used to post the same payload to the
 * return-confirmation endpoint, so declaring a laptop lost mailed the guardian
 * that it had been returned successfully — a message that is not merely wrong
 * but stands as evidence of a return that never happened. A lost or damaged
 * device is an incident and gets its own template with the outcome, the
 * condition note and the fee, if one was recorded.
 *
 * The `returned` payload is left byte-identical to what shipped, so the live
 * template keeps rendering exactly as it does today.
 *
 * Recipient resolution is unchanged and shared:
 * The return notice used to go to `member.email` unconditionally, which mailed a
 * 15-year-old about their own lost laptop instead of their guardian. Being a
 * minor — not being under 13 — is the gate here, and it is the same
 * getConfirmationRecipient the assignment and consent flows use, so the three
 * cannot disagree about who the responsible party is.
 *
 * The member's own NAME stays in the body: the guardian needs to know which
 * student this is about.
 *
 * Returns `{ payload: null, endpoint: null, recipient }` when nobody can be
 * resolved. Falling back to the student's address is the bug being fixed, so it
 * is not an option.
 *
 * @param {{member: object, record: object, outcome?: string, note?: string,
 *   fee?: {fee_amount?: number}}} args
 * @returns {{endpoint: string|null, payload: object|null,
 *   recipient: {email: string|null, isGuardian: boolean, error: string|null}}}
 */
export const buildReturnNotification = ({
  member,
  record,
  outcome = "returned",
  note,
  fee,
} = {}) => {
  const recipient = getConfirmationRecipient(member ?? {});
  if (!recipient.email) return { endpoint: null, payload: null, recipient };
  const payload = {
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
  };
  if (!isChargeableOutcome(outcome)) {
    return { endpoint: RETURN_NOTIFICATION_ENDPOINT, payload, recipient };
  }
  const amount = Number(fee?.fee_amount);
  return {
    endpoint: INCIDENT_NOTIFICATION_ENDPOINT,
    payload: {
      ...payload,
      outcome,
      outcomeLabel: OUTCOME_LABEL[outcome] ?? outcome,
      conditionNote: `${note ?? ""}`.trim() || null,
      // null, not 0: "no fee was charged" and "a $0 fee was charged" read the
      // same on paper but not to a family asking what they owe.
      feeAmount: Number.isFinite(amount) && amount > 0 ? amount : null,
    },
    recipient,
  };
};
