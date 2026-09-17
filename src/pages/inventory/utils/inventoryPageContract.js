/**
 * The wire contract for the three server-paginated inventory endpoints, in one
 * pure module.
 *
 *   POST /api/db_item/inventory-page     — one page of the table
 *   POST /api/db_item/inventory-facets   — matchedTotal + the filter options
 *   GET  /api/db_item/serial-suggest     — autocomplete for the serial select
 *
 * Contract: FRONTEND_inventory_page_endpoints.md. Migration:
 * FRONTEND_inventory_pagination_migration_plan.md.
 *
 * Nothing here touches React, axios or Redux. The request bodies are the part
 * of this migration a test can pin down completely, and the part where a
 * mistake is a 400 in production rather than a red test — the server rejects an
 * unknown filter key, an unknown sort column and a non-integer pageSize, so the
 * job of this module is to make those requests unsendable.
 */

/**
 * The nine keys `filters` accepts. Anything else is a 400 listing the valid
 * ones: a filter key becomes a column name inside the SQL text, so the server
 * refuses to take it from the client unchecked.
 */
export const INVENTORY_FILTER_KEYS = Object.freeze([
  "brand",
  "item_group",
  "category_name",
  "location",
  "ownership",
  "warehouse",
  "logistic_status",
  "status",
  "main_warehouse",
]);

/**
 * Valid `sortBy` values: the seven columns the table declares sortable, plus
 * logistic_status. That eighth one exists because the "Status" column sorts by
 * `warehouse` and paints `logistic_status` — sorting it does not sort by what
 * you can see. Moving that column onto logistic_status closes the gap.
 */
export const INVENTORY_SORT_COLUMNS = Object.freeze([
  "category_name",
  "item_group",
  "warehouse",
  "ownership",
  "main_warehouse",
  "location",
  "serial_number",
  "logistic_status",
]);

/** Facet names inventory-facets aggregates. Omitting `facets` asks for all. */
export const INVENTORY_FACET_KEYS = Object.freeze([
  "brand",
  "item_group",
  "category_name",
  "location",
  "ownership",
  "logistic_status",
  "status",
]);

/**
 * Ten, not the fifty the contract suggests, and the reason is the screen rather
 * than the endpoint: fifty rows make the table longer than what production
 * shows today, and that length is what the people using it are used to.
 *
 * The cost is round trips — ten rows per request is five times the requests of
 * fifty for the same scroll — which is affordable because each page is its own
 * React Query entry: stepping back through cursors already walked is a cache
 * hit, not a fetch. Raise it here if the traffic ever argues louder than the
 * layout; the server's own ceiling is the constant below.
 */
export const INVENTORY_PAGE_SIZE_DEFAULT = 10;
export const INVENTORY_PAGE_SIZE_MAX = 500;

/** Shorter terms are ignored server-side; we do not send them at all. */
export const INVENTORY_SEARCH_MIN_LENGTH = 2;

/** serial-suggest caps at twenty; `limit` may ask for fewer, never more. */
export const SERIAL_SUGGEST_MAX = 20;

const SORT_DIRECTIONS = Object.freeze(["asc", "desc"]);

/**
 * `warehouse` is an integer flag in item_inv — 1 in stock, 0 out — not a label.
 * The server normalises true / "true" / 1 / "1" to 1 on write; mirroring that
 * here keeps a filter built from a checkbox or a select from matching no rows.
 */
const toWarehouseFlag = (value) =>
  value === 1 || value === "1" || value === true || value === "true" ? 1 : 0;

const normalizeSearch = (search) => {
  const term = String(search ?? "").trim();
  return term.length >= INVENTORY_SEARCH_MIN_LENGTH ? term : null;
};

const normalizePageSize = (pageSize) => {
  if (!Number.isInteger(pageSize) || pageSize < 1) {
    return INVENTORY_PAGE_SIZE_DEFAULT;
  }
  return Math.min(pageSize, INVENTORY_PAGE_SIZE_MAX);
};

/** Keeps whitelisted keys only, and coerces the one key that is not a string. */
const normalizeFilters = (filters) => {
  if (!filters || typeof filters !== "object") return {};
  const clean = {};
  for (const key of INVENTORY_FILTER_KEYS) {
    const value = filters[key];
    if (value === undefined || value === null || value === "") continue;
    clean[key] = key === "warehouse" ? toWarehouseFlag(value) : value;
  }
  return clean;
};

/**
 * Body for POST /api/db_item/inventory-page.
 *
 * Deliberately never carries `company_id`. The server resolves the company from
 * the s-company-lq header, which sessionHeaders attaches to every /api/db_*
 * request out of localStorage; a body company_id would come from Redux instead.
 * Those two diverge right after a company switch, and a mismatch is a 400 — so
 * sending only the header removes the failure mode rather than managing it.
 * Any `company_id` passed in is ignored on purpose.
 */
