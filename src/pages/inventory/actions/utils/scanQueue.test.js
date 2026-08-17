import { describe, expect, it } from "vitest";
import { acceptScan, SCAN_STATUS } from "./scanQueue";

describe("acceptScan", () => {
  it("accepts a new code and hands back the cleaned value", () => {
    expect(acceptScan("A1", [])).toEqual({
      status: SCAN_STATUS.ADDED,
      serial: "A1",
    });
  });

  it("ignores an empty or whitespace-only read", () => {
    for (const value of ["", "   ", null, undefined]) {
      expect(acceptScan(value, []).status).toBe(SCAN_STATUS.EMPTY);
    }
  });

  it("trims the surrounding whitespace scanners tend to append", () => {
    expect(acceptScan("  A1  ", []).serial).toBe("A1");
  });

  it("strips the carriage return some scanners send before the newline", () => {
    expect(acceptScan("A1\r", []).serial).toBe("A1");
  });

  it("rejects a code already scanned in this session", () => {
    expect(acceptScan("A1", ["A1"])).toEqual({
      status: SCAN_STATUS.DUPLICATE,
      serial: "A1",
    });
  });

  it("treats a case-only difference as the same label, like the paste parser", () => {
    expect(acceptScan("ab1", ["AB1"]).status).toBe(SCAN_STATUS.DUPLICATE);
  });

  it("compares against stored values with stray whitespace too", () => {
    expect(acceptScan("A1", [" A1 "]).status).toBe(SCAN_STATUS.DUPLICATE);
  });

  it("keeps the label exactly as printed apart from the edges", () => {
    // Internal spacing and casing are part of the manufacturer's serial, so
    // only the edges are cleaned.
    expect(acceptScan("  Ab 1-X  ", []).serial).toBe("Ab 1-X");
  });

  it("survives a missing or malformed list rather than throwing mid-scan", () => {
    for (const list of [undefined, null, "nope"]) {
      expect(acceptScan("A1", list).status).toBe(SCAN_STATUS.ADDED);
    }
  });
});
