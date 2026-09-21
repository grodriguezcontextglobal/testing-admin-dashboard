/**
 * A batch of units -> the body `POST /db_item/bulk-item-alphanumeric` receives.
 *
 * The rule the whole import hangs on: **a scalar is only sent when the batch
 * agrees on it.** Where the units differ, the value travels as a per-serial map
 * — `[{serial: value}]`, the shape the worker already flattens for
 * `extra_serial_number` — and the scalar is left out of the body entirely.
 *
 * Leaving it out is the point. The old importer sent `itemList[0].cost` for a
 * group of 33 microphones with 33 different costs, and a server that copies a
 * scalar onto every row has no way to know it was wrong. An absent field is a
 * question the server can answer with an error; a plausible wrong number is
 * one nobody asks.
 *
 * `per_serial_fields` declares which fields arrived as maps, so a server that
 * does not read them yet can refuse the request instead of silently inserting
 * rows with holes in them.
 */

import { encodeBySerial } from "./inventoryImportPlan";
import { encodeExtraIdentifiers } from "./extraIdentifiers";

/** Fields that are per-unit in a spreadsheet and scalar in today's payload. */
export const PER_SERIAL_CAPABLE_FIELDS = [
  "cost",
  "ownership",
  "main_warehouse",
  "location",
  "sub_location",
  "image_url",
];

const keyOf = (value) =>
  Array.isArray(value) ? JSON.stringify(value) : String(value ?? "");

/** The single value a batch agrees on, or `undefined` when it does not. */
export const agreedValue = (units, read) => {
  if (units.length === 0) return undefined;
  const first = read(units[0]);
  const key = keyOf(first);
  return units.every((unit) => keyOf(read(unit)) === key) ? first : undefined;
};

/**
 * `"Band=G50;Type=Handheld"` -> the identifier entries the item edit modal
 * reads. A pair without an `=` is dropped, which is what the template says.
 */
export const parseExtraInfoCell = (value) =>
  String(value ?? "")
    .split(";")
    .map((pair) => {
      const [key, ...valueParts] = pair.split("=");
      return {
        keyObject: (key ?? "").trim(),
        valueObject: valueParts.join("=").trim(),
        hasSeparator: valueParts.length > 0,
      };
    })
    .filter((entry) => entry.keyObject && entry.keyObject !== "[]" && entry.hasSeparator)
    .map(({ keyObject, valueObject }) => ({ keyObject, valueObject }));

/**
 * @param {{group: object, batch: Array<object>, company: string,
 *   companyId: number|string, imageUrlByMediaPath?: Map<string,string>,
 *   timestamp: string}} input
 * @returns {{body: object, perSerialFields: string[], serials: string[]}}
 */
export const buildGroupRequest = ({
  group,
  batch,
  company,
  companyId,
  imageUrlByMediaPath = new Map(),
  timestamp,
}) => {
  const imageUrlOf = (unit) =>
    unit.imageMediaPath ? imageUrlByMediaPath.get(unit.imageMediaPath) ?? "" : "";

  const readers = {
    cost: (unit) => unit.cost,
    ownership: (unit) => unit.ownership,
    main_warehouse: (unit) => unit.main_warehouse,
    location: (unit) => unit.location,
    sub_location: (unit) => unit.sub_location,
    image_url: imageUrlOf,
  };

  const body = {
    category_name: group.category_name,
    item_group: group.item_group,
    brand: group.brand,
    descript_item: group.descript_item,
    company,
    company_id: companyId,
    list: batch.map((unit) => String(unit.serial_number)),

    // Fixed for every import, as they were before: in stock, handout-enabled,
    // not a container. A unit that needs otherwise is changed from its page.
    warehouse: 1,
    display_item: 1,
    enableAssignFeature: 1,
    container: 0,
    containerSpotLimit: null,
    isItInContainer: 0,
    containerId: JSON.stringify([]),
    returnedRentedInfo: "",
    return_date: null,
    supplier_info: "",
    created_at: timestamp,
    update_at: timestamp,
  };

  const perSerialFields = [];

  for (const field of PER_SERIAL_CAPABLE_FIELDS) {
    const read = readers[field];
    const agreed = agreedValue(batch, read);

    if (agreed !== undefined) {
      body[field] =
        field === "sub_location" ? JSON.stringify(agreed) : agreed;
      continue;
    }

    /* The batch disagrees: the value goes per serial and the scalar is
       deliberately absent. */
    body[`${field}_by_serial`] = encodeBySerial(
      batch.map((unit) => [unit.serial_number, read(unit)])
    );
    perSerialFields.push(field);
  }

  /* `current_location` mirrors whatever location the row has. */
  if (body.location !== undefined) body.current_location = body.location;
  else body.current_location_by_serial = body.location_by_serial;

  const identifiers = new Map();
  for (const unit of batch) {
    const entries = parseExtraInfoCell(unit.extra_serial_number);
    if (entries.length > 0) identifiers.set(unit.serial_number, entries);
  }
  body.extra_serial_number = encodeExtraIdentifiers(identifiers);

  if (perSerialFields.length > 0) body.per_serial_fields = perSerialFields;

  return {
    body,
    perSerialFields,
    serials: body.list,
  };
};

export default buildGroupRequest;
