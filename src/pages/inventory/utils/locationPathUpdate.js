/**
 * The body of `POST /db_inventory/update-location-sub-location`.
 *
 * No `company_id`, deliberately: the server takes it from the verified
 * context — the `s-company-lq` header `sessionHeaders` attaches to every
 * `/api/db_*` call, read out of localStorage. A second copy from Redux
 * disagrees with that header right after a company switch, and the server
 * answers a disagreement with a 400. The field is optional, so not sending it
 * removes the failure mode instead of leaving it to chance.
 *
 * @param {{newName: string, path: string[]}} params
 */
export const buildLocationPathUpdateBody = ({ newName, path }) => ({
  newName,
  path,
  currentIndex: path.length - 1,
});
