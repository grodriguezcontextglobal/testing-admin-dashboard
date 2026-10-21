/**
 * Charging a consumer for a device that did not come back.
 *
 * `resolveLostDeviceFee` replaces a helper that was copy-pasted into both
 * lostFee/actions/Cash.jsx and lostFee/actions/CreditCard.jsx, returned
 * `undefined` when the device type was not in the event's price list, and was
 * read as `returnDeviceValue().value` at the top of the component — so an
 * unpriced device type crashed the screen before it rendered anything.
 */

/**
 * The replacement value the event charges for a device type.
 *
 * Only groups flagged `consumerUses` are eligible: staff-only kit is priced in
 * the same list, and billing a consumer from it would charge them for hardware
 * they were never handed.
 */
export function resolveLostDeviceFee(event, deviceType) {
  const setup = Array.isArray(event?.deviceSetup) ? event.deviceSetup : [];
  const wanted = String(deviceType ?? "").trim().toLowerCase();
  if (!wanted) return { amount: 0, found: false };

  const match = setup.find(
    (entry) =>
      entry?.consumerUses &&
      String(entry?.group ?? "").trim().toLowerCase() === wanted
  );

  if (!match) return { amount: 0, found: false };
  return { amount: Number(match.value) || 0, found: true };
}

/**
 * The store holds the receiver being written off as either a bare object or an
 * array of them, depending on which screen dispatched it. Both call sites
 * unwrapped it differently and one of them read `[0]` off a plain object.
 */
export function normalizeAssignedReceiver(value) {
  if (Array.isArray(value)) return value.at(-1) ?? null;
  return value ?? null;
}

export function formatCurrency(value) {
  return `$${(Number(value) || 0).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;
}

/** How a lost-device fee was settled, as `typeCollection` stores it. */
export const LOST_FEE_METHOD = Object.freeze({
  CASH: "Cash",
  CARD: "Credit Card",
  WAIVED: "Waived",
});

/** The staff member's name for a record, or their email when there is none. */
export function staffName(admin) {
  const name = [admin?.name, admin?.lastName].filter(Boolean).join(" ").trim();
  return name || String(admin?.email ?? "");
}

/**
 * The write that turns a consumer's assigned record into a write-off.
 *
 * Two screens dispatch the receiver: the event inventory hands over the raw
 * record (`{ id, device: {...} }`), the consumer page a flattened table row
 * from `toDeviceRows` with no `.device` at all. Spreading `receiver.device`
 * from that row sent `device: { status: "Lost" }`, which wiped the serial and
 * type — the unit disappeared from the transaction and its slot reopened.
 *
 * Without an id, a serial and a type there is nothing safe to write: null.
 */
export function buildLostReceiverUpdate(receiver) {
  if (!receiver?.id) return null;
  const source = receiver.device ?? {
    serialNumber: receiver.serialNumber,
    deviceType: receiver.deviceType,
    ...(receiver.deviceValue !== undefined ? { deviceValue: receiver.deviceValue } : {}),
  };
  if (!source.serialNumber || !source.deviceType) return null;
  return {
    id: receiver.id,
    device: { ...source, status: "Lost" },
    active: false,
  };
}

const WAIVER_REASON_MAX = 500;

/** For react-hook-form `validate` on the waiver's reason. */
export function validateWaiverReason(value) {
  const reason = String(value ?? "").trim();
  if (!reason) return "Write why the fee is being waived.";
  if (reason.length > WAIVER_REASON_MAX) {
    return `Keep the reason under ${WAIVER_REASON_MAX} characters.`;
  }
  return true;
}

/**
 * The note on the pool's returned-issue record. A waiver names who waived it
 * and why there too, so the fact survives even if the cash report's schema
 * drops the extra fields.
 */
export function describeLostComment({ method, admin, waiverReason } = {}) {
  if (method !== LOST_FEE_METHOD.WAIVED) return "Device lost";
  const email = admin?.email ? ` (${admin.email})` : "";
  return `Device lost — fee waived by ${staffName(admin)}${email}: ${String(
    waiverReason ?? ""
  ).trim()}`;
}

/**
 * The payload `/cash-report/create-cash-report` expects, any method.
 *
 * A waiver is reported as a charge of 0 with who waived it and why.
 * `paymentIntent_charge_transaction` stays the consumer's transaction; a card
 * fee also carries its own Stripe intent as `feePaymentIntent`.
 */
export function buildLostFeeReport({
  amount,
  method,
  device,
  paymentIntent,
  consumer,
  admin,
  event,
  companyId,
  feePaymentIntent,
  waiverReason,
}) {
  const waived = method === LOST_FEE_METHOD.WAIVED;
  return {
    attendee: consumer?.email ?? null,
    admin: admin?.email ?? null,
    deviceLost: [
      {
        label: device?.serialNumber ?? null,
        deviceType: device?.deviceType ?? null,
      },
    ],
    amount: waived ? "0" : amount,
    event: event?.id ?? null,
    company: companyId ?? null,
    typeCollection: method,
    paymentIntent_charge_transaction: paymentIntent ?? null,
    ...(feePaymentIntent ? { feePaymentIntent } : {}),
    ...(waived
      ? {
          waivedBy: { name: staffName(admin), email: admin?.email ?? null },
          waiverReason: String(waiverReason ?? "").trim(),
        }
      : {}),
  };
}

/** What to tell the operator when a lost-fee settlement throws (useLostFeeSettlement). */
export function describeSettleFailure(error, { charged = false } = {}) {
  if (error?.step === "report") {
    return charged
      ? "The card was charged and the device written off, but the fee was not recorded. Record it manually — do not charge again."
      : "The device was written off, but the fee was not recorded. Record it manually.";
  }
  return charged
    ? "The card was charged but the device was not written off. Report this before retrying."
    : "Nothing was recorded. The device is still marked as in use.";
}
