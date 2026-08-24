import { describe, expect, it } from "vitest";
import {
  RETURN_WINDOWS,
  availabilityTone,
  buildForecastKpis,
  formatDay,
  formatPeriodLabel,
  locationRows,
  onRentalCount,
  rentalReturnCounts,
  rentalReturnRows,
  searchParameterChips,
  summarizeDailyAnalysis,
} from "./forecastSummary";

describe("formatDay", () => {
  it("formats an ISO day without shifting it into the previous day", () => {
    // `new Date("2026-06-01").toLocaleDateString()` renders May 31 west of UTC.
    expect(formatDay("2026-06-01")).toBe("Jun 1, 2026");
  });

  it("accepts the unpadded dates the search modal writes", () => {
    // The modal builds `${year}-${month + 1}-${date}` with no padding.
    expect(formatDay("2026-6-1")).toBe("Jun 1, 2026");
  });

  it("ignores a time part", () => {
    expect(formatDay("2026-12-25T00:00:00.000Z")).toBe("Dec 25, 2026");
  });

  it("returns the input untouched when it is not a date", () => {
    expect(formatDay("not a date")).toBe("not a date");
    expect(formatDay(undefined)).toBe("");
  });
});

describe("formatPeriodLabel", () => {
  it("reads as a range with its length", () => {
    expect(formatPeriodLabel({ start: "2026-06-01", end: "2026-06-30" })).toBe(
      "Jun 1, 2026 – Jun 30, 2026 · 30 days"
    );
  });

  it("counts a single-day period as one day", () => {
    expect(formatPeriodLabel({ start: "2026-06-01", end: "2026-06-01" })).toBe(
      "Jun 1, 2026 – Jun 1, 2026 · 1 day"
    );
  });

  it("also reads the date_start/date_end spelling the search parameters use", () => {
    expect(
      formatPeriodLabel({ date_start: "2026-6-1", date_end: "2026-6-2" })
    ).toBe("Jun 1, 2026 – Jun 2, 2026 · 2 days");
  });

  it("drops the length when the dates cannot be parsed", () => {
    expect(formatPeriodLabel({ start: "soon", end: "later" })).toBe("soon – later");
  });

  it("returns an empty label with no period", () => {
    expect(formatPeriodLabel(null)).toBe("");
  });
});

describe("summarizeDailyAnalysis", () => {
  const daily = [
    { date: "2026-06-01", total_available: 10, total_demand: 4 },
    { date: "2026-06-02", total_available: 6, total_demand: 9 },
    { date: "2026-06-03", total_available: 8, total_demand: 12 },
  ];

  it("reports the worst day, not just the totals", () => {
    expect(summarizeDailyAnalysis(daily)).toMatchObject({
      days: 3,
      peakDemand: 12,
      lowestAvailable: 6,
      shortDays: 2,
      firstShortDate: "2026-06-02",
    });
  });

  it("counts a day as short only when demand is strictly above availability", () => {
    expect(
      summarizeDailyAnalysis([{ date: "2026-06-01", total_available: 5, total_demand: 5 }])
    ).toMatchObject({ shortDays: 0, firstShortDate: null });
  });

  it("treats missing metrics as zero rather than NaN", () => {
    expect(summarizeDailyAnalysis([{ date: "2026-06-01" }])).toMatchObject({
      peakDemand: 0,
      lowestAvailable: 0,
      shortDays: 0,
    });
  });

  it("survives an empty or missing series", () => {
    expect(summarizeDailyAnalysis([])).toMatchObject({ days: 0, shortDays: 0 });
    expect(summarizeDailyAnalysis(undefined)).toMatchObject({ days: 0 });
  });
});

describe("onRentalCount", () => {
  it("is what the stock holds beyond what is owned", () => {
    expect(onRentalCount({ owned_count: 4, total_available: 10 })).toBe(6);
  });

  it("is zero when nothing is rented in", () => {
    expect(onRentalCount({ owned_count: 10, total_available: 10 })).toBe(0);
  });

  it("never goes negative when more is owned than counted in stock", () => {
    expect(onRentalCount({ owned_count: 12, total_available: 10 })).toBe(0);
  });

  it("treats missing counts as zero", () => {
    expect(onRentalCount({})).toBe(0);
  });
});

