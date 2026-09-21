/**
 * One spreadsheet row -> one unit of inventory.
 *
 * Lifted out of `DocumentInventoryXLSXUpload` so the reading of a row can be
 * tested without a file input, and so the two things the importer does — read
 * the rows, then decide how to send them — stop being one 80-line closure.
 *
 * The behaviour is the old one except in two places, both deliberate:
 *
 *   - a skipped row is now *reported* rather than dropped. The old parser
 *     returned `null` and filtered it out, so a file where half the rows had
 *     no serial number imported the other half and said "250 items processed".
 *   - a picture placed in the Image cell is read (see
 *     `readWorkbookCellImages`). The column used to accept a public URL, which
 *     is the thing Fredrik objected to at part 2 `9:38`; a picture inside the
 *     file is the same information without pointing anybody at a stranger's
 *     server.
 */

import { normalizeOwnership } from "../actions/utils/ownershipUtils";
import {
  aliasesFor,
  headerFor,
  isBlankImportValue,
  missingRequiredFields,
  normalizeHeader,
  REQUIRED_IMPORT_FIELDS,
} from "./inventoryImportTemplate";

/** The header row is row 1, so the first data row is sheet row 2. */
export const FIRST_DATA_ROW = 2;

/**
 * Reads one field out of a row object keyed by whatever headers the file used.
 * Exact alias first, then a normalized comparison, which is what forgives
 * casing, surrounding space and the mandatory asterisk.
 */
export const readField = (row, field) => {
  for (const alias of aliasesFor(field)) {
    if (row[alias] !== undefined) return row[alias];
    const matched = Object.keys(row).find(
      (key) => normalizeHeader(key) === normalizeHeader(alias)
    );
    if (matched) return row[matched];
  }
  return "";
};

/** "45,5" and "45.5" both mean 45.5. A cell that is not a number means 0. */
export const parseCost = (value) =>
  parseFloat(String(value ?? "").replace(",", ".")) || 0;

/**
 * "Section A, Locker A110" -> ["Section A", "Locker A110"].
 * Brackets and quotes are stripped because a value round-tripped through an
 * export comes back as `["Section A","Locker A110"]` in a single cell.
 */
export const parseSubLocation = (value) =>
  String(value ?? "")
    .replace(/[[\]"]/g, "")
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part && part.toLowerCase() !== "null");

/**
 * @param {Array<object>} rows - `sheet_to_json` output, keyed by header.
 * @param {{imagesByRow?: Map<number, {mediaPath: string, alt: string}>}} [options]
 * @returns {{units: Array<object>, skipped: Array<{rowNumber: number, missing: string[]}>,
 *   ignoredImageValues: Array<{rowNumber: number, value: string}>}}
 */
export const parseInventoryImportRows = (rows = [], options = {}) => {
  const imagesByRow = options.imagesByRow ?? new Map();
  const units = [];
  const skipped = [];
  /* Text typed into the Image column. It is no longer read as a value — the
     picture has to be in the cell — but dropping it without a word would be
     the same silent loss this whole rewrite exists to stop. */
  const ignoredImageValues = [];

  rows.forEach((row, index) => {
    const rowNumber = index + FIRST_DATA_ROW;

    const required = REQUIRED_IMPORT_FIELDS.reduce((values, field) => {
      values[field] = readField(row, field);
      return values;
    }, {});

    const missing = missingRequiredFields(required);
    if (missing.length > 0) {
      skipped.push({ rowNumber, missing: missing.map(headerFor) });
      return;
    }

    const ownership = normalizeOwnership(required.ownership);
    const description = readField(row, "descript_item");
    const image = imagesByRow.get(rowNumber) ?? null;

    /* A cell holding a picture reads as blank here — the value lives in the
       workbook's rich data, not the grid — so anything with text in it was
       typed, and a typed URL is exactly what part 2 `9:38` ruled out. */
    const typedInImageCell = String(readField(row, "image_url") ?? "").trim();
    if (typedInImageCell) {
      ignoredImageValues.push({ rowNumber, value: typedInImageCell });
    }

    units.push({
      rowNumber,
      category_name: required.category_name,
      item_group: required.item_group,
      serial_number: String(required.serial_number),
      cost: parseCost(required.cost),
      brand: required.brand,
      ownership,
      main_warehouse: required.main_warehouse,
      location: required.location,
      current_location: required.location,
      sub_location: parseSubLocation(readField(row, "sub_location")),
      extra_serial_number: readField(row, "extra_serial_number"),
      descript_item: isBlankImportValue(description)
        ? `${required.category_name} ${required.item_group} ${required.brand} ${
            ownership === "Rent" ? "for rent" : ""
          } ${required.location}`.replace(/\s+/g, " ").trim()
        : description,
      /* The picture lives in the archive until the upload step turns it into a
         URL; the row only remembers which file it pointed at. */
      imageMediaPath: image?.mediaPath ?? null,
      imageAlt: image?.alt ?? "",
    });
  });

  return { units, skipped, ignoredImageValues };
};

export default parseInventoryImportRows;
