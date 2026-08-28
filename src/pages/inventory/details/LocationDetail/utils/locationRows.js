import { groupBy } from "lodash";

/**
 * The rows of the location detail table.
 *
 * Two sources are joined by serial number: the catalog answer from
 * `inventory.byAttribute` (what the company owns of this location) and
 * `inventory-based-on-location-and-sublocation` (where each unit currently is).
 * Only items present in both are shown, since the second is what places the
 * item in this location at all.
 *
 * ## The key
 *
 * The row key is the item id, and nothing else. It used to be
 * `${data.item_id}-${uniqueId()}`, which handed every row a new React key on
 * each build — and the caller rebuilt on every render, because it memoized on a
 * `groupBy(...)` recomputed inline. Rows unmounted and remounted continuously,
 * so a mousedown and its mouseup never landed on the same button and the arrow
 * icon produced no click at all. A stable key is the fix; keeping it stable is
 * what the test pins.
 */

const idOf = (item) => item?.item_id ?? item?.id ?? null;

/**
 * @param {object[]} items catalog entries for the location
 * @param {object[]} inventoryItems the located inventory rows, by serial number
 * @param {Record<string, object[]>} imagesByGroup images grouped by item_group
 * @returns {object[]} table rows, keyed stably by item id
 */
export const buildLocationRows = ({ items, inventoryItems, imagesByGroup }) => {
  const catalog = Array.isArray(items) ? items : [];
  if (catalog.length === 0) return [];

  const located = groupBy(
    Array.isArray(inventoryItems) ? inventoryItems : [],
    "serial_number"
  );
  const images = imagesByGroup ?? {};

  /* A Map rather than a Set: the old builder collected freshly-created objects
     into a Set, which deduplicates nothing, so a serial appearing twice in the
     catalog was rendered twice. */
  const rows = new Map();

  for (const entry of catalog) {
    const placed = located[entry?.serial_number]?.at(-1);
    if (!placed) continue;

    /* The catalog entry is the row, but the located row is the truth about
       where the unit is and what it looks like. */
    const key = String(idOf(entry) ?? idOf(placed) ?? entry.serial_number);
    if (rows.has(key)) continue;

    rows.set(key, {
      key,
      item_id: idOf(entry) ?? idOf(placed),
      ...entry,
      data: { ...entry, location: placed.location, ...placed },
      location: placed.location,
      image_url:
        placed.image_url || images[entry?.item_group]?.at(-1)?.source || null,
    });
  }

  return Array.from(rows.values());
};

/**
 * The table's own search. Returns the input array unchanged when there is
 * nothing to search for, so a caller's memo does not invalidate needlessly.
 */
export const filterLocationRows = (rows, searchItem) => {
  if (!Array.isArray(rows)) return [];
  const needle = String(searchItem ?? "").trim().toLowerCase();
  if (needle === "") return rows;

  return rows.filter((row) =>
    JSON.stringify(row).toLowerCase().includes(needle)
  );
};
