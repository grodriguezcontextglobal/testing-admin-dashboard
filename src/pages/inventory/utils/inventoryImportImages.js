/**
 * Reading the pictures a customer pasted *into* the cells of their spreadsheet.
 *
 * Excel 365's "Place in Cell" does not anchor a floating picture over the
 * sheet — the old way, which lives in `xl/drawings/` and which every library
 * can read. It writes a *rich value*: the cell holds an error, and a chain of
 * four parts ties that error to a file in `xl/media/`. Neither SheetJS nor
 * ExcelJS follows that chain: `getImages()` returns nothing and the cell reads
 * as `#VALUE!` or as blank.
 *
 * Measured on `mocks/inventory/Inventory_Template_Mock_500.xlsx`: 87 cells
 * carry a picture, and the import silently sent `image_url: ""` for all of
 * them.
 *
 * The chain, which is what this file walks:
 *
 *   <c r="L3" t="e" vm="1">        the cell, with a 1-based metadata index
 *     -> xl/metadata.xml           valueMetadata[vm - 1] -> rich value index
 *     -> xl/richData/rdrichvalue.xml        rv[i], values by structure
 *     -> rdrichvaluestructure.xml           which value is the image id
 *     -> richValueRel.xml                   image id -> relationship id
 *     -> _rels/richValueRel.xml.rels        relationship id -> ../media/x.jpeg
 *
 * Every hop is a place to be off by one, so the parsing is split into named
 * steps that can each be pinned by a test, and the fixtures in the test file
 * are copied from the real workbook rather than invented.
 *
 * Regex rather than DOMParser: these parts are machine-written OOXML with no
 * mixed content, the five patterns below are the whole grammar we need, and a
 * 500-row sheet is a large string to build a document from on the main thread.
 */

/** `"L3"` -> `{ column: "L", row: 3 }`. Null for anything that is not a ref. */
export const cellReference = (ref) => {
  const match = /^([A-Z]+)(\d+)$/.exec(String(ref ?? "").trim().toUpperCase());
  if (!match) return null;
  return { column: match[1], row: Number(match[2]) };
};

/**
 * The cells carrying a value-metadata index, which is the only mark an in-cell
 * picture leaves on the sheet itself.
 */
export const parseImageCells = (sheetXml) => {
  const cells = [];
  const pattern = /<c\s+r="([A-Z]+\d+)"[^>]*\svm="(\d+)"/g;
  for (const match of String(sheetXml ?? "").matchAll(pattern)) {
    const position = cellReference(match[1]);
    if (!position) continue;
    cells.push({
      ref: match[1],
      column: position.column,
      row: position.row,
      valueMetadataIndex: Number(match[2]),
    });
  }
  return cells;
};

/**
 * `valueMetadata` in reading order: entry N-1 is what a cell's `vm="N"` means,
 * and its `v` is the index into the rich-value table.
 *
 * Only the `valueMetadata` block is read. `futureMetadata` above it contains a
 * similar-looking list, and matching the whole file would pick up both.
 */
export const parseValueMetadataIndex = (metadataXml) => {
  const block = /<valueMetadata[^>]*>([\s\S]*?)<\/valueMetadata>/.exec(
    String(metadataXml ?? "")
  );
  if (!block) return [];
  return [...block[1].matchAll(/<rc[^>]*\sv="(\d+)"/g)].map((match) =>
    Number(match[1])
  );
};

/**
 * The declared shape of each rich-value kind. A picture is `_localImage`, and
 * its keys say which of the rich value's `<v>` entries is the image id and
 * which is the caption — read by name, because the order is Excel's to choose.
 */
export const parseRichValueStructures = (structureXml) =>
  [...String(structureXml ?? "").matchAll(/<s\s+t="([^"]+)"\s*>([\s\S]*?)<\/s>/g)].map(
    (match) => ({
      type: match[1],
      keys: [...match[2].matchAll(/<k\s+n="([^"]+)"/g)].map((key) => key[1]),
    })
  );

/** Each rich value: which structure it follows, and its values in order. */
export const parseRichValues = (richValueXml) =>
  [...String(richValueXml ?? "").matchAll(/<rv\s+s="(\d+)"\s*>([\s\S]*?)<\/rv>/g)].map(
    (match) => ({
      structureIndex: Number(match[1]),
      values: [...match[2].matchAll(/<v>([\s\S]*?)<\/v>/g)].map((value) =>
        value[1]
      ),
    })
  );

