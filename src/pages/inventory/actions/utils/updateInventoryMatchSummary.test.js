import { describe, expect, it } from "vitest";
import {
  TRACKED_FIELDS,
  agreedFieldValues,
  agreedValue,
  formatTrackedFieldValue,
  summarizeInventoryMatches,
} from "./updateInventoryMatchSummary";
import {
  buildSubLocationPath,
  parseSubLocationPath,
} from "./SubLocationRenderer";

const item = (overrides = {}) => ({
  serial_number: "SN-1",
  brand: "Apple",
  cost: 180,
  ownership: "Rent",
  location: "Fort Lauderdale, FL",
  logistic_status: "in-stock",
  warehouse: 1,
  ...overrides,
});

describe("summarizeInventoryMatches", () => {
  it("returns an empty-but-shaped summary for no matches", () => {
    const summary = summarizeInventoryMatches([]);
    expect(summary.matchCount).toBe(0);
    expect(summary.costRange).toBeNull();
    expect(summary.fields).toEqual({});
  });

  it("treats a non-array input the same as no matches", () => {
    expect(summarizeInventoryMatches(undefined).matchCount).toBe(0);
    expect(summarizeInventoryMatches(null).matchCount).toBe(0);
  });

  it("counts distinct locations and ownership types", () => {
    const summary = summarizeInventoryMatches([
      item({ location: "Miami, FL", ownership: "Rent" }),
      item({ location: "Miami, FL", ownership: "Permanent" }),
      item({ location: "Orlando, FL", ownership: "Rent" }),
    ]);
    expect(summary.matchCount).toBe(3);
    expect(summary.locationCount).toBe(2);
    expect(summary.ownershipTypeCount).toBe(2);
  });

  it("computes the cost range across the group, ignoring non-numeric cost", () => {
    const summary = summarizeInventoryMatches([
      item({ cost: 180 }),
      item({ cost: 240 }),
      item({ cost: "" }),
      item({ cost: undefined }),
    ]);
    expect(summary.costRange).toEqual({ min: 180, max: 240 });
  });

  it("splits in-warehouse vs elsewhere using logistic_status", () => {
    const summary = summarizeInventoryMatches([
      item({ logistic_status: "in-stock" }),
      item({ logistic_status: "in-event" }),
      item({ logistic_status: "assigned" }),
    ]);
    expect(summary.inWarehouseCount).toBe(1);
    expect(summary.elsewhereCount).toBe(2);
  });

  it("falls back to the warehouse flag when logistic_status is missing", () => {
    const summary = summarizeInventoryMatches([
      item({ logistic_status: undefined, warehouse: 1 }),
      item({ logistic_status: undefined, warehouse: 0 }),
    ]);
    expect(summary.inWarehouseCount).toBe(1);
    expect(summary.elsewhereCount).toBe(1);
  });

  it("marks a tracked field mixed only when the group disagrees", () => {
    const summary = summarizeInventoryMatches([
      item({ brand: "Apple" }),
      item({ brand: "Apple" }),
    ]);
    expect(summary.fields.brand).toEqual({
      value: "Apple",
      mixed: false,
      distinctCount: 1,
    });

    const mixed = summarizeInventoryMatches([
      item({ brand: "Apple" }),
      item({ brand: "Samsung" }),
    ]);
    expect(mixed.fields.brand.mixed).toBe(true);
    expect(mixed.fields.brand.distinctCount).toBe(2);
  });

  it("uses the first filled value as the representative, ignoring blanks", () => {
    const summary = summarizeInventoryMatches([
      item({ supplier_info: "" }),
      item({ supplier_info: "Invoxia Supply Co." }),
    ]);
    expect(summary.fields.supplier_info.value).toBe("Invoxia Supply Co.");
    expect(summary.fields.supplier_info.mixed).toBe(false);
  });

  it("reports null for a tracked field nobody in the group has set", () => {
    const summary = summarizeInventoryMatches([item({ supplier_info: undefined })]);
    expect(summary.fields.supplier_info).toEqual({
      value: null,
      mixed: false,
      distinctCount: 0,
    });
  });

  it("covers every tracked field", () => {
    const summary = summarizeInventoryMatches([item()]);
    TRACKED_FIELDS.forEach(({ field }) => {
      expect(summary.fields).toHaveProperty(field);
    });
  });
});

