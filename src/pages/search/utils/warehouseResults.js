/**
 * Search results for units that never left the shelf.
 *
 * Searching a serial used to answer with nothing whenever the unit was sitting
 * in the warehouse. `SearchDevice` asked the inventory endpoint for matches and
 * then used the answer only as a signal:
 *
 *     if (result.some((item) => item.warehouse < 1)) {
 *       return checkPoolEventInventory();
 *     }
 *     return setFoundDeviceData([]);      // everything on the shelf, discarded
 *
 * Two failures in four lines. A result that was entirely in stock was thrown
 * away on purpose, and because the test was `some`, one unit out of ten being
 * checked out sent the whole list down the event branch, where the nine on the
 * shelf were never looked at either.
 *
 * Searching is meant to answer "where is this one", and "on the shelf in the IT
 * office" is an answer. These helpers split the result instead of choosing a
 * branch for it, so both halves can be rendered together.
 *
 * The rows come from `GET /db_company/search-inventory`, which returns MySQL
 * item rows: snake_case, with `warehouse` as the in-stock flag.
 */

import resolveItemRowId from "../../inventory/utils/itemRowId";

const text = (value) => String(value ?? "").trim();

/**
 * On the shelf. Anything that is not a readable number of 1 or more counts as
 * out — the same reading the old `warehouse < 1` test had, kept deliberately so
 * a row with no flag is never presented as being in stock when it is not.
 */
export const isInWarehouse = (row) => {
  const flag = Number(row?.warehouse);
  return Number.isFinite(flag) && flag >= 1;
};

/** Both halves of a mixed result, rather than one branch for all of it. */
export const splitByWarehouse = (rows) => {
  const list = Array.isArray(rows) ? rows : [];
  return {
    inWarehouse: list.filter(isInWarehouse),
    out: list.filter((row) => !isInWarehouse(row)),
  };
};

/**
 * One shelf row as the result card reads it.
 *
 * `event` is null and `active` false because neither is true of a unit in
 * stock; `inWarehouse` is what the card uses to say so, instead of falling
 * through to a label about an event this unit is not at.
 *
 * Field names are read snake_case first — that is what the SQL rows carry —
 * with the camelCase spellings as a fallback, since the same unit reaches other
 * screens under those.
 */
export const warehouseCard = (row, { image } = {}) => ({
  serialNumber: text(row?.serial_number ?? row?.serialNumber),
  type: text(row?.item_group ?? row?.deviceType),
  brand: text(row?.brand),
  location: text(row?.location ?? row?.warehouse_location),
  status: text(row?.status ?? row?.condition),
  /* The canonical resolver, not `row.item_id`: it rejects the stringified
     nothings ("undefined", "null") that would navigate to an item page with no
     item. Returns a string, which is what the URL wants anyway. */
  itemId: resolveItemRowId(row),
  image: image ?? false,
  event: null,
  active: false,
  inWarehouse: true,
  data: row,
});

/**
 * One card per serial, first one wins.
 *
 * The effect that builds these re-runs on a timer, and the original appended
 * freshly-built objects into a `new Set()` — which deduplicates nothing, since
 * every template is its own reference. First-wins matters: a unit found through
 * its event carries the event, and a later shelf row for the same serial must
 * not replace it with a card that says nothing.
 *
 * A card with no serial is kept as it is: there is nothing to match it on, and
 * collapsing those into one would hide units rather than tidy the list.
 */
export const dedupeBySerial = (cards) => {
  const list = Array.isArray(cards) ? cards : [];
  const seen = new Set();
  return list.filter((card) => {
    const key = text(card?.serialNumber).toLowerCase();
    if (!key) return true;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