/** Relationship ids in order; an image id indexes into this list. */
export const parseRichValueRelIds = (richValueRelXml) =>
  [...String(richValueRelXml ?? "").matchAll(/<rel[^>]*r:id="([^"]+)"/g)].map(
    (match) => match[1]
  );

/**
 * Relationship id -> target. Keyed rather than positional on purpose: Excel
 * writes these out of order (rId3 first, in the file this was built against),
 * so reading them by position picks the wrong picture.
 */
export const parseRelationshipTargets = (relsXml) => {
  const targets = new Map();
  const pattern = /<Relationship\b([^>]*)\/>/g;
  for (const match of String(relsXml ?? "").matchAll(pattern)) {
    const id = /\bId="([^"]+)"/.exec(match[1])?.[1];
    const target = /\bTarget="([^"]+)"/.exec(match[1])?.[1];
    if (id && target) targets.set(id, target);
  }
  return targets;
};

const LOCAL_IMAGE_TYPE = "_localImage";
const IMAGE_ID_KEY = "_rvRel:LocalImageIdentifier";
const TEXT_KEY = "Text";

/** `"../media/image1.jpeg"` as written from `xl/richData/` -> archive path. */
const toArchivePath = (target) =>
  String(target ?? "").replace(/^\.\.\//, "xl/").replace(/^\/+/, "");

/**
 * Cell reference -> the picture in that cell.
 *
 * A workbook with no rich data — which is almost all of them — resolves to an
 * empty map rather than throwing, because this runs on the import path for
 * every file anyone uploads.
 */
export const resolveEmbeddedCellImages = ({
  sheetXml,
  metadataXml,
  structureXml,
  richValueXml,
  richValueRelXml,
  relsXml,
} = {}) => {
  const images = new Map();

  const cells = parseImageCells(sheetXml);
  if (cells.length === 0) return images;

  const metadata = parseValueMetadataIndex(metadataXml);
  const structures = parseRichValueStructures(structureXml);
  const richValues = parseRichValues(richValueXml);
  const relIds = parseRichValueRelIds(richValueRelXml);
  const targets = parseRelationshipTargets(relsXml);

  for (const cell of cells) {
    const richValueIndex = metadata[cell.valueMetadataIndex - 1];
    if (richValueIndex === undefined) continue;

    const richValue = richValues[richValueIndex];
    if (!richValue) continue;

    const structure = structures[richValue.structureIndex];
    if (!structure || structure.type !== LOCAL_IMAGE_TYPE) continue;

    const imageIdPosition = structure.keys.indexOf(IMAGE_ID_KEY);
    if (imageIdPosition < 0) continue;

    const imageId = Number(richValue.values[imageIdPosition]);
    const relId = relIds[imageId];
    const target = relId ? targets.get(relId) : undefined;
    if (!target) continue;

    const textPosition = structure.keys.indexOf(TEXT_KEY);
    images.set(cell.ref, {
      ref: cell.ref,
      column: cell.column,
      row: cell.row,
      mediaPath: toArchivePath(target),
      alt: textPosition >= 0 ? richValue.values[textPosition] ?? "" : "",
    });
  }

  return images;
};

/**
 * Where the first sheet lives inside the archive.
 *
 * Not always `xl/worksheets/sheet1.xml`: the file name is a relationship
 * target, and a workbook that has had sheets added and deleted can have its
 * first tab in `sheet3.xml`. SheetJS reads `SheetNames[0]`, so the rich-data
 * pass has to resolve the same sheet or the images land on another tab's rows.
 */
export const resolveFirstSheetPath = (workbookXml, workbookRelsXml) => {
  const relId = /<sheet\b[^>]*\sr:id="([^"]+)"/.exec(String(workbookXml ?? ""))?.[1];
  if (!relId) return null;
  const target = parseRelationshipTargets(workbookRelsXml).get(relId);
  if (!target) return null;
  return String(target).startsWith("/")
    ? target.replace(/^\/+/, "")
    : `xl/${String(target).replace(/^\.\//, "")}`;
};

/** The parts of the archive this module needs, by their path inside the xlsx. */
export const RICH_DATA_PARTS = {
  metadataXml: "xl/metadata.xml",
  structureXml: "xl/richData/rdrichvaluestructure.xml",
  richValueXml: "xl/richData/rdrichvalue.xml",
  richValueRelXml: "xl/richData/richValueRel.xml",
  relsXml: "xl/richData/_rels/richValueRel.xml.rels",
};
