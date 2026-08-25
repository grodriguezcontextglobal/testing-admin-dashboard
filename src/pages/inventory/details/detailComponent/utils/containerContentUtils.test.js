import { describe, expect, it } from "vitest";
import {
  buildFilterOptions,
  describeContentChanges,
  describeEmptyAction,
  filterWarehouseItems,
  groupContainerItems,
  summarizeCapacity,
} from "./containerContentUtils";

describe("summarizeCapacity", () => {
  it("reads as spots left while there is room", () => {
    const c = summarizeCapacity(8, 12);
    expect(c.used).toBe(8);
    expect(c.limit).toBe(12);
    expect(c.free).toBe(4);
    expect(c.tone).toBe("under");
    expect(c.statusLabel).toBe("4 spots left");
    expect(c.fillPct).toBe(67);
    expect(c.isOver).toBe(false);
    expect(c.isFull).toBe(false);
  });

  it("says one spot, not one spots", () => {
    expect(summarizeCapacity(11, 12).statusLabel).toBe("1 spot left");
  });

  it("turns full at exactly the limit", () => {
    const c = summarizeCapacity(12, 12);
    expect(c.tone).toBe("full");
    expect(c.statusLabel).toBe("Case full");
    expect(c.isFull).toBe(true);
    expect(c.isOver).toBe(false);
    expect(c.fillPct).toBe(100);
  });

  it("names the overflow and how to clear it", () => {
    const c = summarizeCapacity(14, 12);
    expect(c.tone).toBe("over");
    expect(c.isOver).toBe(true);
    expect(c.excess).toBe(2);
    expect(c.statusLabel).toBe("2 over capacity");
    expect(c.overMessage).toBe("This case holds 12. Remove 2 items before saving.");
  });

  it("uses singular wording for a single item over", () => {
    expect(summarizeCapacity(13, 12).overMessage).toBe(
      "This case holds 12. Remove 1 item before saving.",
    );
  });

  it("caps the fill bar at 100% instead of overflowing it", () => {
    expect(summarizeCapacity(30, 12).fillPct).toBe(100);
  });

  it("reports an empty case as every spot free", () => {
    const c = summarizeCapacity(0, 12);
    expect(c.statusLabel).toBe("12 spots left");
    expect(c.fillPct).toBe(0);
    expect(c.tone).toBe("under");
  });

  // containerSpotLimit is seeded as the string "0" by every create form
  // (useBulkActionLogic, BulkRentedItemsActions), so plenty of real containers
  // carry no usable limit. The old header rendered that as "8/0 cap".
  it("treats a zero limit as no limit rather than a full case", () => {
    const c = summarizeCapacity(8, 0);
    expect(c.hasLimit).toBe(false);
    expect(c.limit).toBeNull();
    expect(c.tone).toBe("unknown");
    expect(c.statusLabel).toBe("8 items");
    expect(c.isOver).toBe(false);
    expect(c.isFull).toBe(false);
    expect(c.free).toBeNull();
    expect(c.fillPct).toBe(0);
    expect(c.overMessage).toBeNull();
  });

  it("says one item, not one items, when there is no limit", () => {
    expect(summarizeCapacity(1, 0).statusLabel).toBe("1 item");
  });

  it("accepts the limit as a numeric string, the way the column arrives", () => {
    const c = summarizeCapacity(8, "12");
    expect(c.limit).toBe(12);
    expect(c.free).toBe(4);
    expect(c.statusLabel).toBe("4 spots left");
  });

  it("treats a missing or unparseable limit as no limit", () => {
    for (const limit of [null, undefined, "", "abc", NaN, -3]) {
      const c = summarizeCapacity(5, limit);
      expect(c.hasLimit).toBe(false);
      expect(c.tone).toBe("unknown");
    }
  });

  it("never reports a negative used count", () => {
    const c = summarizeCapacity(-4, 12);
    expect(c.used).toBe(0);
    expect(c.fillPct).toBe(0);
  });
});

