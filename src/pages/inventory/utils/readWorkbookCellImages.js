import JSZip from "jszip";

import {
  RICH_DATA_PARTS,
  resolveEmbeddedCellImages,
  resolveFirstSheetPath,
} from "./inventoryImportImages";

/**
 * Opens the .xlsx as what it is — a zip — and pulls out the pictures sitting
 * inside cells.
 *
 * SheetJS reads the grid and misses these entirely, so the import opens the
 * file twice: once for the values, once here for the pictures. The second pass
 * is cheap next to the first, and keeping them apart means a workbook with no
 * images costs one `loadAsync` and three missing-part lookups.
 *
 * Deduplication matters more than it looks. In the 500-row file this was built
 * against, 87 cells carry a picture but only **four** distinct files back them:
 * one per device group, reused down the column. Uploading per cell would be 87
 * round trips for 4 images.
 */

const CONTENT_TYPES = {
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  bmp: "image/bmp",
};

const contentTypeFor = (path) =>
  CONTENT_TYPES[String(path).split(".").pop()?.toLowerCase()] ??
  "application/octet-stream";

const readText = async (zip, path) => {
  const entry = path && zip.file(path);
  return entry ? entry.async("string") : "";
};

/**
 * @param {ArrayBuffer|Uint8Array} fileData - the uploaded workbook.
 * @returns {Promise<{
 *   byCell: Map<string, {ref: string, column: string, row: number, mediaPath: string, alt: string}>,
 *   byRow: Map<number, {ref: string, column: string, row: number, mediaPath: string, alt: string}>,
 *   media: Map<string, {mediaPath: string, contentType: string, dataUrl: string, byteLength: number}>
 * }>} empty maps for a workbook with no in-cell pictures.
 */
export const readWorkbookCellImages = async (fileData) => {
  const empty = { byCell: new Map(), byRow: new Map(), media: new Map() };

  let zip;
  try {
    zip = await JSZip.loadAsync(fileData);
  } catch (error) {
    console.error("readWorkbookCellImages: not a readable archive", error);
    return empty;
  }

  /* No metadata part means no rich values, which is every workbook that has
     never had a picture placed in a cell. Bail before reading the sheet, which
     is the expensive string on a 500-row file. */
  if (!zip.file(RICH_DATA_PARTS.metadataXml)) return empty;

  const sheetPath =
    resolveFirstSheetPath(
      await readText(zip, "xl/workbook.xml"),
      await readText(zip, "xl/_rels/workbook.xml.rels")
    ) ?? "xl/worksheets/sheet1.xml";

  const byCell = resolveEmbeddedCellImages({
    sheetXml: await readText(zip, sheetPath),
    metadataXml: await readText(zip, RICH_DATA_PARTS.metadataXml),
    structureXml: await readText(zip, RICH_DATA_PARTS.structureXml),
    richValueXml: await readText(zip, RICH_DATA_PARTS.richValueXml),
    richValueRelXml: await readText(zip, RICH_DATA_PARTS.richValueRelXml),
    relsXml: await readText(zip, RICH_DATA_PARTS.relsXml),
  });

  if (byCell.size === 0) return empty;

  /* One read per distinct file, not per cell. */
  const media = new Map();
  for (const image of byCell.values()) {
    if (media.has(image.mediaPath)) continue;
    const entry = zip.file(image.mediaPath);
    if (!entry) continue;
    const base64 = await entry.async("base64");
    const contentType = contentTypeFor(image.mediaPath);
    media.set(image.mediaPath, {
      mediaPath: image.mediaPath,
      contentType,
      dataUrl: `data:${contentType};base64,${base64}`,
      byteLength: Math.floor((base64.length * 3) / 4),
    });
  }

  /* Keyed by row as well, because that is how the parsed grid is addressed.
     A row with pictures in two columns keeps the first — the import reads one
     Image column, and a second picture elsewhere is not ours to interpret. */
  const byRow = new Map();
  for (const image of byCell.values()) {
    if (!byRow.has(image.row)) byRow.set(image.row, image);
  }

  return { byCell, byRow, media };
};

export default readWorkbookCellImages;
