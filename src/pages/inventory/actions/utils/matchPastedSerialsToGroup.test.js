import { describe, expect, it } from "vitest";
import { matchPastedSerialsToGroup } from "./matchPastedSerialsToGroup";

const GROUP = [
  { serial_number: "SN-1" },
  { serial_number: "SN-2" },
  { serial_number: "SN-3" },
];

describe("matchPastedSerialsToGroup", () => {
  it("matches every pasted serial that exists in the group", () => {
    const result = matchPastedSerialsToGroup("SN-1\nSN-2", GROUP);
    expect(result.matchedSerials).toEqual(["SN-1", "SN-2"]);
    expect(result.unmatched).toEqual([]);
  });

  it("reports a pasted serial that is not part of the group, with its line number", () => {
    const result = matchPastedSerialsToGroup("SN-1\nSN-99", GROUP);
    expect(result.matchedSerials).toEqual(["SN-1"]);
    expect(result.unmatched).toEqual([{ line: 2, value: "SN-99" }]);
  });

  it("drops a header row that is not itself a known serial", () => {
    const result = matchPastedSerialsToGroup("Serial number\nSN-1\nSN-2", GROUP);
    expect(result.matchedSerials).toEqual(["SN-1", "SN-2"]);
    expect(result.unmatched).toEqual([]);
  });

  it("treats a single pasted line as data, never as a header", () => {
    const result = matchPastedSerialsToGroup("SN-99", GROUP);
    expect(result.matchedSerials).toEqual([]);
    expect(result.unmatched).toEqual([{ line: 1, value: "SN-99" }]);
  });

  it("does not drop the first line when it is itself a known serial", () => {
    const result = matchPastedSerialsToGroup("SN-1\nSN-2", GROUP);
    expect(result.matchedSerials).toEqual(["SN-1", "SN-2"]);
  });

  it("deduplicates a serial pasted more than once", () => {
    const result = matchPastedSerialsToGroup("SN-1\nSN-1\nSN-2", GROUP);
    expect(result.matchedSerials).toEqual(["SN-1", "SN-2"]);
  });

  it("reads only the first cell of a multi-column paste", () => {
    const result = matchPastedSerialsToGroup("SN-1\tIMEI-abc\nSN-2,extra", GROUP);
    expect(result.matchedSerials).toEqual(["SN-1", "SN-2"]);
  });

  it("ignores blank lines", () => {
    const result = matchPastedSerialsToGroup("SN-1\n\n\nSN-2\n", GROUP);
    expect(result.matchedSerials).toEqual(["SN-1", "SN-2"]);
  });

  it("returns empty arrays for empty input", () => {
    expect(matchPastedSerialsToGroup("", GROUP)).toEqual({ matchedSerials: [], unmatched: [] });
    expect(matchPastedSerialsToGroup(undefined, GROUP)).toEqual({ matchedSerials: [], unmatched: [] });
  });

  it("treats every candidate as unmatched when the group is empty", () => {
    const result = matchPastedSerialsToGroup("SN-1\nSN-2", []);
    expect(result.matchedSerials).toEqual([]);
    expect(result.unmatched).toEqual([
      { line: 1, value: "SN-1" },
      { line: 2, value: "SN-2" },
    ]);
  });
});
