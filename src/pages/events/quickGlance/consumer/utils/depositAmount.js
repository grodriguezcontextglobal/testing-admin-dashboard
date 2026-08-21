/**
 * Deposit amounts and deposit state.
 *
 * Stripe reports amounts in cents. Both deposit screens converted them with
 * `String(maxAmount).slice(0, -2)`, which is string surgery standing in for a
 * division:
 *
 *   5000      → "50"       correct by luck
 *   50        → "0"        $0.50 shown as $0
 *   5         → ""         empty amount field
 *   undefined → "undefin"  rendered into the amount input as if it were money
 *
 * The status handling was equally loose: both screens compared the raw Stripe
 * status inline, called `alert()` from inside an effect, and left the submit
 * button enabled for statuses they had not thought about.
 */

export function centsToAmount(cents) {
  const value = Number(cents);
  if (!Number.isFinite(value)) return 0;
  // Cents are exact integers; round the division to avoid 0.30000000000000004.
  return Math.round(value) / 100;
}

export function formatCents(cents) {
  if (cents === null || cents === undefined || !Number.isFinite(Number(cents))) {
    return "—";
  }
  const amount = centsToAmount(cents);
  const hasCents = Math.round(amount * 100) % 100 !== 0;
  return `$${amount.toLocaleString(undefined, {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * What can be done to a deposit in this Stripe state, and what to tell the
 * operator when the answer is nothing.
 *
 * Only `requires_capture` — an authorized, uncaptured hold — permits either
 * action. Everything else is refused with a reason, including statuses this
 * function has never seen, which is the opposite of the old default.
 */
export function describeDepositState(status) {
  switch (status) {
    case "requires_capture":
      return {
        canCapture: true,
        canRelease: true,
        tone: "warning",
        label: "Deposit held",
        reason: "The hold is authorized and can be captured or released.",
      };
    case "succeeded":
      return {
        canCapture: false,
        canRelease: false,
        tone: "success",
        label: "Captured",
        reason: "This deposit was already captured. Nothing left to do.",
      };
    case "canceled":
      return {
        canCapture: false,
        canRelease: false,
        tone: "neutral",
        label: "Released",
        reason: "This deposit was already released. Nothing left to do.",
      };
    case "requires_payment_method":
    case "requires_confirmation":
    case "requires_action":
    case "processing":
      return {
        canCapture: false,
        canRelease: false,
        tone: "neutral",
        label: "Not authorized yet",
        reason:
          "The consumer's card has not finished authorizing. Wait for the hold before capturing or releasing.",
      };
    default:
      return {
        canCapture: false,
        canRelease: false,
        tone: "neutral",
        label: "Unavailable",
        reason: status
          ? `Stripe reports this deposit as "${status}", which this screen cannot act on.`
          : "The deposit's status could not be read, so no action is offered.",
      };
  }
}

/** Validate a capture amount against the authorized hold. */
export function clampCaptureAmount(requested, maxCents) {
  const max = Number(maxCents);
  if (!Number.isFinite(max) || max <= 0) {
    return {
      ok: false,
      message: "The authorized amount could not be read, so nothing can be captured.",
    };
  }

  const amount = Number(requested);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, message: "Enter an amount greater than zero." };
  }

  const maxAmount = centsToAmount(max);
  if (amount > maxAmount) {
    return {
      ok: false,
      message: `The most that can be captured is ${formatCents(max)}.`,
    };
  }

  return { ok: true, amount };
}
