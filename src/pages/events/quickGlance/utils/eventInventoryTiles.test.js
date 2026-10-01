import { describe, expect, it } from "vitest";
import { inventoryTileColumns, inventoryTileGridTemplate } from "./eventInventoryTiles";

/**
 * "Inventory assigned to event for consumer uses" — meeting 2026-09-29
 * `1:03:24`–`1:03:46`: "how many can you have in each row?… Three, I think.
 * Three you can do." It was `repeat(auto-fit, minmax(280px, 1fr))`, so the
 * count per row depended on the width, and one card stretched across it all.
 */
describe("inventoryTileColumns", () => {
  it("is three on a large screen", () => {
    expect(inventoryTileColumns({ small: false, medium: false })).toBe(3);
  });

  it("is two on a medium screen", () => {
    expect(inventoryTileColumns({ small: false, medium: true })).toBe(2);
  });

  it("is one on a phone", () => {
    expect(inventoryTileColumns({ small: true, medium: true })).toBe(1);
  });
});

describe("inventoryTileGridTemplate", () => {
  /* Fixed columns: a single card takes one column, not the whole row. */
  it("is fixed equal columns that never overflow", () => {
    expect(inventoryTileGridTemplate(3)).toBe("repeat(3, minmax(0, 1fr))");
  });
});
