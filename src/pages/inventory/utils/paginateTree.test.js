import { describe, expect, it } from "vitest";
import { TREE_PAGE_SIZE, paginateTree } from "./paginateTree";

const tree = (count) =>
  Object.fromEntries(
    Array.from({ length: count }, (_, index) => [
      `Location ${index + 1}`,
      { units: index },
    ]),
  );

describe("paginateTree", () => {
  it("hands back ten rows a page by default", () => {
    const result = paginateTree(tree(25), { page: 1 });

    expect(result.entries).toHaveLength(TREE_PAGE_SIZE);
    expect(result.entries[0][0]).toBe("Location 1");
    expect(result.total).toBe(25);
    expect(result.pageCount).toBe(3);
  });

  it("carries the rows of the page asked for", () => {
    const result = paginateTree(tree(25), { page: 3 });

    expect(result.entries.map(([name]) => name)).toEqual([
      "Location 21",
      "Location 22",
      "Location 23",
      "Location 24",
      "Location 25",
    ]);
    expect(result.page).toBe(3);
  });

  // A filter can shrink the tree while the operator is on page 4. Showing an
  // empty page there reads as "no locations", which is the opposite of true.
  it("lands on the last page when the one asked for is past the end", () => {
    const result = paginateTree(tree(12), { page: 7 });

    expect(result.page).toBe(2);
    expect(result.entries.map(([name]) => name)).toEqual([
      "Location 11",
      "Location 12",
    ]);
  });

  it("treats a page below one as the first", () => {
    expect(paginateTree(tree(5), { page: 0 }).page).toBe(1);
    expect(paginateTree(tree(5), { page: -3 }).page).toBe(1);
  });

  // The pager only earns its place once there is a second page; with nine
  // locations it is a control that does nothing.
  it("says how many pages there are, so the caller can hide a pager of one", () => {
    expect(paginateTree(tree(9), { page: 1 }).pageCount).toBe(1);
    expect(paginateTree(tree(11), { page: 1 }).pageCount).toBe(2);
  });

  it("survives an empty tree and a tree that never arrived", () => {
    for (const empty of [{}, null, undefined, [], "locations"]) {
      const result = paginateTree(empty, { page: 1 });
      expect(result.entries).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.pageCount).toBe(1);
      expect(result.page).toBe(1);
    }
  });

  it("keeps the order the tree arrived in", () => {
    const unordered = { Zulu: {}, Alpha: {}, Mike: {} };

    expect(paginateTree(unordered, { page: 1 }).entries.map(([n]) => n)).toEqual([
      "Zulu",
      "Alpha",
      "Mike",
    ]);
  });

  it("takes a page size when the caller has a reason for one", () => {
    const result = paginateTree(tree(25), { page: 2, pageSize: 5 });

    expect(result.entries).toHaveLength(5);
    expect(result.entries[0][0]).toBe("Location 6");
    expect(result.pageCount).toBe(5);
  });
});
