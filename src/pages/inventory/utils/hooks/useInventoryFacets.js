import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../api/devitrakApi";
import { buildInventoryFacetsBody } from "../inventoryPageContract";
import { inventoryServerFacetsKey } from "../inventoryQueryKeys";

/**
 * The filter options and the filtered total, from
 * POST /api/db_item/inventory-facets.
 *
 * Replaces two things the table used to derive from having every row in memory:
 * the eight filter dropdowns, built with `Object.keys(groupBy(dataset, prop))`,
 * and the result count, which was `dataToDisplay.length`. Neither survives
 * server-side pagination — a page of fifty rows knows fifty brands.
 *
 * Takes the same filters and search as the page it describes, or `matchedTotal`
 * counts a different query than the one on screen. It deliberately does NOT
 * take the cursor: facets describe the whole filtered set, so re-running the
 * aggregate on every Next click would be exactly the cost this endpoint exists
 * to avoid.
 *
 * @param {{enabled?: boolean, filters?: object, search?: string,
 *   facets?: string[]}} params
 */
const useInventoryFacets = ({ enabled = false, filters, search, facets } = {}) => {
  const companyId = useSelector((state) => state.admin.user?.sqlInfo?.company_id);

  const query = useQuery({
    queryKey: inventoryServerFacetsKey(companyId, { filters, search }),
    queryFn: () =>
      devitrakApi.post(
        "/db_item/inventory-facets",
        buildInventoryFacetsBody({ filters, search, facets }),
      ),
    enabled: Boolean(enabled && companyId),
    staleTime: 60 * 1000,
    keepPreviousData: true,
  });

  const body = query.data?.data;

  return {
    facets: body?.facets ?? {},
    // null, not 0, until the answer arrives: zero is a real result — "nothing
    // matches" — and showing it while loading tells the user something false.
    matchedTotal: typeof body?.matchedTotal === "number" ? body.matchedTotal : null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

export default useInventoryFacets;
