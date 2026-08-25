/**
 * Reporting what the add-to-event write actually did.
 *
 * Adding stock is four separate transactions across two databases, with no
 * rollback anywhere:
 *
 *   0  POST /db_event/event_device          reserve the devices for the event
 *   1  POST /db_item/item-out-warehouse     take them out of the warehouse
 *   2  POST /receiver/receivers-pool-bulk   create their tracking records
 *   3  POST /event/event-list + PATCH /event/edit-event/:id   update the event
 *
 * Until this existed, every nested helper in the action hooks ended its catch
 * with `return message.error(...)`. `return` — not `throw`. Since
 * `message.error()` returns a value, the promise FULFILLED, so the awaiting
 * caller saw a success: it went on to announce "Items added to event
 * inventory.", patch the event, clear the caches and close the modal, while the
 * write that failed had never happened. The outer catch never fired because
 * nothing ever propagated.
 *
 * So a failure has to be reported as a position in the chain, not a boolean:
 * step 1 failing means step 0 is already committed and cannot be taken back
 * from here, and re-running the whole flow would write step 0 a second time —
 * none of those three inserts carries a dedup key (the defect fixed once in
 * commit 95a61580).
 */

export const WRITE_STEPS = [
  { key: "reserve", label: "Reserve the devices for this event", scope: "inventory" },
  { key: "warehouse", label: "Take them out of the warehouse", scope: "inventory" },
  { key: "tracking", label: "Create their tracking records", scope: "tracking" },
  { key: "event", label: "Update the event’s inventory list", scope: "event" },
];

const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;

/** A fresh chain with nothing attempted. */
export const initialWriteState = () => ({
  statuses: WRITE_STEPS.map(() => "pending"),
  failedAt: null,
});

/**
 * Records one step's status. Never mutates — the caller holds this in React
 * state and the write reports into it from inside an async chain.
 *
 * @param {object} state
 * @param {number} index position in WRITE_STEPS.
 * @param {"pending"|"running"|"done"|"failed"} status
 */
export const markWriteStep = (state, index, status) => {
  const base = state ?? initialWriteState();
  const statuses = [...base.statuses];
  if (index < 0 || index >= statuses.length) {
    return { statuses, failedAt: base.failedAt ?? null };
  }
  statuses[index] = status;
  return {
    statuses,
    // Keep the FIRST failure: it is the one that says how far the chain got.
    failedAt:
      status === "failed" && base.failedAt === null ? index : (base.failedAt ?? null),
  };
};

/**
 * One row per step, with the flags a list renders straight from.
 *
 * @param {object} state
 * @returns {Array<{label: string, scope: string, status: string,
 *   isDone: boolean, isRunning: boolean, isFailed: boolean,
 *   isPending: boolean, note: string|null}>}
 */
export const describeWriteSteps = (state) => {
  const base = state ?? initialWriteState();
  const failedAt = base.failedAt;

  return WRITE_STEPS.map((step, index) => {
    const status = base.statuses[index] ?? "pending";
    let note = null;
    if (status === "failed") {
      note = "The server rejected this step.";
    } else if (status === "pending" && failedAt !== null && index > failedAt) {
      note = "Not attempted.";
    }
    return {
      label: step.label,
      scope: step.scope,
      status,
      isDone: status === "done",
      isRunning: status === "running",
      isFailed: status === "failed",
      isPending: status === "pending",
      note,
    };
  });
};

/**
 * What is true about the write right now, in the words the person needs.
 *
 * @param {object} state
 * @param {number} deviceCount how many devices the write was for.
 * @returns {{phase: "idle"|"running"|"ok"|"partial", title: string,
 *   subtitle: string, hasVerdict: boolean, verdictTone: "good"|"bad",
 *   verdictTitle: string, verdictDetail: string, committedCount: number,
 *   canRetry: boolean, primaryLabel: string, primaryDisabled: boolean,
 *   footerHint: string}}
 */
export const describeWriteOutcome = (state, deviceCount) => {
  const base = state ?? initialWriteState();
  const statuses = base.statuses;
  const total = WRITE_STEPS.length;
  const count = Number.isFinite(Number(deviceCount))
    ? Math.max(0, Math.floor(Number(deviceCount)))
    : 0;
  const committedCount = statuses.filter((s) => s === "done").length;

  const untouched = statuses.every((s) => s === "pending");
  const failed = base.failedAt !== null;
  const finished = committedCount === total;

  if (untouched && !failed) {
    return {
      phase: "idle",
      title: "",
      subtitle: "",
      hasVerdict: false,
      verdictTone: "good",
      verdictTitle: "",
      verdictDetail: "",
      committedCount: 0,
      canRetry: false,
      primaryLabel: "",
      primaryDisabled: false,
      footerHint: "",
    };
  }

  if (failed) {
    const step = WRITE_STEPS[base.failedAt];
    const nothingCommitted = committedCount === 0;
    return {
      phase: "partial",
      title: nothingCommitted
        ? "That did not go through"
        : "Only part of this went through",
      subtitle: nothingCommitted
        ? "Nothing was written, so nothing needs undoing."
        : "Some of it was written and some of it was not.",
      hasVerdict: true,
      verdictTone: "bad",
      verdictTitle: nothingCommitted
        ? "Nothing was written"
        : `${committedCount} of ${total} steps committed, and they cannot be undone from here`,
      verdictDetail: nothingCommitted
        ? `The first step — ${step.label.toLowerCase()} — was rejected, so no devices moved. Safe to try again.`
        : `The step that failed was ${step.label.toLowerCase()}. The ${plural(
            count,
            "device",
          )} in this batch are already partly committed, so retry only the failed step — running the whole flow again would write the committed steps a second time.`,
      committedCount,
      // The chain is not re-enterable at a step, so this screen deliberately
      // offers no retry button — pressing one would re-run from step 0 and
      // write the committed steps twice. It reports, and a person decides.
      canRetry: true,
      primaryLabel: "Close",
      primaryDisabled: false,
      footerHint: "Nothing here retries by itself.",
    };
  }

  if (finished) {
    return {
      phase: "ok",
      title: `${plural(count, "device")} added`,
      subtitle: "They are out of the warehouse and tracked against this event.",
      hasVerdict: true,
      verdictTone: "good",
      verdictTitle: "All four steps completed",
      verdictDetail: `${plural(
        count,
        "device",
      )} reserved, taken out of the warehouse, tracked, and listed on the event.`,
      committedCount,
      canRetry: false,
      primaryLabel: "Done",
      primaryDisabled: false,
      footerHint: "",
    };
  }

  return {
    phase: "running",
    title: `Adding ${plural(count, "device")}`,
    subtitle:
      "Four steps across inventory and tracking. Leave this open until it finishes.",
    hasVerdict: false,
    verdictTone: "good",
    verdictTitle: "",
    verdictDetail: "",
    committedCount,
    canRetry: false,
    primaryLabel: "Working…",
    primaryDisabled: true,
    footerHint: "Do not submit again — a second run would add these devices twice.",
  };
};
