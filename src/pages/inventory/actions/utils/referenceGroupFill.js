/**
 * What AddNewItem writes into the form when the "reference item group"
 * changes, as [field, value] pairs applied in order with setValue.
 *
 * - An existing group: copy its fields, except the ones that belong to a unit
 *   (serial number, location, sub-location, container, assign flag), and reset
 *   quantity.
 * - Anything else: it is a new group name; only `item_group` is set.
 * - An empty reference also clears the fields a previous pick filled in.
 *
 * @param {string|undefined} reference the field's value
 * @param {Map<string, object>} itemsByGroup one inventory row per item_group
 * @returns {Array<[string, unknown]>}
 */
const NOT_COPIED = new Set([
  "enableAssignFeature",
  "container",
  "sub_location",
  "location",
  "serial_number",
]);

const CLEARED = [
  ["item_group", ""],
  ["photo", []],
  ["category_name", ""],
  ["cost", ""],
  ["brand", ""],
  ["descript_item", ""],
  ["min_serial_number", ""],
  ["max_serial_number", ""],
  ["sub_location", ""],
  ["quantity", 0],
  ["container", ""],
  ["containerSpotLimit", "0"],
  ["enabledAssignFeature", 1],
];

export const referenceGroupFormValues = (reference, itemsByGroup) => {
  const entries = [];
  if (itemsByGroup.has(reference)) {
    const copied = Object.entries(itemsByGroup.get(reference) ?? {}).filter(
      ([key]) => !NOT_COPIED.has(key),
    );
    if (copied.length > 0) entries.push(...copied, ["quantity", 0]);
  } else {
    entries.push(["item_group", reference]);
  }
  if (reference?.length === 0) entries.push(...CLEARED);
  return entries;
};
