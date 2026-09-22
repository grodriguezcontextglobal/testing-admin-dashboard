/**
 * The whole spreadsheet, in one request.
 *
 * `POST /api/db_item/bulk-item-from-spreadsheet` takes every unit with its own
 * values — see `FRONTEND_inventory_import_endpoint_RESPONSE_2026-09-22.md`. It
 * replaces the arrangement this file's neighbours implement, where a request
 * carries one group of identical units: a 500-row file needed 499 of those and
 * the rate limiter allows 300 per fifteen minutes.
 *
 * Nothing here is per-group any more. There is no plan, no batching and no
 * agreement to compute, because there is nothing left to flatten.
 */

import { encodeExtraIdentifiers } from "./extraIdentifiers";
import { parseExtraInfoCell } from "./inventoryImportPayload";

/**
 * The server's ceiling, `INVENTORY_IMPORT_MAX_UNITS`. Enforced here as well so
 * a file that cannot be imported is refused before it is uploaded rather than
 * after — the 400 carries the real number in `limit`, and the caller should
 * prefer that over this constant when it has one.
 */
export const MAX_IMPORT_UNITS = 10000;

/**
 * Fixed for every unit of a spreadsheet import, as they have always been.
 *
 * `isItInContainer` is not here any more. It is not a column of `item_inv` —
 * the table has `container`, `containerSpotLimit` and `container_id` — so the
 * server ignored it and the older bulk endpoint never wrote it either. Nothing
 * is lost: an import never places a unit inside a container, so the value it
 * was sending was always "no".
 */
export const IMPORT_DEFAULTS = {
  warehouse: 1,
  display_item: 1,
  enableAssignFeature: 1,
  container: 0,
  containerSpotLimit: null,
  containerId: "[]",
  returnedRentedInfo: "",
  return_date: null,
  supplier_info: "",
};

/**
 * @param {{units: Array<object>, company: string, companyId: number|string,
 *   imageUrlByMediaPath?: Map<string, string>}} input
 * @returns {{body: object, rowByIndex: number[]}} `rowByIndex` maps a position
 *   in `units` back to the spreadsheet row it came from.
 */
export const buildSpreadsheetImportRequest = ({
  units = [],
  company,
  companyId,
  imageUrlByMediaPath = new Map(),
}) => {
  const body = {
    company_id: companyId,
    company,
    defaults: { ...IMPORT_DEFAULTS },
    units: units.map((unit) => ({
      /* Where this unit came from in the sheet. The server echoes it back on
         every error, so a message points at the row the person is looking at
         rather than at a position in an array they cannot see. */
      row: unit.rowNumber,
      serial_number: String(unit.serial_number),
      category_name: unit.category_name,
      item_group: unit.item_group,
      brand: unit.brand,
      descript_item: unit.descript_item,
      cost: unit.cost,
      ownership: unit.ownership,
      location: unit.location,
      main_warehouse: unit.main_warehouse,
      sub_location: unit.sub_location ?? [],
      /* Per unit and already in the shape `item_inv` stores, rather than the
         `{serial: value}` map the older endpoint flattens — there is one unit
         per object here, so there is nothing to key by. */
      extra_serial_number: parseExtraInfoCell(unit.extra_serial_number),
      image_url: unit.imageMediaPath
        ? (imageUrlByMediaPath.get(unit.imageMediaPath) ?? "")
        : "",
    })),
  };

  return { body, rowByIndex: units.map((unit) => unit.rowNumber) };
};

/**
 * The spreadsheet row an error refers to.
 *
 * The server now echoes back the `row` each unit was sent with, so this is a
 * passthrough — `spreadsheetRowFor(4, …)` is 4. It survives only for the
 * version that is deployed today, which still derives the row from a position
 * in the array and gets it wrong as soon as one row is skipped.
 *
 * **Delete this, and the `rowByIndex` that feeds it, when the new endpoint is
 * live.** It is listed in the reply as one of the four things to remove.
 */
export const spreadsheetRowFor = (reportedRow, rowByIndex = []) => {
  const row = Number(reportedRow);
  if (!Number.isInteger(row)) return null;

  /* Already one of the rows we sent: the server echoed ours back, and there is
     nothing to translate. */
  if (rowByIndex.includes(row)) return row;

  const index = row - 2;
  if (index < 0 || index >= rowByIndex.length) return row;
  return rowByIndex[index];
};

/**
 * A rejected import, said in one line.
 *
 * The 400 carries up to 25 rows; showing all of them in a toast helps nobody,
 * and showing none leaves the person with "it failed".
 */
export const describeImportRejection = (responseData, rowByIndex = []) => {
  const errors = responseData?.errors ?? [];
  if (errors.length === 0) {
    return responseData?.msg ?? "The file could not be imported.";
  }

  const first = errors[0];
  const row = spreadsheetRowFor(first.row, rowByIndex);
  const rest =
    errors.length > 1 ? ` (and ${errors.length - 1} more row(s))` : "";

  return `Row ${row}: ${first.reason}${rest}. Fix the file and import again.`;
};

/**
 * What the job's result says once it finishes.
 *
 * `failed` is capped at 500 entries with `failedCount` carrying the real total,
 * so a summary has to read the count and not the list's length.
 */
export const describeImportResult = (result, rowByIndex = []) => {
  const inserted = result?.inserted ?? 0;
  const failedCount = result?.failedCount ?? result?.failed?.length ?? 0;
  const created = result?.locationsCreated ?? 0;

  const parts = [`${inserted} unit(s) added`];
  if (created > 0) parts.push(`${created} location(s) created`);
  if (failedCount > 0) {
    const first = result?.failed?.[0];
    const where = first?.row
      ? ` — first is row ${spreadsheetRowFor(first.row, rowByIndex)}: ${first.reason}`
      : "";
    parts.push(`${failedCount} not added${where}`);
  }
  return `${parts.join(", ")}.`;
};

/** Re-exported so a caller does not have to know which module encodes what. */
export { encodeExtraIdentifiers };