describe("formatTrackedFieldValue", () => {
  it("returns null for a blank value", () => {
    expect(formatTrackedFieldValue("brand", null)).toBeNull();
    expect(formatTrackedFieldValue("brand", undefined)).toBeNull();
    expect(formatTrackedFieldValue("brand", "")).toBeNull();
  });

  it("reads a tinyint container/enableAssignFeature value as Yes or No", () => {
    expect(formatTrackedFieldValue("container", 1)).toBe("Yes");
    expect(formatTrackedFieldValue("container", 0)).toBe("No");
    expect(formatTrackedFieldValue("enableAssignFeature", 1)).toBe("Yes");
    expect(formatTrackedFieldValue("enableAssignFeature", 0)).toBe("No");
  });

  it("reads the form's radio-option strings for the same boolean fields", () => {
    expect(formatTrackedFieldValue("container", "Yes - It is a container")).toBe("Yes");
    expect(formatTrackedFieldValue("container", "No - It is not a container")).toBe("No");
    expect(formatTrackedFieldValue("enableAssignFeature", "YES")).toBe("Yes");
    expect(formatTrackedFieldValue("enableAssignFeature", "NO")).toBe("No");
  });

  it("joins a sub_location array into one readable path", () => {
    expect(formatTrackedFieldValue("sub_location", ["Miami, FL", "Rack A", "Shelf 1"])).toBe(
      "Miami, FL / Rack A / Shelf 1",
    );
  });

  it("parses a JSON-stringified sub_location into the same readable path", () => {
    expect(formatTrackedFieldValue("sub_location", JSON.stringify(["Miami, FL", "Rack A"]))).toBe(
      "Miami, FL / Rack A",
    );
  });

  it("shows a plain non-JSON sub_location string as-is", () => {
    expect(formatTrackedFieldValue("sub_location", "Miami, FL")).toBe("Miami, FL");
  });

  it("formats cost as currency", () => {
    expect(formatTrackedFieldValue("cost", 180)).toBe("$180.00");
    expect(formatTrackedFieldValue("cost", "540.00")).toBe("$540.00");
  });

  it("leaves every other tracked field as plain text", () => {
    expect(formatTrackedFieldValue("brand", "Apple")).toBe("Apple");
    expect(formatTrackedFieldValue("location", "Miami, FL")).toBe("Miami, FL");
  });
});

/* Fredrik, part 1 `13:55`: "Why can't we, if I selected a group there that only
   had one location in step one, it can pre-fill it here." The single-value
   condition is the whole safeguard — with two, guessing files stock in the
   wrong place. */
describe("agreedValue", () => {
  const items = [
    { location: "Miami, FL", container: 0 },
    { location: "Miami, FL", container: 0 },
  ];

  it("gives the value when the whole group says the same thing", () => {
    expect(agreedValue(items, "location")).toBe("Miami, FL");
  });

  it("refuses to choose when the group disagrees", () => {
    expect(
      agreedValue([...items, { location: "Orlando, FL" }], "location")
    ).toBeNull();
  });

  /* A group of one agrees with itself, so "only one item to copy from" is not
     a special case anywhere. */
  it("reads a single item as agreement", () => {
    expect(agreedValue([{ location: "Miami, FL" }], "location")).toBe("Miami, FL");
  });

  /* Same rule the image already followed: a blank is "not recorded", not a
     second variant. */
  it("does not let a blank count as a competing value", () => {
    expect(
      agreedValue(
        [{ location: "Miami, FL" }, { location: "" }, { location: null }],
        "location"
      )
    ).toBe("Miami, FL");
  });

  it("returns null when nobody recorded one, and survives no items at all", () => {
    expect(agreedValue([{ location: "" }], "location")).toBeNull();
    expect(agreedValue([], "location")).toBeNull();
    expect(agreedValue(undefined, "location")).toBeNull();
  });

  /* 0 is a value — "not a container" is an answer, and `isFilled` must not
     read it as a blank. */
  it("treats a tinyint 0 as an answer", () => {
    expect(agreedValue(items, "container")).toBe(0);
  });
});

