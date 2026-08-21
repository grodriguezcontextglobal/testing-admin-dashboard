/**
 * Assembling a new transaction, and refusing to write a broken one.
 *
 * The four transaction flows (free / cash single / cash multiple / authorized
 * deposit) each built these payloads inline, so the id formats and the device
 * block were copy-pasted four times and drifted. They live here once, with the
 * id shapes pinned by tests against `transactionTable.formatTransactionId`,
 * which is what renders them back out in the transactions table.
 *
 * `validateDraft` is the important one. It exists because the old multi-device
 * flow had no `else`: when the starting serial was not found it skipped the
 * device assignment and still posted `/stripe/save-transaction`, producing a
 * transaction that claimed N devices and held none, with no error anywhere.
 * Nothing is written now until the whole draft is coherent.
 */

/** Only groups flagged `consumerUses` may be handed to a consumer. */
export function consumerDeviceOptions(event) {
  const setup = Array.isArray(event?.deviceSetup) ? event.deviceSetup : [];
  return setup.filter(
    (entry) => entry?.consumerUses && String(entry?.group ?? "").trim() !== ""
  );
}

export function buildDeviceSelection(deviceSetupEntry, quantity) {
  return {
    deviceType: deviceSetupEntry?.group,
    deviceValue: Number(deviceSetupEntry?.value) || 0,
    deviceNeeded: Number(quantity) || 1,
  };
}

/**
 * A no-charge transaction id. Deliberately short: the transactions table reads
 * ids of 16 characters or fewer as "no charge", and a longer one would be shown
 * as a card charge and offered a refund button that has nothing to refund.
 */
export function buildFreePaymentIntentId(reference) {
  return `pi_${reference}`;
}

/**
 * A cash transaction id. The amount and the admin who took the money are
 * encoded in the id itself — that is the only record of who collected it, so
 * the shape is load-bearing and pinned by a test.
 */
export function buildCashPaymentIntentId({ amount, adminEmail, reference }) {
  return `pi_cash_amount:$${amount}_received_by:**${adminEmail}**&${reference}`;
}

export function buildTransactionProfile({
  paymentIntent,
  clientSecret,
  deviceSelection,
  consumer,
  event,
  companyId,
  date,
}) {
  return {
    paymentIntent,
    clientSecret: clientSecret ?? "unknown",
    device: deviceSelection,
    consumerInfo: consumer,
    provider: event?.company,
    eventSelected: event?.eventInfoDetail?.eventName,
    event_id: event?.id,
    date,
    company: companyId,
  };
}

/**
 * Everything wrong with the draft, all at once — a form that reveals one
 * problem per submit is a form you submit four times.
 */
export function validateDraft({
  group,
  quantity,
  serials,
  availableCount,
  requiresAmount,
  amount,
}) {
  const problems = [];
  const picked = Array.isArray(serials) ? serials : [];

  if (!group) {
    problems.push("Choose a device type.");
  }

  const requested = Number(quantity);
  if (!Number.isFinite(requested) || !Number.isInteger(requested)) {
    problems.push("Enter a whole number as the quantity.");
  } else if (requested <= 0) {
    problems.push("The quantity has to be at least one device.");
  } else if (Number.isFinite(Number(availableCount)) && requested > Number(availableCount)) {
    problems.push(
      `This event has only ${Number(availableCount)} of that device free right now.`
    );
  }

  if (picked.length === 0) {
    problems.push("Scan at least one serial number.");
  } else if (Number.isFinite(requested) && requested > 0 && picked.length !== requested) {
    problems.push(
      `Only ${picked.length} of ${requested} serial numbers are scanned.`
    );
  }

  const unique = new Set(picked.map((serial) => String(serial).trim().toLowerCase()));
  if (unique.size !== picked.length) {
    problems.push("The same serial number is scanned more than once.");
  }

  if (requiresAmount) {
    const value = Number(amount);
    if (String(amount ?? "").trim() === "" || !Number.isFinite(value) || value <= 0) {
      problems.push("Enter the amount being collected.");
    }
  }

  return { ok: problems.length === 0, problems };
}
