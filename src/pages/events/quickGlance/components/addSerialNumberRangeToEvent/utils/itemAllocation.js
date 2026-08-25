/**
 * Moving individually scanned devices into an event.
 *
 * `POST /db_event/allocate-device-event` resolves each serial by all four of
 * company / item_group / category_name / serial_number, and it used to report
 * only two outcomes: a 500 when nothing matched, and `ok: true` for everything
 * else — including a batch where only some serials resolved. So a run of ten
 * with three unmatched went out three devices short while the UI announced ten.
 * Backend's `feat/event-allocation-hardening` (2026-08-20) adds:
 *
 * - `422` instead of `500` when nothing matched — a wrong payload, not an
 *   outage, and now carrying `unresolved_serials`.
 * - `requested_count`, `matched_count` and `unresolved_serials` on the `200`,
 *   so a partial match is no longer silent.
 * - `serial_number` alongside `item_id` on the `result` rows.
 *
 * Two things this module is careful about:
 *
 * 1. `inserted.total_items` is the MATCHED count, never the requested one.
 *    `requestedCount` therefore comes from the batch we sent and nothing else.
 * 2. Every field above is absent on the currently deployed server, where a
 *    `200` did mean every serial resolved. Reading their absence as "nothing
 *    was allocated" would stop the receivers pool being written today, so the
 *    legacy shape stays a full success.
 *
 * The receivers pool matters here: `/receiver/receivers-pool-bulk` is
 * `insertMany` with no dedup, and it used to be handed the whole scanned batch.
 * Anything that did not resolve in SQL still landed in the Mongo pool — a
 * device held by an event it was never assigned to. `allocatedSerials` is what
 * that call should be given.
 */

const isFilledString = (value) => typeof value === "string" && value.trim() !== "";

const asArray = (value) => (Array.isArray(value) ? value : []);

const asCount = (value) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;

/**
 * @param {{event: object, deviceTitle: string, user: object, batch: string[]}} args
 * @returns the request body, with exactly the keys the endpoint reads.
 * @throws when the device group is not part of the event's setup. The category
 *   comes from there, and sending it undefined leaves every serial unresolved
 *   for a reason no message would explain.
 */
export const buildItemAllocationPayload = ({ event, deviceTitle, user, batch }) => {
  const setup = Array.isArray(event?.deviceSetup)
    ? event.deviceSetup.find((item) => item?.group === deviceTitle)
    : undefined;

  if (!setup) {
    throw new Error(
      `"${deviceTitle}" is not part of this event's inventory setup, so its category cannot be read. Add the group to the event first.`,
    );
  }

  return {
    category_name: setup.category,
    company_id: user?.sqlInfo?.company_id,
    data: batch,
    event_id: event?.sql?.event_id,
    item_group: deviceTitle,
    logistic_status: "in-event",
    warehouse: 0,
  };
};

/**
 * What the endpoint reported about a batch it accepted.
 *
 * @param {object} responseData - the axios response body.
 * @param {string[]} requestedSerials - the batch we sent, and the only source
 *   for `requestedCount`.
 * @returns {{requestedCount: number, matchedCount: number|null,
 *   insertedCount: number|null, unresolvedSerials: string[],
 *   allocatedSerials: string[], fullyAllocated: boolean}}
 */
export const summarizeItemAllocation = (responseData, requestedSerials) => {
  const data = responseData && typeof responseData === "object" ? responseData : {};
  const requested = asArray(requestedSerials);
  const requestedCount = requested.length;

  const matchedCount = asCount(data.matched_count);
  const insertedCount = asCount(data?.inserted?.inserted_items);

  const requestedKeys = new Set(requested.map(String));
  const unresolvedSerials = asArray(data.unresolved_serials)
    .filter((serial) => isFilledString(serial) || typeof serial === "number")
    .map(String);

  const resolvedRows = asArray(data.result)
    .map((row) => row?.serial_number)
    .filter((serial) => isFilledString(serial) || typeof serial === "number")
    .map(String);

  const allocatedSerials = (() => {
    // The server says it matched nothing — believe it before anything else.
    if (matchedCount === 0) return [];
    // Preferred: the rows it resolved, kept to what we actually sent.
    if (resolvedRows.length > 0) {
      const resolvedKeys = new Set(resolvedRows);
      return requested.filter((serial) => resolvedKeys.has(String(serial)));
    }
    // Next best: what we sent, minus what it named as unresolved.
    if (Array.isArray(data.unresolved_serials)) {
      const missing = new Set(unresolvedSerials);
      return requested.filter((serial) => !missing.has(String(serial)));
    }
    // Legacy shape: a 200 meant every serial resolved.
    return [...requested];
  })();

  return {
    requestedCount,
    matchedCount,
    insertedCount,
    unresolvedSerials: unresolvedSerials.filter((serial) => requestedKeys.has(serial)),
    allocatedSerials,
    fullyAllocated:
      allocatedSerials.length === requestedCount &&
      (matchedCount === null || matchedCount === requestedCount),
  };
};

