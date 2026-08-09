/**
 * Whether a document's expiration_date has passed. Documents are meant to
 * stay visible after expiring (per product decision) — this only tells
 * callers whether to disable selection/re-use, never to hide the record.
 *
 * @param {string|null|undefined} expirationDate - ISO date string
 * @param {Date} [referenceDate] - defaults to now; injectable for tests
 * @returns {boolean}
 */
export function isDocumentExpired(expirationDate, referenceDate = new Date()) {
  if (!expirationDate) return false;
  const expiry = new Date(expirationDate);
  if (Number.isNaN(expiry.getTime())) return false;
  return expiry.getTime() <= referenceDate.getTime();
}
