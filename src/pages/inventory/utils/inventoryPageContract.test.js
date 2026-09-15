import { describe, expect, it } from "vitest";
import {
  INVENTORY_FACET_KEYS,
  INVENTORY_FILTER_KEYS,
  INVENTORY_PAGE_SIZE_DEFAULT,
  INVENTORY_PAGE_SIZE_MAX,
  INVENTORY_SEARCH_MIN_LENGTH,
  INVENTORY_SORT_COLUMNS,
  SERIAL_SUGGEST_MAX,
  buildInventoryFacetsBody,
  buildInventoryPageBody,
  buildSerialSuggestParams,
  inventoryQuerySignature,
  toServerFilters,
} from "./inventoryPageContract";

describe("the whitelists", () => {
  it("names the nine filter keys the server accepts", () => {
    // Anything else is a 400 with the list of valid ones. The server is strict
    // on purpose: a filter key becomes a column name inside the SQL text, so it
    // cannot come from the client unchecked. Keeping the list here means the
    // client never sends the request that earns the 400.
    expect([...INVENTORY_FILTER_KEYS].sort()).toEqual([
      "brand",
      "category_name",
      "item_group",
      "location",
      "logistic_status",
      "main_warehouse",
      "ownership",
      "status",
      "warehouse",
    ]);
  });

  it("names the eight sortable columns, logistic_status included", () => {
    // Seven come from what the table declares sortable. logistic_status is the
    // eighth, added by the backend so the "Status" column can sort by what it
    // paints — it sorts by `warehouse` today and shows logistic_status.
    expect([...INVENTORY_SORT_COLUMNS].sort()).toEqual([
      "category_name",
      "item_group",
      "location",
      "logistic_status",
      "main_warehouse",
      "ownership",
      "serial_number",
      "warehouse",
    ]);
  });

  it("does not offer serial_number as a filter key", () => {
    // It is reachable through search (prefix, index-backed) and through
    // serial-suggest, never as an equality filter.
    expect(INVENTORY_FILTER_KEYS).not.toContain("serial_number");
  });
});

describe("buildInventoryPageBody", () => {
  it("never sends company_id", () => {
    // The one rule that is ours rather than the contract's. The company comes
    // from the s-company-lq header, which sessionHeaders attaches to every
    // /api/db_* call out of localStorage. A body company_id would come from
    // Redux instead, and the two diverge right after a company switch — which
    // is exactly the 400 the server now returns for a mismatch. Sending only
    // the header removes the failure mode instead of managing it.
    const body = buildInventoryPageBody({ company_id: 62 });
    expect(body).not.toHaveProperty("company_id");
  });

  it("defaults to a first page of fifty, with no cursor", () => {
    expect(buildInventoryPageBody()).toEqual({
      pageSize: INVENTORY_PAGE_SIZE_DEFAULT,
      cursor: null,
    });
  });

  it("caps pageSize at the server ceiling instead of earning a 400", () => {
    expect(buildInventoryPageBody({ pageSize: 50000 }).pageSize).toBe(
      INVENTORY_PAGE_SIZE_MAX,
    );
  });

  it("falls back to the default for a pageSize the server would reject", () => {
    for (const pageSize of [0, -10, 12.5, "many", null, NaN]) {
      expect(buildInventoryPageBody({ pageSize }).pageSize).toBe(
        INVENTORY_PAGE_SIZE_DEFAULT,
      );
    }
  });

  it("passes a cursor back verbatim", () => {
    const cursor = { v: "Laptop", id: 200336 };
    expect(buildInventoryPageBody({ cursor }).cursor).toEqual(cursor);
  });

  it("drops a search term shorter than the minimum rather than sending it", () => {
    expect(buildInventoryPageBody({ search: "0" })).not.toHaveProperty("search");
    expect(buildInventoryPageBody({ search: "   " })).not.toHaveProperty(
      "search",
    );
  });

  it("trims a search term it does send", () => {
    expect(buildInventoryPageBody({ search: "  00100  " }).search).toBe("00100");
  });

  it("keeps only whitelisted filter keys", () => {
    const body = buildInventoryPageBody({
      filters: { brand: "Dell", nonsense: "x", serial_number: "001" },
    });
    expect(body.filters).toEqual({ brand: "Dell" });
  });

  it("omits filters entirely when nothing survives the whitelist", () => {
    expect(
      buildInventoryPageBody({ filters: { nonsense: "x" } }),
    ).not.toHaveProperty("filters");
  });

  it("coerces warehouse to the integer flag the column actually holds", () => {
    // warehouse is an int in item_inv — 1 in stock, 0 out — not a label. The
    // server normalises true/"true"/1/"1" the same way; matching that here
    // keeps a filter built from a checkbox from missing every row.
    for (const truthy of [1, "1", true, "true"]) {
      expect(buildInventoryPageBody({ filters: { warehouse: truthy } }).filters)
        .toEqual({ warehouse: 1 });
    }
    for (const falsy of [0, "0", false, "false"]) {
      expect(buildInventoryPageBody({ filters: { warehouse: falsy } }).filters)
        .toEqual({ warehouse: 0 });
    }
  });

  it("drops a sort column the server does not accept", () => {
    const body = buildInventoryPageBody({ sortBy: "cost", sortDir: "asc" });
    expect(body).not.toHaveProperty("sortBy");
    expect(body).not.toHaveProperty("sortDir");
  });

  it("sends an accepted sort column with its direction", () => {
    expect(
      buildInventoryPageBody({ sortBy: "logistic_status", sortDir: "desc" }),
    ).toMatchObject({ sortBy: "logistic_status", sortDir: "desc" });
  });

  it("defaults an unrecognised direction to ascending", () => {
    expect(
      buildInventoryPageBody({ sortBy: "location", sortDir: "sideways" })
        .sortDir,
    ).toBe("asc");
  });

  it("does not sort by brand, which the table shows but the server will not order by", () => {
    // Easy to assume otherwise: brand is a filter key and a visible value, just
    // not one of the eight sortable columns.
    expect(buildInventoryPageBody({ sortBy: "brand" })).not.toHaveProperty(
      "sortBy",
    );
  });
});

