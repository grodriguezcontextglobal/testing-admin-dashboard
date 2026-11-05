import { describe, expect, it } from "vitest";
import { hasOverdueRentals } from "./overdueRentals";

const NOW = new Date("2026-11-05T12:00:00Z").getTime();

describe("hasOverdueRentals", () => {
  it("is false for no items", () => {
    expect(hasOverdueRentals([], NOW)).toBe(false);
    expect(hasOverdueRentals(undefined, NOW)).toBe(false);
  });

  it("is true when a rented item's return date has passed", () => {
    const items = [{ ownership: "Rent", return_date: "2026-11-01" }];
    expect(hasOverdueRentals(items, NOW)).toBe(true);
  });

  it("ignores rented items still within their return date", () => {
    const items = [{ ownership: "rent", return_date: "2026-12-01" }];
    expect(hasOverdueRentals(items, NOW)).toBe(false);
  });

  it("ignores owned items, whatever the date", () => {
    const items = [{ ownership: "Permanent", return_date: "2020-01-01" }];
    expect(hasOverdueRentals(items, NOW)).toBe(false);
  });

  it("ignores rented items without a valid return date", () => {
    const items = [
      { ownership: "Rent", return_date: null },
      { ownership: "Rent", return_date: "not a date" },
    ];
    expect(hasOverdueRentals(items, NOW)).toBe(false);
  });
});
