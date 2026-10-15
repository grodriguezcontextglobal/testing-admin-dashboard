/**
 * Reading a failed payment request.
 *
 * The server reserves an idempotency key in Redis *before* it runs the
 * handler, so a duplicate that arrives while the first request is still going
 * answers **409** instead of charging twice. A 409 is therefore not a failure:
 * it says the first request is still deciding, and it may well charge.
 *
 * That distinction matters because every one of these screens used to answer
 * any error with a sentence like "Nothing was charged" — which, on a 409, is
 * false, and sends the operator off to try again by hand.
 *
 * Retrying is the other half. Nothing here retries, and nothing above it does
 * either: the Axios response interceptor only retries on `Network Error` or
 * `timeout` (it never reads a status code), and these calls are mutations, so
 * React Query leaves them alone. A retry on a 409 would collect another 409
 * for as long as the first request runs.
 */

const CONFLICT = 409;
const FORBIDDEN = 403;
const NOT_FOUND = 404;

/** True only for the duplicate-in-flight answer. */
export const isPaymentRequestInProgress = (error) =>
  error?.response?.status === CONFLICT;

/**
 * @param {unknown} error the rejected Axios error
 * @param {{failure: string, subject?: string}} copy `failure` is what the
 *   screen says when the money really did not move; `subject` names the
 *   operation in the in-progress sentence ("capture", "refund", …).
 * @returns {{inProgress: boolean, message: string}}
 */
export const describePaymentError = (error, { failure, subject = "request" }) => {
  if (isPaymentRequestInProgress(error)) {
    return {
      inProgress: true,
      message: `The previous ${subject} is still going through. Check the transaction to see where it landed before sending it again.`,
    };
  }

  /* Refund, partial refund, capture and cancel are going to require a session
     and transaction:update (BACKEND_answers_to_dashboard_2026-10-06.md). Both
     answers are given before the handler runs, so `failure` still holds; the
     added sentence says why, because pressing again would fail the same way. */
  const status = error?.response?.status;
  if (status === FORBIDDEN) {
    return {
      inProgress: false,
      message: `${failure} Your role cannot make this ${subject}; ask an administrator.`,
    };
  }
  if (status === NOT_FOUND) {
    return {
      inProgress: false,
      message: `${failure} This payment was not found for your company; reload the transactions before trying again.`,
    };
  }

  return { inProgress: false, message: failure };
};
