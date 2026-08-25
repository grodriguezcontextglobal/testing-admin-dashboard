/**
 * The rules behind returning rented items to their supplier.
 *
 * The modal had two tabs — "Return All Items" and "Return Selected Items" —
 * over the same table, one with a checkbox column and one without. They were
 * two modes for one decision, and switching between them cleared the search and
 * the selection, so looking at the other tab to check a count lost the work.
 * One table with row selection answers both, and the button says which of the
 * two it is about to do. That decision is `describeReturnAction`.
 *
 * The batching rules live here too. They were inline in a loop that mutated its
 * own index to retry, which is the kind of code that has to be read three times
 * to be trusted and could not be tested at all.
 */

const MIN_BATCH_SIZE = 50;

/** Ids split into batches, in order. */
export function chunkForBatching(ids, size) {
  const list = Array.isArray(ids) ? ids : [];
  const step = Math.max(1, Math.floor(Number(size) || 0));
  const batches = [];

  for (let index = 0; index < list.length; index += step) {
    batches.push(list.slice(index, index + step));
  }
  return batches;
}

/**
 * The next batch size after a payload the server will not take.
 *
 * Two reasons, two rates: a locally measured oversized body shrinks gently, a
 * 413 from the server shrinks hard. Never below `MIN_BATCH_SIZE`, and never
 * above the current size — a rule that grows the batch would loop forever.
 */
export function nextBatchSize(current, reason) {
  const size = Math.floor(Number(current) || 0);
  if (size <= MIN_BATCH_SIZE) return MIN_BATCH_SIZE;

  const rate = reason === "payload-too-large" ? 0.5 : 0.7;
  return Math.max(MIN_BATCH_SIZE, Math.floor(size * rate));
}

/** True when the size cannot usefully shrink any further. */
export function canShrinkBatch(current) {
  return Math.floor(Number(current) || 0) > MIN_BATCH_SIZE;
}

/**
 * What the primary button is about to do.
 *
 * With nothing selected it acts on everything the filter matched — which is the
 * "Return All" tab's whole reason to exist — and with a selection it acts on
 * the selection. The label, the confirmation and the count all come from here,
 * so they cannot disagree with each other.
 */
export function describeReturnAction({ totalItems = 0, selectedCount = 0 } = {}) {
  const isAll = selectedCount === 0;
  const count = isAll ? totalItems : selectedCount;
  const noun = `item${count === 1 ? "" : "s"}`;

  return {
    isAll,
    count,
    label: isAll ? `Return all ${count} ${noun}` : `Return ${count} selected`,
    canSubmit: count > 0,
    confirmTitle: isAll
      ? `Return all ${count} ${noun} to the supplier?`
      : `Return ${count} selected ${noun}?`,
    confirmDescription:
      "They are marked as returned, emailed to the team, and then removed from this company's inventory. This cannot be undone.",
  };
}

/** The steps the run reports, in the order they actually happen. */
export const RETURN_STEPS = [
  { key: "return", label: "Marking items as returned" },
  { key: "email", label: "Emailing the team" },
  { key: "delete", label: "Removing them from inventory" },
];

/**
 * Progress as a percentage, safe for the states the old component could reach:
 * it divided by `progress.total` without checking it, so the first render of a
 * run showed `NaN%`.
 */
export function progressPercent({ current = 0, total = 0 } = {}) {
  if (!total || total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((current / total) * 100)));
}

/** Rows matching a free-text search over the fields the table shows. */
export function filterRentedRows(rows, search) {
  const term = String(search ?? "").trim().toLowerCase();
  const list = Array.isArray(rows) ? rows : [];
  if (!term) return list;

  return list.filter((row) =>
    [row?.item_id, row?.serial_number, row?.item_group].some((value) =>
      String(value ?? "").toLowerCase().includes(term)
    )
  );
}
