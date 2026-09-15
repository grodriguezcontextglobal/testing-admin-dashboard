import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import {
  INVENTORY_PAGE_QUERY_NAMES,
  inventoryCacheKeys,
  inventoryPageQueryKeys,
  inventoryServerFacetsKey,
  inventoryServerPageKey,
  invalidateInventoryQueries,
} from "./inventoryQueryKeys";

const COMPANY_ID = 42;

describe("inventoryPageQueryKeys", () => {
  const keys = inventoryPageQueryKeys(COMPANY_ID);

  it("includes the landing fetch that decides the tab and the total", () => {
    // companyHasInventoryQuery caches for 5 minutes and is the query the page
    // boots on. Leaving it out is why a just-created item was invisible on the
    // page you land back on.
    expect(keys).toContainEqual(["companyHasInventoryQuery", COMPANY_ID]);
  });

  it("includes the grouping query behind the Locations/Categories/Groups cards", () => {
    expect(keys).toContainEqual(["structuredCompanyInventory"]);
  });

  it("no longer counts the legacy fetches among what the page mounts", () => {
    // The table used to download the whole inventory three times: once from
    // /db_item/warehouse-items, and twice more from the pair below, whose only
    // job was to feed a client-side join that was thrown away whenever
    // warehouse-items returned anything at all. Server-side pagination cannot
    // paginate two datasets at once, so the legacy path is gone — and these
    // two names must not come back into what the page mounts.
    expect(INVENTORY_PAGE_QUERY_NAMES).not.toContain("listOfItemsInStock");
    expect(INVENTORY_PAGE_QUERY_NAMES).not.toContain(
      "ItemsInInventoryCheckingQuery",
    );
  });

  it("still clears the legacy fetches, which other screens do mount", () => {
    // The distinction this pins down is the one that makes the two lists
    // differ. /inventory no longer reads these, but /home's location table and
    // the add / edit / bulk / assignment flows do, off the same inventory a
    // write from this page just changed. Dropping them from the write path
    // would let someone create an item here and meet the old count there.
    expect(keys).toContainEqual(["listOfItemsInStock"]);
    expect(keys).toContainEqual(["ItemsInInventoryCheckingQuery"]);
  });

  it("passes the company id through untouched", () => {
    // BackgroundJobsTracker invalidates with `exact: true`, which deep-compares
    // the key. Stringifying a numeric company id here would silently stop
    // matching the query the page registered.
    const scoped = keys.filter((key) => key.length > 1);
    expect(scoped.length).toBeGreaterThan(0);
    for (const key of scoped) {
      expect(key[1]).toBe(COMPANY_ID);
    }
  });

  it("returns only non-empty arrays, with no duplicates", () => {
    for (const key of keys) {
      expect(Array.isArray(key)).toBe(true);
      expect(key.length).toBeGreaterThan(0);
      expect(typeof key[0]).toBe("string");
    }
    const serialized = keys.map((key) => JSON.stringify(key));
    expect(new Set(serialized).size).toBe(serialized.length);
  });

  it("covers every query the /inventory page actually mounts", () => {
    // The drift this guards against is the whole point of the module: a query
    // added to the page and forgotten here goes stale after every write.
    const here = path.dirname(fileURLToPath(import.meta.url));
    const pageFiles = [
      path.resolve(here, "../MainPage.jsx"),
      path.resolve(here, "../table/ItemTable.jsx"),
      path.resolve(here, "../table/extras/RenderingFilters.jsx"),
    ];

    const mounted = new Set();
    for (const file of pageFiles) {
      const source = fs.readFileSync(file, "utf8");
      for (const match of source.matchAll(
        /queryKey:\s*\[\s*["']([^"']+)["']/g,
      )) {
        mounted.add(match[1]);
      }
    }

    expect(mounted.size).toBeGreaterThan(0);
    expect([...mounted].sort()).toEqual([...INVENTORY_PAGE_QUERY_NAMES].sort());
  });
});

describe("inventoryServerPageKey / inventoryServerFacetsKey", () => {
  const query = { filters: { brand: "Dell" }, sortBy: "location" };

  it("carries the company id, which the page-level keys never did", () => {
    // The four keys this page registered were bare constants. That was
    // survivable while every one of them returned the whole company's
    // inventory; the moment a key stands for "page 3 of this filtered set",
    // a cache hit from another company or another query is served silently.
    expect(inventoryServerPageKey(COMPANY_ID, query)[1]).toBe(COMPANY_ID);
    expect(inventoryServerFacetsKey(COMPANY_ID, query)[1]).toBe(COMPANY_ID);
  });

  it("separates two companies asking the same question", () => {
    expect(inventoryServerPageKey(1, query)).not.toEqual(
      inventoryServerPageKey(2, query),
    );
  });

  it("separates two queries from the same company", () => {
    expect(
      inventoryServerPageKey(COMPANY_ID, { filters: { brand: "Dell" } }),
    ).not.toEqual(
      inventoryServerPageKey(COMPANY_ID, { filters: { brand: "HP" } }),
    );
  });

  it("keeps the same query stable across key order", () => {
    expect(
      inventoryServerPageKey(COMPANY_ID, {
        filters: { brand: "Dell", location: "A" },
      }),
    ).toEqual(
      inventoryServerPageKey(COMPANY_ID, {
        filters: { location: "A", brand: "Dell" },
      }),
    );
  });

  it("gives each cursor its own entry, so paging back is a cache hit", () => {
    const first = inventoryServerPageKey(COMPANY_ID, query);
    const second = inventoryServerPageKey(COMPANY_ID, {
      ...query,
      cursor: { v: "Laptop", id: 200336 },
    });
    expect(first).not.toEqual(second);
    expect(second).toEqual(
      inventoryServerPageKey(COMPANY_ID, {
        ...query,
        cursor: { v: "Laptop", id: 200336 },
      }),
    );
  });

  it("does not key the facets by cursor, which would refetch them per page", () => {
    // Facets describe the whole filtered set, not the page. Keying them by
    // cursor would fire the aggregate query on every Next click.
    expect(inventoryServerFacetsKey(COMPANY_ID, query)).toEqual(
      inventoryServerFacetsKey(COMPANY_ID, {
        ...query,
        cursor: { v: "Laptop", id: 200336 },
      }),
    );
  });

  it("keeps the page and the facets in separate namespaces", () => {
    expect(inventoryServerPageKey(COMPANY_ID, query)[0]).not.toBe(
      inventoryServerFacetsKey(COMPANY_ID, query)[0],
    );
  });
});

describe("inventoryCacheKeys", () => {
  it("builds the backend cache keys the inventory writes clear", () => {
    expect(inventoryCacheKeys({ companyMongoId: "abc123" })).toEqual([
      "company_id=abc123&warehouse=true&enableAssignFeature=1",
      "providerCompanies_abc123",
    ]);
  });
});

describe("invalidateInventoryQueries", () => {
  it("invalidates every page key exactly once, matching exactly", () => {
    const queryClient = { invalidateQueries: vi.fn().mockResolvedValue() };
    invalidateInventoryQueries(queryClient, { companyId: COMPANY_ID });

    const calls = queryClient.invalidateQueries.mock.calls.map(([arg]) => arg);
    expect(calls).toHaveLength(inventoryPageQueryKeys(COMPANY_ID).length);
    for (const call of calls) {
      expect(call.exact).toBe(true);
      expect(call.refetchType).toBe("active");
    }
    expect(calls.map((call) => call.queryKey)).toEqual(
      inventoryPageQueryKeys(COMPANY_ID),
    );
  });

  it("resolves even when a client rejects, so a write is never reported as failed for a stale cache", async () => {
    const queryClient = {
      invalidateQueries: vi.fn().mockRejectedValue(new Error("offline")),
    };
    await expect(
      invalidateInventoryQueries(queryClient, { companyId: COMPANY_ID }),
    ).resolves.toBeUndefined();
  });

  it("does nothing without a client rather than throwing mid-write", async () => {
    await expect(
      invalidateInventoryQueries(null, { companyId: COMPANY_ID }),
    ).resolves.toBeUndefined();
  });
});
