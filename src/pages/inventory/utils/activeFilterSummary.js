import { dicSelectedOptions } from "./dicSelectedOptions";
import { dicForLogisticStatus } from "./FilterOptionsUX";

/**
 * Describing what the user asked for, so an empty table can say why it is empty.
 *
 * The filters are AND: Brand Dell *and* Group Laptop shows only rows matching
 * both, and a combination that exists in neither direction — Brand Dell with an
 * HP group — legitimately matches nothing. That is the feature working, not a
 * failure, but the table cannot say so on its own: zero rows from a filter and
 * zero rows from an empty company look exactly alike and mean opposite things.
 *
 * Kept out of the component because it is the part worth pinning down in a test,
 * and because the copy has to agree with the labels on the selects.
 */

/** Whether the user has narrowed anything at all. */
export const hasActiveCriteria = (chosenOption, searchTerm) =>
  (Array.isArray(chosenOption) && chosenOption.length > 0) ||
  String(searchTerm ?? "").trim().length > 0;

/**
 * "Brand: Dell · Group: Laptop · Search: "00100"" — the criteria in the order
 * the user built them, named the way the controls name them.
 *
 * A category with no select is skipped rather than shown under a raw index: a
 * chosen filter can outlive the control that produced it (category 6, Staff
 * member), and naming something the user cannot see is worse than saying less.
 */
export const activeFilterSummary = (chosenOption, searchTerm) => {
  const parts = [];

  for (const chosen of Array.isArray(chosenOption) ? chosenOption : []) {
    const label = dicSelectedOptions[chosen?.category];
    if (!label || chosen?.value === undefined || chosen?.value === null) continue;
    // The Status select shows "In transit" while the row holds "in-transit".
    const value =
      chosen.category === 7
        ? (dicForLogisticStatus[chosen.value] ?? chosen.value)
        : chosen.value;
    parts.push(`${label}: ${value}`);
  }

  const term = String(searchTerm ?? "").trim();
  if (term) parts.push(`Search: "${term}"`);

  return parts.join(" · ");
};
