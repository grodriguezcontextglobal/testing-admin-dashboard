import { describe, expect, it } from "vitest";
import {
  dedupeBySerial,
  isInWarehouse,
  splitByWarehouse,
  warehouseCard,
} from "./warehouseResults";

const row = (over = {}) => ({
  item_id: 41,
  serial_number: "CAM-0007",
  item_group: "Chromebook",
  brand: "Acer",
  location: "IT office",
  status: "Operational",
  warehouse: 1,
  ...over,
});

describe("isInWarehouse", () => {
  it("reads warehouse = 1 as sitting on the shelf", () => {
    expect(isInWarehouse(row())).toBe(true);
    expect(isInWarehouse(row({ warehouse: "1" }))).toBe(true);
    expect(isInWarehouse(row({ warehouse: 2 }))).toBe(true);
  });

  it("reads 0 as out — that is what the old check meant by `warehouse < 1`", () => {
    expect(isInWarehouse(row({ warehouse: 0 }))).toBe(false);
    expect(isInWarehouse(row({ warehouse: "0" }))).toBe(false);
  });

  it("treats a missing or unreadable value as out, never as in stock", () => {
    expect(isInWarehouse(row({ warehouse: undefined }))).toBe(false);
    expect(isInWarehouse(row({ warehouse: null }))).toBe(false);
    expect(isInWarehouse(row({ warehouse: "yes" }))).toBe(false);
    expect(isInWarehouse(undefined)).toBe(false);
  });
});

describe("splitByWarehouse", () => {
  /* The bug this replaces: the old code asked `some(item => item.warehouse < 1)`
     and took one branch for the whole list, so nine units on the shelf were
     dropped the moment a tenth was out. */
  it("keeps both halves of a mixed result instead of choosing one", () => {
    const rows = [
      row({ serial_number: "A-1", warehouse: 1 }),
      row({ serial_number: "A-2", warehouse: 0 }),
      row({ serial_number: "A-3", warehouse: 1 }),
    ];
    const { inWarehouse, out } = splitByWarehouse(rows);
    expect(inWarehouse.map((r) => r.serial_number)).toEqual(["A-1", "A-3"]);
    expect(out.map((r) => r.serial_number)).toEqual(["A-2"]);
  });

  it("handles a result that is all shelf, which used to render nothing at all", () => {
    const { inWarehouse, out } = splitByWarehouse([row(), row({ serial_number: "B-2" })]);
    expect(inWarehouse).toHaveLength(2);
    expect(out).toHaveLength(0);
  });

  it("survives no result at all", () => {
    expect(splitByWarehouse(undefined)).toEqual({ inWarehouse: [], out: [] });
    expect(splitByWarehouse(null)).toEqual({ inWarehouse: [], out: [] });
  });
});

describe("warehouseCard", () => {
  it("shapes a shelf row the way the result card reads it", () => {
    const card = warehouseCard(row());
    expect(card).toMatchObject({
      serialNumber: "CAM-0007",
      type: "Chromebook",
      brand: "Acer",
      location: "IT office",
      itemId: "41",
      inWarehouse: true,
      event: null,
      active: false,
    });
    expect(card.data).toMatchObject({ serial_number: "CAM-0007" });
  });

  it("takes the image for its group when one is given", () => {
    expect(warehouseCard(row(), { image: "https://cdn/chromebook.png" }).image).toBe(
      "https://cdn/chromebook.png",
    );
    expect(warehouseCard(row()).image).toBe(false);
  });

  it("reads camelCase field names too, since only the SQL rows are snake_case", () => {
    const card = warehouseCard({ serialNumber: "D-9", deviceType: "Receiver", warehouse: 1 });
    expect(card.serialNumber).toBe("D-9");
    expect(card.type).toBe("Receiver");
  });

  it("never invents a serial", () => {
    expect(warehouseCard({ warehouse: 1 }).serialNumber).toBe("");
  });

  /* A stringified nothing is not an id — navigating with one lands on an item
     page with no item, which is how the inventory table's arrow came to look
     broken. resolveItemRowId is the shared guard against it. */
  it("refuses an id that is really the word \"undefined\"", () => {
    expect(warehouseCard({ item_id: "undefined", warehouse: 1 }).itemId).toBeNull();
    expect(warehouseCard({ item_id: null, warehouse: 1 }).itemId).toBeNull();
  });
});

describe("dedupeBySerial", () => {
  /* The effect that builds these re-runs on a timer, and the old code appended
     to an array of fresh objects inside a Set — which deduplicates nothing,
     because every template is a new reference. */
  it("keeps one card per serial", () => {
    const cards = [
      { serialNumber: "A-1", inWarehouse: true },
      { serialNumber: "A-1", inWarehouse: true },
      { serialNumber: "A-2", inWarehouse: true },
    ];
    expect(dedupeBySerial(cards)).toHaveLength(2);
  });

  it("matches serials case-insensitively and ignores surrounding space", () => {
    const cards = [{ serialNumber: "a-1" }, { serialNumber: " A-1 " }];
    expect(dedupeBySerial(cards)).toHaveLength(1);
  });

  it("keeps the first card for a serial, so an event result does not lose to a later duplicate", () => {
    const cards = [
      { serialNumber: "A-1", event: "Fall fair" },
      { serialNumber: "A-1", event: null },
    ];
    expect(dedupeBySerial(cards)[0].event).toBe("Fall fair");
  });

  it("keeps cards with no serial rather than collapsing them into one", () => {
    expect(dedupeBySerial([{ serialNumber: "" }, { serialNumber: "" }])).toHaveLength(2);
    expect(dedupeBySerial(undefined)).toEqual([]);
  });
});
