/**
 * The forecast search: what can be filtered on, what is sent, and what the
 * screen says about it.
 *
 * All of it was inline in AdvanceSearchModal.jsx, where the filter options were
 * read from a localStorage blob that was written once and preferred forever
 * after, and the query string was concatenated by hand out of raw form values.
 */

export const FILTER_FIELDS = [
  { name: "category", label: "Category", plural: "categories" },
  { name: "group", label: "Group", plural: "groups" },
  { name: "brand", label: "Brand", plural: "brands" },
  { name: "location", label: "Location", plural: "locations" },
];

const OPTIONS_CACHE_KEY = "searchParameters";

const text = (value) => String(value ?? "").trim();

const toOptions = (entries) =>
  (Array.isArray(entries) ? entries : [])
    .map((entry) => text(entry?.key ?? entry?.label ?? entry))
    .filter((label) => label.length > 0)
    .map((label) => ({ id: label, label }));

const anyOptions = (options) =>
  FILTER_FIELDS.some((field) => (options?.[field.name]?.length ?? 0) > 0);

/**
 * The options for the four filters.
 *
 * The live context wins. It used to be the other way round: the first thing the
 * modal ever saw was written to localStorage, and every later open read the
 * cache and ignored the context — so a category added afterwards never
 * appeared, and if the very first open happened while the inventory query was
 * still loading, an empty list was cached permanently and the dropdowns stayed
 * empty for good.
 *
 * The cache is only a fallback for the moment before the context has anything.
 */
export const resolveFilterOptions = ({ context, cached }) => {
  const live = {
    category: toOptions(context?.category),
    group: toOptions(context?.group),
    brand: toOptions(context?.brand),
    location: toOptions(context?.location),
  };
  if (anyOptions(live)) return live;

  const fallback = {
    category: toOptions(cached?.category),
    group: toOptions(cached?.group),
    brand: toOptions(cached?.brand),
    location: toOptions(cached?.location),
  };
  return anyOptions(fallback) ? fallback : live;
};

/* inventory-facets key for each forecast filter. */
const FACET_FOR_FIELD = {
  category: "category_name",
  group: "item_group",
  brand: "brand",
  location: "location",
};

/**
 * The modal's context, out of the inventory-facets block.
 *
 * With the inventory paginated on the server the page holds one page of rows,
 * and the full dataset the options used to be counted from is empty — so the
 * forecast opened with four empty dropdowns. The facets are the company's
 * distinct values, which is what the options always meant.
 */
export const forecastContextFromFacets = (facets) => {
  const source = facets && typeof facets === "object" ? facets : {};
  return Object.fromEntries(
    Object.entries(FACET_FOR_FIELD).map(([field, facetKey]) => [
      field,
      (Array.isArray(source[facetKey]) ? source[facetKey] : [])
        .filter((entry) => text(entry?.value).length > 0)
        .map((entry) => ({ key: entry.value, value: entry.count })),
    ])
  );
};

/**
 * The forecast filters picked, as inventory-facets filters, leaving out
 * `fieldName` (null leaves out none). A filter's own options are never narrowed
 * by itself: that would leave only the value already picked, and switching to
 * another would need a Clear first.
 */
export const facetFiltersExcept = (filters, fieldName) =>
  Object.fromEntries(
    FILTER_FIELDS.filter(
      (field) => field.name !== fieldName && text(filters?.[field.name])
    ).map((field) => [FACET_FOR_FIELD[field.name], text(filters[field.name])])
  );

/**
 * Each filter's options out of the rows in memory, narrowed by the others
 * picked — the same rule as facetFiltersExcept, for when the table holds the
 * whole inventory (server pagination off). Pick the Laptop group and the brand,
 * category and location lists keep only what laptops have.
 *
 * Shaped like the modal's context: `{ key, value }` with value the item count.
 */
export const cascadeOptionsFromRows = (rows, filters) => {
  const list = Array.isArray(rows) ? rows : [];
  return Object.fromEntries(
    FILTER_FIELDS.map((field) => {
      const narrowing = Object.entries(facetFiltersExcept(filters, field.name));
      const counts = new Map();
      for (const row of list) {
        if (!narrowing.every(([column, value]) => text(row?.[column]) === value)) continue;
        const label = text(row?.[FACET_FOR_FIELD[field.name]]);
        if (label) counts.set(label, (counts.get(label) ?? 0) + 1);
      }
      return [
        field.name,
        [...counts.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, value]) => ({ key, value })),
      ];
    })
  );
};

/**
 * The filters, minus one pick the others have ruled out: brand Apple, then the
 * Desktop group, when no desktop is an Apple. Kept, it would run a forecast
 * over nothing while its select showed empty.
 *
 * `keep` is the filter just picked. Two picks can rule each other out, and the
 * one the person just made is the one they meant.
 *
 * One per call, because dropping a pick widens the others' lists: the caller
 * recomputes the options and asks again until the same object comes back.
 */
