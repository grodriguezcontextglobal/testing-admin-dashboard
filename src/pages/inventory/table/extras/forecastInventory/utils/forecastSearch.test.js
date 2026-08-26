import { describe, expect, it } from "vitest";
import {
  FILTER_FIELDS,
  buildSearchParameters,
  buildSearchQuery,
  countFilters,
  describeFilters,
  emptyFilters,
  formatSearchDate,
  readCachedOptions,
  readSearchError,
  resolveFilterOptions,
  searchFieldErrors,
  writeCachedOptions,
} from "./forecastSearch";

const user = { companyData: { id: "co-1" }, sqlInfo: { company_id: 7 } };

const context = {
  category: [{ key: "Radios" }, { key: "Headsets" }],
  group: [{ key: "Group A" }],
  brand: [{ key: "Sennheiser" }],
  location: [{ key: "Warehouse" }],
};

const fakeStorage = (initial) => {
  const store = new Map(Object.entries(initial ?? {}));
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, value),
    read: (key) => store.get(key),
  };
};

describe("FILTER_FIELDS", () => {
  it("keeps the four the endpoint accepts", () => {
    expect(FILTER_FIELDS.map((field) => field.name)).toEqual([
      "category",
      "group",
      "brand",
      "location",
    ]);
  });
});

describe("resolveFilterOptions", () => {
  it("turns the context's {key} entries into options", () => {
    expect(resolveFilterOptions({ context, cached: null }).category).toEqual([
      { id: "Radios", label: "Radios" },
      { id: "Headsets", label: "Headsets" },
    ]);
  });

  it("prefers the live context over the cache", () => {
    // It used to be the other way round, so a category added after the first
    // ever open never appeared again.
    const cached = { category: [{ key: "Stale" }], group: [], brand: [], location: [] };
    expect(
      resolveFilterOptions({ context, cached }).category.map((o) => o.label)
    ).toEqual(["Radios", "Headsets"]);
  });

  it("falls back to the cache only while the context has nothing", () => {
    const cached = { category: [{ key: "Radios" }], group: [], brand: [], location: [] };
    const empty = { category: [], group: [], brand: [], location: [] };
    expect(
      resolveFilterOptions({ context: empty, cached }).category.map((o) => o.label)
    ).toEqual(["Radios"]);
  });

  it("returns empty lists when neither has anything, rather than throwing", () => {
    expect(resolveFilterOptions({ context: undefined, cached: undefined })).toEqual({
      category: [],
      group: [],
      brand: [],
      location: [],
    });
  });

  it("drops blank entries instead of offering an unlabelled option", () => {
    const messy = { category: [{ key: "" }, { key: "  " }, { key: "Radios" }] };
    expect(resolveFilterOptions({ context: messy, cached: null }).category).toEqual([
      { id: "Radios", label: "Radios" },
    ]);
  });
});

describe("readCachedOptions / writeCachedOptions", () => {
  it("reads back what was written", () => {
    const storage = fakeStorage();
    expect(writeCachedOptions(storage, context)).toBe(true);
    expect(readCachedOptions(storage)).toEqual(context);
  });

  it("never caches an empty set of options", () => {
    // The permanent-empty-dropdown bug: the modal opened while the inventory
    // query was still loading, wrote `[]`, and preferred that cache forever.
    const storage = fakeStorage();
    const empty = { category: [], group: [], brand: [], location: [] };
    expect(writeCachedOptions(storage, empty)).toBe(false);
    expect(readCachedOptions(storage)).toBeNull();
  });

  it("survives a cache that is not JSON", () => {
    expect(readCachedOptions(fakeStorage({ searchParameters: "{oops" }))).toBeNull();
  });

  it("survives storage being unavailable", () => {
    expect(readCachedOptions(undefined)).toBeNull();
    expect(writeCachedOptions(undefined, context)).toBe(false);
  });
});

describe("formatSearchDate", () => {
  it("writes the unpadded form the endpoint has always received", () => {
    // Deliberately `2026-8-1`, not `2026-08-01`: unpadded parses as local and
    // padded as UTC, so padding it would change what the server resolves.
    expect(formatSearchDate(new Date(2026, 7, 1))).toBe("2026-8-1");
    expect(formatSearchDate(new Date(2026, 11, 25))).toBe("2026-12-25");
  });

  it("reads a dayjs value through either of its escapes", () => {
    const day = new Date(2026, 7, 28);
    expect(formatSearchDate({ $d: day })).toBe("2026-8-28");
    expect(formatSearchDate({ toDate: () => day })).toBe("2026-8-28");
  });

  it("is empty for something that is not a date", () => {
    expect(formatSearchDate(null)).toBe("");
    expect(formatSearchDate("not a date")).toBe("");
  });
});

