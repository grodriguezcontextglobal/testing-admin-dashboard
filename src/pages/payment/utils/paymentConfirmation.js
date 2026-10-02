/**
 * Shared rules for the pages Stripe redirects back to from an event's consumer
 * page: `payment-confirmed` (card deposit) and `payment-service-confirmation`
 * (service charge). Both finish the transaction in the browser, from a draft
 * kept in redux-persist (`devicesHandle.deviceSelectionPaidTransaction`).
 *
 * That draft survives a reload and was never cleared, so reloading the page,
 * whose URL still carries `payment_intent`, ran every write again. The draft is
 * now stamped with the intent before the first write, and a page that mounts
 * with a draft already stamped for that intent refuses to run.
 */

/** Stripe's `redirect_status` values for a redirect that did not authorize. */
const DECLINED_REDIRECT = new Set(["failed", "requires_payment_method", "canceled"]);

/** PaymentIntent statuses that mean there is no money behind the intent. */
const DECLINED_INTENT = new Set(["requires_payment_method", "canceled"]);

/**
 * Only an explicit failure counts. A deposit is a manual-capture hold, and an
 * authorized hold must never be refused over how Stripe words its status.
 */
export const isDeclinedRedirect = (redirectStatus) =>
  DECLINED_REDIRECT.has(String(redirectStatus ?? ""));

export const isDeclinedIntent = (intent) => DECLINED_INTENT.has(String(intent?.status ?? ""));

/** The draft, stamped as processed for this intent. */
export const markProcessed = (draft, paymentIntent) => ({
  ...(draft ?? {}),
  processedPaymentIntent: paymentIntent,
});

const draftSerials = (draft) =>
  Array.isArray(draft?.serialNumbers)
    ? draft.serialNumbers
    : draft?.serialNumber
    ? [draft.serialNumber]
    : [];

/**
 * What the page should do on arrival.
 *
 * @param {{ paymentIntent?: string|null, redirectStatus?: string|null,
 *   draft?: object, requireSerials?: boolean }} input
 * @returns {"declined"|"missing"|"already-processed"|"run"}
 */
export const confirmationStep = ({
  paymentIntent,
  redirectStatus,
  draft,
  requireSerials = true,
}) => {
  if (isDeclinedRedirect(redirectStatus)) return "declined";
  if (!paymentIntent || !draft?.deviceType?.group) return "missing";
  if (requireSerials && draftSerials(draft).length === 0) return "missing";
  if (draft.processedPaymentIntent === paymentIntent) return "already-processed";
  return "run";
};

export { draftSerials };
