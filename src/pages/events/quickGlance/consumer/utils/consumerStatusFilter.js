/**
 * The four states a consumer can be in at an event, and the filter the legend
 * pills drive.
 *
 * The four buckets were written out three times: the labels and descriptions in
 * CustomerInformationSection's legend, the labels again in CustomerDatabase's
 * `dicStatus`, and the colours in a `styleDic` copied into both files. That is
 * how a legend and a column can quietly disagree about what a colour means.
 * One table now, and it is the same one the pills and the cells read.
 *
 * The status itself arrives from
 * GET /event/all-users-and-transactions-per-event as `transactions` — a number
 * 0-3, not a list, despite the name.
 */

export const CONSUMER_STATUSES = Object.freeze([
  Object.freeze({
    value: 0,
    label: "No devices",
    description: "No devices assigned",
    backgroundColor: "#dad7d7",
    color: "#262424",
  }),
  Object.freeze({
    value: 1,
    label: "Devices pending to return",
    description: "Devices in use but also some returned",
    backgroundColor: "#FFF4ED",
    color: "#B93815",
  }),
  Object.freeze({
    value: 2,
    label: "Devices in use",
    description: "All devices of all transactions are in use",
    backgroundColor: "#ECFDF3",
    color: "var(--success-700, #027A48)",
  }),
  Object.freeze({
    value: 3,
    label: "Devices returned",
    description: "All devices of all transactions are returned",
    backgroundColor: "#EFF8FF",
    color: "#175CD3",
  }),
]);

/**
 * Anything that is not one of the four buckets is "No devices" — which is what
 * the cell has always rendered for a missing status (`status || 0`). Stated
 * here so the pill filters the same rows the cell claims are in that bucket.
 */
export const normalizeConsumerStatus = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 3 ? parsed : 0;
};

/** The bucket a row renders as. Never undefined, so the cell always has colours. */
export const consumerStatus = (value) =>
  CONSUMER_STATUSES[normalizeConsumerStatus(value)];

/**
 * Clicking the pill that is already filtering clears it. A pill that only ever
 * switched on would need a separate "show all" control to undo, and the pill
 * itself is the obvious place to look for it.
 *
 * `null` is "no filter"; 0 is a bucket of its own, so neither may stand in for
 * the other anywhere in this module.
 */
export const toggleStatusFilter = (current, next) =>
  current === normalizeConsumerStatus(next) ? null : normalizeConsumerStatus(next);

/** Row-level predicate, for the column's own onFilter. */
export const matchesStatusFilter = (statusFilter, rowStatus) =>
  statusFilter === null || statusFilter === undefined
    ? true
    : normalizeConsumerStatus(rowStatus) === statusFilter;

/** antd hands back `{ status: [2] }`, or `null`/`[]` once cleared. */
export const statusFilterFromTableChange = (filters) => {
  const selected = filters?.status;
  if (!Array.isArray(selected) || selected.length === 0) return null;
  return normalizeConsumerStatus(selected[0]);
};

/**
 * What the Status column's `filteredValue` has to be for the pills and the
 * column dropdown to stay one selection rather than two that intersect.
 * antd reads `null` as uncontrolled-and-unfiltered; `[]` would filter nothing
 * in and empty the table.
 */
export const statusColumnFilterValue = (statusFilter) =>
  statusFilter === null || statusFilter === undefined ? null : [statusFilter];
