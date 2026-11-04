/**
 * What the "assign a new device" form fills in when the reference item group
 * changes (AssignemntNewDeviceInInventory).
 *
 * An existing group's fields are copied, except `container` and
 * `serial_number`; `enableAssignFeature` is switched on, quantity reset. Its
 * sub-locations, when it has any, go to their own list instead of the field.
 * A group that does not exist yet changes nothing.
 *
 * @param {string|undefined} reference
 * @param {Map<string, object>} itemsByGroup one inventory row per item_group
 * @returns {{values: Array<[string, unknown]>, subLocations: string[]|null}}
 */
const NOT_COPIED = new Set(["container", "serial_number"]);

const parseList = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const assignmentReferenceFill = (reference, itemsByGroup) => {
  const group = itemsByGroup.has(reference) ? itemsByGroup.get(reference) : null;
  if (!group) return { values: [], subLocations: null };

  const values = [];
  let subLocations = null;
  for (const [key, value] of Object.entries(group)) {
    if (NOT_COPIED.has(key)) continue;
    if (key === "enableAssignFeature") {
      values.push([key, "Enabled"]);
      continue;
    }
    if (key === "sub_location") {
      const list = parseList(value);
      if (list.length > 0) {
        subLocations = [...list];
        continue;
      }
    }
    values.push([key, value]);
  }
  if (values.length > 0 || subLocations) values.push(["quantity", 0]);
  return { values, subLocations };
};
