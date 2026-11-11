import { describe, it, expect } from "vitest";
import {
  buildCompaniesQuery,
  companyStatusPill,
  formatCents,
  formatLastActivity,
  normalizeCompaniesResponse,
} from "./platformClients";

describe("buildCompaniesQuery", () => {
  it("defaults to page 1 and 25 rows", () => {
    expect(buildCompaniesQuery({})).toEqual({ page: 1, limit: 25 });
  });

  it("trims the search and drops it when blank", () => {
    expect(buildCompaniesQuery({ search: "  north  " }).search).toBe("north");
    expect(buildCompaniesQuery({ search: "   " })).not.toHaveProperty("search");
  });

  it("sends the status unless it is 'all'", () => {
    expect(buildCompaniesQuery({ status: "at_risk" }).status).toBe("at_risk");
    expect(buildCompaniesQuery({ status: "all" })).not.toHaveProperty("status");
  });

  it("never sends a page below 1", () => {
    expect(buildCompaniesQuery({ page: 0 }).page).toBe(1);
    expect(buildCompaniesQuery({ page: -3 }).page).toBe(1);
    expect(buildCompaniesQuery({ page: 4 }).page).toBe(4);
  });
});

describe("companyStatusPill", () => {
  it.each([
    ["active", "Active", "success"],
    ["at_risk", "At risk", "error"],
    ["trial", "Trial", "brand"],
    ["paused", "Paused", "gray"],
  ])("maps %s to %s / %s", (status, label, color) => {
    expect(companyStatusPill(status)).toEqual({ label, color });
  });

  it("shows unknown statuses as gray, never as a crash", () => {
    expect(companyStatusPill("something_new")).toEqual({ label: "Unknown", color: "gray" });
    expect(companyStatusPill(undefined)).toEqual({ label: "Unknown", color: "gray" });
  });
});

describe("formatCents", () => {
  it("formats integer cents as money", () => {
    expect(formatCents(1510000)).toBe("$15,100.00");
    expect(formatCents(0)).toBe("$0.00");
  });

  it("uses the currency it is given", () => {
    expect(formatCents(4200, "EUR")).toBe("€42.00");
  });

  it("shows a dash for missing values instead of $NaN", () => {
    expect(formatCents(undefined)).toBe("—");
    expect(formatCents(null)).toBe("—");
    expect(formatCents("abc")).toBe("—");
  });
});

describe("formatLastActivity", () => {
  const now = new Date("2026-11-11T12:00:00Z");

  it.each([
    ["2026-11-11T11:59:40Z", "Just now"],
    ["2026-11-11T11:55:00Z", "5 min ago"],
    ["2026-11-11T09:00:00Z", "3 h ago"],
    ["2026-11-10T09:00:00Z", "Yesterday"],
    ["2026-11-06T12:00:00Z", "5 days ago"],
  ])("%s → %s", (iso, label) => {
    expect(formatLastActivity(iso, now)).toBe(label);
  });

  it("shows a calendar date after a month", () => {
    expect(formatLastActivity("2026-09-01T12:00:00Z", now)).toBe("Sep 1, 2026");
  });

  it("shows 'Never' for no activity and a dash for an invalid date", () => {
    expect(formatLastActivity(null, now)).toBe("Never");
    expect(formatLastActivity("not a date", now)).toBe("—");
  });
});

describe("normalizeCompaniesResponse", () => {
  it("reads the agreed { ok, data, page, limit, total } shape", () => {
    const rows = [{ id: "a" }];
    expect(
      normalizeCompaniesResponse({ ok: true, data: rows, page: 2, limit: 25, total: 48 }),
    ).toEqual({ rows, page: 2, limit: 25, total: 48 });
  });

  it("never returns undefined rows while the shape is wrong or loading", () => {
    expect(normalizeCompaniesResponse(undefined)).toEqual({ rows: [], page: 1, limit: 25, total: 0 });
    expect(normalizeCompaniesResponse({ ok: true, data: null }).rows).toEqual([]);
  });

  it("falls back to the row count when total is missing", () => {
    expect(normalizeCompaniesResponse({ data: [{}, {}] }).total).toBe(2);
  });
});
