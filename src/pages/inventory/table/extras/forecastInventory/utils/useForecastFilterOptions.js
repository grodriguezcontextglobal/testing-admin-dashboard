import { useMemo } from "react";
import useInventoryFacets from "../../../../utils/hooks/useInventoryFacets";
import {
  cascadeOptionsFromRows,
  facetFiltersExcept,
  forecastContextFromFacets,
} from "./forecastSearch";

/**
 * The forecast's four option lists, each narrowed by the other filters picked.
 *
 * Two sources, matching the two ways the inventory page loads:
 * - `rows`: the whole inventory in memory (server pagination off), narrowed
 *   here by cascadeOptionsFromRows.
 * - `fromServer`: one inventory-facets call with every filter picked. The
 *   server already never narrows a facet by itself
 *   (FRONTEND_inventory_page_endpoints.md §3), which is the same rule. With
 *   nothing picked it is the unfiltered call the table already made, so opening
 *   the modal costs no request.
 *
 * Returns `context: null` with neither, so the modal keeps its plain lists.
 * `settled` is false while a narrowed list is still on its way, so nothing is
 * judged ruled out against a list that is about to change.
 */
const useForecastFilterOptions = ({ filters, rows = null, fromServer = false }) => {
  const facetsQuery = useInventoryFacets({
    enabled: fromServer,
    filters: facetFiltersExcept(filters, null),
  });

  const serverContext = useMemo(
    () => (fromServer ? forecastContextFromFacets(facetsQuery.facets) : null),
    [fromServer, facetsQuery.facets]
  );

  const rowsContext = useMemo(
    () =>
      !fromServer && Array.isArray(rows) && rows.length > 0
        ? cascadeOptionsFromRows(rows, filters)
        : null,
    [fromServer, rows, filters]
  );

  if (fromServer) {
    return { context: serverContext, settled: !facetsQuery.isFetching };
  }
  return { context: rowsContext, settled: true };
};

export default useForecastFilterOptions;
