import { describe, expect, it } from "vitest";
import {
  annotateImportRows,
  generalIssues,
  importCounts,
  parseRowIssues,
} from "./memberImportPresentation";

const rows = [
  { first_name: "Ada", last_name: "Lovelace" },
  { first_name: "Grace", last_name: "Hopper" },
  { first_name: "Alan", last_name: "Turing" },
];

const errors = ["Row 2: missing required field(s): email, phone"];
const warnings = [
  "Row 3: no date of birth and no minor column — imported as an ADULT, so notices will go to them and not to a guardian.",
];

describe("parseRowIssues", () => {
  it("files a message under the row it names", () => {
    const parsed = parseRowIssues(errors);
    expect(parsed.byRow.get(2)).toEqual(["missing required field(s): email, phone"]);
  });

  it("keeps a message that names no row instead of dropping it", () => {
    // "Failed to read file: …" has no row prefix and still has to be seen.
    const parsed = parseRowIssues(["Failed to read file: bad zip"]);
    expect(parsed.byRow.size).toBe(0);
    expect(parsed.general).toEqual(["Failed to read file: bad zip"]);
  });

  it("collects several messages for the same row", () => {
    const parsed = parseRowIssues([
      "Row 1: Guardian email is required for minors.",
      "Row 1: Guardian phone number is required for minors.",
    ]);
    expect(parsed.byRow.get(1)).toHaveLength(2);
  });

  it("survives nothing", () => {
    expect(parseRowIssues(undefined)).toEqual({ byRow: new Map(), general: [] });
  });
});

describe("annotateImportRows", () => {
  it("marks the row the error names as blocked", () => {
    const annotated = annotateImportRows(rows, errors, warnings);
    expect(annotated[1]._status).toBe("blocked");
    expect(annotated[1]._errors).toHaveLength(1);
  });

  it("marks a warned row as a warning, not as blocked", () => {
    // Warned rows do import; colouring them like errors trains people to
    // ignore the errors.
    const annotated = annotateImportRows(rows, errors, warnings);
    expect(annotated[2]._status).toBe("warning");
    expect(annotated[2]._warnings).toHaveLength(1);
  });

  it("leaves a clean row ready", () => {
    expect(annotateImportRows(rows, errors, warnings)[0]._status).toBe("ready");
  });

  it("numbers rows the way the messages do, so they line up", () => {
    expect(annotateImportRows(rows, [], [])[0]._rowNumber).toBe(1);
  });

  it("blocks a row that is both warned and errored", () => {
    const annotated = annotateImportRows(rows, ["Row 3: bad"], warnings);
    expect(annotated[2]._status).toBe("blocked");
  });

  it("gives each row a stable key", () => {
    const keys = annotateImportRows(rows, [], []).map((row) => row.key);
    expect(new Set(keys).size).toBe(3);
  });

  it("survives nothing", () => {
    expect(annotateImportRows(undefined, undefined, undefined)).toEqual([]);
  });
});

describe("importCounts", () => {
  it("counts what will and will not import", () => {
    expect(importCounts(annotateImportRows(rows, errors, warnings))).toEqual({
      total: 3,
      blocked: 1,
      warned: 1,
      ready: 1,
    });
  });

  it("is all zeroes for no rows", () => {
    expect(importCounts([])).toEqual({ total: 0, blocked: 0, warned: 0, ready: 0 });
  });
});

describe("generalIssues", () => {
  it("returns only what is not tied to a row, so the list is not a duplicate", () => {
    expect(
      generalIssues(["Failed to read file: bad zip", ...errors], warnings)
    ).toEqual(["Failed to read file: bad zip"]);
  });

  it("is empty when every message names a row", () => {
    expect(generalIssues(errors, warnings)).toEqual([]);
  });
});
