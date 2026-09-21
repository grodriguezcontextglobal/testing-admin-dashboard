import { describe, expect, it } from "vitest";

import {
  cellReference,
  parseImageCells,
  parseRelationshipTargets,
  parseRichValueRelIds,
  parseRichValueStructures,
  parseRichValues,
  parseValueMetadataIndex,
  resolveEmbeddedCellImages,
  resolveFirstSheetPath,
} from "./inventoryImportImages";

/* Every fixture below is the real shape, copied down from
   mocks/inventory/Inventory_Template_Mock_500.xlsx — the parts Excel writes
   when someone uses Insert > Picture > Place in Cell. */

const SHEET_XML = `<worksheet><sheetData>
<row r="1"><c r="A1" t="s"><v>0</v></c><c r="L1" s="1" t="s"><v>11</v></c></row>
<row r="2"><c r="A2" t="s"><v>20</v></c><c r="D2" s="2"><v>258.42</v></c></row>
<row r="3"><c r="A3" t="s"><v>21</v></c><c r="L3" s="1" t="e" vm="1"><v>#VALUE!</v></c></row>
<row r="4"><c r="A4" t="s"><v>27</v></c><c r="L4" s="1" t="e" vm="2"><v>#VALUE!</v></c></row>
</sheetData></worksheet>`;

const METADATA_XML = `<metadata><metadataTypes count="1"><metadataType name="XLRICHVALUE"/></metadataTypes><valueMetadata count="2"><bk><rc t="1" v="0"/></bk><bk><rc t="1" v="3"/></bk></valueMetadata></metadata>`;

const STRUCTURE_XML = `<rvStructures count="1"><s t="_localImage"><k n="_rvRel:LocalImageIdentifier" t="i"/><k n="CalcOrigin" t="i"/><k n="Text" t="s"/></s></rvStructures>`;

const RICH_VALUE_XML = `<rvData count="4"><rv s="0"><v>0</v><v>5</v><v>Light blue headphones</v></rv><rv s="0"><v>1</v><v>5</v><v>Person scanning debit card with phone</v></rv><rv s="0"><v>2</v><v>5</v><v>Electric car charger</v></rv><rv s="0"><v>3</v><v>5</v><v>Doctor pointing at x-ray scan</v></rv></rvData>`;

const RICH_VALUE_REL_XML = `<richValueRels><rel r:id="rId1"/><rel r:id="rId2"/><rel r:id="rId3"/><rel r:id="rId4"/></richValueRels>`;

const RELS_XML = `<Relationships><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image3.jpeg"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image2.jpeg"/><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image1.jpeg"/><Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image4.jpeg"/></Relationships>`;

const parts = (overrides = {}) => ({
  sheetXml: SHEET_XML,
  metadataXml: METADATA_XML,
  structureXml: STRUCTURE_XML,
  richValueXml: RICH_VALUE_XML,
  richValueRelXml: RICH_VALUE_REL_XML,
  relsXml: RELS_XML,
  ...overrides,
});

describe("splitting a cell reference", () => {
  it("reads the column letters and the row number", () => {
    expect(cellReference("L3")).toEqual({ column: "L", row: 3 });
    expect(cellReference("AA127")).toEqual({ column: "AA", row: 127 });
  });

  it("returns nothing for something that is not a reference", () => {
    expect(cellReference("")).toBeNull();
    expect(cellReference("L")).toBeNull();
  });
});

describe("finding the cells that carry an image", () => {
  /* An in-cell image leaves an error value behind, which is what every reader
     that does not know about rich data sees. The `vm` attribute is the only
     thing tying the cell to the picture. */
  it("picks out only the cells with a value-metadata index", () => {
    expect(parseImageCells(SHEET_XML)).toEqual([
      { ref: "L3", column: "L", row: 3, valueMetadataIndex: 1 },
      { ref: "L4", column: "L", row: 4, valueMetadataIndex: 2 },
    ]);
  });

  it("finds none in a sheet that has no images", () => {
    expect(parseImageCells("<worksheet><sheetData/></worksheet>")).toEqual([]);
  });
});

describe("the chain from a cell to a file in the archive", () => {
  it("reads the value-metadata table", () => {
    expect(parseValueMetadataIndex(METADATA_XML)).toEqual([0, 3]);
  });

  it("reads the rich-value structures, so a non-image one can be told apart", () => {
    expect(parseRichValueStructures(STRUCTURE_XML)).toEqual([
      { type: "_localImage", keys: ["_rvRel:LocalImageIdentifier", "CalcOrigin", "Text"] },
    ]);
  });

  it("reads each rich value's structure index and its values", () => {
    const values = parseRichValues(RICH_VALUE_XML);
    expect(values).toHaveLength(4);
    expect(values[0]).toEqual({
      structureIndex: 0,
      values: ["0", "5", "Light blue headphones"],
    });
  });

  it("reads the relationship ids in order", () => {
    expect(parseRichValueRelIds(RICH_VALUE_REL_XML)).toEqual([
      "rId1",
      "rId2",
      "rId3",
      "rId4",
    ]);
  });

  /* The rels part lists them out of order on purpose — Excel writes rId3 first
     in this very file — so resolution has to go by id, never by position. */
  it("maps a relationship id to its target whatever order they are written in", () => {
    const targets = parseRelationshipTargets(RELS_XML);
    expect(targets.get("rId1")).toBe("../media/image1.jpeg");
    expect(targets.get("rId4")).toBe("../media/image4.jpeg");
  });
});

