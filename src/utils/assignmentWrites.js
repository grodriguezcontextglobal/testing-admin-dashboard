/**
 * Guards for the write chain behind "assign inventory to a staff member".
 *
 * The flow is six writes in a row, and each one depends on the last: the lease
 * event, the warehouse move, the verification, one lease per device, the NoSQL
 * event, the event links. Only the first checked what came back.
 *
 * These endpoints answer HTTP 200 with `{ ok: false, msg }` when they refuse a
 * write, which axios does not treat as an error. So a refusal read as success:
 * the chain carried on writing against a step that had not happened, and the
 * modal reported the devices assigned while the units were still in the
 * warehouse. Stopping at the first refusal is the whole point — the later
 * writes are not just pointless, they are what makes the records disagree.
 */

/** The refusal reason in a response, or null when the write went through. */
export const readWriteFailure = (response) => {
  if (!response) return "the server did not answer";

  const status = response.status;
  if (typeof status === "number" && (status < 200 || status >= 300)) {
    return `the server answered ${status}`;
  }

  const body = response.data;
  if (body?.ok === false) {
    const reason = body.msg ?? body.message ?? body.error;
    return String(reason ?? "").trim() || "the server refused it and gave no reason";
  }

  return null;
};

/**
 * Returns the response, or throws naming the step that failed.
 *
 * @param {object} response an axios response
 * @param {string} step what was being attempted, in the operator's words
 */
export const assertWriteSucceeded = (response, step) => {
  const failure = readWriteFailure(response);
  if (failure) {
    throw new Error(`${step} failed: ${failure}. Nothing else was written.`);
  }
  return response;
};

/**
 * The serials a rollback failed to put back, given the restock's own answer.
 *
 * Undoing a warehouse move goes through the same endpoint as making one, so a
 * refused undo resolves with `{ ok: false }` instead of throwing. A caller that
 * only catches throws reads that as "everything was restored" and tells nobody
 * — which is the one outcome worse than not rolling back at all, because the
 * device is off the shelf and no longer on anyone's list to look for.
 *
 * @param {object|null} response the restock's axios response
 * @param {string[]} serials the serials the rollback tried to restore
 * @returns {string[]} the serials still stranded; empty when the undo landed
 */
export const strandedAfterRollback = (response, serials) => {
  if (!serials?.length) return [];
  return readWriteFailure(response) ? [...serials] : [];
};