/**
 * One sentence for the whole run, across however many batches it took.
 *
 * @param {ReturnType<typeof summarizeItemAllocation>[]} summaries
 * @param {string} deviceTitle - the group the serials were scanned against,
 *   which is half of why an unresolved serial did not match.
 * @returns {{headline: string, detail: string|null, complete: boolean}}
 */
export const describeItemAllocation = (summaries, deviceTitle) => {
  const batches = asArray(summaries);

  if (batches.length === 0) {
    return {
      headline: "No serial numbers were sent.",
      detail: null,
      complete: true,
    };
  }

  const requestedTotal = batches.reduce((sum, batch) => sum + (batch?.requestedCount ?? 0), 0);
  // matchedCount is absent on the legacy response, where everything we sent
  // resolved — so the batch's own requested count is the honest fallback.
  const movedTotal = batches.reduce(
    (sum, batch) => sum + (batch?.matchedCount ?? batch?.requestedCount ?? 0),
    0,
  );
  const skipped = batches.flatMap((batch) => asArray(batch?.unresolvedSerials));
  const complete = batches.every((batch) => batch?.fullyAllocated === true);

  if (complete) {
    return {
      headline: `${plural(movedTotal, "item")} moved into this event.`,
      detail: null,
      complete: true,
    };
  }

  return {
    headline: `${movedTotal} of ${plural(requestedTotal, "item")} moved into this event.`,
    detail:
      skipped.length > 0
        ? `${
            skipped.length === 1 ? "This serial number" : "These serial numbers"
          } matched no device in "${deviceTitle}" and ${
            skipped.length === 1 ? "was" : "were"
          } skipped: ${skipped.join(", ")}.`
        : `The server matched fewer devices than the ${plural(
            requestedTotal,
            "serial number",
          )} sent, without naming which.`,
    complete: false,
  };
};

/**
 * Why a batch was rejected, in terms the person scanning can act on.
 *
 * The `422` is the interesting one: it means the payload was wrong, not that
 * the server is down, and it names the serials. That answers reports like
 * `00100003` — a serial that exists but belongs to another item group, so it
 * can never match the group being scanned into.
 *
 * Nothing here suppresses a retry: `useBatchProcessor` stops the run on the
 * first failed batch, and the axios response interceptor only retries on a
 * network error or timeout, never on an HTTP status.
 *
 * @param {object} error - the rejected axios error.
 * @param {string} deviceTitle - the group the serials were scanned against.
 * @returns {string} never empty.
 */
export const explainAllocationFailure = (error, deviceTitle) => {
  const status = error?.response?.status ?? null;
  const body = error?.response?.data;
  const serverMessage = isFilledString(body?.msg) ? body.msg.trim() : null;
  const unresolved = asArray(body?.unresolved_serials)
    .filter((serial) => isFilledString(serial) || typeof serial === "number")
    .map(String);

  if (unresolved.length > 0) {
    return `No device in "${deviceTitle}" matched ${
      unresolved.length === 1 ? "this serial number" : "these serial numbers"
    }, so nothing was allocated: ${unresolved.join(
      ", ",
    )}. Check the serial belongs to this group and category.`;
  }

  if (serverMessage) return serverMessage;

  if (status !== null) {
    return `The server rejected this batch with status ${status}.`;
  }

  return isFilledString(error?.message)
    ? error.message
    : "The batch could not be allocated, and the server gave no reason.";
};
