/**
 * The body for `POST /db_event/events_information`, always scoped to a company
 * (GovRAMP AC-4).
 *
 * Six screens used to look an event's SQL row up by name and zip code alone.
 * `event_info` has no company condition of its own on that route, so the
 * server answered with every company's matching row and the client sorted it
 * out afterwards — `pickSqlEventId` filters by company in the browser, which
 * is where a control does not count. One screen did not even do that: it took
 * `events.at(-1)` and used whatever came back as the event's identity.
 *
 * The company id is the **numeric SQL** one (`user.sqlInfo.company_id`), the
 * same value `s-company-lq` carries on `/api/db_*`. The column is
 * `company_assigned_event_id`, which `SearchDeviceRef` was already sending.
 *
 * The server will make the column required once this is in production
 * (BACKEND_si11_three_routes_fixed_2026-11-17.md §2). Until then the scoping
 * is ours alone, which is why `buildEventSqlLookup` refuses to produce an
 * unscoped body rather than quietly dropping the field: a request without the
 * company is the bug this exists to prevent.
 */

/** The zip is the last whitespace-separated token of the address. */
export const zipFromAddress = (address) =>
  `${address ?? ""}`.trim().split(" ").filter(Boolean).at(-1) ?? "";

/**
 * @returns {{event_name: string, zip_address: string, company_assigned_event_id: number|string}|null}
 *   `null` when there is no company id — the caller must not send the request.
 */
export const buildEventSqlLookup = ({ eventName, address, companyId } = {}) => {
  if (companyId === null || companyId === undefined || companyId === "") return null;
  return {
    event_name: eventName,
    zip_address: zipFromAddress(address),
    company_assigned_event_id: companyId,
  };
};

/** The same body from a Mongo event document. */
export const eventSqlLookupFromEvent = (event, companyId) =>
  buildEventSqlLookup({
    eventName: event?.eventInfoDetail?.eventName,
    address: event?.eventInfoDetail?.address,
    companyId,
  });

/**
 * This company's row among the matches, newest first when the name repeats.
 *
 * Kept after the request became scoped, as a second lock rather than the
 * first one: until the server makes the column required, a build that forgets
 * the field would otherwise silently read another company's row again.
 */
export const pickOwnEventRow = (rows = [], companyId) =>
  (rows ?? [])
    .filter((row) => String(row?.company_assigned_event_id) === String(companyId))
    .at(-1) ?? null;
