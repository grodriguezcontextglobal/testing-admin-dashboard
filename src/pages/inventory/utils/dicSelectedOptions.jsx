/**
 * The filter selects, keyed by the `category` index that travels inside a
 * chosen filter ({category, value}).
 *
 * 6 ("Staff member") is deliberately absent, and the gap is deliberate too.
 * The filter read `assignedToStaffMember`, derived from `usage` — a field a
 * real warehouse-items response does not contain, so the value was null on
 * every row and the control matched nothing. Renumbering Status from 7 to 6 to
 * close the hole would silently repoint every reader of that index at the wrong
 * column; the gap costs nothing and the index stays meaningful.
 *
 * It returns when the backend settles where "assigned to staff" comes from —
 * leases or events. See FRONTEND_inventory_page_endpoints.md §6.1.
 */
export const dicSelectedOptions = {
  0: "Brand",
  1: "Group",
  2: "Serial Number",
  3: "Location",
  4: "Ownership",
  5: "Condition",
  7: "Status",
  // Added after the others, so it renders last. The index is the wire format
  // of a chosen filter; slotting Category into the vacated 6 would have made a
  // Staff member filter that survived in state come back carrying a person's
  // name under a category label.
  8: "Category",
};

export { OWNERSHIP_LABELS as dictionary } from "../actions/utils/ownershipUtils";
