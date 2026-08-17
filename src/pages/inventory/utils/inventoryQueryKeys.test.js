import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import {
  INVENTORY_PAGE_QUERY_NAMES,
  inventoryCacheKeys,
  inventoryPageQueryKeys,
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
