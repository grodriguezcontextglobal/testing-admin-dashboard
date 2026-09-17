/**
 * The `Idempotency-Key` for a payment operation, keyed on the deposit.
 *
 * The server derives a key from method, route and body when the client sends
 * none. That covers the accidental double-click, but not the case the backend
 * asked us to close: **the capture amount is editable**, so two captures of the
 * same deposit for different amounts are two different requests by that
 * derivation — and both charge the card.
 *
 * Keyed on the operation and the deposit instead, the second one collides with
 * the first and gets its answer back rather than making a second charge.
 *
 * **Deliberately not used for partial refunds.** Refunding two lost devices
 * from the same transaction is two legitimate requests, and they can be for the
 * same amount: a key that collapsed them would hand the second one the first
 * one's receipt and look like it had worked. A repeat that is legitimate must
 * not be deduplicated.
 *
 * @param {"capture"|"release"|"refund"} operation
 * @param {string|undefined|null} paymentIntent
 * @returns {{headers?: {"Idempotency-Key": string}}} an axios config fragment,
 *   empty when there is nothing stable to key on — a made-up key would let a
 *   real duplicate through while claiming to prevent one.
 */
export const paymentIdempotencyHeaders = (operation, paymentIntent) => {
  if (!paymentIntent) return {};
  return { headers: { "Idempotency-Key": `${operation}:${paymentIntent}` } };
};
