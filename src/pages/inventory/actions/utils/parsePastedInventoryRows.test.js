import { describe, expect, it } from "vitest";
import parsePastedInventoryRows, {
  MAX_PASTED_LINES,
} from "./parsePastedInventoryRows";

const rows = (count, prefix = "A") =>
  Array.from({ length: count }, (_, index) => `${prefix}${index + 1}`);

const EXCEL = [
  "Serial Number\tIMEI\tDevice ID",
  "sdffaf1\tkdhfhk\td654f64",
  "sdffaf2\toirl\t65u3rtet6",
].join("\n");

describe("delimiter detection", () => {
  it("reads a tab-separated paste, which is what Excel puts on the clipboard", () => {
    const parsed = parsePastedInventoryRows(EXCEL);
    expect(parsed.delimiter).toBe("\t");
    expect(parsed.items).toHaveLength(2);
  });

  it("reads semicolon- and comma-separated exports", () => {
    expect(
      parsePastedInventoryRows("Serial;IMEI\nA1;X\nA2;Y").delimiter,
    ).toBe(";");
    expect(parsePastedInventoryRows("Serial,IMEI\nA1,X\nA2,Y").delimiter).toBe(
      ",",
    );
  });

  it("prefers tabs when a value also contains commas", () => {
    const parsed = parsePastedInventoryRows(
      "Serial Number\tLocation\nA1\tMiami, FL",
    );
    expect(parsed.delimiter).toBe("\t");
    expect(parsed.items[0].identifiers).toEqual([
      { keyObject: "Location", valueObject: "Miami, FL" },
    ]);
  });

  it("treats a single column with no delimiter as a plain serial list", () => {
    const parsed = parsePastedInventoryRows("Serial Number\nA1\nA2\nA3");
    expect(parsed.items.map((item) => item.serial)).toEqual(["A1", "A2", "A3"]);
    expect(parsed.items[0].identifiers).toEqual([]);
  });
});

describe("header row", () => {
  it("uses the first row as column names by default", () => {
    const parsed = parsePastedInventoryRows(EXCEL);
    expect(parsed.columns.map((column) => column.label)).toEqual([
      "Serial Number",
      "IMEI",
      "Device ID",
    ]);
    expect(parsed.items[0].serial).toBe("sdffaf1");
  });

  it("names columns positionally when told there is no header", () => {
    const parsed = parsePastedInventoryRows(EXCEL, { hasHeaderRow: false });
    expect(parsed.columns.map((column) => column.label)).toEqual([
      "Column 1",
      "Column 2",
      "Column 3",
    ]);
    // Nothing is eaten: the would-be header becomes an item.
    expect(parsed.items).toHaveLength(3);
    expect(parsed.items[0].serial).toBe("Serial Number");
  });

  it("reports nothing to import when the paste is only a header", () => {
    const parsed = parsePastedInventoryRows("Serial Number\tIMEI");
    expect(parsed.items).toEqual([]);
    expect(parsed.columns).toHaveLength(2);
  });

  it("returns an empty result for empty input", () => {
    for (const input of ["", "   \n\n  ", null, undefined]) {
      const parsed = parsePastedInventoryRows(input);
      expect(parsed.items).toEqual([]);
      expect(parsed.skipped).toEqual([]);
    }
  });
});

describe("primary column", () => {
  it("uses the column named serial_number wherever it sits", () => {
    const parsed = parsePastedInventoryRows(
      "IMEI\tserial_number\tDevice ID\nX\tA1\tD9",
    );
    expect(parsed.primaryColumn.label).toBe("serial_number");
    expect(parsed.items[0].serial).toBe("A1");
    expect(parsed.items[0].identifiers).toEqual([
      { keyObject: "IMEI", valueObject: "X" },
      { keyObject: "Device ID", valueObject: "D9" },
    ]);
  });

  it("recognises the usual spellings", () => {
    for (const header of [
      "Serial Number",
      "serial-number",
      "SERIALNUMBER",
      "SN",
      "S/N",
      "Serial",
      "Numero de serie",
      "Número de Serie",
    ]) {
      const parsed = parsePastedInventoryRows(`IMEI\t${header}\nX\tA1`);
      expect(parsed.items[0].serial).toBe("A1");
    }
  });

  it("falls back to the first column when no name matches", () => {
    const parsed = parsePastedInventoryRows("Cod. Interno\tIMEI\nA1\tX");
    expect(parsed.primaryColumn.label).toBe("Cod. Interno");
    expect(parsed.items[0].serial).toBe("A1");
  });

  it("marks which column is primary, for the preview to highlight", () => {
    const parsed = parsePastedInventoryRows(EXCEL);
    expect(parsed.columns.map((column) => column.isPrimary)).toEqual([
      true,
      false,
      false,
    ]);
  });
});