describe("searchFieldErrors", () => {
  const range = [new Date(2026, 7, 28), new Date(2026, 8, 2)];

  it("asks for the period, which is the one required thing", () => {
    expect(searchFieldErrors({}).range).toBe("Pick the period to forecast.");
    expect(searchFieldErrors({ range: [] }).range).toBe("Pick the period to forecast.");
  });

  it("asks for both ends of it", () => {
    expect(searchFieldErrors({ range: [range[0], null] }).range).toBe(
      "Pick the period to forecast."
    );
  });

  it("returns nothing for a complete period", () => {
    expect(searchFieldErrors({ range })).toEqual({});
  });
});

describe("buildSearchParameters", () => {
  const range = [new Date(2026, 7, 28), new Date(2026, 8, 2)];

  it("records an empty string for a filter nobody set", () => {
    expect(buildSearchParameters({ filters: emptyFilters(), range })).toEqual({
      category: "",
      group: "",
      brand: "",
      location: "",
      date_start: "2026-8-28",
      date_end: "2026-9-2",
    });
  });

  it("carries the filters that were set", () => {
    expect(
      buildSearchParameters({
        filters: { ...emptyFilters(), category: "Radios", location: "Warehouse" },
        range,
      })
    ).toMatchObject({ category: "Radios", location: "Warehouse", group: "", brand: "" });
  });
});

describe("buildSearchQuery", () => {
  const parameters = {
    category: "Radios",
    group: "",
    brand: "",
    location: "Warehouse",
    date_start: "2026-8-28",
    date_end: "2026-9-2",
  };

  it("sends the eight parameters the endpoint documents", () => {
    const url = buildSearchQuery({ parameters, user });
    const query = new URLSearchParams(url.split("?")[1]);
    expect(url.startsWith("/search/advance_searching_query?")).toBe(true);
    expect([...query.keys()].sort()).toEqual([
      "brand",
      "category",
      "company_id",
      "company_sql_id",
      "date_end",
      "date_start",
      "group",
      "location",
    ]);
    expect(query.get("category")).toBe("Radios");
    expect(query.get("company_id")).toBe("co-1");
    expect(query.get("company_sql_id")).toBe("7");
  });

  it("sends an empty value for a filter nobody set, not the word undefined", () => {
    // The hand-built string interpolated the raw form value, which is
    // `undefined` for an untouched antd Select — so every unfiltered forecast
    // asked for `category=undefined` while Redux recorded `""`.
    const url = buildSearchQuery({
      parameters: { ...parameters, category: undefined, group: undefined },
      user,
    });
    expect(url).not.toContain("undefined");
    expect(new URLSearchParams(url.split("?")[1]).get("category")).toBe("");
  });

  it("encodes a value that would otherwise break the query", () => {
    const url = buildSearchQuery({
      parameters: { ...parameters, category: "Radios & Headsets" },
      user,
    });
    expect(url).toContain("category=Radios+%26+Headsets");
    expect(new URLSearchParams(url.split("?")[1]).get("category")).toBe(
      "Radios & Headsets"
    );
  });

  it("does not throw on a user with no company ids", () => {
    const url = buildSearchQuery({ parameters, user: {} });
    expect(new URLSearchParams(url.split("?")[1]).get("company_id")).toBe("");
  });
});

describe("describeFilters", () => {
  it("says what an unfiltered forecast covers", () => {
    expect(describeFilters(emptyFilters())).toBe(
      "Forecasting every item in your inventory."
    );
  });

  it("names the filters that are set", () => {
    expect(
      describeFilters({ ...emptyFilters(), category: "Radios", location: "Warehouse" })
    ).toBe("Forecasting only category Radios, location Warehouse.");
  });
});

describe("countFilters", () => {
  it("counts only what is set", () => {
    expect(countFilters(emptyFilters())).toBe(0);
    expect(countFilters({ ...emptyFilters(), brand: "Sennheiser" })).toBe(1);
    expect(countFilters(undefined)).toBe(0);
  });
});

describe("readSearchError", () => {
  it("turns the handler's TypeError into what it actually means", () => {
    expect(
      readSearchError({
        response: {
          data: { msg: "Cannot read properties of undefined (reading 'length')" },
        },
      })
    ).toBe("There is no inventory available for the period selected.");
  });

  it("passes the server's own message through", () => {
    expect(readSearchError({ response: { data: { msg: "Too broad." } } })).toBe(
      "Too broad."
    );
    expect(readSearchError({ response: { data: { message: "Nope." } } })).toBe("Nope.");
  });

  it("falls back to the thrown error, then to a sentence of its own", () => {
    expect(readSearchError(new Error("Network Error"))).toBe("Network Error");
    expect(readSearchError({})).toBe(
      "The forecast could not be run. Nothing was changed — try again."
    );
  });
});
