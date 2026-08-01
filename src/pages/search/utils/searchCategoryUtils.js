// Maps the UI's filter-tab labels (HeaderSearch.jsx) to the `category`
// query param /search/searching_ accepts. Values (and casing) come from the
// backend contract, not the UI copy — note Devices/Events are plural in the
// UI but singular ("device"/"event") in the backend param.
export const CATEGORY_PARAM_BY_FILTER = {
  Consumers: "consumers",
  Staff: "staff",
  Devices: "device",
  Events: "event",
};

/**
 * Derives the `category` query param from the active filter tabs.
 * Returns null when zero or more than one area is active — the backend only
 * accepts a single category and defaults to "all" when the param is omitted,
 * so "View All" and multi-select both mean "don't scope the query".
 */
export function resolveSearchCategoryParam(filterOptions) {
  if (!filterOptions) return null;
  const activeAreas = Object.keys(CATEGORY_PARAM_BY_FILTER).filter(
    (key) => filterOptions[key] === 1
  );
  return activeAreas.length === 1
    ? CATEGORY_PARAM_BY_FILTER[activeAreas[0]]
    : null;
}
