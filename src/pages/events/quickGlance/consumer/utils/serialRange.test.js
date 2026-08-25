import { describe, expect, it } from "vitest";
import {
  compareSerials,
  countSerialsBetween,
  expandSerialRange,
  nextSerial,
  parseSerial,
  serialRangeLabel,
  sortSerials,
} from "./serialRange";

describe("parseSerial", () => {
  it("splits a prefixed serial into prefix and counter", () => {
    expect(parseSerial("RRRRR001")).toEqual({
      raw: "RRRRR001",
      prefix: "RRRRR",
      digits: "001",
      number: 1,
      width: 3,
      isNumeric: true,
    });
  });

  it("handles a serial that is only digits", () => {
    const parsed = parseSerial("00123");
    expect(parsed.prefix).toBe("");
    expect(parsed.number).toBe(123);
    expect(parsed.width).toBe(5);
    expect(parsed.isNumeric).toBe(true);
  });

  it("treats only the trailing digit run as the counter", () => {
    const parsed = parseSerial("A1B2C34");
    expect(parsed.prefix).toBe("A1B2C");
    expect(parsed.digits).toBe("34");
    expect(parsed.number).toBe(34);
  });

  it("reports a serial with no trailing digits as non-numeric", () => {
    expect(parseSerial("TABLET-A")).toMatchObject({
      prefix: "TABLET-A",
      digits: "",
      number: null,
      isNumeric: false,
    });
  });

  it("survives an empty or missing serial", () => {
    expect(parseSerial("").isNumeric).toBe(false);
    expect(parseSerial(undefined).isNumeric).toBe(false);
    expect(parseSerial(null).raw).toBe("");
  });

  it("trims surrounding whitespace a scanner may append", () => {
    expect(parseSerial("  RRRRR001\n").raw).toBe("RRRRR001");
    expect(parseSerial(" RRRRR001 ").number).toBe(1);
  });

  it("keeps a very long counter as a number without losing the width", () => {
    const parsed = parseSerial("SN0000000042");
    expect(parsed.number).toBe(42);
    expect(parsed.width).toBe(10);
  });
});

describe("compareSerials", () => {
  it("orders same-prefix serials numerically, not lexicographically", () => {
    // "RRRRR9" > "RRRRR10" as strings; the counter is what matters.
    expect(compareSerials("RRRRR9", "RRRRR10")).toBeLessThan(0);
  });

  it("orders zero-padded serials numerically", () => {
    expect(compareSerials("RRRRR002", "RRRRR010")).toBeLessThan(0);
  });

  it("orders different prefixes by prefix", () => {
    expect(compareSerials("AAA001", "BBB001")).toBeLessThan(0);
  });

  it("returns zero for the same serial", () => {
    expect(compareSerials("RRRRR001", "RRRRR001")).toBe(0);
  });

  it("puts non-numeric serials in a stable order rather than throwing", () => {
    expect(compareSerials("TABLET-A", "TABLET-B")).toBeLessThan(0);
    expect(compareSerials("TABLET-B", "TABLET-A")).toBeGreaterThan(0);
  });

  it("orders a non-numeric serial against a numeric one deterministically", () => {
    const forward = compareSerials("TABLET", "TABLET001");
    const backward = compareSerials("TABLET001", "TABLET");
    expect(Math.sign(forward)).toBe(-Math.sign(backward));
  });
});

describe("sortSerials", () => {
  it("sorts a mixed list into human order", () => {
    expect(sortSerials(["RRRRR010", "RRRRR002", "RRRRR001"])).toEqual([
      "RRRRR001",
      "RRRRR002",
      "RRRRR010",
    ]);
  });

  it("does not mutate the input", () => {
    const input = ["B2", "A1"];
    sortSerials(input);
    expect(input).toEqual(["B2", "A1"]);
  });

  it("survives a missing list", () => {
    expect(sortSerials(undefined)).toEqual([]);
  });
});