describe("items", () => {
  it("carries every non-empty column as an identifier", () => {
    const parsed = parsePastedInventoryRows(EXCEL);
    expect(parsed.items[1]).toMatchObject({
      serial: "sdffaf2",
      identifiers: [
        { keyObject: "IMEI", valueObject: "oirl" },
        { keyObject: "Device ID", valueObject: "65u3rtet6" },
      ],
    });
  });

  it("lets items differ: an empty cell simply produces no identifier", () => {
    const parsed = parsePastedInventoryRows(
      "Serial\tIMEI\tMAC\nA1\tX\t\nA2\t\t00:1B",
    );
    expect(parsed.items[0].identifiers).toEqual([
      { keyObject: "IMEI", valueObject: "X" },
    ]);
    expect(parsed.items[1].identifiers).toEqual([
      { keyObject: "MAC", valueObject: "00:1B" },
    ]);
  });

  it("tolerates a short row", () => {
    const parsed = parsePastedInventoryRows("Serial\tIMEI\tMAC\nA1\tX");
    expect(parsed.items[0].identifiers).toEqual([
      { keyObject: "IMEI", valueObject: "X" },
    ]);
    expect(parsed.skipped).toEqual([]);
  });

  it("keeps a row with more cells than headers, and says so", () => {
    const parsed = parsePastedInventoryRows("Serial\tIMEI\nA1\tX\tEXTRA");
    expect(parsed.items[0].identifiers).toEqual([
      { keyObject: "IMEI", valueObject: "X" },
      { keyObject: "Column 3", valueObject: "EXTRA" },
    ]);
    expect(parsed.items[0].warnings).toContain(
      "1 value beyond the last named column",
    );
  });

  it("trims surrounding whitespace from names and values", () => {
    const parsed = parsePastedInventoryRows("  Serial \t IMEI \n A1 \t X ");
    expect(parsed.columns[0].label).toBe("Serial");
    expect(parsed.items[0].serial).toBe("A1");
    expect(parsed.items[0].identifiers).toEqual([
      { keyObject: "IMEI", valueObject: "X" },
    ]);
  });

  it("ignores blank lines between rows", () => {
    const parsed = parsePastedInventoryRows("Serial\nA1\n\n\nA2\n");
    expect(parsed.items).toHaveLength(2);
    expect(parsed.skipped).toEqual([]);
  });
});

describe("skipped rows", () => {
  it("skips a row whose serial cell is empty, with the source line number", () => {
    const parsed = parsePastedInventoryRows("Serial\tIMEI\nA1\tX\n\tY\nA3\tZ");
    expect(parsed.items.map((item) => item.serial)).toEqual(["A1", "A3"]);
    expect(parsed.skipped).toEqual([
      { line: 3, raw: "\tY", reason: "no serial number in the Serial column" },
    ]);
  });

  it("skips a serial repeated inside the paste, keeping the first", () => {
    const parsed = parsePastedInventoryRows("Serial\tIMEI\nA1\tX\nA1\tY");
    expect(parsed.items).toHaveLength(1);
    expect(parsed.items[0].identifiers).toEqual([
      { keyObject: "IMEI", valueObject: "X" },
    ]);
    expect(parsed.skipped[0].reason).toBe("duplicate of A1");
  });

  it("skips a serial already added to the group", () => {
    const parsed = parsePastedInventoryRows("Serial\nA1\nA2", {
      existingSerials: ["A1"],
    });
    expect(parsed.items.map((item) => item.serial)).toEqual(["A2"]);
    expect(parsed.skipped[0].reason).toBe("A1 is already in the list");
  });

  it("treats case-only differences as the same unit", () => {
    const parsed = parsePastedInventoryRows("Serial\nab1\nAB1");
    expect(parsed.items).toHaveLength(1);
    expect(parsed.items[0].serial).toBe("ab1");
  });
});

describe("line limit", () => {
  it("caps the paste at 2000 lines", () => {
    expect(MAX_PASTED_LINES).toBe(2000);
  });

  it("accepts a paste sitting exactly on the limit", () => {
    // The header counts toward it, so the limit buys 1999 units.
    const parsed = parsePastedInventoryRows(
      ["Serial Number", ...rows(MAX_PASTED_LINES - 1)].join("\n"),
    );
    expect(parsed.error).toBeNull();
    expect(parsed.items).toHaveLength(MAX_PASTED_LINES - 1);
  });

  it("rejects the whole paste one line over, rather than importing part of it", () => {
    // Truncating to the first 2000 and importing them would leave the user
    // with a group that looks complete and is not — and no way to tell which
    // units made it without diffing against their own spreadsheet.
    const parsed = parsePastedInventoryRows(
      ["Serial Number", ...rows(MAX_PASTED_LINES)].join("\n"),
    );
    expect(parsed.items).toEqual([]);
    expect(parsed.skipped).toEqual([]);
    expect(parsed.error).toEqual({
      code: "too_many_lines",
      lines: MAX_PASTED_LINES + 1,
      limit: MAX_PASTED_LINES,
    });
  });

  it("counts the header row toward the limit", () => {
    const withHeader = parsePastedInventoryRows(
      ["Serial Number", ...rows(MAX_PASTED_LINES)].join("\n"),
    );
    const withoutHeader = parsePastedInventoryRows(
      rows(MAX_PASTED_LINES).join("\n"),
    );
    expect(withHeader.error).not.toBeNull();
    expect(withoutHeader.error).toBeNull();
  });

  it("does not count blank lines, which are ignored everywhere else", () => {
    const parsed = parsePastedInventoryRows(
      ["Serial Number", ...rows(MAX_PASTED_LINES - 1)].join("\n\n\n"),
    );
    expect(parsed.error).toBeNull();
    expect(parsed.items).toHaveLength(MAX_PASTED_LINES - 1);
  });

  it("reports error: null on every accepted paste, so callers can test one field", () => {
    expect(parsePastedInventoryRows(EXCEL).error).toBeNull();
    expect(parsePastedInventoryRows("").error).toBeNull();
  });
});
