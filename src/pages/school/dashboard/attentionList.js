/**
 * Narrowing the needs-attention list down to something a person can act on.
 *
 * The list rendered every outstanding student at once, one flex row each. That
 * is fine for the twelve-student demo roster it was built against and falls
 * over for a district: five thousand students is five thousand DOM rows, no way
 * to find one, and no way to tell which part of the problem is the big part.
 *
 * All of this is derived from rows the dashboard has already resolved, so the
 * filters can never disagree with the counts above them.
 */

const text = (value) => String(value ?? "").trim();

/** The statuses a row can carry, worst first — same order the list sorts by. */
export const ATTENTION_FILTERS = Object.freeze([
  { value: "missing", label: "Not requested" },
  { value: "refused", label: "Refused" },
  { value: "expired", label: "Expired" },
  { value: "stale", label: "Needs re-consent" },
  { value: "pending", label: "Awaiting guardian" },
]);

export const ATTENTION_PAGE_SIZE = 25;

/**
 * How many rows sit in each status.
 *
 * Only statuses that are actually present come back, so the filter bar shows
 * four chips for a school with four problems rather than a fixed row of zeros.
 */
export function attentionStatusCounts(rows) {
  const counts = new Map();
  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const status = row?.status;
    if (!status) return;
    counts.set(status, (counts.get(status) ?? 0) + 1);
  });

  return ATTENTION_FILTERS.filter((filter) => counts.has(filter.value)).map(
    (filter) => ({ ...filter, count: counts.get(filter.value) })
  );
}

/** The grades present in the list, sorted so 2 comes before 10. */
export function attentionGrades(rows) {
  const grades = new Set(
    (Array.isArray(rows) ? rows : []).map((row) => text(row?.grade)).filter(Boolean)
  );

  return [...grades].sort((a, b) => {
    const [left, right] = [Number(a), Number(b)];
    if (Number.isFinite(left) && Number.isFinite(right)) return left - right;
    return a.localeCompare(b);
  });
}

/**
 * The rows matching the current search, status chip and grade.
 *
 * Search covers the name and whatever the record says about who was asked —
 * finding "every consent we sent to mum@x.com" is a real question when a
 * guardian has three children in the school.
 */
export function filterAttentionRows(rows, { search, status, grade } = {}) {
  const term = text(search).toLowerCase();
  const list = Array.isArray(rows) ? rows : [];

  return list.filter((row) => {
    if (status && row?.status !== status) return false;
    if (grade && text(row?.grade) !== text(grade)) return false;
    if (!term) return true;

    return [row?.name, row?.record?.signer_name, row?.record?.signer_email].some(
      (value) => text(value).toLowerCase().includes(term)
    );
  });
}

/**
 * One page of rows, plus the numbers the pager needs to describe itself.
 *
 * `page` is clamped rather than trusted: filtering down from page 40 to a
 * three-row result must not leave the list empty with no way back.
 */
export function pageOfAttentionRows(rows, page, pageSize = ATTENTION_PAGE_SIZE) {
  const list = Array.isArray(rows) ? rows : [];
  const size = Math.max(1, Math.floor(Number(pageSize)) || ATTENTION_PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(list.length / size));
  const current = Math.min(Math.max(1, Math.floor(Number(page)) || 1), totalPages);
  const from = (current - 1) * size;

  return {
    rows: list.slice(from, from + size),
    page: current,
    totalPages,
    total: list.length,
    // 1-based and inclusive, the way "26–50 of 5,000" reads.
    firstShown: list.length === 0 ? 0 : from + 1,
    lastShown: Math.min(from + size, list.length),
  };
}
