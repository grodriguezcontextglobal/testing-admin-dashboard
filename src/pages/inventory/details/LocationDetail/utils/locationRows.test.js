import { describe, expect, it } from "vitest";
import { buildLocationRows, filterLocationRows } from "./locationRows";

/**
 * Why this file exists.
 *
 * The location table built its rows inline, keyed with lodash `uniqueId()`, and
 * memoized them on `groupingByDeviceType` — a `groupBy(...)` recomputed on
 * every render. So the memo never held: every render produced a fresh row array
 * with a brand-new React key per row, the `referenceData(...)` effect that
 * depends on it fired again, its `setReferenceData({...})` handed the parent a
 * new object, and the parent re-rendered. A self-sustaining loop.
 *
 * The visible symptom was the arrow icon: with every `<tr>` unmounting and
 * remounting continuously, the button under the cursor was destroyed between
 * mousedown and mouseup, so no click event was ever produced. Hence "the icon
 * does nothing", intermittently, in every browser, surviving a cache refresh —
 * while the same icon worked from the All devices table, whose row keys are a
 * plain `${item_id}`.
 */

const catalog = [
  { item_id: 200602, serial_number: "SN-100016", item_group: "Chromebook" },
  { item_id: 200603, serial_number: "SN-100017", item_group: "Chromebook" },
];

const inventoryItems = [
  { item_id: 200602, serial_number: "SN-100016", location: "IT office", warehouse: 1 },
  { item_id: 200603, serial_number: "SN-100017", location: "IT office", warehouse: 0 },
];

const imagesByGroup = { Chromebook: [{ image_url: "", source: "group.png" }] };

describe("buildLocationRows", () => {
  it("keeps the key stable across calls with the same input", () => {
    // The property that was broken. Anything else about the rows can change;
    // if the keys move, React throws the rows away and rebuilds them, and a
    // click cannot survive that.
    const first = buildLocationRows({ items: catalog, inventoryItems, imagesByGroup });
    const second = buildLocationRows({ items: catalog, inventoryItems, imagesByGroup });

    expect(first.map((row) => row.key)).toEqual(second.map((row) => row.key));
    expect(first.map((row) => row.key)).toEqual(["200602", "200603"]);
  });

  it("carries the item id on the row so the details icon can find it", () => {
    const [row] = buildLocationRows({ items: catalog, inventoryItems, imagesByGroup });
    expect(row.item_id).toBe(200602);
  });

  it("only keeps the items the location query answered for", () => {
    const rows = buildLocationRows({
      items: catalog,
      inventoryItems: [inventoryItems[0]],
      imagesByGroup,
    });
    expect(rows.map((row) => row.serial_number)).toEqual(["SN-100016"]);
  });

  it("does not emit the same item twice", () => {
    // The old builder collected into a `new Set()` of freshly-created objects,
    // which can never deduplicate anything.
    const rows = buildLocationRows({
      items: [...catalog, catalog[0]],
      inventoryItems,
      imagesByGroup,
    });
    expect(rows).toHaveLength(2);
  });

  it("takes the location from the inventory row, not the catalog entry", () => {
    const [row] = buildLocationRows({ items: catalog, inventoryItems, imagesByGroup });
    expect(row.location).toBe("IT office");
    expect(row.data.location).toBe("IT office");
  });

  it("falls back to the group image when the item has none", () => {
    const [row] = buildLocationRows({ items: catalog, inventoryItems, imagesByGroup });
    expect(row.image_url).toBe("group.png");
  });

  it("prefers the item's own image", () => {
    const [row] = buildLocationRows({
      items: catalog,
      inventoryItems: [{ ...inventoryItems[0], image_url: "item.png" }, inventoryItems[1]],
      imagesByGroup,
    });
    expect(row.image_url).toBe("item.png");
  });

  it("does not blow up when the group has no image either", () => {
    const [row] = buildLocationRows({
      items: catalog,
      inventoryItems,
      imagesByGroup: {},
    });
    expect(row.image_url).toBeNull();
  });

  it("survives nothing at all", () => {
    expect(buildLocationRows({})).toEqual([]);
    expect(buildLocationRows({ items: null, inventoryItems: null })).toEqual([]);
  });

  it("keys off the serial number when the catalog entry has no id", () => {
    const rows = buildLocationRows({
      items: [{ serial_number: "SN-100016", item_group: "Chromebook" }],
      inventoryItems,
      imagesByGroup,
    });
    // Still stable, and still never the string "undefined".
    expect(rows[0].key).toBe("200602");
  });
});

describe("filterLocationRows", () => {
  const rows = buildLocationRows({ items: catalog, inventoryItems, imagesByGroup });

  it("returns everything when nothing is searched for", () => {
    expect(filterLocationRows(rows, "")).toHaveLength(2);
    expect(filterLocationRows(rows, null)).toHaveLength(2);
  });

  it("matches on any field, case-insensitively", () => {
    expect(filterLocationRows(rows, "sn-100017")).toHaveLength(1);
    expect(filterLocationRows(rows, "IT OFFICE")).toHaveLength(2);
  });

  it("returns the same array identity when there is nothing to filter", () => {
    // So the caller's memo does not invalidate on every render.
    expect(filterLocationRows(rows, "")).toBe(rows);
  });

  it("survives no rows", () => {
    expect(filterLocationRows(null, "x")).toEqual([]);
  });
});
