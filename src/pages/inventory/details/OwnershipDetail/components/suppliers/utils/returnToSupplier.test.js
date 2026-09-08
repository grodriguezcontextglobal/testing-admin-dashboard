import { describe, expect, it } from "vitest";
import {
  buildDeleteCriteriaGroups,
  buildReturnAuditEntries,
  buildReturnReportRows,
  describeUndeletable,
  describeBlocked,
  itemIdOf,
  partitionForReturn,
} from "./returnToSupplier";

const inStock = {
  item_id: 200602,
  serial_number: "SN-A1",
  item_group: "Tablet",
  logistic_status: "in-stock",
  warehouse: 1,
};


describe("partitionForReturn", () => {
  const assigned = {
    item_id: 200603,
    serial_number: "SN-B2",
    item_group: "Radio",
  };

  it("returns every row the server answered about", () => {
    /* The in-use rule that used to split these lived here and is gone:
       `inventory.itemsByIds` returns neither `logistic_status` nor `warehouse`,
       so it had no input on any real return. See the file's own note. */
    const { returnable, blocked } = partitionForReturn({
      items: [inStock, assigned],
      requestedIds: [200602, 200603],
    });
    expect(returnable.map((row) => row.item_id)).toEqual([200602, 200603]);
    expect(blocked).toEqual([]);
  });

  it("blocks an id the query did not answer for", () => {
    // There is no serial to report and nothing to log for it, and the server
    // not having it is not a reason to delete it.
    const { returnable, blocked } = partitionForReturn({
      items: [inStock],
      requestedIds: [200602, 999999],
    });
    expect(returnable).toHaveLength(1);
    expect(blocked).toEqual([
      {
        item_id: 999999,
        serial_number: null,
        reason: "missing",
        detail: "it is no longer in the inventory",
      },
    ]);
  });

  it("blocks everything when the query answered nothing", () => {
    const { returnable, blocked } = partitionForReturn({
      items: [],
      requestedIds: [1, 2, 3],
    });
    expect(returnable).toEqual([]);
    expect(blocked).toHaveLength(3);
  });

  it("matches ids across a string/number mismatch", () => {
    const { returnable } = partitionForReturn({
      items: [{ ...inStock, item_id: "200602" }],
      requestedIds: [200602],
    });
    expect(returnable).toHaveLength(1);
  });

  it("keeps the requested order and does not invent rows", () => {
    const { returnable } = partitionForReturn({
      items: [assigned, inStock],
      requestedIds: [200602],
    });
    expect(returnable.map((row) => row.item_id)).toEqual([200602]);
  });

  it("survives nothing at all", () => {
    expect(partitionForReturn({})).toEqual({ returnable: [], blocked: [] });
  });



});

describe("describeBlocked", () => {
  it("is null when nothing is blocked", () => {
    expect(describeBlocked([])).toBeNull();
    expect(describeBlocked(undefined)).toBeNull();
  });

  it("names the items and says what to do", () => {
    expect(
      describeBlocked([{ item_id: 1, serial_number: "SN-B2", reason: "missing" }])
    ).toBe(
      "1 item is no longer in the inventory and will not be returned: SN-B2. Reopen this list to see what is left."
    );
  });

  it("names three and counts the rest, rather than listing three hundred", () => {
    const blocked = Array.from({ length: 12 }, (_, index) => ({
      item_id: index,
      serial_number: `SN-${index}`,
      reason: "missing",
    }));
    expect(describeBlocked(blocked)).toContain("SN-0, SN-1, SN-2 and 9 more");
    expect(describeBlocked(blocked)).toContain("12 items are");
  });

  it("falls back to the id when a row has no serial", () => {
    expect(
      describeBlocked([{ item_id: 77, serial_number: null, reason: "missing" }])
    ).toContain("item 77");
  });
});


