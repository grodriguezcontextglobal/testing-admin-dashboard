import { describe, it, expect } from "vitest";
import {
  AUDIT_RANGES,
  PLATFORM_LIST_SCREENS,
  buildListQuery,
  formatDelta,
  overviewTiles,
  revenueByClient,
  screenTotalsTiles,
} from "./platformScreens";

describe("PLATFORM_LIST_SCREENS", () => {
  it("has the five cross-client list screens", () => {
    expect(Object.keys(PLATFORM_LIST_SCREENS).sort()).toEqual([
      "audit",
      "events",
      "inventory",
      "people",
      "transactions",
    ]);
  });

  it("gives every screen a resource, filters with a default, columns and totals", () => {
    for (const screen of Object.values(PLATFORM_LIST_SCREENS)) {
      expect(screen.resource).toBeTruthy();
      expect(screen.filters.map((f) => f.key)).toContain(screen.defaultFilter);
      expect(screen.columns.length).toBeGreaterThan(3);
      expect(screen.totals.length).toBeGreaterThan(0);
    }
  });

  it("keeps the inventory serial as text", () => {
    const serial = PLATFORM_LIST_SCREENS.inventory.columns.find((c) => c.key === "serial");
    expect(serial.format).toBe("text");
  });

  it("links every row that names a client to that client", () => {
    for (const key of ["inventory", "transactions", "events", "people", "audit"]) {
      const company = PLATFORM_LIST_SCREENS[key].columns.find((c) => c.key === "companyName");
      expect(company.format).toBe("company");
    }
  });
});

describe("buildListQuery", () => {
  it("sends the filter under the screen's own param, trimmed search, page and limit", () => {
    expect(
      buildListQuery({ filterParam: "status", filter: "lost", search: "  RX-0001 ", page: 2 }),
    ).toEqual({ status: "lost", search: "RX-0001", page: 2, limit: 25 });
  });

  it("leaves out an 'all' filter and a blank search", () => {
    expect(buildListQuery({ filterParam: "type", filter: "all", search: "  " })).toEqual({
      page: 1,
      limit: 25,
    });
  });
});

describe("screenTotalsTiles", () => {
  it("formats totals and marks a critical one only when above zero", () => {
    const tiles = screenTotalsTiles(PLATFORM_LIST_SCREENS.transactions, {
      count: 1200,
      volumeCents: 1234500,
      refundsCents: 5000,
      failed: 3,
    });
    expect(tiles.map((t) => t.value)).toEqual(["1,200", "$12,345.00", "$50.00", "3"]);
    expect(tiles.filter((t) => t.tone === "critical")).toHaveLength(1);
    const calm = screenTotalsTiles(PLATFORM_LIST_SCREENS.transactions, { failed: 0 });
    expect(calm.filter((t) => t.tone === "critical")).toHaveLength(0);
  });

  it("shows dashes while totals are loading", () => {
    const tiles = screenTotalsTiles(PLATFORM_LIST_SCREENS.audit, null);
    expect(tiles.every((t) => t.value === "—")).toBe(true);
  });
});

describe("formatDelta", () => {
  it("says the change against the previous period", () => {
    expect(formatDelta(120, 100, "30d")).toBe("+20% vs previous 30 days");
    expect(formatDelta(80, 100, "7d")).toBe("−20% vs previous 7 days");
    expect(formatDelta(100, 100, "90d")).toBe("No change vs previous 90 days");
  });

  it("says nothing it cannot compute", () => {
    expect(formatDelta(5, 0, "30d")).toBeNull();
    expect(formatDelta(undefined, 10, "30d")).toBeNull();
  });
});

describe("overviewTiles", () => {
  const summary = {
    range: "30d",
    current: { activeClients: 34, devicesOut: 5000, devicesOverdue: 120, revenueCents: 9000000, transactions: 2400, activeEvents: 9 },
    previous: { activeClients: 32, devicesOut: 4600, devicesOverdue: 80, revenueCents: 8000000, transactions: 2000, activeEvents: 8 },
  };

  it("shows the six platform numbers with their change", () => {
    const tiles = overviewTiles(summary);
    expect(tiles.map((t) => t.label)).toEqual([
      "Active clients",
      "Revenue",
      "Transactions",
      "Devices out",
      "Overdue devices",
      "Live events",
    ]);
    expect(tiles[1].value).toBe("$90,000.00");
    expect(tiles[1].sub).toBe("+13% vs previous 30 days");
  });

  it("makes only overdue critical, and only when there is any", () => {
    expect(overviewTiles(summary).filter((t) => t.tone === "critical").map((t) => t.label)).toEqual([
      "Overdue devices",
    ]);
  });

  it("shows dashes while loading", () => {
    expect(overviewTiles(undefined).every((t) => t.value === "—")).toBe(true);
  });
});

