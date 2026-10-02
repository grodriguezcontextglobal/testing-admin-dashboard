import { describe, expect, it } from "vitest";
import {
  annotateImportRows,
  generalIssues,
  importCounts,
  parseRowIssues,
  summarizeBulkMembersResult,
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

/**
 * POST /db_member/bulk-members skips rows that break the contact rule and
 * inserts the rest (branch feat/member-contact-minors):
 *   { ok, requested, inserted, skipped, contact_skipped: [{ row, missing, msg }] }
 * `row` is the 0-based index in the list sent — the preview's "#" minus one.
 * `skipped` also counts rows without a name, which are not in contact_skipped.
 * The old server sends neither contact_skipped nor, possibly, the counts.
 */
describe("summarizeBulkMembersResult", () => {
  const sent = [
    { first_name: "Ada", last_name: "Lovelace" },
    { first_name: "Grace", last_name: "Hopper" },
    { first_name: "Alan", last_name: "Turing" },
    { first_name: "", last_name: "" },
  ];

  it("names each skipped row by the preview's # and the member, with the reason", () => {
    const result = summarizeBulkMembersResult(
      {
        ok: true,
        requested: 4,
        inserted: 1,
        skipped: 3,
        contact_skipped: [
          { row: 1, missing: ["phone_number"], msg: "Adult members require phone_number." },
          { row: 2, missing: ["parent_guardian_email"], msg: "…" },
        ],
      },
      sent,
      { representativeLabel: "Parent" }
    );
    expect(result.inserted).toBe(1);
    expect(result.skippedRows).toEqual([
      { rowNumber: 2, name: "Grace Hopper", reason: "Phone is required for adults." },
      {
        rowNumber: 3,
        name: "Alan Turing",
        reason: "Parent email is required while the student has no email or phone of their own.",
      },
    ]);
    expect(result.skippedWithoutReason).toBe(1);
  });

  it("falls back to the server's msg when it names no field it knows", () => {
    const [row] = summarizeBulkMembersResult(
      { inserted: 3, skipped: 1, contact_skipped: [{ row: 0, missing: [], msg: "Some new rule." }] },
      sent
    ).skippedRows;
    expect(row.reason).toBe("Some new rule.");
  });

  it("reads the old contract as everything imported", () => {
    expect(summarizeBulkMembersResult({ ok: true }, sent)).toEqual({
      inserted: 4,
      skippedRows: [],
      skippedWithoutReason: 0,
    });
  });

  it("counts every skipped row when the server sends no inserted count", () => {
    const result = summarizeBulkMembersResult(
      { ok: true, contact_skipped: [{ row: 0, missing: ["email"] }] },
      sent
    );
    expect(result.inserted).toBe(3);
  });

  it("reads a refusal (400, nothing inserted) the same way", () => {
    const result = summarizeBulkMembersResult(
      { ok: false, inserted: 0, skipped: 1, contact_skipped: [{ row: 0, missing: ["email"] }] },
      sent.slice(0, 1)
    );
    expect(result).toMatchObject({ inserted: 0, skippedWithoutReason: 0 });
    expect(result.skippedRows[0]).toMatchObject({ rowNumber: 1, name: "Ada Lovelace" });
  });
});
