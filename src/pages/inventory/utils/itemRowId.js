/**
 * The item id behind a row of any inventory table.
 *
 * Five detail tables (category, brand, group, ownership, location) and the All
 * devices table each build their rows differently, and the id ends up in a
 * different place in each: on the row, under a nested `data`, or only inside
 * the composed row `key`. The arrow icon in ColumnsTableMain has to find it
 * wherever it is, because navigating without it lands on an item page with no
 * item.
 *
 * The bug this replaces: the icon read the id as
 * `String(record.key).split("-")[0]`. The detail tables build
 * `key: `${data.item_id}-${uniqueId()}``, so a row whose `item_id` never
 * arrived got the key "undefined-47" — and the split handed back the *string*
 * "undefined", which is truthy. The `disabled={!itemId}` guard therefore never
 * tripped, and the click navigated to `/inventory/item?id=undefined`. The URL
 * changed, the page had nothing to load, and to the operator the icon did
 * nothing at all.
 */

/** The stringified nothings that reach the client as if they were ids. */
const NOT_AN_ID = new Set(["", "undefined", "null", "NaN", "false"]);

const usableId = (value) => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return NOT_AN_ID.has(text) ? null : text;
};

/**
 * @param {object} record a row from any of the inventory tables
 * @returns {string|null} the id to navigate with, or null when the row does not
 *   carry one — in which case the caller must not offer the navigation.
 */
export const resolveItemRowId = (record) => {
  if (!record) return null;

  /* The row's own id first: the nested `data` is the *inventory* row joined in
     by serial number, which can be a different record for the same serial. */
  const direct =
    usableId(record.item_id) ??
    usableId(record.id) ??
    usableId(record.data?.item_id) ??
    usableId(record.data?.id);
  if (direct) return direct;

  /* Last resort: the composed row key. Only its first segment is the id, and
     it is only an id if it survives the same check as the fields above. */
  return usableId(String(record.key ?? "").split("-")[0]);
};

export default resolveItemRowId;