describe("buildReturnReportRows", () => {
  it("carries the provenance the item row used to hold", () => {
    // The item is deleted afterwards, so anything not in the report is gone.
    expect(
      buildReturnReportRows({
        items: [inStock],
        supplierName: "Acme Rentals",
        returnedBy: "Gustavo",
        timestamp: "2026-08-27T10:00:00.000Z",
      })
    ).toEqual([
      {
        item_id: 200602,
        serial_number: "SN-A1",
        item_group: "Tablet",
        supplier: "Acme Rentals",
        returned_by: "Gustavo",
        returned_at: "2026-08-27T10:00:00.000Z",
      },
    ]);
  });

  it("survives an item missing its optional fields", () => {
    const [row] = buildReturnReportRows({ items: [{ item_id: 5 }] });
    expect(row).toEqual({
      item_id: 5,
      serial_number: "",
      item_group: "",
      supplier: "",
      returned_by: "",
      returned_at: "",
    });
  });
});

describe("buildReturnAuditEntries", () => {
  it("writes one row per item, in the shape the endpoint takes", () => {
    expect(
      buildReturnAuditEntries({
        items: [inStock],
        supplierId: "sup-1",
        returnedBy: "Gustavo",
        timestamp: "2026-08-27T10:00:00.000Z",
      })
    ).toEqual([
      {
        action: "DELETE",
        target_model: "Item",
        target_id: 200602,
        details: {
          reason: "returned_to_supplier",
          supplier_id: "sup-1",
          returned_by: "Gustavo",
          return_timestamp: "2026-08-27T10:00:00.000Z",
          serial_number: "SN-A1",
          item_group: "Tablet",
        },
      },
    ]);
  });

  it("carries the two fields the endpoint requires on every row", () => {
    const entries = buildReturnAuditEntries({ items: [{ item_id: 1 }, { item_id: 2 }] });
    expect(entries).toHaveLength(2);
    entries.forEach((entry) => {
      expect(entry.action).toBe("DELETE");
      expect(entry.target_model).toBe("Item");
    });
  });

  it("is empty for nothing", () => {
    expect(buildReturnAuditEntries({ items: [] })).toEqual([]);
    expect(buildReturnAuditEntries({})).toEqual([]);
  });
});

describe("itemIdOf", () => {
  it("reads either spelling", () => {
    expect(itemIdOf({ item_id: 7 })).toBe(7);
    expect(itemIdOf({ id: 8 })).toBe(8);
    expect(itemIdOf({})).toBeNull();
  });
});