describe("groupContainerItems", () => {
  const items = [
    { item_id: 1, serial_number: "RX-100001", item_group: "Receiver" },
    { item_id: 2, serial_number: "RX-100002", item_group: "Receiver" },
    { item_id: 3, serial_number: "TX-200001", item_group: "Transmitter" },
    { item_id: 4, serial_number: "RX-100003", item_group: "Receiver" },
  ];

  it("groups by item group so a bare serial carries identity", () => {
    const groups = groupContainerItems(items);
    expect(groups).toHaveLength(2);
    expect(groups[0].name).toBe("Receiver");
    expect(groups[0].count).toBe(3);
    expect(groups[0].countLabel).toBe("3");
    expect(groups[0].items.map((i) => i.serial)).toEqual([
      "RX-100001",
      "RX-100002",
      "RX-100003",
    ]);
    expect(groups[1].name).toBe("Transmitter");
    expect(groups[1].count).toBe(1);
  });

  it("keeps groups in the order they first appear", () => {
    const groups = groupContainerItems([items[2], items[0]]);
    expect(groups.map((g) => g.name)).toEqual(["Transmitter", "Receiver"]);
  });

  it("carries the item id through, since removal keys off it", () => {
    expect(groupContainerItems(items)[0].items[0].itemId).toBe(1);
  });

  // The container-items endpoint is not documented to return item_group, so a
  // missing group must not collapse the list into blank headings.
  it("falls back to one plain group when no item carries a group", () => {
    const groups = groupContainerItems([
      { item_id: 9, serial_number: "RX-100009" },
      { item_id: 10, serial_number: "RX-100010" },
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].name).toBe("Items");
    expect(groups[0].count).toBe(2);
  });

  it("accepts the alternative group key the pool responses use", () => {
    expect(groupContainerItems([{ item_id: 1, serial_number: "A", group: "Receiver" }])[0].name).toBe(
      "Receiver",
    );
  });

  it("returns nothing for an empty, missing or non-array input", () => {
    for (const value of [[], null, undefined, "nope", 0]) {
      expect(groupContainerItems(value)).toEqual([]);
    }
  });

  it("skips entries with no serial rather than rendering a blank chip", () => {
    const groups = groupContainerItems([
      { item_id: 1, serial_number: "RX-100001", item_group: "Receiver" },
      { item_id: 2, serial_number: "", item_group: "Receiver" },
      { item_id: 3, item_group: "Receiver" },
    ]);
    expect(groups[0].count).toBe(1);
  });
});

describe("describeContentChanges", () => {
  it("reports no changes when the staged set matches the baseline", () => {
    const d = describeContentChanges([1, 2, 3], [1, 2, 3]);
    expect(d.hasChanges).toBe(false);
    expect(d.addedCount).toBe(0);
    expect(d.removedCount).toBe(0);
    expect(d.changeLabel).toBeNull();
    expect(d.deltaLabel).toBe("No changes yet");
    expect(d.saveLabel).toBe("Save");
  });

  it("ignores ordering — the same set in another order is not a change", () => {
    expect(describeContentChanges([1, 2, 3], [3, 1, 2]).hasChanges).toBe(false);
  });

  it("describes removals for the panel and the save button", () => {
    const d = describeContentChanges([1, 2, 3], [1]);
    expect(d.removedCount).toBe(2);
    expect(d.addedCount).toBe(0);
    expect(d.changeLabel).toBe("2 items removed — not saved yet");
    expect(d.saveLabel).toBe("Remove 2 items");
  });

  it("describes additions", () => {
    const d = describeContentChanges([1], [1, 2, 3]);
    expect(d.addedCount).toBe(2);
    expect(d.changeLabel).toBe("2 items added — not saved yet");
    expect(d.saveLabel).toBe("Add 2 items");
  });

  it("uses singular wording for a single change", () => {
    expect(describeContentChanges([1], [1, 2]).changeLabel).toBe("1 item added — not saved yet");
    expect(describeContentChanges([1, 2], [1]).saveLabel).toBe("Remove 1 item");
  });

  it("reports a swap as both, and totals them on the save button", () => {
    const d = describeContentChanges([1, 2], [2, 3]);
    expect(d.addedCount).toBe(1);
    expect(d.removedCount).toBe(1);
    expect(d.changeLabel).toBe("1 item added, 1 item removed — not saved yet");
    expect(d.saveLabel).toBe("Save 2 changes");
  });

  it("spells the delta out against the count it started from", () => {
    const d = describeContentChanges([1, 2, 3, 4, 5, 6], [1, 2, 3, 4, 5, 7, 8, 9]);
    expect(d.deltaLabel).toBe("+3 added · −1 taken out · was 6");
  });

  it("shows only the side that changed in the delta", () => {
    expect(describeContentChanges([1, 2], [1, 2, 3]).deltaLabel).toBe("+1 added · was 2");
    expect(describeContentChanges([1, 2], [1]).deltaLabel).toBe("−1 taken out · was 2");
  });

  it("counts a duplicate id once instead of inflating the diff", () => {
    expect(describeContentChanges([1], [1, 1, 2]).addedCount).toBe(1);
  });

  it("survives missing or non-array inputs", () => {
    const d = describeContentChanges(null, undefined);
    expect(d.hasChanges).toBe(false);
    expect(d.saveLabel).toBe("Save");
  });

  it("treats emptying a full case as a removal of everything", () => {
    const d = describeContentChanges([1, 2, 3], []);
    expect(d.removedCount).toBe(3);
    expect(d.saveLabel).toBe("Remove 3 items");
  });
});