describe("serialRangeLabel", () => {
  it("reports the lowest and highest serial as they are written", () => {
    // The old code rebuilt the label with Number() + padStart, which produced
    // "RRRRRNaN" for any serial that was not purely numeric. The real strings
    // are never reconstructed here.
    expect(serialRangeLabel(["RRRRR010", "RRRRR001", "RRRRR005"])).toEqual({
      min: "RRRRR001",
      max: "RRRRR010",
      count: 3,
    });
  });

  it("never produces NaN for alphanumeric serials", () => {
    const label = serialRangeLabel(["TABLET-A", "TABLET-C", "TABLET-B"]);
    expect(label.min).toBe("TABLET-A");
    expect(label.max).toBe("TABLET-C");
    expect(JSON.stringify(label)).not.toContain("NaN");
  });

  it("reports a single available serial as both ends", () => {
    expect(serialRangeLabel(["RRRRR007"])).toEqual({
      min: "RRRRR007",
      max: "RRRRR007",
      count: 1,
    });
  });

  it("reports nothing available as nulls rather than as zero", () => {
    // The old code returned { max: 0, min: 0 }, which rendered as "0 - 0" and
    // read like a real range of serials.
    expect(serialRangeLabel([])).toEqual({ min: null, max: null, count: 0 });
    expect(serialRangeLabel(undefined)).toEqual({
      min: null,
      max: null,
      count: 0,
    });
  });

  it("ignores blank entries in the list", () => {
    expect(serialRangeLabel(["", null, "RRRRR001"])).toEqual({
      min: "RRRRR001",
      max: "RRRRR001",
      count: 1,
    });
  });
});

describe("nextSerial", () => {
  it("increments the counter and keeps the width", () => {
    expect(nextSerial("RRRRR001")).toBe("RRRRR002");
    expect(nextSerial("RRRRR009")).toBe("RRRRR010");
  });

  it("grows the width when the counter overflows it", () => {
    expect(nextSerial("RRRRR999")).toBe("RRRRR1000");
  });

  it("returns null for a serial with no counter", () => {
    expect(nextSerial("TABLET-A")).toBeNull();
    expect(nextSerial(undefined)).toBeNull();
  });
});

describe("countSerialsBetween", () => {
  it("counts an inclusive range", () => {
    expect(countSerialsBetween("RRRRR001", "RRRRR003")).toBe(3);
  });

  it("counts a single-serial range as one", () => {
    expect(countSerialsBetween("RRRRR001", "RRRRR001")).toBe(1);
  });

  it("returns null when the ends have different prefixes", () => {
    expect(countSerialsBetween("AAA001", "BBB003")).toBeNull();
  });

  it("returns null when either end has no counter", () => {
    // This is what used to be `endingNumber - startingNumber + 1` → NaN, which
    // was then dispatched as the device quantity.
    expect(countSerialsBetween("TABLET-A", "TABLET-C")).toBeNull();
    expect(countSerialsBetween("RRRRR001", "TABLET")).toBeNull();
  });

  it("returns null when the range runs backwards", () => {
    expect(countSerialsBetween("RRRRR003", "RRRRR001")).toBeNull();
  });
});

describe("expandSerialRange", () => {
  it("lists every serial in the range, padded like the start", () => {
    expect(expandSerialRange("RRRRR001", "RRRRR003")).toEqual([
      "RRRRR001",
      "RRRRR002",
      "RRRRR003",
    ]);
  });

  it("returns the single serial for a one-wide range", () => {
    expect(expandSerialRange("RRRRR001", "RRRRR001")).toEqual(["RRRRR001"]);
  });

  it("returns null for a range it cannot expand", () => {
    expect(expandSerialRange("AAA001", "BBB003")).toBeNull();
    expect(expandSerialRange("TABLET-A", "TABLET-C")).toBeNull();
    expect(expandSerialRange("RRRRR003", "RRRRR001")).toBeNull();
  });

  it("refuses an absurdly large range instead of hanging the tab", () => {
    expect(expandSerialRange("SN1", "SN100000")).toBeNull();
  });
});