describe("agreedFieldValues", () => {
  const group = [
    {
      location: "Miami, FL",
      main_warehouse: "Miami, FL",
      sub_location: '["Section A","Locker A110"]',
      enableAssignFeature: 1,
      container: 0,
      containerSpotLimit: null,
    },
    {
      location: "Miami, FL",
      main_warehouse: "Miami, FL",
      sub_location: '["Section A","Locker A110"]',
      enableAssignFeature: 1,
      container: 0,
      containerSpotLimit: null,
    },
  ];

  it("hands back everything a uniform group agrees on", () => {
    const { agreed, mixed } = agreedFieldValues(group);

    expect(agreed.location).toBe("Miami, FL");
    expect(agreed.main_warehouse).toBe("Miami, FL");
    expect(agreed.sub_location).toBe('["Section A","Locker A110"]');
    expect(agreed.enableAssignFeature).toBe(1);
    expect(agreed.container).toBe(0);
    expect(mixed).toEqual([]);
  });

  /* The field that disagrees is named, so the form can say why it was left
     empty instead of leaving a hole with no explanation. */
  it("names the fields it refused to fill, and still fills the rest", () => {
    const { agreed, mixed } = agreedFieldValues([
      ...group,
      { ...group[0], location: "Orlando, FL", enableAssignFeature: 0 },
    ]);

    expect(agreed.location).toBeUndefined();
    expect(agreed.enableAssignFeature).toBeUndefined();
    expect(mixed).toEqual(["location", "enableAssignFeature"]);
    expect(agreed.main_warehouse).toBe("Miami, FL");
  });

  it("says nothing about a field nobody recorded", () => {
    const { agreed, mixed } = agreedFieldValues(group);

    expect(agreed).not.toHaveProperty("containerSpotLimit");
    expect(mixed).not.toContain("containerSpotLimit");
  });

  it("returns nothing for no matches", () => {
    expect(agreedFieldValues([])).toEqual({ agreed: {}, mixed: [] });
  });
});

describe("parseSubLocationPath", () => {
  it("reads the JSON array item_inv stores", () => {
    expect(parseSubLocationPath('["Section A","Locker A110"]')).toEqual([
      "Section A",
      "Locker A110",
    ]);
  });

  it("takes an array that arrived already parsed", () => {
    expect(parseSubLocationPath(["Section A", "Locker A110"])).toEqual([
      "Section A",
      "Locker A110",
    ]);
  });

  /* An older row can hold one plain segment rather than JSON. */
  it("reads a bare string as a single segment", () => {
    expect(parseSubLocationPath("Equipment Cage A")).toEqual(["Equipment Cage A"]);
  });

  it("reads nothing as no chips", () => {
    expect(parseSubLocationPath("")).toEqual([]);
    expect(parseSubLocationPath(null)).toEqual([]);
    expect(parseSubLocationPath("[]")).toEqual([]);
  });

  /* It has to round-trip with its inverse, or a copied sub-location comes back
     one level deeper every time it is copied. */
  it("round-trips through buildSubLocationPath", () => {
    const chips = ["Section A", "Locker A110"];

    expect(parseSubLocationPath(JSON.stringify(buildSubLocationPath(chips, {})))).toEqual(
      chips
    );
  });
});
