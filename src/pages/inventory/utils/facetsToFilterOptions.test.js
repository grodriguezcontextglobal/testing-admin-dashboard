import { describe, expect, it } from "vitest";
import { facetsToFilterOptions } from "./facetsToFilterOptions";
import { dicSelectedOptions } from "./dicSelectedOptions";

const facets = {
  brand: [
    { value: "Dell", count: 12 },
    { value: "Apple", count: 5 },
  ],
  item_group: [{ value: "Group Test 1", count: 20 }],
  category_name: [{ value: "Laptop", count: 20 }],
  location: [{ value: "Almeria", count: 30 }],
  ownership: [{ value: "Permanent", count: 25 }],
  status: [{ value: "Operational", count: 40 }],
  logistic_status: [{ value: "in-stock", count: 35 }],
};

describe("facetsToFilterOptions", () => {
  it("lands each facet on the select that asks for it", () => {
    const options = facetsToFilterOptions(facets);
    expect(options[0]).toEqual(["Dell", "Apple"]);
    expect(options[1]).toEqual(["Group Test 1"]);
    expect(options[3]).toEqual(["Almeria"]);
    expect(options[4]).toEqual(["Permanent"]);
    expect(options[5]).toEqual(["Operational"]);
    expect(options[7]).toEqual(["in-stock"]);
    expect(options[8]).toEqual(["Laptop"]);
  });

  it("keeps the order the server sent", () => {
    // The server orders by count, which puts the values a user is most likely
    // to want at the top of a long dropdown. Re-sorting alphabetically here
    // would throw that away.
    expect(facetsToFilterOptions(facets)[0]).toEqual(["Dell", "Apple"]);
  });

  it("maps Condition to the `status` facet", () => {
    // The select is labelled Condition and the column is `status`. This is the
    // same crossing that made the old client compare against `condition`, a
    // field these rows never carry.
    expect(dicSelectedOptions[5]).toBe("Condition");
    expect(facetsToFilterOptions(facets)[5]).toEqual(["Operational"]);
  });

  it("leaves the Serial Number select alone", () => {
    // 2 is an autocomplete against serial-suggest, not a facet: one option per
    // item is not a dropdown, it is the inventory.
    expect(facetsToFilterOptions(facets)[2]).toEqual([]);
  });

  it("gives every select an array, even one the server said nothing about", () => {
    // The selects read options[index] directly. A missing key would be
    // undefined and render a dropdown that throws instead of one that is empty.
    const options = facetsToFilterOptions({ brand: [{ value: "Dell" }] });
    for (const index of Object.keys(dicSelectedOptions)) {
      expect(Array.isArray(options[index])).toBe(true);
    }
  });

  it("survives junk without throwing", () => {
    for (const input of [undefined, null, {}, { brand: null }, { brand: "x" }]) {
      const options = facetsToFilterOptions(input);
      expect(Array.isArray(options[0])).toBe(true);
    }
  });

  it("drops values with nothing to show", () => {
    expect(
      facetsToFilterOptions({
        brand: [{ value: "Dell" }, { value: "" }, { value: null }, {}],
      })[0],
    ).toEqual(["Dell"]);
  });

  it("carries no key the selects do not render", () => {
    // main_warehouse and warehouse are filter keys the server accepts but no
    // select offers. Letting them through would put values nobody asked for
    // into an object keyed by select index.
    const options = facetsToFilterOptions({
      ...facets,
      main_warehouse: [{ value: "Denver" }],
    });
    expect(Object.keys(options).sort()).toEqual(
      Object.keys(dicSelectedOptions).sort(),
    );
  });
});
