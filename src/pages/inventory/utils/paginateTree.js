/**
 * One page of the Locations | Sub locations tree.
 *
 * The card renders every registered location at once, each one expandable into
 * its sub-locations. A company with a few dozen locations turns that card into
 * most of the page, and the table below it — the one people came for — ends up
 * below the fold.
 *
 * Only the top level is paged. A location's sub-locations belong to the row
 * that opens them, and splitting a node's children across pages would mean
 * expanding a location and finding half of it.
 *
 * @param {Record<string, unknown>} data the tree, keyed by location name
 * @param {{page?: number, pageSize?: number}} params
 * @returns {{entries: Array<[string, unknown]>, page: number, pageCount: number,
 *   total: number}} `entries` in the order the tree arrived in — the server
 *   decides that order, and re-sorting here would fight it
 */
export const TREE_PAGE_SIZE = 10;

export const paginateTree = (data, { page = 1, pageSize = TREE_PAGE_SIZE } = {}) => {
  const entries =
    data && typeof data === "object" && !Array.isArray(data)
      ? Object.entries(data)
      : [];

  const size = Number.isInteger(pageSize) && pageSize > 0 ? pageSize : TREE_PAGE_SIZE;
  const pageCount = Math.max(1, Math.ceil(entries.length / size));

  // Clamped rather than trusted: a filter can shrink the tree while the operator
  // sits on page 4, and an empty page there reads as "no locations".
  const requested = Number.isInteger(page) ? page : 1;
  const current = Math.min(Math.max(requested, 1), pageCount);
  const start = (current - 1) * size;

  return {
    entries: entries.slice(start, start + size),
    page: current,
    pageCount,
    total: entries.length,
  };
};