describe("finding the sheet the rows came from", () => {
  const WORKBOOK_XML = `<workbook><sheets><sheet name="Template" sheetId="1" r:id="rId1"/></sheets></workbook>`;
  const WORKBOOK_RELS = `<Relationships><Relationship Id="rId2" Target="styles.xml"/><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`;

  it("resolves the first tab through its relationship", () => {
    expect(resolveFirstSheetPath(WORKBOOK_XML, WORKBOOK_RELS)).toBe(
      "xl/worksheets/sheet1.xml"
    );
  });

  /* The first tab is not always sheet1.xml — the number is whatever it was
     when the sheet was created, and deleting tabs leaves gaps. Guessing the
     name would put the pictures on another tab's rows. */
  it("follows the relationship rather than guessing sheet1", () => {
    const rels = `<Relationships><Relationship Id="rId1" Target="worksheets/sheet3.xml"/></Relationships>`;

    expect(resolveFirstSheetPath(WORKBOOK_XML, rels)).toBe(
      "xl/worksheets/sheet3.xml"
    );
  });

  it("returns nothing when the workbook cannot be read", () => {
    expect(resolveFirstSheetPath("", WORKBOOK_RELS)).toBeNull();
    expect(resolveFirstSheetPath(WORKBOOK_XML, "")).toBeNull();
  });
});

describe("resolving cells to images", () => {
  it("walks the whole chain and lands on the file in the archive", () => {
    const images = resolveEmbeddedCellImages(parts());

    expect(images.get("L3")).toEqual({
      ref: "L3",
      column: "L",
      row: 3,
      mediaPath: "xl/media/image1.jpeg",
      alt: "Light blue headphones",
    });
    /* L4's vm is 2, whose value-metadata entry points at rich value 3, whose
       image identifier is 3 — so rId4. Off-by-one in any of the three hops
       lands on the wrong picture, which is why the fixture uses a metadata
       table that is not the identity. */
    expect(images.get("L4")).toEqual({
      ref: "L4",
      column: "L",
      row: 4,
      mediaPath: "xl/media/image4.jpeg",
      alt: "Doctor pointing at x-ray scan",
    });
  });

  it("reads the identifier by key name, not by position", () => {
    const structureXml = `<rvStructures count="1"><s t="_localImage"><k n="CalcOrigin" t="i"/><k n="Text" t="s"/><k n="_rvRel:LocalImageIdentifier" t="i"/></s></rvStructures>`;
    const richValueXml = `<rvData count="1"><rv s="0"><v>5</v><v>A caption</v><v>0</v></rv></rvData>`;

    const images = resolveEmbeddedCellImages(
      parts({ structureXml, richValueXml, metadataXml: `<metadata><valueMetadata><bk><rc t="1" v="0"/></bk></valueMetadata></metadata>` })
    );

    expect(images.get("L3")?.mediaPath).toBe("xl/media/image1.jpeg");
    expect(images.get("L3")?.alt).toBe("A caption");
  });

  /* Most spreadsheets have none of these parts. Reading one must be a no-op,
     not a crash on the import path. */
  it("returns nothing for a workbook with no rich data", () => {
    expect(resolveEmbeddedCellImages({ sheetXml: SHEET_XML }).size).toBe(0);
    expect(resolveEmbeddedCellImages({}).size).toBe(0);
  });

  it("skips a rich value that is not a picture", () => {
    const structureXml = `<rvStructures count="1"><s t="_hyperlink"><k n="Url" t="s"/></s></rvStructures>`;
    const richValueXml = `<rvData count="1"><rv s="0"><v>https://example.com</v></rv></rvData>`;

    expect(
      resolveEmbeddedCellImages(parts({ structureXml, richValueXml })).size
    ).toBe(0);
  });

  it("skips a cell whose metadata index points past the table", () => {
    const sheetXml = `<worksheet><sheetData><row r="9"><c r="L9" t="e" vm="99"><v>#VALUE!</v></c></row></sheetData></worksheet>`;

    expect(resolveEmbeddedCellImages(parts({ sheetXml })).size).toBe(0);
  });
});
