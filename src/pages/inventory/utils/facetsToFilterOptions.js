import { dicSelectedOptions } from "./dicSelectedOptions";

/**
 * The `facets` block of inventory-facets, reshaped into the object the filter
 * selects read — keyed by the select's category index.
 *
 * Replaces `Object.keys(groupBy(baseDataset, prop))`, which could only ever
 * describe the rows already in memory. A page of fifty rows knows fifty brands.
 *
 * Index 2 (Serial Number) stays empty on purpose: it is an autocomplete against
 * serial-suggest, because one option per item is not a dropdown, it is the
 * inventory.
 */
const FACET_BY_CATEGORY = Object.freeze({
  0: "brand",
  1: "item_group",
  3: "location",
  4: "ownership",
  // The select is labelled Condition; the column is `status`. Same crossing the
  // old client got wrong by comparing against `condition`, a field these rows
  // never carry.
  5: "status",
  7: "logistic_status",
  8: "category_name",
});

/**
 * @param {Record<string, Array<{value: string, count: number}>>} facets
 * @returns {Record<string, string[]>} one array per select index — always an
 *   array, including for indices the server said nothing about, because the
 *   selects index into this directly and `undefined` renders a dropdown that
 *   throws rather than one that is empty.
 */
export const facetsToFilterOptions = (facets) => {
  const source = facets && typeof facets === "object" ? facets : {};
  const options = {};

  for (const index of Object.keys(dicSelectedOptions)) {
    const facetKey = FACET_BY_CATEGORY[index];
    const values = facetKey ? source[facetKey] : null;
    options[index] = Array.isArray(values)
      ? values
          // Order is the server's: it sorts by count, which floats the values
          // a user is most likely to want to the top of a long list.
          .map((entry) => entry?.value)
          .filter((value) => value !== undefined && value !== null && value !== "")
      : [];
  }

  return options;
};
