import { describe, it, expect } from "vitest";
import {
  cleanScanValue,
  containsScanValue,
  findByScanValue,
  normalizeScanValue,
  scanValuesMatch,
  SCAN_KIND_UNKNOWN,
} from "./scanInput";

describe("normalizeScanValue", () => {
  it("trims surrounding whitespace", () => {
    expect(cleanScanValue("  300  ")).toBe("300");
  });

  it("strips a terminator the reader glued onto the value", () => {
    expect(cleanScanValue("300\r\n")).toBe("300");
    expect(cleanScanValue("300\t")).toBe("300");
    expect(cleanScanValue("\u0000300")).toBe("300");
  });

  it("leaves a full 24-character GIAI-96 EPC intact", () => {
    const epc = "3425E16CB400000000003039";
    expect(cleanScanValue(`${epc}\r\n`)).toBe(epc);
  });

  it("coerces non-strings and never throws on empty input", () => {
    expect(cleanScanValue(undefined)).toBe("");
    expect(cleanScanValue(null)).toBe("");
    expect(cleanScanValue(300)).toBe("300");
  });

  it("reports unknown kind when no prefix is configured", () => {
    expect(normalizeScanValue("300").kind).toBe(SCAN_KIND_UNKNOWN);
  });

  it("preserves case by default", () => {
    expect(cleanScanValue("abc123")).toBe("abc123");
  });

  it("keeps inner whitespace unless asked to strip it", () => {
    expect(cleanScanValue("34 25 E1")).toBe("34 25 E1");
    expect(cleanScanValue("34 25 E1", { stripInnerWhitespace: true })).toBe(
      "3425E1",
    );
  });

  it("folds case when configured", () => {
    expect(cleanScanValue("ab", { caseMode: "upper" })).toBe("AB");
    expect(cleanScanValue("AB", { caseMode: "lower" })).toBe("ab");
  });
});

describe("normalizeScanValue with configured affixes", () => {
  const settings = {
    prefixes: [
      { kind: "rfid", value: "%R" },
      { kind: "optical", value: "%B" },
    ],
    suffixes: [{ kind: "rfid", value: "#" }],
  };

  it("strips a configured prefix and classifies the read", () => {
    expect(normalizeScanValue("%R3425E16C", settings)).toEqual({
      value: "3425E16C",
      kind: "rfid",
    });
    expect(normalizeScanValue("%B300", settings)).toEqual({
      value: "300",
      kind: "optical",
    });
  });

  it("strips a configured suffix", () => {
    expect(cleanScanValue("300#", settings)).toBe("300");
  });

  it("leaves an unprefixed read alone and marks it unknown", () => {
    expect(normalizeScanValue("300", settings)).toEqual({
      value: "300",
      kind: SCAN_KIND_UNKNOWN,
    });
  });

  it("returns empty when the read was nothing but its affixes", () => {
    expect(cleanScanValue("%R", settings)).toBe("");
  });
});

describe("scanValuesMatch", () => {
  it("matches across whitespace and terminator noise", () => {
    expect(scanValuesMatch(" 300\r\n", "300")).toBe(true);
  });

  it("does not match different identifiers", () => {
    expect(scanValuesMatch("300", "301")).toBe(false);
  });

  it("matches a long EPC against itself, where a length check would not help", () => {
    const epc = "3425E16CB400000000003039";
    expect(scanValuesMatch(epc, epc)).toBe(true);
    expect(scanValuesMatch(epc, "300")).toBe(false);
  });

  it("treats empty as matching nothing, including another empty", () => {
    expect(scanValuesMatch("", "")).toBe(false);
    expect(scanValuesMatch("   ", "")).toBe(false);
    expect(scanValuesMatch(undefined, "300")).toBe(false);
  });

  it("is case-sensitive under the default preserve mode", () => {
    expect(scanValuesMatch("abc", "ABC")).toBe(false);
    expect(scanValuesMatch("abc", "ABC", { caseMode: "upper" })).toBe(true);
  });
});

describe("containsScanValue", () => {
  it("detects a duplicate that differs only by surrounding noise", () => {
    expect(containsScanValue(["300", "301"], " 300\r\n")).toBe(true);
  });

  it("returns false for a new value, an empty value, or a missing list", () => {
    expect(containsScanValue(["300"], "302")).toBe(false);
    expect(containsScanValue(["300"], "  ")).toBe(false);
    expect(containsScanValue(undefined, "300")).toBe(false);
  });

  it("reads the identifier off object entries via getValue", () => {
    const rows = [{ serial_number: "300" }, { serial_number: "301" }];
    const getValue = (row) => row.serial_number;
    expect(containsScanValue(rows, "301", { getValue })).toBe(true);
    expect(containsScanValue(rows, "999", { getValue })).toBe(false);
  });
});

describe("findByScanValue", () => {
  const rows = [
    { serial_number: "300", item_id: 1 },
    { serial_number: "3425E16CB400000000003039", item_id: 2 },
  ];
  const getValue = (row) => row.serial_number;

  it("finds a short serial and a long EPC through the same call", () => {
    expect(findByScanValue(rows, " 300 ", { getValue })?.item_id).toBe(1);
    expect(
      findByScanValue(rows, "3425E16CB400000000003039\r\n", { getValue })
        ?.item_id,
    ).toBe(2);
  });

  it("returns undefined when nothing matches or the read was empty", () => {
    expect(findByScanValue(rows, "999", { getValue })).toBeUndefined();
    expect(findByScanValue(rows, "", { getValue })).toBeUndefined();
  });
});
