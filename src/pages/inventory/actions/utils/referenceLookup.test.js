import { describe, expect, it } from "vitest";
import {
  findReferenceMatches,
  hasReferenceCriteria,
  hasReferenceOptions,
  matchesReferenceCriteria,
  matchesTypedText,
  narrowReferenceOptions,
  referenceSourceLabel,
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

// ─── hasReferenceOptions ─────────────────────────────────────────────────────

describe("hasReferenceOptions", () => {
  it("es true si alguna de las listas tiene algo que elegir", () => {
    expect(hasReferenceOptions([[], ["PL6 RF Receiver"], []])).toBe(true);
    expect(hasReferenceOptions([[{ value: "Audio" }]])).toBe(true);
  });

  // Una compañía que todavía no cargó inventario no tiene de dónde copiar.
  // Ofrecer el panel ahí es prometer un atajo que no puede funcionar: el usuario
  // abre, no encuentra opciones y no sabe si falló o si está vacío.
  it("es false cuando no hay inventario del cual copiar", () => {
    expect(hasReferenceOptions([[], [], []])).toBe(false);
    expect(hasReferenceOptions([])).toBe(false);
    expect(hasReferenceOptions()).toBe(false);
  });

  it("ignora lo que no sea un arreglo", () => {
    expect(hasReferenceOptions([null, undefined, "Audio"])).toBe(false);
  });
});

// ─── referenceSourceLabel ────────────────────────────────────────────────────

describe("referenceSourceLabel", () => {
  it("nombra la unidad de la que salieron los datos", () => {
    expect(referenceSourceLabel({ serial_number: "A1" })).toBe("A1");
  });

  it("cae a una frase legible cuando la unidad no tiene serial", () => {
    expect(referenceSourceLabel({ serial_number: "" })).toBe("an existing device");
    expect(referenceSourceLabel({})).toBe("an existing device");
    expect(referenceSourceLabel(null)).toBe("an existing device");
  });
});

// ─── matchesTypedText ────────────────────────────────────────────────────────

describe("matchesTypedText(typed, option)", () => {
  /* antd's AutoComplete defaults `filterOption` to false — unlike Select — so
     these three fields showed the whole list no matter what was typed. This is
     the predicate that makes typing narrow them. */
  const option = { value: "Chromebook 11 G8", label: "Chromebook 11 G8" };

  it("keeps an option containing what was typed", () => {
    expect(matchesTypedText("chrome", option)).toBe(true);
  });

  it("ignores case on both sides", () => {
    expect(matchesTypedText("CHROMEBOOK", option)).toBe(true);
    expect(matchesTypedText("g8", option)).toBe(true);
  });

  it("matches in the middle, not only at the start", () => {
    // Someone looking for a model rarely remembers the leading word.
    expect(matchesTypedText("11 g8", option)).toBe(true);
  });

  it("drops an option that does not contain it", () => {
    expect(matchesTypedText("thinkpad", option)).toBe(false);
  });

  it("shows everything while nothing has been typed", () => {
    expect(matchesTypedText("", option)).toBe(true);
    expect(matchesTypedText("   ", option)).toBe(true);
    expect(matchesTypedText(undefined, option)).toBe(true);
  });

  it("ignores the whitespace around what was typed", () => {
    expect(matchesTypedText("  chrome  ", option)).toBe(true);
  });

  it("falls back to the value when an option carries no label", () => {
    expect(matchesTypedText("chrome", { value: "Chromebook" })).toBe(true);
  });

  it("survives an option that is nothing at all", () => {
    expect(matchesTypedText("chrome", null)).toBe(false);
    expect(matchesTypedText("chrome", {})).toBe(false);
  });
});

/* Fredrik, part 2 `11:04`: "if I put laptops here, I should not be able to do
   disinfectant wipes." The three filters were independent so that any one could
   be used alone — that stays, but a combination no unit can satisfy is no
   longer offered. */
describe("narrowReferenceOptions", () => {
  const inventory = [
    { category_name: "Laptops", item_group: "Latitude 5540", brand: "Dell" },
    { category_name: "Laptops", item_group: "XPS 15", brand: "Dell" },
    { category_name: "Monitors", item_group: "UltraSharp 27", brand: "Dell" },
    { category_name: "Laptops", item_group: "MacBook Pro", brand: "Apple" },
    { category_name: "Cleaning", item_group: "Disinfectant wipes", brand: "Ticonderoga" },
  ];
  const [categories, groups, brands] = [0, 1, 2];
  const narrow = (criteria) => narrowReferenceOptions(inventory, criteria);

  it("offers everything when nothing is chosen", () => {
    const lists = narrow({});

    expect(lists[categories]).toEqual(["Laptops", "Monitors", "Cleaning"]);
    expect(lists[groups]).toHaveLength(5);
    expect(lists[brands]).toEqual(["Dell", "Apple", "Ticonderoga"]);
  });

  /* The example asked for: pick the brand and both other lists follow it. */
  it("narrows category and group when a brand is chosen", () => {
    const lists = narrow({ brand: "Dell" });

    expect(lists[categories]).toEqual(["Laptops", "Monitors"]);
    expect(lists[groups]).toEqual(["Latitude 5540", "XPS 15", "UltraSharp 27"]);
    expect(lists[groups]).not.toContain("Disinfectant wipes");
  });

  it("narrows group and brand when a category is chosen", () => {
    const lists = narrow({ category: "Laptops" });

    expect(lists[groups]).toEqual(["Latitude 5540", "XPS 15", "MacBook Pro"]);
    expect(lists[brands]).toEqual(["Dell", "Apple"]);
    expect(lists[brands]).not.toContain("Ticonderoga");
  });

  /* A field narrowed by its own value collapses to the one thing already
     chosen, and then it cannot be changed without being cleared first. */
  it("never narrows a field by its own value", () => {
    expect(narrow({ brand: "Dell" })[brands]).toEqual([
      "Dell",
      "Apple",
      "Ticonderoga",
    ]);
    expect(narrow({ category: "Laptops" })[categories]).toEqual([
      "Laptops",
      "Monitors",
      "Cleaning",
    ]);
  });

  it("does not care in which order the criteria were picked", () => {
    expect(narrow({ category: "Laptops", brand: "Dell" })[groups]).toEqual(
      narrow({ brand: "Dell", category: "Laptops" })[groups]
    );
    expect(narrow({ category: "Laptops", brand: "Dell" })[groups]).toEqual([
      "Latitude 5540",
      "XPS 15",
    ]);
  });

  /* Honest rather than helpful: the combination really has nothing in it, and
     an empty list says so. */
  it("offers nothing for a combination no unit satisfies", () => {
    expect(narrow({ category: "Laptops", brand: "Ticonderoga" })[groups]).toEqual([]);
  });

  it("survives no inventory at all", () => {
    expect(narrowReferenceOptions([], { brand: "Dell" })).toEqual([[], [], []]);
    expect(narrowReferenceOptions(undefined)).toEqual([[], [], []]);
  });
});

describe("matchesReferenceCriteria", () => {
  const item = { category_name: "Laptops", item_group: "XPS 15", brand: "Dell" };

  it("ignores a blank criterion, so one filter can be used alone", () => {
    expect(matchesReferenceCriteria(item, { brand: "Dell" })).toBe(true);
    expect(matchesReferenceCriteria(item, {})).toBe(true);
  });

  it("requires every criterion that was set", () => {
    expect(
      matchesReferenceCriteria(item, { brand: "Dell", category: "Monitors" })
    ).toBe(false);
  });

  /* The search and the dropdowns have to agree on this, or the options offer a
     combination the search then finds nothing for. */
  it("is the rule findReferenceMatches filters by", () => {
    const criteria = { category: "Laptops", brand: "Dell" };
    const inventory = [item, { ...item, brand: "Apple" }];

    expect(findReferenceMatches(inventory, criteria).matches).toEqual(
      inventory.filter((candidate) => matchesReferenceCriteria(candidate, criteria))
    );
  });
});
