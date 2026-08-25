import { describe, expect, it } from "vitest";
import {
  ATTENTION_FILTERS,
  ATTENTION_PAGE_SIZE,
  attentionGrades,
  attentionStatusCounts,
  filterAttentionRows,
  pageOfAttentionRows,
} from "./attentionList";

const rows = [
  { memberId: 1, name: "Ada Lovelace", status: "missing", grade: "5" },
  { memberId: 2, name: "Grace Hopper", status: "missing", grade: "10" },
  {
    memberId: 3,
    name: "Alan Turing",
    status: "expired",
    grade: "2",
    record: { signer_email: "mum@x.com" },
  },
  {
    memberId: 4,
    name: "Zoe Byron",
    status: "pending",
    grade: "5",
    record: { signer_name: "Anne Byron" },
  },
];

describe("attentionStatusCounts", () => {
  it("counts each status the list actually holds", () => {
    expect(attentionStatusCounts(rows)).toEqual([
      { value: "missing", label: "Not requested", count: 2 },
      { value: "expired", label: "Expired", count: 1 },
      { value: "pending", label: "Awaiting guardian", count: 1 },
    ]);
  });

  it("leaves out a status nobody is in, rather than showing a row of zeros", () => {
    expect(attentionStatusCounts(rows).map((chip) => chip.value)).not.toContain(
      "refused"
    );
  });

  it("orders the chips worst first, matching how the list is sorted", () => {
    expect(ATTENTION_FILTERS.map((filter) => filter.value)).toEqual([
      "missing",
      "refused",
      "expired",
      "stale",
      "pending",
    ]);
  });

  it("survives nothing", () => {
    expect(attentionStatusCounts(undefined)).toEqual([]);
  });
});

describe("attentionGrades", () => {
  it("sorts numerically, so 2 comes before 10", () => {
    expect(attentionGrades(rows)).toEqual(["2", "5", "10"]);
  });

  it("skips rows with no grade on file", () => {
    expect(attentionGrades([{ grade: null }, { grade: "  " }])).toEqual([]);
  });
});

describe("filterAttentionRows", () => {
  it("filters by status", () => {
    expect(filterAttentionRows(rows, { status: "missing" })).toHaveLength(2);
  });

  it("filters by grade", () => {
    expect(
      filterAttentionRows(rows, { grade: "5" }).map((row) => row.name)
    ).toEqual(["Ada Lovelace", "Zoe Byron"]);
  });

  it("searches the name", () => {
    expect(filterAttentionRows(rows, { search: "hopper" })).toHaveLength(1);
  });

  it("searches who the request was sent to", () => {
    // A guardian with three children in the school is a real lookup.
    expect(filterAttentionRows(rows, { search: "mum@x.com" })[0].name).toBe(
      "Alan Turing"
    );
    expect(filterAttentionRows(rows, { search: "anne" })[0].name).toBe("Zoe Byron");
  });

  it("combines the filters", () => {
    expect(filterAttentionRows(rows, { status: "missing", grade: "5" })).toHaveLength(
      1
    );
  });

  it("returns everything when nothing is asked for", () => {
    expect(filterAttentionRows(rows, {})).toHaveLength(4);
    expect(filterAttentionRows(rows)).toHaveLength(4);
  });

  it("survives a missing list", () => {
    expect(filterAttentionRows(undefined, { search: "ada" })).toEqual([]);
  });
});

describe("pageOfAttentionRows", () => {
  const many = Array.from({ length: 5000 }, (_, i) => ({
    memberId: i,
    name: `Student ${i}`,
    status: "missing",
  }));

  it("renders one page of a five-thousand-student district, not all of it", () => {
    const result = pageOfAttentionRows(many, 1);
    expect(result.rows).toHaveLength(ATTENTION_PAGE_SIZE);
    expect(result.total).toBe(5000);
    expect(result.totalPages).toBe(200);
  });

  it("describes the page the way the pager reads it", () => {
    const result = pageOfAttentionRows(many, 2);
    expect(result.firstShown).toBe(26);
    expect(result.lastShown).toBe(50);
  });

  it("clamps a page past the end instead of showing nothing", () => {
    // Filtering down from page 40 to three rows must not strand the list.
    const result = pageOfAttentionRows(rows, 40);
    expect(result.page).toBe(1);
    expect(result.rows).toHaveLength(4);
  });

  it("clamps a page below one", () => {
    expect(pageOfAttentionRows(many, 0).page).toBe(1);
    expect(pageOfAttentionRows(many, "x").page).toBe(1);
  });

  it("reports an empty list as zero of zero, not one of zero", () => {
    const result = pageOfAttentionRows([], 1);
    expect(result.firstShown).toBe(0);
    expect(result.lastShown).toBe(0);
    expect(result.totalPages).toBe(1);
  });

  it("shows the short last page", () => {
    expect(pageOfAttentionRows(many, 200).rows).toHaveLength(ATTENTION_PAGE_SIZE);
    const uneven = [...many, ...many.slice(0, 10)]; // 5010 rows -> 201 pages
    expect(pageOfAttentionRows(uneven, 201).rows).toHaveLength(10);
  });

  it("survives nothing", () => {
    expect(pageOfAttentionRows(undefined, 1).rows).toEqual([]);
  });
});
