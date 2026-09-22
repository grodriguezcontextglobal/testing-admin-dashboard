/* eslint-env node */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { read, utils } from "xlsx";

import { summarizeImportUnits } from "./spreadsheetImportRequest";
import { parseInventoryImportRows } from "./inventoryImportRows";
import { readWorkbookCellImages } from "./readWorkbookCellImages";

/**
 * The whole client pipeline, run against the workbook it was designed from.
 *
 * The numbers asserted here are the ones the import decision rests on, so if
 * any of them moves, the decision has to be looked at again rather than the
 * test quietly updated.
 *
 * Skipped when the mock is not checked out.
 */
const MOCK = resolve(
  process.cwd(),
  "mocks/inventory/Inventory_Template_Mock_500.xlsx"
);

describe.skipIf(!existsSync(MOCK))("the 500-row workbook, end to end", () => {
  const load = async () => {
    const buffer = readFileSync(MOCK);
    const workbook = read(buffer, { type: "buffer" });
    const rows = utils.sheet_to_json(
      workbook.Sheets[workbook.SheetNames[0]],
      { defval: "" }
    );
    const { byRow } = await readWorkbookCellImages(buffer);
    return parseInventoryImportRows(rows, { imagesByRow: byRow });
  };

  it("reads every row without dropping one", async () => {
    const { units, skipped } = await load();

    expect(units).toHaveLength(500);
    expect(skipped).toEqual([]);
  });

  it("gives 87 units a picture, backed by 4 files", async () => {
    const { units } = await load();

    const withImage = units.filter((unit) => unit.imageMediaPath);
    expect(withImage).toHaveLength(87);
    expect(new Set(withImage.map((unit) => unit.imageMediaPath)).size).toBe(4);
  });

  it("keeps each unit's own cost — the value the old importer overwrote", async () => {
    const { units } = await load();

    const microphones = units.filter(
      (unit) => unit.item_group === "Wireless Microphone"
    );
    expect(microphones).toHaveLength(33);
    expect(new Set(microphones.map((unit) => unit.cost)).size).toBe(33);
  });

  /* The file goes in one request now, so there is nothing to count here but
     what the preview tells someone before they upload it. The numbers this test
     used to pin — 18 requests grouped by device name, 499 grouped by every
     flattened field, against a limiter of 300 — were the evidence for asking
     for the endpoint. It exists; they are history. */
  it("names the five locations the file touches", async () => {
    const { units } = await load();

    expect(summarizeImportUnits(units).locations.sort()).toEqual([
      "Fort Lauderdale, FL",
      "Miami, FL",
      "New York, NY",
      "Orlando, FL",
      "Washington, DC",
    ]);
  });

  it("finds no serial number repeated inside the file", async () => {
    const { units } = await load();

    expect(summarizeImportUnits(units).duplicateSerials).toEqual([]);
  });
});
