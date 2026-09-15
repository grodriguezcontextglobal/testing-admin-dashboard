import { describe, expect, it } from "vitest";
import {
  activeFilterSummary,
  hasActiveCriteria,
} from "./activeFilterSummary";

describe("hasActiveCriteria", () => {
  // The whole point of the empty state is telling two situations apart: this
  // company has no inventory, and your combination matched nothing. They look
  // identical in the table and mean opposite things.
  it("is false with nothing chosen and nothing typed", () => {
    expect(hasActiveCriteria([], "")).toBe(false);
    expect(hasActiveCriteria(undefined, undefined)).toBe(false);
    expect(hasActiveCriteria([], "   ")).toBe(false);
  });

  it("is true with a filter chosen", () => {
    expect(hasActiveCriteria([{ category: 0, value: "Dell" }], "")).toBe(true);
  });

  it("is true with a search term", () => {
    expect(hasActiveCriteria([], "00100")).toBe(true);
  });
});

describe("activeFilterSummary", () => {
  it("names one filter by the label the user clicked", () => {
    expect(activeFilterSummary([{ category: 0, value: "Dell" }], "")).toBe(
      "Brand: Dell",
    );
  });

  it("joins a combination in the order the user built it", () => {
    // Filters are AND: Brand Dell *and* Group Laptop. Showing them in the order
    // they were picked matches the row of chips above the table, so the message
    // reads as an explanation of what is on screen rather than a second list.
    expect(
      activeFilterSummary(
        [
          { category: 0, value: "Dell" },
          { category: 1, value: "HP Laptop" },
        ],
        "",
      ),
    ).toBe("Brand: Dell · Group: HP Laptop");
  });

  it("includes the search term alongside the filters", () => {
    expect(
      activeFilterSummary([{ category: 0, value: "Dell" }], "  00100 "),
    ).toBe('Brand: Dell · Search: "00100"');
  });

  it("uses the human label for a logistic status, not the raw value", () => {
    // The select shows "In transit"; the row holds "in-transit". Echoing the
    // stored value back would name something the user never saw.
    expect(activeFilterSummary([{ category: 7, value: "in-transit" }], "")).toBe(
      "Status: In transit",
    );
  });

  it("falls back to the raw value when there is no label for it", () => {
    expect(activeFilterSummary([{ category: 7, value: "quarantined" }], "")).toBe(
      "Status: quarantined",
    );
  });

  it("skips a category that no longer has a select", () => {
    // 6 was Staff member. A chosen filter can outlive the control that made it,
    // and naming a filter the user cannot see would be worse than saying less.
    expect(
      activeFilterSummary(
        [
          { category: 6, value: "Ana Ruiz / ana@x.com" },
          { category: 0, value: "Dell" },
        ],
        "",
      ),
    ).toBe("Brand: Dell");
  });

  it("returns an empty string when there is nothing to describe", () => {
    expect(activeFilterSummary([], "")).toBe("");
    expect(activeFilterSummary(undefined, undefined)).toBe("");
  });
});