describe("describeEmptyAction", () => {
  // The old Popconfirm asked "Are you sure you want to remove all items inside
  // this container?" without ever saying how many that was.
  it("names the count in the button and in the confirm", () => {
    const a = describeEmptyAction(8);
    expect(a.buttonLabel).toBe("Empty case (8)");
    expect(a.confirmTitle).toBe("Remove all 8 items from this case?");
    expect(a.confirmCta).toBe("Remove 8 items");
  });

  it("does not say 1 items", () => {
    const a = describeEmptyAction(1);
    expect(a.buttonLabel).toBe("Empty case (1)");
    expect(a.confirmTitle).toBe("Remove the only item from this case?");
    expect(a.confirmCta).toBe("Remove 1 item");
  });

  it("is unavailable for an already-empty case", () => {
    expect(describeEmptyAction(0).isAvailable).toBe(false);
    expect(describeEmptyAction(3).isAvailable).toBe(true);
  });

  it("treats a missing count as an empty case", () => {
    for (const value of [null, undefined, NaN, -2]) {
      expect(describeEmptyAction(value).isAvailable).toBe(false);
    }
  });
});

describe("filterWarehouseItems", () => {
  const stock = [
    { item_id: 1, serial_number: "RX-100001", item_group: "Receiver", category_name: "Audio", brand: "Listen Tech", ownership: "Permanent" },
    { item_id: 2, serial_number: "RX-100002", item_group: "Receiver", category_name: "Audio", brand: "Sennheiser", ownership: "Rent" },
    { item_id: 3, serial_number: "TX-200001", item_group: "Transmitter", category_name: "Audio", brand: "Sennheiser", ownership: "Permanent" },
    { item_id: 4, serial_number: "CB-500001", item_group: "Cable", category_name: "Accessories", brand: "Generic", ownership: "Permanent" },
  ];

  it("returns everything when nothing is typed or picked", () => {
    expect(filterWarehouseItems(stock, {})).toHaveLength(4);
  });

  // The old flow made you choose four dropdowns and press Search before a
  // single row appeared; matching the serial directly is the whole point.
  it("matches a serial substring, case-insensitively", () => {
    expect(filterWarehouseItems(stock, { query: "rx-1000" })).toHaveLength(2);
    expect(filterWarehouseItems(stock, { query: "TX" })).toHaveLength(1);
    expect(filterWarehouseItems(stock, { query: "200001" })[0].item_id).toBe(3);
  });

  it("ignores surrounding whitespace from a scanner", () => {
    expect(filterWarehouseItems(stock, { query: "  RX-100001  " })).toHaveLength(1);
  });

  it("narrows by each filter dimension", () => {
    expect(filterWarehouseItems(stock, { filters: { item_group: "Receiver" } })).toHaveLength(2);
    expect(filterWarehouseItems(stock, { filters: { category_name: "Accessories" } })).toHaveLength(1);
    expect(filterWarehouseItems(stock, { filters: { brand: "Sennheiser" } })).toHaveLength(2);
    expect(filterWarehouseItems(stock, { filters: { ownership: "Rent" } })).toHaveLength(1);
  });

  it("combines filters and the query", () => {
    const out = filterWarehouseItems(stock, {
      query: "rx",
      filters: { brand: "Sennheiser" },
    });
    expect(out).toHaveLength(1);
    expect(out[0].item_id).toBe(2);
  });

  it("treats an empty or absent filter value as no filter", () => {
    expect(
      filterWarehouseItems(stock, { filters: { brand: "", ownership: undefined, item_group: null } }),
    ).toHaveLength(4);
  });

  it("excludes ids already staged in the case", () => {
    expect(filterWarehouseItems(stock, { excludeIds: [1, 2] })).toHaveLength(2);
  });

  it("matches excluded ids across number and string forms", () => {
    expect(filterWarehouseItems(stock, { excludeIds: ["1"] })).toHaveLength(3);
  });

  it("returns nothing for a missing or non-array list", () => {
    for (const value of [null, undefined, {}, "x"]) {
      expect(filterWarehouseItems(value, {})).toEqual([]);
    }
  });

  it("does not blow up on rows with missing fields", () => {
    expect(filterWarehouseItems([{ item_id: 9 }], { query: "rx" })).toEqual([]);
    expect(filterWarehouseItems([{ item_id: 9 }], {})).toHaveLength(1);
  });
});

describe("buildFilterOptions", () => {
  const stock = [
    { brand: "Listen Tech" },
    { brand: "Sennheiser" },
    { brand: "Listen Tech" },
    { brand: "" },
    { brand: null },
  ];

  it("leads with the any-option and lists each value once", () => {
    const options = buildFilterOptions(stock, "brand", "Any brand");
    expect(options[0]).toEqual({ value: "", label: "Any brand" });
    expect(options.slice(1).map((o) => o.value)).toEqual(["Listen Tech", "Sennheiser"]);
  });

  it("keeps values in first-seen order rather than sorting them", () => {
    const options = buildFilterOptions([{ brand: "Zeta" }, { brand: "Alpha" }], "brand", "Any");
    expect(options.slice(1).map((o) => o.value)).toEqual(["Zeta", "Alpha"]);
  });

  it("still returns the any-option for an empty or missing list", () => {
    for (const value of [[], null, undefined]) {
      expect(buildFilterOptions(value, "brand", "Any brand")).toEqual([
        { value: "", label: "Any brand" },
      ]);
    }
  });
});