describe("buildDeleteCriteriaGroups", () => {
  const laptopA = {
    item_id: 1,
    serial_number: "15001519",
    category_name: "Laptop",
    item_group: "Group Test 1",
  };
  const laptopB = { ...laptopA, item_id: 2, serial_number: "15001520" };
  const radio = {
    item_id: 3,
    serial_number: "RD-01",
    category_name: "Radio",
    item_group: "Handhelds",
  };

  it("builds the body the criteria endpoint takes", () => {
    const { groups } = buildDeleteCriteriaGroups({
      items: [laptopA],
      companyId: 137,
    });

    expect(groups).toEqual([
      {
        company_id: 137,
        serial_number: ["15001519"],
        category_name: "Laptop",
        item_group: "Group Test 1",
      },
    ]);
  });

  it("puts every serial of one category and group in a single request", () => {
    const { groups } = buildDeleteCriteriaGroups({
      items: [laptopA, laptopB],
      companyId: 137,
    });

    expect(groups).toHaveLength(1);
    expect(groups[0].serial_number).toEqual(["15001519", "15001520"]);
  });

  it("splits by category and group, because the body carries one of each", () => {
    const { groups } = buildDeleteCriteriaGroups({
      items: [laptopA, radio],
      companyId: 137,
    });

    expect(groups).toHaveLength(2);
    expect(groups.map((group) => group.category_name)).toEqual([
      "Laptop",
      "Radio",
    ]);
  });

  it("separates two groups inside the same category", () => {
    const { groups } = buildDeleteCriteriaGroups({
      items: [laptopA, { ...laptopA, item_id: 9, serial_number: "X", item_group: "Group Test 2" }],
      companyId: 137,
    });

    expect(groups).toHaveLength(2);
  });

  it("never emits a body with no serial numbers", () => {
    /* `serial_number` is the only thing narrowing the delete: the endpoint
       requires `category_name` and treats the rest as optional filters, so a
       body without serials is a request to delete the whole category. */
    const { groups, undeletable } = buildDeleteCriteriaGroups({
      items: [{ ...laptopA, serial_number: "  " }],
      companyId: 137,
    });

    expect(groups).toEqual([]);
    expect(undeletable).toEqual([
      { item_id: 1, serial_number: null, reason: "no-serial" },
    ]);
  });

  it("holds back an item with no category rather than guessing one", () => {
    const { groups, undeletable } = buildDeleteCriteriaGroups({
      items: [{ ...laptopA, category_name: null }],
      companyId: 137,
    });

    expect(groups).toEqual([]);
    expect(undeletable).toEqual([
      { item_id: 1, serial_number: "15001519", reason: "no-category" },
    ]);
  });

  it("recovers the category from the rows the table already had", () => {
    // `inventory.itemsByIds` is a narrow projection; the table's own rows carry
    // `category_name`, so they are used to fill the gap before giving up.
    const { groups, undeletable } = buildDeleteCriteriaGroups({
      items: [{ item_id: 1, serial_number: "15001519", item_group: "Group Test 1" }],
      companyId: 137,
      fallbackRows: [laptopA],
    });

    expect(undeletable).toEqual([]);
    expect(groups[0].category_name).toBe("Laptop");
  });

  it("matches a fallback row by serial when the ids do not line up", () => {
    const { groups } = buildDeleteCriteriaGroups({
      items: [{ item_id: 999, serial_number: "15001519" }],
      companyId: 137,
      fallbackRows: [laptopA],
    });

    expect(groups[0].category_name).toBe("Laptop");
    expect(groups[0].item_group).toBe("Group Test 1");
  });

  it("omits item_group when nothing knows it, since it is optional", () => {
    const { groups } = buildDeleteCriteriaGroups({
      items: [{ item_id: 1, serial_number: "15001519", category_name: "Laptop" }],
      companyId: 137,
    });

    expect(groups).toEqual([
      { company_id: 137, serial_number: ["15001519"], category_name: "Laptop" },
    ]);
  });

  it("does not repeat a serial", () => {
    const { groups } = buildDeleteCriteriaGroups({
      items: [laptopA, { ...laptopA }],
      companyId: 137,
    });

    expect(groups[0].serial_number).toEqual(["15001519"]);
  });

  it("refuses to build anything without a company", () => {
    // Without it the server rejects the body, and a delete is not something to
    // send hopefully.
    expect(buildDeleteCriteriaGroups({ items: [laptopA] })).toEqual({
      groups: [],
      undeletable: [{ item_id: 1, serial_number: "15001519", reason: "no-company" }],
    });
  });

  it("survives nothing at all", () => {
    expect(buildDeleteCriteriaGroups({})).toEqual({ groups: [], undeletable: [] });
  });
});

describe("describeUndeletable", () => {
  it("is null when everything could be targeted", () => {
    expect(describeUndeletable([])).toBeNull();
  });

  it("says what is staying and why", () => {
    expect(
      describeUndeletable([
        { item_id: 1, serial_number: "15001519", reason: "no-category" },
      ])
    ).toBe(
      "1 item was reported but not removed, because the inventory has no category recorded for it: 15001519. Remove it by hand from the inventory table."
    );
  });

  it("names three and counts the rest", () => {
    const list = Array.from({ length: 7 }, (_, index) => ({
      item_id: index,
      serial_number: `SN-${index}`,
      reason: "no-serial",
    }));
    expect(describeUndeletable(list)).toContain("SN-0, SN-1, SN-2 and 4 more");
    expect(describeUndeletable(list)).toContain("7 items were");
  });
});
