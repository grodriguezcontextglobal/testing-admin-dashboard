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

/** The payload `/cash-report/create-cash-report` expects, either method. */
export function buildLostFeeReport({
  amount,
  method,
  device,
  paymentIntent,
  consumer,
  admin,
  event,
  companyId,
}) {
  return {
    attendee: consumer?.email ?? null,
    admin: admin?.email ?? null,
    deviceLost: [
      {
        label: device?.serialNumber ?? null,
        deviceType: device?.deviceType ?? null,
      },
    ],
    amount,
    event: event?.id ?? null,
    company: companyId ?? null,
    typeCollection: method,
    paymentIntent_charge_transaction: paymentIntent ?? null,
  };
}
