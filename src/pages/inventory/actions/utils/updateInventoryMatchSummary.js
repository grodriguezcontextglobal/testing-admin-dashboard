/**
 * What a group of matched items has today, summarized for the bulk-update
 * wizard's first two steps: how many items, how they are split across
 * location/ownership/cost, and — per field the wizard lets you overwrite —
 * whether the group already agrees on one value or is "mixed".
 *
 * findReferenceMatches() (referenceLookup.js) narrows the company's inventory
 * down to the matching items; this takes that array and describes it, so a
 * bulk edit stops silently picking the first item's value and calling it the
 * group's value.
 */

/** Fields the update form can overwrite, tracked here for their prefill value
 * and whether the matched group already disagrees on it. */
export const TRACKED_FIELDS = [
  { field: "brand", label: "Brand" },
  { field: "cost", label: "Cost per unit", numeric: true },
  { field: "ownership", label: "Ownership" },
  { field: "return_date", label: "Return date" },
  { field: "location", label: "Location" },
  { field: "sub_location", label: "Sub-location" },
  { field: "main_warehouse", label: "Taxable location" },
  { field: "supplier_info", label: "Supplier" },
  { field: "container", label: "Container" },
  { field: "enableAssignFeature", label: "Assignable to consumers" },
  { field: "image_url", label: "Photo" },
];

const isFilled = (value) =>
  value !== undefined && value !== null && String(value).trim() !== "";

/** Tracked fields the database stores as a tinyint (0/1) rather than text —
 * shown as "Yes"/"No" everywhere in the wizard instead of the raw digit. */
const BOOLEAN_FIELDS = new Set(["container", "enableAssignFeature"]);

export const isTruthyBoolean = (value) =>
  value === true ||
  value === 1 ||
  value === "1" ||
  /yes/i.test(String(value ?? ""));

/**
 * `sub_location` is stored as a JSON-stringified array of path segments
 * ("Miami, FL" > "Rack A" > "Shelf 1"); some API responses hand it back
 * already parsed into an array. Either way this reads as one joined path.
 */
const formatSubLocation = (value) => {
  if (Array.isArray(value)) return value.filter(isFilled).join(" / ");
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.filter(isFilled).join(" / ");
    } catch {
      // Not JSON — fall through and show the raw string.
    }
  }
  return String(value);
};

/**
 * How a tracked field's value should read to a person, given the field it
 * belongs to — the raw value alone can't tell a tinyint boolean from a real
 * number, or a JSON-encoded path from plain text.
 * @returns {string|null} null when there is nothing to show.
 */
export const formatTrackedFieldValue = (field, value) => {
  if (!isFilled(value)) return null;
  if (field === "sub_location") return formatSubLocation(value);
  if (BOOLEAN_FIELDS.has(field)) return isTruthyBoolean(value) ? "Yes" : "No";
  if (field === "cost") {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? `$${numeric.toFixed(2)}` : String(value);
  }
  return String(value);
};

const distinctValues = (items, field) => {
  const values = items.map((item) => item?.[field]).filter(isFilled);
  return [...new Set(values.map((value) => String(value)))];
};

/**
 * The one value a group agrees on for a field, or `null` when it does not.
 *
 * This is the rule the wizard keeps rediscovering — pre-fill only when there is
 * exactly one candidate, otherwise leave the field to the operator — written
 * once. A blank counts as "not recorded", not as a second variant, so a group
 * where half the units have a location and half have none still agrees on it.
 * (`findReferenceMatches` applies the same rule to `image_url` in
 * referenceLookup.js, three lines of its own; the two say the same thing.)
 *
 * A group of one agrees with itself, which is why "only one item to copy from"
 * needs no special case.
 */
export const agreedValue = (items, field) => {
  const list = Array.isArray(items) ? items : [];
  if (distinctValues(list, field).length !== 1) return null;
  return list.find((item) => isFilled(item?.[field]))?.[field] ?? null;
};

/**
 * Fields the add-inventory form can be pre-filled with from a copied group.
 *
 * `main_warehouse` is the item's field; the form calls it `tax_location`. The
 * caller does that mapping — this module describes inventory, not a form.
 */
/** A tracked field's name for a person, read off the one list that has them. */
export const trackedFieldLabel = (field) =>
  TRACKED_FIELDS.find((tracked) => tracked.field === field)?.label ?? field;

export const PREFILLABLE_FIELDS = [
  "location",
  "main_warehouse",
  "sub_location",
  "enableAssignFeature",
  "container",
  "containerSpotLimit",
];

/**
 * @param {Array<object>} matches - items returned by findReferenceMatches().
 * @param {string[]} [fields]
 * @returns {{agreed: Record<string, *>, mixed: string[]}} what can be filled in
 *   safely, and which fields were left alone because the group disagrees.
 */
export const agreedFieldValues = (matches, fields = PREFILLABLE_FIELDS) => {
  const list = Array.isArray(matches) ? matches : [];
  const agreed = {};
  const mixed = [];

  for (const field of fields) {
    if (list.length === 0) continue;
    const value = agreedValue(list, field);
    if (value !== null) agreed[field] = value;
    else if (distinctValues(list, field).length > 1) mixed.push(field);
  }

  return { agreed, mixed };
};

const EMPTY_SUMMARY = {
  matchCount: 0,
  locationCount: 0,
  ownershipTypeCount: 0,
  costRange: null,
  inWarehouseCount: 0,
  elsewhereCount: 0,
  fields: {},
};

/**
 * @param {Array<object>} matches - items returned by findReferenceMatches().
 * @returns matchCount, how many distinct locations/ownership types are
 *   represented, the cost range across the group, how many are physically in
 *   the warehouse vs out (on an event, assigned, lost), and per tracked field
 *   the representative value plus whether the group is mixed on it.
 */
export const summarizeInventoryMatches = (matches) => {
  const items = Array.isArray(matches) ? matches : [];
  if (items.length === 0) return EMPTY_SUMMARY;

  const costValues = items
    .filter((item) => isFilled(item?.cost))
    .map((item) => Number(item.cost))
    .filter((value) => Number.isFinite(value));

  const inWarehouseCount = items.filter((item) =>
    isFilled(item?.logistic_status)
      ? item.logistic_status === "in-stock"
      : Number(item?.warehouse) === 1,
  ).length;

  const fields = {};
  TRACKED_FIELDS.forEach(({ field }) => {
    const distinct = distinctValues(items, field);
    const representative = items.find((item) => isFilled(item?.[field]));
    fields[field] = {
      value: representative ? representative[field] : null,
      mixed: distinct.length > 1,
      distinctCount: distinct.length,
    };
  });

  return {
    matchCount: items.length,
    locationCount: distinctValues(items, "location").length,
    ownershipTypeCount: distinctValues(items, "ownership").length,
    costRange: costValues.length
      ? { min: Math.min(...costValues), max: Math.max(...costValues) }
      : null,
    inWarehouseCount,
    elsewhereCount: items.length - inWarehouseCount,
    fields,
  };
};