describe("locationRows", () => {
  const locations = [
    {
      location: "Warehouse A",
      location_summary: { total_items: 2 },
      items: [
        {
          category: "Radios",
          group: "Handheld",
          owned_count: 4,
          total_available: 10,
          net_availability: 3,
          availability_status: "Available",
          restock_needed: false,
        },
      ],
    },
    {
      location: "Warehouse B",
      items: [
        {
          category: "Radios",
          group: "Base",
          owned_count: 2,
          total_available: 2,
          net_availability: 0,
          availability_status: "Short",
          restock_needed: true,
        },
      ],
    },
  ];

  it("flattens every location into one comparable list", () => {
    const rows = locationRows(locations);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      location: "Warehouse A",
      category: "Radios",
      group: "Handheld",
      owned: 4,
      onRental: 6,
      inStock: 10,
      netAvailable: 3,
      status: "Available",
      restockNeeded: false,
    });
  });

  it("keys every row uniquely so two locations can hold the same item", () => {
    const rows = locationRows([
      { location: "A", items: [{ group: "Handheld" }] },
      { location: "B", items: [{ group: "Handheld" }] },
    ]);
    expect(rows[0].key).not.toBe(rows[1].key);
  });

  it("reads the item_group/category_name spelling too", () => {
    const rows = locationRows([
      { location: "A", items: [{ item_group: "Handheld", category_name: "Radios" }] },
    ]);
    expect(rows[0]).toMatchObject({ group: "Handheld", category: "Radios" });
  });

  it("falls back to the stock count when net availability is absent", () => {
    const rows = locationRows([{ location: "A", items: [{ total_available: 7 }] }]);
    expect(rows[0].netAvailable).toBe(7);
  });

  it("survives a location with no items and a missing list", () => {
    expect(locationRows([{ location: "A" }])).toEqual([]);
    expect(locationRows(undefined)).toEqual([]);
  });
});

describe("availabilityTone", () => {
  it("reads the status the API sends", () => {
    expect(availabilityTone("Available")).toBe("success");
    expect(availabilityTone("partial")).toBe("warning");
    expect(availabilityTone("Insufficient")).toBe("danger");
  });

  it("stays neutral on a status it does not recognise, rather than guessing", () => {
    expect(availabilityTone("pending review")).toBe("neutral");
    expect(availabilityTone(undefined)).toBe("neutral");
  });
});

describe("rentalReturnRows", () => {
  const analysis = {
    before_period: [{ serial_number: "SN-1", item_group: "Handheld", location: "A" }],
    within_period: [
      { serial_number: "SN-2", item_group: "Handheld", location: "A" },
      { serial_number: "SN-3", item_group: "Base", location: "B" },
    ],
    after_period: [{ serial_number: "SN-4", item_group: "Base", location: "B" }],
  };

  it("puts the three buckets in one list with the bucket as a column", () => {
    const rows = rentalReturnRows(analysis);
    expect(rows).toHaveLength(4);
    expect(rows.map((row) => row.window)).toEqual([
      "before",
      "within",
      "within",
      "after",
    ]);
  });

  it("keeps the fields the table renders", () => {
    expect(rentalReturnRows(analysis)[0]).toMatchObject({
      serial_number: "SN-1",
      item_group: "Handheld",
      location: "A",
    });
  });

  it("gives every row a unique key even when a serial repeats across buckets", () => {
    const rows = rentalReturnRows({
      before_period: [{ serial_number: "SN-1" }],
      within_period: [{ serial_number: "SN-1" }],
    });
    expect(rows[0].key).not.toBe(rows[1].key);
  });

  it("survives a missing analysis", () => {
    expect(rentalReturnRows(null)).toEqual([]);
    expect(rentalReturnRows({})).toEqual([]);
  });
});