export const buildInventoryPageBody = ({
  filters,
  search,
  sortBy,
  sortDir,
  pageSize,
  cursor = null,
} = {}) => {
  const body = {
    pageSize: normalizePageSize(pageSize),
    // null is the first page. Otherwise the previous response's nextCursor,
    // passed back untouched — it is the server's to read, not ours to build.
    cursor: cursor ?? null,
  };

  const cleanFilters = normalizeFilters(filters);
  if (Object.keys(cleanFilters).length > 0) body.filters = cleanFilters;

  const term = normalizeSearch(search);
  if (term) body.search = term;

  if (INVENTORY_SORT_COLUMNS.includes(sortBy)) {
    body.sortBy = sortBy;
    body.sortDir = SORT_DIRECTIONS.includes(sortDir) ? sortDir : "asc";
  }

  return body;
};

/**
 * Body for POST /api/db_item/inventory-facets.
 *
 * Build it from the same filters and search as the page it describes, or
 * matchedTotal counts a different query than the one on screen.
 */
export const buildInventoryFacetsBody = ({ filters, search, facets } = {}) => {
  const body = {};

  const cleanFilters = normalizeFilters(filters);
  if (Object.keys(cleanFilters).length > 0) body.filters = cleanFilters;

  const term = normalizeSearch(search);
  if (term) body.search = term;

  if (Array.isArray(facets)) {
    const known = facets.filter((facet) => INVENTORY_FACET_KEYS.includes(facet));
    if (known.length > 0) body.facets = known;
  }

  return body;
};

/**
 * Query params for GET /api/db_item/serial-suggest, or null when the term is
 * too short to ask about — the endpoint 400s under two characters, and not
 * asking beats asking and handling the error.
 */
export const buildSerialSuggestParams = ({ q, limit } = {}) => {
  const term = String(q ?? "").trim();
  if (term.length < INVENTORY_SEARCH_MIN_LENGTH) return null;
  return {
    q: term,
    limit:
      Number.isInteger(limit) && limit > 0
        ? Math.min(limit, SERIAL_SUGGEST_MAX)
        : SERIAL_SUGGEST_MAX,
  };
};

/**
 * The filter selects speak in {category, value}; the server speaks in column
 * names. Anything that does not map to a filter column is returned rather than
 * dropped — a silently ignored filter is how a control appears to work while
 * quietly returning everything.
 *
 *   category 2 (Serial Number) → `search`, which covers serial_number by prefix
 *   anything unrecognised      → `unsupported`
 *
 * Category 6 (Staff member) is no longer rendered: it filtered on
 * `assignedToStaffMember`, derived from `usage`, and a real warehouse-items row
 * has no such column — so it matched nothing. The branch below still reports it
 * instead of ignoring it, because a chosen filter can outlive the control that
 * produced it, and because the category returns once the backend settles where
 * "assigned to staff" lives.
 *
 * Condition (category 5) maps to `status`. The select has always built its
 * options from `status` while the client compared them against `condition`,
 * which lives in item_inv_assigned_event and never reaches these rows.
 *
 * @param {Array<{category: number, value: unknown}>} chosenOption
 * @returns {{filters: object, search: string|null, unsupported: number[]}}
 */
export const toServerFilters = (chosenOption) => {
  const byCategory = {
    0: "brand",
    1: "item_group",
    3: "location",
    4: "ownership",
    5: "status",
    7: "logistic_status",
    8: "category_name",
  };

  const filters = {};
  const unsupported = [];
  let search = null;

  for (const chosen of Array.isArray(chosenOption) ? chosenOption : []) {
    const { category, value } = chosen ?? {};
    if (value === undefined || value === null || value === "") continue;

    if (category === 2) {
      search = String(value).trim() || null;
      continue;
    }

    const key = byCategory[category];
    if (!key) {
      unsupported.push(category);
      continue;
    }
    filters[key] = value;
  }

  return { filters, search, unsupported };
};

/**
 * A stable identity for "which query is this", covering everything that
 * invalidates a cursor and nothing that does not.
 *
 * A cursor belongs to one ordering of one filtered set, so any change to
 * filters, search, sort column or direction has to send the table back to page
 * one. Paging itself must not.
 *
 * The same value goes into the React Query key, so the cache and the reset rule
 * cannot end up disagreeing about what counts as the same query.
 */
export const inventoryQuerySignature = ({
  filters,
  search,
  sortBy,
  sortDir,
} = {}) => {
  const cleanFilters = normalizeFilters(filters);
  // Sorted, so two objects with the same pairs in a different insertion order
  // are the same query — otherwise re-picking a filter would reset the cursor.
  const orderedFilters = Object.keys(cleanFilters)
    .sort()
    .map((key) => [key, cleanFilters[key]]);

  const sortable = INVENTORY_SORT_COLUMNS.includes(sortBy) ? sortBy : null;

  return JSON.stringify({
    filters: orderedFilters,
    search: normalizeSearch(search),
    sortBy: sortable,
    sortDir: sortable && SORT_DIRECTIONS.includes(sortDir) ? sortDir : null,
  });
};
