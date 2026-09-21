/* eslint-env node */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { readWorkbookCellImages } from "./readWorkbookCellImages";

/**
 * Read against the real workbook, not a fixture.
 *
 * Every other test here pins the parsing of hand-written XML. This one pins
 * the thing that actually matters: that a file Excel wrote, with pictures a
 * person placed in cells, comes back with those pictures. The chain has four
 * hops and the fixtures were copied from this same file, so a fixture-only
 * suite would agree with itself and still be wrong.
 *
 * Skipped when the mock is not checked out, so the suite stays green for
 * anyone who does not have it.
 */
const MOCK = resolve(
  process.cwd(),
  "mocks/inventory/Inventory_Template_Mock_500.xlsx"
);
const hasMock = existsSync(MOCK);

describe.skipIf(!hasMock)("the 500-row workbook with pictures in cells", () => {
  const load = () => readWorkbookCellImages(readFileSync(MOCK));

  it("finds the pictures that SheetJS and ExcelJS both miss", async () => {
    const { byCell, media } = await load();

    expect(byCell.size).toBe(87);
    expect(media.size).toBe(4);
  });

  it("reads them as image data, not as an empty cell", async () => {
    const { media } = await load();

    for (const file of media.values()) {
      expect(file.contentType).toBe("image/jpeg");
      expect(file.dataUrl.startsWith("data:image/jpeg;base64,")).toBe(true);
      expect(file.byteLength).toBeGreaterThan(1000);
    }
  });

  /* Every picture sits in column L, the Image column of the template. If the
     chain drifted by a column this would be the first thing to notice. */
  it("puts every picture in the Image column", async () => {
    const { byCell } = await load();

    expect(new Set([...byCell.values()].map((image) => image.column))).toEqual(
      new Set(["L"])
    );
  });

  /* The captions are the proof the rows line up: the tablet rows must get the
     tablet picture. Off by one anywhere in the chain and a barcode scanner
     ends up wearing an x-ray. */
  it("lands each picture on the rows it belongs to", async () => {
    const { byRow } = await load();

    expect(byRow.get(3)?.alt).toBe("Light blue headphones");
    expect(byRow.get(4)?.alt).toBe("Person scanning debit card with phone");

    const captions = new Set([...byRow.values()].map((image) => image.alt));
    expect(captions).toEqual(
      new Set([
        "Light blue headphones",
        "Person scanning debit card with phone",
        "Electric car charger",
        "Doctor pointing at x-ray scan",
      ])
    );
  });

  it("reuses one file for every cell that shows the same picture", async () => {
    const { byCell, media } = await load();

    const paths = [...byCell.values()].map((image) => image.mediaPath);
    expect(new Set(paths).size).toBe(4);
    expect(paths.length).toBe(87);
    for (const path of new Set(paths)) expect(media.has(path)).toBe(true);
  });
});
