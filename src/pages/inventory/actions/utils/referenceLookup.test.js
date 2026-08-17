import { describe, expect, it } from "vitest";
import {
  findReferenceMatches,
  hasReferenceCriteria,
} from "./referenceLookup";

const items = [
  {
    serial_number: "A1",
    category_name: "Audio",
    item_group: "PL6 RF Receiver",
    brand: "Congress Audio",
    cost: "99.00",
    image_url: "https://img/pl6.png",
  },
  {
    serial_number: "A2",
    category_name: "Audio",
    item_group: "PL6 RF Receiver",
    brand: "Congress Audio",
    cost: "99.00",
    image_url: "https://img/pl6.png",
  },
  {
    serial_number: "B1",
    category_name: "Audio",
    item_group: "Transmitter",
    brand: "Sony",
    cost: "150.00",
    image_url: "",
  },
  {
    serial_number: "C1",
    category_name: "Fitness",
    item_group: "Treadmill",
    brand: "Sony",
    cost: "900.00",
    image_url: "https://img/tread.png",
  },
];

describe("hasReferenceCriteria", () => {
  it("is false when nothing was chosen", () => {
    expect(hasReferenceCriteria({})).toBe(false);
    expect(
      hasReferenceCriteria({ category: "", itemGroup: "", brand: "" }),
    ).toBe(false);
    expect(hasReferenceCriteria({ category: "   " })).toBe(false);
  });

  it("is true as soon as one field is filled", () => {
    expect(hasReferenceCriteria({ brand: "Sony" })).toBe(true);
  });
});

describe("findReferenceMatches", () => {
  it("filters by category", () => {
    const { matches } = findReferenceMatches(items, { category: "Fitness" });
    expect(matches.map((item) => item.serial_number)).toEqual(["C1"]);
  });

  it("filters by device name", () => {
    const { matches } = findReferenceMatches(items, {
      itemGroup: "PL6 RF Receiver",
    });
    expect(matches.map((item) => item.serial_number)).toEqual(["A1", "A2"]);
  });

  it("filters by brand", () => {
    const { matches } = findReferenceMatches(items, { brand: "Sony" });
    expect(matches.map((item) => item.serial_number)).toEqual(["B1", "C1"]);
  });

  it("combines the criteria that were filled and ignores the blank ones", () => {
    const { matches } = findReferenceMatches(items, {
      category: "Audio",
      brand: "Sony",
      itemGroup: "",
    });
    expect(matches.map((item) => item.serial_number)).toEqual(["B1"]);
  });

  it("copies from the first match, and says how many there were", () => {
    // Which unit is copied from matters to the user: they are all supposed to
    // share the group's details, but if they do not, this is the one that wins.
    const result = findReferenceMatches(items, { category: "Audio" });
    expect(result.source.serial_number).toBe("A1");
    expect(result.matchCount).toBe(3);
  });

  it("returns nothing usable when no criteria were given", () => {
    const result = findReferenceMatches(items, {});
    expect(result.matches).toEqual([]);
    expect(result.source).toBeNull();
    expect(result.matchCount).toBe(0);
  });

  it("returns nothing usable when the criteria match no item", () => {
    const result = findReferenceMatches(items, { brand: "Nokia" });
    expect(result.source).toBeNull();
    expect(result.matchCount).toBe(0);
  });

  it("survives a missing or malformed inventory list", () => {
    for (const list of [null, undefined, "nope", []]) {
      expect(findReferenceMatches(list, { brand: "Sony" }).source).toBeNull();
    }
  });
});

describe("findReferenceMatches — image", () => {
  it("offers the image when every match shares exactly one", () => {
    const result = findReferenceMatches(items, {
      itemGroup: "PL6 RF Receiver",
    });
    expect(result.imageUrl).toBe("https://img/pl6.png");
    expect(result.imageConflict).toBe(false);
  });

  it("offers none and flags the conflict when the matches disagree", () => {
    const result = findReferenceMatches(
      [
        { serial_number: "A", brand: "X", image_url: "https://img/a.png" },
        { serial_number: "B", brand: "X", image_url: "https://img/b.png" },
      ],
      { brand: "X" },
    );
    expect(result.imageUrl).toBeNull();
    expect(result.imageConflict).toBe(true);
  });

  it("does not call one picture plus one blank a conflict", () => {
    // Sony matches a unit with a picture and a unit with none. That is one
    // picture the group agrees on, not two competing ones.
    const result = findReferenceMatches(items, { brand: "Sony" });
    expect(result.imageUrl).toBe("https://img/tread.png");
    expect(result.imageConflict).toBe(false);
  });

  it("ignores blank image fields rather than counting them as a variant", () => {
    const result = findReferenceMatches(
      [
        { serial_number: "A", brand: "X", image_url: "https://img/a.png" },
        { serial_number: "B", brand: "X", image_url: "" },
        { serial_number: "C", brand: "X", image_url: null },
      ],
      { brand: "X" },
    );
    expect(result.imageUrl).toBe("https://img/a.png");
    expect(result.imageConflict).toBe(false);
  });

  it("reports no image at all when none of the matches has one", () => {
    const result = findReferenceMatches(
      [{ serial_number: "A", brand: "X", image_url: "" }],
      { brand: "X" },
    );
    expect(result.imageUrl).toBeNull();
    expect(result.imageConflict).toBe(false);
  });
});
