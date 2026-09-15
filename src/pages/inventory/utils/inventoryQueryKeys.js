import { inventoryQuerySignature } from "./inventoryPageContract";

/**
 * Every React Query the /inventory page mounts, in one place.
 *
 * Each write path — create one item, create a bulk group, import a spreadsheet,
 * edit an item — had its own hand-written list of what to invalidate, and every
 * one of them was a subset. The two that mattered most were missing everywhere:
 *
 *   - companyHasInventoryQuery is the landing fetch. It decides whether the
 *     page shows the table or the empty-state banner, it supplies the total
 *     count, and it caches for five minutes. Creating an item and navigating
 *     back to /inventory showed the pre-creation state for up to five minutes.
 *   - structuredCompanyInventory feeds the Locations / Categories / Groups /
 *     Brands cards. A new item did not appear under its group until something
 *     else happened to evict it.
 *
 * Keys are built here so a query added to the page is added to the writes too;
 * inventoryQueryKeys.test.js fails when the two drift apart.
 *
 * The module holds two lists, and they are not the same list. What the page
 * mounts is one question; what a write from this page has to invalidate is
 * another, and it is the wider of the two — a screen elsewhere can read the
 * same inventory this page just changed.
 */

/**
 * The first element of every key the /inventory page itself registers.
 * Exported for the drift test, which scrapes the page components for the
 * queries they actually mount.
 *
 * Deliberately NOT the same list as inventoryPageQueryKeys below: two keys the
 * page no longer mounts are still worth clearing from here. See the note there.
 */
export const INVENTORY_PAGE_QUERY_NAMES = [
  "companyHasInventoryQuery",
  "RefactoredListInventoryCompany",
  "imagePerItemList",
  "structuredCompanyInventory",
  "locations",
  "locationsAndSublocationsWithTypes",
  "locationPathsTree",
];

/**
 * @param {number|string} companyId - the SQL company id (user.sqlInfo.company_id).
 *   Passed through as given: consumers invalidate with `exact: true`, which
 *   deep-compares, so coercing a number to a string here would stop matching
 *   the key the page registered.
 */
export const inventoryPageQueryKeys = (companyId) => [
  ["companyHasInventoryQuery", companyId],
  ["RefactoredListInventoryCompany"],
  ["imagePerItemList"],
  // The /inventory table stopped mounting these two when the legacy join was
  // removed, but they are not dead: nine other screens still register queries
  // under the same names — the home page's location table, the add/edit/bulk
  // item flows, the consumer assignment drawer. They read the same inventory a
  // write from this page just changed, so dropping them here would let someone
  // create an item on /inventory and find the old count waiting on /home.
  ["listOfItemsInStock"],
  ["ItemsInInventoryCheckingQuery"],
  ["structuredCompanyInventory"],
  ["locations", companyId],
  ["locationsAndSublocationsWithTypes"],
  ["locationPathsTree", companyId],
];

/**
 * Keys for the server-paginated queries (FEATURE_INVENTORY_SERVER_PAGINATION).
 *
 * Every key above is a bare constant, which was survivable only because each of
 * those queries returned the whole company's inventory: one company, one
 * answer. These two stand for "page 3 of this filtered set" and "the options
 * for this filtered set", so the company and the query have to be part of the
 * key or React Query serves a cache hit from a different question entirely.
 *
 * The query half comes from inventoryQuerySignature, the same function the page
 * uses to decide the cursor is stale — one definition of "the same query", so
 * the cache and the reset rule cannot drift apart.
 *
 * @param {number|string} companyId - user.sqlInfo.company_id, passed through as
 *   given (consumers match with `exact: true`, which deep-compares).
 * @param {{filters?: object, search?: string, sortBy?: string, sortDir?: string,
 *   cursor?: object|null}} query
 */
export const inventoryServerPageKey = (companyId, query = {}) => [
  "inventoryServerPage",
  companyId,
  inventoryQuerySignature(query),
  // Each page gets its own entry, so stepping back through the cursors you
  // already walked is a cache hit rather than a round trip.
  query.cursor ?? null,
];

/**
 * Facets describe the whole filtered set, not the page, so the cursor is
 * deliberately absent: including it would refire the aggregate query on every
 * Next click, which is the cost this endpoint exists to avoid.
 */
export const inventoryServerFacetsKey = (companyId, query = {}) => [
  "inventoryServerFacets",
  companyId,
  inventoryQuerySignature(query),
];

/**
 * Backend response-cache keys the inventory writes clear alongside the client
 * cache. Keyed by the Mongo company id (user.companyData.id), not the SQL one.
 */
export const inventoryCacheKeys = ({ companyMongoId }) => [
  `company_id=${companyMongoId}&warehouse=true&enableAssignFeature=1`,
  `providerCompanies_${companyMongoId}`,
];

/**
 * Mark the whole inventory page stale and refetch whatever is on screen.
 *
 * Never rejects: this runs after the write has already succeeded, and a failed
 * cache invalidation must not surface to the user as a failed save. The worst
 * case is the data the user would have seen anyway.
 */
export const invalidateInventoryQueries = async (
  queryClient,
  { companyId } = {},
) => {
  if (!queryClient?.invalidateQueries) return;
  await Promise.allSettled(
    inventoryPageQueryKeys(companyId).map((queryKey) =>
      queryClient.invalidateQueries({
        queryKey,
        exact: true,
        refetchType: "active",
      }),
    ),
  );
};
