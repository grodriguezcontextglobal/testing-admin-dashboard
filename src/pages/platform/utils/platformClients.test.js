import { describe, it, expect } from "vitest";
import {
  COMPANY_OPTIONS_LIMIT,
  PLAN_FILTERS,
  buildCompaniesQuery,
  companyOptionsComplete,
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

describe("buildCompaniesQuery, plan filter", () => {
  it("sends the plan when one is chosen", () => {
    expect(buildCompaniesQuery({ plan: "Pro" }).plan).toBe("Pro");
  });

  it("leaves the plan out when it is every plan", () => {
    expect(buildCompaniesQuery({ plan: "all" }).plan).toBeUndefined();
    expect(buildCompaniesQuery({}).plan).toBeUndefined();
  });

  it("carries the plan alongside status and search", () => {
    const q = buildCompaniesQuery({ search: "harbor", status: "active", plan: "Enterprise" });
    expect(q).toEqual({ search: "harbor", status: "active", plan: "Enterprise", page: 1, limit: 25 });
  });
});

describe("PLAN_FILTERS", () => {
  it("offers every plan the product sells, plus All", () => {
    expect(PLAN_FILTERS.map((p) => p.value)).toEqual(["all", "Free", "Pro", "Enterprise"]);
    expect(PLAN_FILTERS[0].label).toBe("All plans");
  });
});

describe("COMPANY_OPTIONS_LIMIT", () => {
  it("asks for exactly what the server will give, not more", () => {
    // The client dropdown used to ask for 500 against a server cap of 100:
    // it would have shown the first hundred clients as if they were all of
    // them, silently, the day the hundred-and-first signed up.
    expect(COMPANY_OPTIONS_LIMIT).toBe(100);
    expect(buildCompaniesQuery({ limit: COMPANY_OPTIONS_LIMIT }).limit).toBe(100);
  });
});

describe("companyOptionsComplete", () => {
  it("is complete when the page holds every client the server counted", () => {
    expect(companyOptionsComplete({ rows: [1, 2, 3], total: 3 })).toBe(true);
  });

  it("is incomplete when the server counted more than it sent", () => {
    expect(companyOptionsComplete({ rows: new Array(100).fill(1), total: 137 })).toBe(false);
  });

  it("is complete while there is nothing to be missing", () => {
    // An empty list has its own empty state; it is not a truncated one.
    expect(companyOptionsComplete({ rows: [], total: 0 })).toBe(true);
  });

  it("treats a total it cannot read as complete, because the rows are all we know", () => {
    expect(companyOptionsComplete({ rows: [1], total: undefined })).toBe(true);
    expect(companyOptionsComplete({ rows: [1], total: "many" })).toBe(true);
  });

  it("survives being called before anything has loaded", () => {
    expect(companyOptionsComplete({})).toBe(true);
    expect(companyOptionsComplete()).toBe(true);
  });
});
