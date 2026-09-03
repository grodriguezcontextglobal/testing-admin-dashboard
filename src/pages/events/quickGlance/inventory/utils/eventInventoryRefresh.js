/**
 * What "reload this table" has to touch for an event's device list.
 *
 * Two caches sit in front of that table and both have to be answered, which is
 * why this is a list of keys rather than one call: the server caches the pool
 * response, and react-query caches it again in the browser. Clearing one
 * without the other is what the refresh button used to do — the server let go
 * of its copy and the client kept showing its own.
 *
 * Kept here rather than inline because deciding *which* keys are the right
 * ones is not readable from the call site. It took reading four other files to
 * establish, and the previous version had it wrong in three separate ways.
 */

const text = (value) => String(value ?? "").trim();

/**
 * The server-side cache keys for one event's device data.
 *
 * `clearCacheMemory` posts a literal key to `/cache_update/remove-cache`, so
 * the string has to match what the server stored — there is no prefix match
 * and no error when it misses. The same data is fetched by event id in some
 * screens and by event name in others, so the cached response can be sitting
 * under either form and both are cleared.
 *
 * The company is always its **id**. Every request that writes this cache sends
 * `company=<companyData.id>`: the pool list in MainPageQuickGlance,
 * GraphicInventoryEventActivity, SpreadSheet, FormatToDisplayDetail. A key
 * built from a company *name* clears nothing — which is what the previous
 * version did, using a `companyName` field the session does not even carry, so
 * it posted `company=undefined` twice on every press.
 *
 * A missing reference drops its form instead of interpolating into the string.
 * A key with "undefined" in it is not a cache miss, it is a wasted request
 * that always succeeds and never clears anything.
 *
 * @param {{eventId?: string|number, eventName?: string, companyId?: string|number}} [args]
 * @returns {string[]}
 */
export const eventCacheKeys = ({ eventId, eventName, companyId } = {}) => {
  const company = text(companyId);
  if (!company) return [];

  return [text(eventId), text(eventName)]
    .filter(Boolean)
    .map((reference) => `eventSelected=${reference}&company=${company}`);
};

/**
 * The react-query keys to invalidate, each matching by prefix.
 *
 * `listOfreceiverInPool` is the one that feeds the table the refresh button
 * sits above (MainPageQuickGlance). It was missing entirely: the old call
 * invalidated only `deviceInPoolList`, which is registered by ReplaceDevice, a
 * different component — so the button could not refresh what the operator was
 * looking at no matter what else was fixed.
 *
 * `deviceInPoolList` stays because the old code was reaching for it and
 * clearing it costs nothing: react-query refetches active queries and only
 * marks inactive ones stale.
 *
 * One element each, on purpose. `deviceInPoolList` is registered as
 * `["deviceInPoolList", companyId]`, so a prefix match is the only thing that
 * reaches it — `exact: true`, which the old call passed, never could.
 */
export const EVENT_DEVICE_QUERY_KEYS = Object.freeze([
  ["listOfreceiverInPool"],
  ["deviceInPoolList"],
]);