describe("inventoryQuerySignature", () => {
  // A cursor belongs to one ordering of one filtered set. The signature is what
  // the page compares to know the cursor is stale, and it is also what goes in
  // the React Query key — one definition, so the cache and the reset rule can
  // never disagree about what "the same query" means.

  it("is stable across key order, so an unchanged query keeps its cursor", () => {
    expect(
      inventoryQuerySignature({
        filters: { brand: "Dell", location: "A" },
        sortBy: "brand",
      }),
    ).toBe(
      inventoryQuerySignature({
        sortBy: "brand",
        filters: { location: "A", brand: "Dell" },
      }),
    );
  });

  it("changes when a filter changes", () => {
    expect(inventoryQuerySignature({ filters: { brand: "Dell" } })).not.toBe(
      inventoryQuerySignature({ filters: { brand: "HP" } }),
    );
  });

  it("changes when the search term changes", () => {
    expect(inventoryQuerySignature({ search: "001" })).not.toBe(
      inventoryQuerySignature({ search: "002" }),
    );
  });

  it("changes when the sort column or direction changes", () => {
    const asc = inventoryQuerySignature({
      sortBy: "item_group",
      sortDir: "asc",
    });
    expect(asc).not.toBe(
      inventoryQuerySignature({ sortBy: "item_group", sortDir: "desc" }),
    );
    expect(asc).not.toBe(
      inventoryQuerySignature({ sortBy: "location", sortDir: "asc" }),
    );
  });

  it("ignores a sort column the server would reject, as the body does", () => {
    // The signature and the body have to agree: if `sortBy: "brand"` is not
    // sent, it must not reset the cursor either.
    expect(inventoryQuerySignature({ sortBy: "brand" })).toBe(
      inventoryQuerySignature({}),
    );
  });

  it("ignores the cursor and the page size, which must not reset the cursor", () => {
    expect(
      inventoryQuerySignature({
        filters: { brand: "Dell" },
        cursor: { v: "x", id: 1 },
        pageSize: 200,
      }),
    ).toBe(inventoryQuerySignature({ filters: { brand: "Dell" } }));
  });

  it("treats a sub-minimum search as no search, matching what gets sent", () => {
    // Otherwise typing one character would reset the cursor and refetch page
    // one for a term the server was never told about.
    expect(inventoryQuerySignature({ search: "0" })).toBe(
      inventoryQuerySignature({}),
    );
  });
});

