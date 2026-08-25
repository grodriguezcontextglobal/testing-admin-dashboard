import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import ConsentAttentionList from "./ConsentAttentionList";

const row = (overrides) => ({
  memberId: 1,
  name: "Ada Lovelace",
  status: "missing",
  grade: "5",
  flags: { dob_valid: true, age: 10, under_13: true },
  ...overrides,
});

const rows = [
  row({}),
  row({ memberId: 2, name: "Grace Hopper", status: "expired", grade: "10", flags: { dob_valid: true, age: 15, under_13: false }, record: { signer_email: "mum@x.com" } }),
  row({ memberId: 3, name: "Alan Turing", status: "pending", grade: "2", flags: { dob_valid: true, age: 14, under_13: false } }),
  row({ memberId: 4, name: "Zoe Byron", status: "missing", grade: "10", flags: {} }),
];

const wrap = (props = {}) =>
  render(
    <MemoryRouter>
      <ConsentAttentionList rows={rows} describeRow={() => "detail"} {...props} />
    </MemoryRouter>
  );

const names = () =>
  [...document.querySelectorAll(".consent-attention__name")].map((node) =>
    node.textContent.trim()
  );

describe("ConsentAttentionList", () => {
  it("shows every row when nothing is narrowed", () => {
    wrap();
    expect(names()).toHaveLength(4);
  });

  it("turns each status into a filter that carries its own count", () => {
    wrap();
    fireEvent.click(screen.getByText("Not requested").closest("button"));
    expect(names()).toEqual(["Ada Lovelace", "Zoe Byron"]);
  });

  it("only offers a chip for a status somebody is actually in", () => {
    // A fixed row of chips reading "Refused 0" is noise.
    wrap();
    expect(screen.queryByText("Refused")).toBeNull();
    expect(screen.getByText("Expired")).toBeTruthy();
  });

  it("clears the filter when the same chip is pressed again", () => {
    wrap();
    const chip = screen.getByText("Expired").closest("button");
    fireEvent.click(chip);
    expect(names()).toHaveLength(1);
    fireEvent.click(chip);
    expect(names()).toHaveLength(4);
  });

  it("searches by name and by who the request went to", () => {
    wrap();
    const field = screen.getByLabelText("Search students");

    fireEvent.change(field, { target: { value: "turing" } });
    expect(names()).toEqual(["Alan Turing"]);

    fireEvent.change(field, { target: { value: "mum@x.com" } });
    expect(names()).toEqual(["Grace Hopper"]);
  });

  it("says when a filter matched nobody instead of congratulating you", () => {
    wrap();
    fireEvent.change(screen.getByLabelText("Search students"), {
      target: { value: "nobody" },
    });
    expect(screen.getByText("No one matches those filters.")).toBeTruthy();
    expect(screen.queryByText(/🎉/)).toBeNull();
  });

  it("celebrates only a genuinely empty list", () => {
    wrap({ rows: [] });
    expect(screen.getByText("No outstanding consent actions. 🎉")).toBeTruthy();
  });

  it("marks the under-13 row, since COPPA is the tighter obligation", () => {
    wrap();
    const first = document.querySelector(".consent-attention__row");
    expect(first.querySelector(".consent-attention__coppa").textContent).toContain(
      "under 13"
    );
  });

  it("does not offer a student link for a record whose student is gone", () => {
    wrap({
      rows: [row({ memberId: 9, name: "Deleted student #9", orphan: true, flags: {} })],
    });
    expect(screen.getByText("no student record")).toBeTruthy();
    expect(document.querySelector("a[href^='/member/']")).toBeNull();
  });
});

describe("ConsentAttentionList, at district scale", () => {
  const many = Array.from({ length: 5000 }, (_, i) =>
    row({ memberId: i, name: `Student ${String(i).padStart(4, "0")}`, grade: "5" })
  );

  it("renders one page, not five thousand rows", () => {
    wrap({ rows: many });
    // The whole point: the browser lays out 25 rows, not 5000.
    expect(names()).toHaveLength(25);
    expect(screen.getByText(/Showing 1–25 of 5000/)).toBeTruthy();
  });

  it("pages forward and back", () => {
    wrap({ rows: many });
    fireEvent.click(screen.getByText("Next"));
    expect(screen.getByText(/Showing 26–50 of 5000/)).toBeTruthy();
    expect(names()[0]).toBe("Student 0025");

    fireEvent.click(screen.getByText("Previous"));
    expect(names()[0]).toBe("Student 0000");
  });

  it("stops at both ends", () => {
    wrap({ rows: many });
    expect(screen.getByText("Previous").disabled).toBe(true);
    expect(screen.getByText("Next").disabled).toBe(false);
  });

  it("returns to the first page when the list is narrowed", async () => {
    // Page 7 of the old result set means nothing under the new one.
    wrap({ rows: many });
    fireEvent.click(screen.getByText("Next"));
    expect(screen.getByText(/Showing 26–50/)).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Search students"), {
      target: { value: "Student 01" },
    });
    await waitFor(() => expect(screen.getByText(/Showing 1–25/)).toBeTruthy());
    expect(screen.getByText(/filtered from 5000/)).toBeTruthy();
  });

  it("hides the pager when everything fits on one page", () => {
    wrap();
    expect(screen.queryByText("Next")).toBeNull();
  });
});