export const dropUnavailableFilters = (filters, options, keep) => {
  const ruledOut = FILTER_FIELDS.find((field) => {
    const value = text(filters?.[field.name]);
    if (!value || field.name === keep) return false;
    return !toOptions(options?.[field.name]).some((option) => option.id === value);
  });
  return ruledOut ? { ...filters, [ruledOut.name]: "" } : filters;
};

/** Read the fallback blob, tolerating anything that is not JSON. */
export const readCachedOptions = (storage) => {
  try {
    const raw = storage?.getItem(OPTIONS_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/** Refresh the fallback, but never with nothing. */
export const writeCachedOptions = (storage, context) => {
  if (typeof storage?.setItem !== "function") return false;
  try {
    const options = resolveFilterOptions({ context, cached: null });
    if (!anyOptions(options)) return false;
    storage.setItem(OPTIONS_CACHE_KEY, JSON.stringify(context));
    return true;
  } catch {
    return false;
  }
};

/**
 * A day as the endpoint has always received it: `2026-8-1`, unpadded, built
 * from the *local* parts of what the picker returned.
 *
 * Deliberately not padded to `2026-08-01`. Both forms work today for the same
 * reason they are easy to confuse: unpadded parses as local time and padded as
 * UTC, so padding it here would change what the server resolves the day to if
 * the server is not on UTC. That is a question for the backend, not a change to
 * make on the way past.
 */
export const formatSearchDate = (value) => {
  if (value === null || value === undefined || value === "") return "";
  const date = value?.$d ?? value?.toDate?.() ?? value;
  // `new Date(null)` is the epoch, not an error — it used to slip through as
  // "1970-1-1".
  if (date === null || date === undefined) return "";
  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";
  return `${parsed.getFullYear()}-${parsed.getMonth() + 1}-${parsed.getDate()}`;
};

/** What is wrong with the form, if anything. */
export const searchFieldErrors = ({ range } = {}) => {
  const errors = {};
  const [start, end] = Array.isArray(range) ? range : [];
  if (!start || !end) {
    errors.range = "Pick the period to forecast.";
  } else if (!formatSearchDate(start) || !formatSearchDate(end)) {
    errors.range = "That period could not be read. Pick it again.";
  }
  return errors;
};

/**
 * The parameters kept in Redux and shown back on the result page.
 *
 * Empty string for a filter that was not set — which is what the screen means
 * and what Redux has always stored.
 */
export const buildSearchParameters = ({ filters, range }) => {
  const [start, end] = Array.isArray(range) ? range : [];
  return {
    category: text(filters?.category),
    group: text(filters?.group),
    brand: text(filters?.brand),
    location: text(filters?.location),
    date_start: formatSearchDate(start),
    date_end: formatSearchDate(end),
  };
};

/**
 * The query string for GET /api/search/advance_searching_query.
 *
 * Same eight parameters. Two things it does that the hand-built string did not:
 * it encodes them, so a category containing `&` or a space cannot break the
 * query; and it sends an empty value for a filter nobody set. The old string
 * interpolated the raw form value, which is `undefined` for an untouched
 * antd Select — so every unfiltered forecast asked the server for
 * `category=undefined` while Redux recorded `""` for the same search.
 */
export const buildSearchQuery = ({ parameters, user }) => {
  const query = new URLSearchParams({
    category: text(parameters?.category),
    group: text(parameters?.group),
    brand: text(parameters?.brand),
    location: text(parameters?.location),
    date_start: text(parameters?.date_start),
    date_end: text(parameters?.date_end),
    company_id: text(user?.companyData?.id),
    company_sql_id: text(user?.sqlInfo?.company_id),
  });
  return `/search/advance_searching_query?${query.toString()}`;
};

/** "Category: Radios · Location: Warehouse", or what it means to set none. */
export const describeFilters = (filters) => {
  const set = FILTER_FIELDS.filter((field) => text(filters?.[field.name]));
  if (set.length === 0) return "Forecasting every item in your inventory.";
  return `Forecasting only ${set
    .map((field) => `${field.label.toLowerCase()} ${text(filters[field.name])}`)
    .join(", ")}.`;
};

/** How many filters are set, for the Clear control. */
export const countFilters = (filters) =>
  FILTER_FIELDS.filter((field) => text(filters?.[field.name])).length;

/** An empty set of filters. */
export const emptyFilters = () => ({
  category: "",
  group: "",
  brand: "",
  location: "",
});

/**
 * The friendlier sentence for a server error that is really a crash.
 *
 * Kept from the original: the handler throws on an empty result set and the
 * message that reaches the client is a TypeError.
 */
export const readSearchError = (error) => {
  const msg = error?.response?.data?.msg ?? error?.response?.data?.message;
  if (msg === "Cannot read properties of undefined (reading 'length')") {
    return "There is no inventory available for the period selected.";
  }
  return (
    text(msg) ||
    text(error?.message) ||
    "The forecast could not be run. Nothing was changed — try again."
  );
};
