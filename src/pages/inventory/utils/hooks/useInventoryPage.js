import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../api/devitrakApi";
import {
  buildInventoryPageBody,
  inventoryQuerySignature,
} from "../inventoryPageContract";
import { inventoryServerPageKey } from "../inventoryQueryKeys";

/**
 * One page of the inventory table, from POST /api/db_item/inventory-page.
 *
 * Keyset pagination, not offset: the server hands back a `nextCursor` and the
 * client hands it straight back to walk forward. There is no page number to
 * jump to, so the hook keeps the trail of cursors it has walked and exposes
 * next / previous instead.
 *
 * The cursor is only valid for the query that produced it. Any change to
 * filters, search, sort column or direction sends the table back to page one —
 * that is what the signature watches. Page size deliberately does not: resizing
 * the page is not a different question.
 *
 * @param {{enabled?: boolean, filters?: object, search?: string,
 *   sortBy?: string, sortDir?: string, pageSize?: number}} params
 */
const useInventoryPage = ({
  enabled = false,
  filters,
  search,
  sortBy,
  sortDir,
  pageSize,
} = {}) => {
  const companyId = useSelector((state) => state.admin.user?.sqlInfo?.company_id);

  const signature = inventoryQuerySignature({ filters, search, sortBy, sortDir });

  // The cursors already walked. Index 0 is null — page one asks for no cursor.
  const [trail, setTrail] = useState([null]);
  const previousSignature = useRef(signature);

  useEffect(() => {
    if (previousSignature.current === signature) return;
    previousSignature.current = signature;
    setTrail([null]);
  }, [signature]);

  const cursor = trail[trail.length - 1];

  const query = useQuery({
    queryKey: inventoryServerPageKey(companyId, {
      filters,
      search,
      sortBy,
      sortDir,
      cursor,
    }),
    queryFn: () =>
      devitrakApi.post(
        "/db_item/inventory-page",
        // No company_id: it travels in the s-company-lq header, and a second
        // copy read from Redux can disagree with it after a company switch —
        // which the server answers with a 400.
        buildInventoryPageBody({ filters, search, sortBy, sortDir, pageSize, cursor }),
      ),
    enabled: Boolean(enabled && companyId),
    // A page the user already walked past is still the page they come back to
    // when they press Previous, so keep it rather than refetching the trail.
    staleTime: 60 * 1000,
    keepPreviousData: true,
  });

  const body = query.data?.data;
  const hasMore = Boolean(body?.hasMore && body?.nextCursor);

  // An array that is empty-but-present, never undefined: components gated on a
  // truthy dataset render nothing at all while a query is in flight, and that
  // has bitten this page before.
  const items = useMemo(
    () => (Array.isArray(body?.items) ? body.items : []),
    [body?.items],
  );

  const nextPage = useCallback(() => {
    if (!hasMore) return;
    setTrail((walked) => [...walked, body.nextCursor]);
  }, [hasMore, body?.nextCursor]);

  const previousPage = useCallback(() => {
    setTrail((walked) => (walked.length > 1 ? walked.slice(0, -1) : walked));
  }, []);

  const resetToFirstPage = useCallback(() => setTrail([null]), []);

  return {
    items,
    cursor,
    hasMore,
    hasPrevious: trail.length > 1,
    pageNumber: trail.length,
    nextPage,
    previousPage,
    resetToFirstPage,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

export default useInventoryPage;