describe("toServerFilters", () => {
  // The selects speak in {category, value}. The server speaks in column names.
  // Not everything maps to a filter, and saying so out loud is the point — a
  // silent drop is how a filter appears to work and quietly returns everything.

  it("maps the seven selects that are real filter columns", () => {
    const { filters } = toServerFilters([
      { category: 0, value: "Dell" },
      { category: 1, value: "Laptops" },
      { category: 3, value: "Warehouse A" },
      { category: 4, value: "Permanent" },
      { category: 5, value: "Good" },
      { category: 7, value: "in-stock" },
      { category: 8, value: "Connectivity" },
    ]);
    expect(filters).toEqual({
      brand: "Dell",
      item_group: "Laptops",
      location: "Warehouse A",
      ownership: "Permanent",
      status: "Good",
      logistic_status: "in-stock",
      category_name: "Connectivity",
    });
  });

  it("maps the Category select to category_name", () => {
    expect(toServerFilters([{ category: 8, value: "Connectivity" }]).filters)
      .toEqual({ category_name: "Connectivity" });
  });

  it("sends the Condition select to `status`, which is the column that exists", () => {
    // The select builds its options from `status` but the client compared them
    // against `condition`, which lives in item_inv_assigned_event and never
    // arrives on these rows. Mapping to `status` is the fix, not a rename.
    expect(toServerFilters([{ category: 5, value: "Good" }]).filters).toEqual({
      status: "Good",
    });
  });

  it("routes the Serial Number select to search, not to a filter", () => {
    const { filters, search } = toServerFilters([
      { category: 2, value: "00100003" },
    ]);
    expect(filters).toEqual({});
    expect(search).toBe("00100003");
  });

  it("still reports category 6 as unsupported, though nothing renders it now", () => {
    // The Staff member select is gone — it filtered on assignedToStaffMember,
    // derived from `usage`, which a real warehouse-items row does not carry, so
    // it matched nothing. This branch stays because a chosen filter can outlive
    // the control that produced it, and because the category comes back once
    // the backend settles where "assigned to staff" lives.
    const { filters, unsupported } = toServerFilters([
      { category: 6, value: "Ana Ruiz / ana@x.com" },
    ]);
    expect(filters).toEqual({});
    expect(unsupported).toEqual([6]);
  });

  it("survives junk without throwing", () => {
    expect(toServerFilters(undefined).filters).toEqual({});
    expect(toServerFilters([{ category: 99, value: "x" }]).unsupported).toEqual([
      99,
    ]);
    expect(toServerFilters([{ category: 0 }]).filters).toEqual({});
  });
});

describe("buildInventoryFacetsBody", () => {
  it("never sends company_id either", () => {
    expect(buildInventoryFacetsBody({ company_id: 62 })).not.toHaveProperty(
      "company_id",
    );
  });

  it("carries the same filters and search as the page it describes", () => {
    // matchedTotal has to count the set the table is showing. A facets call
    // built from different filters would report a total for a different query.
    expect(
      buildInventoryFacetsBody({
        filters: { brand: "Dell", nonsense: "x" },
        search: "00100",
      }),
    ).toEqual({ filters: { brand: "Dell" }, search: "00100" });
  });

  it("asks for every facet by default", () => {
    expect(buildInventoryFacetsBody()).toEqual({});
    expect(INVENTORY_FACET_KEYS).toHaveLength(7);
  });

  it("keeps only recognised facet names when asked for a subset", () => {
    expect(
      buildInventoryFacetsBody({ facets: ["brand", "serial_number"] }).facets,
    ).toEqual(["brand"]);
  });
});

describe("buildSerialSuggestParams", () => {
  it("returns null below the minimum, so no request is made", () => {
    // The endpoint 400s under two characters. Not asking is better than asking
    // and handling the error.
    expect(buildSerialSuggestParams({ q: "0" })).toBeNull();
    expect(buildSerialSuggestParams({ q: "  " })).toBeNull();
    expect(buildSerialSuggestParams({})).toBeNull();
  });

  it("trims the term and defaults the limit to the ceiling", () => {
    expect(buildSerialSuggestParams({ q: "  001 " })).toEqual({
      q: "001",
      limit: SERIAL_SUGGEST_MAX,
    });
  });

  it("lets the caller ask for fewer, never more", () => {
    expect(buildSerialSuggestParams({ q: "001", limit: 5 }).limit).toBe(5);
    expect(buildSerialSuggestParams({ q: "001", limit: 900 }).limit).toBe(
      SERIAL_SUGGEST_MAX,
    );
  });

  it("does not put company_id in the query string", () => {
    expect(buildSerialSuggestParams({ q: "001", company_id: 62 })).not.toHaveProperty(
      "company_id",
    );
  });

  it("agrees with the page body on what counts as a searchable term", () => {
    const tooShort = "x".repeat(INVENTORY_SEARCH_MIN_LENGTH - 1);
    expect(buildSerialSuggestParams({ q: tooShort })).toBeNull();
    expect(buildInventoryPageBody({ search: tooShort })).not.toHaveProperty(
      "search",
    );
  });
});