describe("buildListQuery, client scope", () => {
  it("sends the company when one is chosen", () => {
    const q = buildListQuery({ filterParam: "status", filter: "all", company: "cmp_003" });
    expect(q.company).toBe("cmp_003");
  });

  it("leaves the company out when the filter is every client", () => {
    expect(buildListQuery({ company: "all" }).company).toBeUndefined();
    expect(buildListQuery({ company: "" }).company).toBeUndefined();
    expect(buildListQuery({}).company).toBeUndefined();
  });

  it("carries the company alongside the screen filter and the search", () => {
    const q = buildListQuery({
      filterParam: "status",
      filter: "lost",
      search: "RX-1",
      company: "cmp_003",
      page: 2,
      limit: 25,
    });
    expect(q).toEqual({ status: "lost", search: "RX-1", company: "cmp_003", page: 2, limit: 25 });
  });
});

describe("PLATFORM_LIST_SCREENS, client scope and notices", () => {
  it("offers the client filter on every cross-client list", () => {
    for (const [key, screen] of Object.entries(PLATFORM_LIST_SCREENS)) {
      expect(screen.companyFilter, `${key} should filter by client`).toBe(true);
    }
  });

  // Members and consumers are real people. Whoever opens this screen is told,
  // on the screen, that their search is recorded with their name (plan risk
  // "personal data exposure"; design board People).
  it("warns on Members & consumers, and only there", () => {
    expect(PLATFORM_LIST_SCREENS.people.notice).toMatch(/personal data/i);
    expect(PLATFORM_LIST_SCREENS.people.notice).toMatch(/audit log/i);
    const others = Object.entries(PLATFORM_LIST_SCREENS).filter(([key]) => key !== "people");
    for (const [key, screen] of others) {
      expect(screen.notice, `${key} needs no personal-data warning`).toBeUndefined();
    }
  });
});

describe("revenueByClient", () => {
  const summary = {
    topClientsByRevenue: [
      { companyId: "cmp_1", companyName: "Harbor Point Events", revenueCents: 4504200 },
      { companyId: "cmp_2", companyName: "Lakeside Academy", revenueCents: 2252100 },
      { companyId: "cmp_3", companyName: "Summit Arena Group", revenueCents: 1126050 },
    ],
  };

  it("measures every bar against the largest, so the top one fills the row", () => {
    const bars = revenueByClient(summary);
    expect(bars.map((b) => b.width)).toEqual([100, 50, 25]);
  });

  it("keeps the client id for the link and formats the money", () => {
    const [first] = revenueByClient(summary);
    expect(first.companyId).toBe("cmp_1");
    expect(first.name).toBe("Harbor Point Events");
    expect(first.amount).toBe("$45,042.00");
  });

  it("gives each bar its share of the total shown", () => {
    const bars = revenueByClient(summary);
    expect(bars[0].share).toBe("57%");
    expect(bars.map((b) => b.share).every((s) => /%$/.test(s))).toBe(true);
  });

  // A client with no revenue still deserves a row rather than a broken bar.
  it("survives a zero and a missing top list", () => {
    const zeroes = revenueByClient({
      topClientsByRevenue: [{ companyId: "a", companyName: "A", revenueCents: 0 }],
    });
    expect(zeroes[0].width).toBe(0);
    expect(zeroes[0].share).toBe("0%");
    expect(revenueByClient(null)).toEqual([]);
    expect(revenueByClient({})).toEqual([]);
  });
});

describe("the audit log screen", () => {
  const audit = PLATFORM_LIST_SCREENS.audit;

  it("counts oversight, not rows", () => {
    expect(audit.totals.map((t) => t.key)).toEqual([
      "activeSuperUsers",
      "profilesOpenedToday",
      "exportsThisWeek",
      "failedSignIns",
    ]);
    expect(audit.totals.find((t) => t.key === "failedSignIns").critical).toBe(true);
  });

  it("says in writing that the log cannot be edited, and who may be here", () => {
    expect(audit.notes).toHaveLength(2);
    expect(audit.notes[0]).toMatch(/cannot be edited or deleted/i);
    expect(audit.notes[0]).toMatch(/120 days/);
    expect(audit.notes[1]).toMatch(/@devitrak\.com/);
  });

  it("filters by staff member and by date range, and only here", () => {
    expect(audit.staffFilter).toBe(true);
    expect(audit.dateRange).toBe(true);
    const others = Object.entries(PLATFORM_LIST_SCREENS).filter(([key]) => key !== "audit");
    for (const [key, screen] of others) {
      expect(screen.staffFilter, `${key}`).toBeUndefined();
      expect(screen.dateRange, `${key}`).toBeUndefined();
    }
  });
});

describe("buildListQuery, audit scope", () => {
  it("sends the staff member and the range", () => {
    const q = buildListQuery({ staff: "super.user1@devitrak.com", range: "30d" });
    expect(q.staff).toBe("super.user1@devitrak.com");
    expect(q.range).toBe("30d");
  });

  it("leaves the staff member out when it is everyone", () => {
    expect(buildListQuery({ staff: "all", range: "7d" }).staff).toBeUndefined();
  });
});

describe("AUDIT_RANGES", () => {
  it("offers the three windows the board shows, newest first", () => {
    expect(AUDIT_RANGES.map((r) => r.value)).toEqual(["7d", "30d", "90d"]);
    expect(AUDIT_RANGES[0].label).toBe("Last 7 days");
  });
});
