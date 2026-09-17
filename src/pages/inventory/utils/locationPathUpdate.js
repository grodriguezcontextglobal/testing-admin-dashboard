/**
 * The body of `POST /db_inventory/update-location-sub-location`.
 *
 * `company_id` comes from **the same place the header does** — `s-company-lq`
 * in localStorage — or it is left out entirely. That single rule satisfies both
 * servers, and it is what takes the deploy order out of the question:
 *
 *   - The server running in production today validates `company_id` and answers
 *     **400** without it (its route is still the anonymous `updateSubLocation`;
 *     the backend confirmed this on 2026-09-17).
 *   - The hardened server takes the company from the verified context and
 *     answers **400** when the body **disagrees** with the header.
 *
 * The bug this replaces read the value from **Redux** while the header came
 * from localStorage: the two diverge right after a company switch, and that
 * divergence is the 400 the hardened server introduces. Reading one source for
 * both means they cannot disagree.
 *
 * @param {{newName: string, path: string[], companyId?: string|number}} params
 *   `companyId` is the `s-company-lq` value; a missing or empty one leaves the
 *   field out rather than sending an empty string the server would reject.
 */
export const buildLocationPathUpdateBody = ({ newName, path, companyId }) => {
  const body = {
    newName,
    path,
    currentIndex: path.length - 1,
  };

  if (companyId !== undefined && companyId !== null && companyId !== "") {
    body.company_id = companyId;
  }

  return body;
};
