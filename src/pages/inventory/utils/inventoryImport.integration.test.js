/* eslint-env node */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { read, utils } from "xlsx";

import { IMPORT_MODES, buildImportPlan } from "./inventoryImportPlan";
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

  it("sends one request per device name", async () => {
    const { units } = await load();

    const { groups, stats } = buildImportPlan(units, {
      mode: IMPORT_MODES.PER_SERIAL,
    });

    expect(stats.groups).toBe(18);
    expect(stats.requests).toBe(18);
    expect(groups.reduce((total, group) => total + group.units.length, 0)).toBe(500);
  });

  /* What the same file costs on the payload as it stands today. The gap
     between 18 and 499 is the whole argument for the per-serial maps. */
  it("would need 499 requests to say the same thing with today's payload", async () => {
    const { units } = await load();

    expect(
      buildImportPlan(units, { mode: IMPORT_MODES.COMPATIBLE }).stats.requests
    ).toBe(499);
  });

  /* Measured across all 500 rows: brand, description and picture never
     disagree inside a device group, which is what makes them group-level. */
  it("finds no group whose group-level fields disagree", async () => {
    const { units } = await load();

    expect(
      buildImportPlan(units, { mode: IMPORT_MODES.PER_SERIAL }).stats.conflicts
    ).toEqual([]);
  });

  it("reports the five locations and the absence of duplicate serials", async () => {
    const { units } = await load();

    const { stats } = buildImportPlan(units, { mode: IMPORT_MODES.PER_SERIAL });

    expect(stats.locations.sort()).toEqual([
      "Fort Lauderdale, FL",
      "Miami, FL",
      "New York, NY",
      "Orlando, FL",
      "Washington, DC",
    ]);
    expect(stats.duplicateSerials).toEqual([]);
  });

  /* Every device group is stocked in more than one city, so grouping by device
     name alone means a request whose units do not share one location_id — the
     value the endpoint resolves once per request for its scope check. */
  it("shows that every group spans several locations", async () => {
    const { units } = await load();

    const { groups } = buildImportPlan(units, { mode: IMPORT_MODES.PER_SERIAL });

    expect(groups.every((group) => group.spansSeveralLocations)).toBe(true);
  });
});
