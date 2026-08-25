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
 */

/**
 * The first element of every key above. Exported for the drift test, which
 * scrapes the page components for the queries they actually register.
 */
export const INVENTORY_PAGE_QUERY_NAMES = [
  "companyHasInventoryQuery",
  "listOfItemsInStock",
  "ItemsInInventoryCheckingQuery",
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
  ["listOfItemsInStock"],
  ["ItemsInInventoryCheckingQuery"],
  ["RefactoredListInventoryCompany"],
  ["imagePerItemList"],
  ["structuredCompanyInventory"],
  ["locations", companyId],
  ["locationsAndSublocationsWithTypes"],
  ["locationPathsTree", companyId],
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
