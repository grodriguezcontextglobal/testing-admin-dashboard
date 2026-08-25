/**
 * Moving scanned containers (and everything inside them) into an event.
 *
 * `POST /db_event/allocate-device-container-event` is synchronous and does the
 * whole job in one transaction: it resolves each scanned serial to a
 * container, expands it into its children, updates item_inv, inserts the rows
 * into the event, and writes the Mongo receivers pool itself. Two consequences
 * confirmed with the backend (2026-08-19) shape this module:
 *
 * 1. The pool write is internal, so calling `/receiver/receivers-pool-bulk`
 *    after it inserted the same units into the pool a second time —
 *    poolReceiversBulk is insertMany with no dedup. That second call is gone.
 * 2. The UPDATE and the INSERT are one un-chunked statement each, with a
 *    placeholder per expanded item. 500 containers of ~20 children is ~10k
 *    placeholders in one INSERT, which risks max_allowed_packet and the
 *    Vitess limit — hence CONTAINER_BATCH_SIZE below.
 *
 * The queued sibling the task-queue doc lists,
 * `/db_event/inserting-items-in-event-from-container`, is deliberately NOT
 * used: it takes item_ids the client would have to resolve itself, has no
 * auth (so its jobId can never be polled — the job carries context.uid null
 * and GET /jobs/owned/:jobId requires it), ignores container_items, never
 * touches item_inv or the pool, has no idempotency and returns no counts.
 */

/**
 * Containers per request. The backend asked for 100-200 until they chunk the
 * statement server-side; 500 (the generic batch default) is past what the
 * single INSERT can carry once children are expanded.
 */
export const CONTAINER_BATCH_SIZE = 150;

const isFilledString = (value) => typeof value === "string" && value.trim() !== "";

/**
 * @param {{event: object, deviceTitle: string, user: object, batch: string[]}} args
 * @returns the request body, with exactly the keys the endpoint reads.
 * @throws when the device group is not part of the event's setup — the
 *   category comes from there, and a missing group is a state problem worth
 *   naming rather than a TypeError mid-batch.
 */
export const buildContainerAllocationPayload = ({ event, deviceTitle, user, batch }) => {
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
    company_id_nosql: event?.company_id,
    data: batch,
    event_id: event?.sql?.event_id,
    eventName: event?.eventInfoDetail?.eventName,
    item_group: deviceTitle,
    logistic_status: "in-event",
    warehouse: 0,
  };
};

/**
 * What the endpoint tells us about a batch it accepted.
 *
 * Counts are null rather than 0 when the response does not carry them, so a
 * caller never reports "0 items" for a response it simply could not read.
 * Note what is deliberately absent: which of the scanned serials failed to
 * resolve. The response returns the resolved containers' children, not the
 * scanned serials, so that diff cannot be computed here — the endpoint
 * answers 200 having processed only the serials that were containers, without
 * naming the ones it skipped. Surfacing `message` is the closest honest
 * signal, and it is what carries "The specified containers are empty."
 *
 * @param {object} responseData - the axios response body.
 * @returns {{message: string|null, processedItemCount: number|null, childCount: number|null}}
 */
export const summarizeContainerAllocation = (responseData) => {
  const data = responseData && typeof responseData === "object" ? responseData : {};
  const processed = data?.result?.allItemsToProcess;
  const children = data?.props;

  return {
    message: isFilledString(data.message) ? data.message.trim() : null,
    processedItemCount: Array.isArray(processed) ? processed.length : null,
    childCount: Array.isArray(children) ? children.length : null,
  };
};
