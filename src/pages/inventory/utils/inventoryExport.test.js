import { describe, expect, it, vi } from "vitest";
import {
  buildInventoryExportBody,
  fetchInventoryForExport,
} from "./inventoryExport";

describe("buildInventoryExportBody", () => {
  // B5: the server takes the role from company_staff via the JWT and ignores
  // `role` in the body (BACKEND_fedramp_backend_blockers_REPLY_2026-11-04.md §1.2).
  it("asks warehouse-items for the company and location scope, without a role", () => {
    expect(
      buildInventoryExportBody({
        companyId: 62,
        locations: ["Main warehouse", "Aisle 3"],
      }),
    ).toStrictEqual({
      company_id: 62,
      preference: ["Main warehouse", "Aisle 3"],
    });
  });

  // A role with no location scope sends what it sent before: the fallback the
  // page used, or nothing. Sending [] would read as "scoped to zero locations".
  it("falls back rather than sending an empty scope", () => {
    expect(
      buildInventoryExportBody({ companyId: 62, locations: [] })
        .preference,
    ).toBeUndefined();

    expect(
      buildInventoryExportBody({
        companyId: 62,
        locations: null,
        fallbackPreference: "Main warehouse",
      }).preference,
    ).toBe("Main warehouse");
  });
});

describe("fetchInventoryForExport", () => {
  const rows = [{ item_id: 1 }, { item_id: 2 }];

  it("hands back every row the endpoint returned", async () => {
    const api = { post: vi.fn().mockResolvedValue({ data: { ok: true, items: rows } }) };

    await expect(
      fetchInventoryForExport(api, { company_id: 62 }),
    ).resolves.toEqual(rows);

    expect(api.post).toHaveBeenCalledWith("/db_item/warehouse-items", {
      company_id: 62,
    });
  });

  // The whole inventory in one request is the point: this runs on a click, not
  // on every render, which is what the server pagination was protecting.
  it("asks once", async () => {
    const api = { post: vi.fn().mockResolvedValue({ data: { items: rows } }) };

    await fetchInventoryForExport(api, { company_id: 62 });

    expect(api.post).toHaveBeenCalledTimes(1);
  });

  it("reads an answer with no items as no rows", async () => {
    for (const data of [{ ok: true }, { items: null }, {}]) {
      const api = { post: vi.fn().mockResolvedValue({ data }) };
      await expect(fetchInventoryForExport(api, {})).resolves.toEqual([]);
    }
  });

  // The caller shows a failure message; swallowing the error here would hand
  // the exporter an empty array and produce an empty spreadsheet instead.
  it("lets a failed request reach the caller", async () => {
    const api = { post: vi.fn().mockRejectedValue(new Error("Network Error")) };

    await expect(fetchInventoryForExport(api, {})).rejects.toThrow("Network Error");
  });
});