describe("rentalReturnCounts", () => {
  it("counts what the table actually holds", () => {
    expect(
      rentalReturnCounts({
        before_period: [{}],
        within_period: [{}, {}],
        after_period: [],
      })
    ).toMatchObject({ before: 1, within: 2, after: 0, total: 3 });
  });

  it("reports the analyzed total from the summary when it is given", () => {
    expect(
      rentalReturnCounts({
        summary: { total_analyzed: 9 },
        before_period: [{}],
      })
    ).toMatchObject({ total: 1, analyzed: 9 });
  });

  it("falls back to the row total when there is no summary", () => {
    expect(rentalReturnCounts({ before_period: [{}] })).toMatchObject({ analyzed: 1 });
  });

  it("survives a missing analysis", () => {
    expect(rentalReturnCounts(null)).toMatchObject({ total: 0, analyzed: 0 });
  });
});

describe("RETURN_WINDOWS", () => {
  it("orders the buckets the way availability degrades", () => {
    // Before the period is the best case (available the whole window); after it
    // is the worst (out for the whole window). The old screen coloured "after"
    // green and "within" amber, which read as the opposite.
    expect(RETURN_WINDOWS.map((w) => w.key)).toEqual(["before", "within", "after"]);
    expect(RETURN_WINDOWS.map((w) => w.tone)).toEqual([
      "success",
      "warning",
      "danger",
    ]);
  });
});

describe("buildForecastKpis", () => {
  const base = {
    uniqueItemGroupsCount: 5,
    locationData: [{ location: "A" }, { location: "B" }],
    dailyAnalysis: [
      { date: "2026-06-01", total_available: 10, total_demand: 4 },
      { date: "2026-06-02", total_available: 6, total_demand: 9 },
    ],
    eventInventory: { total_events: 3 },
    allItems: [{ restock_needed: true }, { restock_needed: false }],
  };

  it("leads with the numbers a forecast is read for", () => {
    const kpis = buildForecastKpis(base);
    expect(kpis.map((kpi) => kpi.key)).toEqual([
      "itemTypes",
      "locations",
      "events",
      "peakDemand",
      "lowestAvailable",
      "shortDays",
    ]);
  });

  it("computes each value from the data already on screen", () => {
    const byKey = Object.fromEntries(
      buildForecastKpis(base).map((kpi) => [kpi.key, kpi.value])
    );
    expect(byKey).toMatchObject({
      itemTypes: 5,
      locations: 2,
      events: 3,
      peakDemand: 9,
      lowestAvailable: 6,
      shortDays: 1,
    });
  });

  it("prefers the location total the projection reports over the list length", () => {
    const kpis = buildForecastKpis({
      ...base,
      overallSummary: { total_locations: 7 },
    });
    expect(kpis.find((kpi) => kpi.key === "locations").value).toBe(7);
  });

  it("flags the short days as the only alarming stat", () => {
    const shortDays = buildForecastKpis(base).find((kpi) => kpi.key === "shortDays");
    expect(shortDays.tone).toBe("danger");
    expect(
      buildForecastKpis({ ...base, dailyAnalysis: [] }).find(
        (kpi) => kpi.key === "shortDays"
      ).tone
    ).toBe("neutral");
  });

  it("survives being handed nothing at all", () => {
    const kpis = buildForecastKpis({});
    expect(kpis).toHaveLength(6);
    expect(kpis.every((kpi) => kpi.value === 0)).toBe(true);
  });
});

describe("searchParameterChips", () => {
  it("shows what was searched for, skipping the fields left blank", () => {
    expect(
      searchParameterChips({
        category: "Radios",
        group: "",
        brand: "Motorola",
        location: "",
        date_start: "2026-6-1",
        date_end: "2026-6-30",
      })
    ).toEqual([
      { key: "category", label: "Category", value: "Radios" },
      { key: "brand", label: "Brand", value: "Motorola" },
    ]);
  });

  it("joins a multi-select value", () => {
    expect(searchParameterChips({ category: ["Radios", "Cases"] })).toEqual([
      { key: "category", label: "Category", value: "Radios, Cases" },
    ]);
  });

  it("returns nothing when the search had no filters", () => {
    expect(searchParameterChips({ category: "", group: "" })).toEqual([]);
    expect(searchParameterChips(null)).toEqual([]);
  });
});
