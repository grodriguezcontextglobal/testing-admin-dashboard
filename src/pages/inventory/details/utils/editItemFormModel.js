/**
 * Turning a stored inventory item into the values the edit form renders, and
 * back.
 *
 * EditItemModal used to seed the form by walking the record's own keys and
 * calling setValue(key, value) for each. That only fills a field whose name
 * happens to equal a column name, and three of them do not:
 *
 *   - "Taxable location" is `tax_location` in the form, `main_warehouse` in the
 *     database. It came up blank, and the submit handler refuses a blank
 *     tax_location — so editing anything at all failed with "All fields are
 *     required" until the user re-picked a value that was never actually
 *     missing.
 *   - "Supplier" is `supplier` in the form and `supplier_info` (an id) in the
 *     database. It came up blank, and a blank supplier is written back as
 *     null — so every edit silently dropped the item's supplier.
 *   - The rented return date lives in `returningDate` component state, which
 *     the seed never touched, so it reset to today on every edit.
 *
 * Extra identifiers had the same shape of problem from the other direction:
 * they were sent as [] unless the "Add more information" panel had been opened,
 * so a routine edit erased them.
 *
 * All of it is pure data mapping, so it lives here where it can be tested,
 * rather than inside a modal that also talks to the network.
 */

import {
  encodeExtraIdentifiers,
  parseExtraIdentifiers,
} from "../../utils/extraIdentifiers";

const CONTAINER_YES = "Yes - It is a container";
const CONTAINER_NO = "No - It is not a container";

/**
 * The flags arrive as 1/0 from SQL, but a boolean or a numeric string turns up
 * often enough (different endpoints, different serializers) that reading them
 * as `value > 0` — which is false for `"true"` — is not worth the risk.
 */
const isFlagOn = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  const text = String(value ?? "").trim().toLowerCase();
  return text === "1" || text === "true" || text === "yes";
};

/** Sub-locations are stored JSON-encoded, but not always. */
export const parseSubLocations = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (typeof raw !== "string" || raw.trim() === "") return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

/**
 * `return_date` is stored as "YYYY-MM-DD HH:mm:ss". Swapping the space for a
 * "T" is what makes it parse as local time everywhere rather than relying on
 * engine-specific tolerance for the space form.
 */
export const parseReturnDate = (raw) => {
  const text = String(raw ?? "").trim();
  if (!text) return null;
  const parsed = new Date(text.replace(" ", "T"));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * Extra identifiers for this item. Delegates to the shared codec, which reads
 * every shape the column has been written in — including the plain object the
 * XLSX importer produces, which the reader that used to live here could not
 * parse, so a spreadsheet-imported item looked like it had no identifiers.
 */
export const parseExtraInfoEntries = (item) =>
  parseExtraIdentifiers(item?.extra_serial_number, item?.serial_number);

export const buildExtraSerialNumberPayload = ({ serialNumber, entries }) =>
  encodeExtraIdentifiers([[serialNumber, entries ?? []]]);

/** dicSuppliers is the [name, id] pair list useSuppliers hands out. */
export const resolveSupplierName = (dicSuppliers, supplierInfo) => {
  if (supplierInfo === null || supplierInfo === undefined || supplierInfo === "")
    return "";
  if (!Array.isArray(dicSuppliers)) return "";
  const found = dicSuppliers.find(
    ([, id]) => String(id) === String(supplierInfo),
  );
  return found ? found[0] : "";
};

/**
 * Returns null rather than throwing on an unknown name — the supplier field is
 * a free-text AutoComplete, so a typed-in value that matches no provider is a
 * normal thing for a user to do, not a crash.
 */
export const resolveSupplierId = (dicSuppliers, supplierName) => {
  if (!supplierName || !Array.isArray(dicSuppliers)) return null;
  const found = dicSuppliers.find(([name]) => name === supplierName);
  return found ? found[1] : null;
};

/**
 * Every value the edit form should open with.
 *
 * The record's own keys are spread first so any field named after its column
 * keeps working; the entries below are the ones that need translating.
 */
export const buildEditItemFormValues = (item, { supplierName = "" } = {}) => ({
  ...item,
  enableAssignFeature: isFlagOn(item?.enableAssignFeature) ? "YES" : "NO",
  container: isFlagOn(item?.container) ? CONTAINER_YES : CONTAINER_NO,
  tax_location: item?.main_warehouse ?? "",
  supplier: supplierName || "",
  // The sub-location input is for adding the next one; the ones already on the
  // item render as chips from parseSubLocations.
  sub_location: "",
  quantity: 0,
});
