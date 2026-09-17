import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../api/devitrakApi";
import { buildSerialSuggestParams } from "../inventoryPageContract";
import { inventorySerialSuggestKey } from "../inventoryQueryKeys";

/**
 * Serial numbers that start with what the operator has typed so far.
 *
 * The Serial Number select used to hold one option per item: with fifty
 * thousand items, fifty thousand options in a dropdown, built by grouping a
 * dataset the page no longer downloads. It becomes an autocomplete instead, and
 * the list is the server's answer to the prefix — twenty at most, which is the
 * endpoint's own cap.
 *
 * Two guards, both of them the endpoint's rules rather than ours: nothing is
 * asked under two characters (it answers 400), and the burst of keystrokes a
 * scanner produces is collapsed into one request. A scanned serial arrives as
 * eight keystrokes in a few milliseconds; without the debounce that is eight
 * requests for an answer only the last one needs.
 *
 * @param {{term?: string, enabled?: boolean, limit?: number, delay?: number}} params
 * @returns {{suggestions: string[], isLoading: boolean, tooShort: boolean}}
 */
const useSerialSuggest = ({ term, enabled = false, limit, delay = 250 } = {}) => {
  const companyId = useSelector((state) => state.admin.user?.sqlInfo?.company_id);
  const [settledTerm, setSettledTerm] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setSettledTerm(term ?? ""), delay);
    return () => clearTimeout(timer);
  }, [term, delay]);

  // null below two characters, which is also what turns the query off: one
  // decision, taken in the contract module, read here rather than repeated.
  const params = buildSerialSuggestParams({ q: settledTerm, limit });

  const query = useQuery({
    queryKey: inventorySerialSuggestKey(companyId, params),
    queryFn: () => devitrakApi.get("/db_item/serial-suggest", { params }),
    enabled: Boolean(enabled && companyId && params),
    staleTime: 60 * 1000,
    keepPreviousData: true,
  });

  // The select takes strings; the endpoint sends rows carrying item_id,
  // category_name and item_group besides the serial. Memoised because this
  // feeds an options array, and a new array identity on every render is how the
  // other two hooks on this page learned to loop.
  const suggestions = useMemo(() => {
    const items = query.data?.data?.items;
    if (!Array.isArray(items)) return EMPTY_SUGGESTIONS;
    return items
      .map((item) => item?.serial_number)
      .filter((serial) => typeof serial === "string" && serial !== "");
  }, [query.data]);

  return {
    suggestions,
    isLoading: query.isFetching,
    // The select says what it is waiting for rather than showing an empty list
    // that looks like "no matches".
    tooShort: params === null,
  };
};

/** One frozen empty array, so "nothing yet" is the same value every time. */
const EMPTY_SUGGESTIONS = Object.freeze([]);

export default useSerialSuggest;
