import { describe, expect, it } from "vitest";

import {
  agreedValue,
  buildGroupRequest,
  parseExtraInfoCell,
} from "./inventoryImportPayload";

const unit = (overrides = {}) => ({
  rowNumber: 2,
  category_name: "Audio",
  item_group: "Wireless Microphone",
  serial_number: "AUD-1",
  cost: 258.42,
  brand: "Shure",
  descript_item: "Wireless handheld microphone",
  ownership: "Permanent",
  main_warehouse: "Miami, FL",
  location: "Miami, FL",
  sub_location: ["Section A", "Locker A110"],
  extra_serial_number: "Band=G50;Type=Handheld",
  imageMediaPath: null,
  ...overrides,
});

const group = {
  category_name: "Audio",
  item_group: "Wireless Microphone",
  brand: "Shure",
  descript_item: "Wireless handheld microphone",
  imageMediaPath: null,
};

const build = (batch, extra = {}) =>
  buildGroupRequest({
    group,
    batch,
    company: "ABC Interpreting",
    companyId: 7,
    timestamp: "2026-09-21 12:00:00",
    ...extra,
  });

describe("deciding whether a batch agrees", () => {
  it("returns the value when every unit says the same thing", () => {
    expect(agreedValue([unit(), unit({ serial_number: "AUD-2" })], (u) => u.cost)).toBe(
      258.42
    );
  });

  it("returns undefined the moment one differs", () => {
    expect(
      agreedValue([unit(), unit({ cost: 1 })], (u) => u.cost)
    ).toBeUndefined();
  });

  it("compares arrays by content, not by identity", () => {
    const units = [
      unit({ sub_location: ["A", "B"] }),
      unit({ sub_location: ["A", "B"] }),
    ];

    expect(agreedValue(units, (u) => u.sub_location)).toEqual(["A", "B"]);
  });
});

describe("a batch whose units really are identical", () => {
  const batch = [unit(), unit({ serial_number: "AUD-2" })];

  it("sends plain scalars, exactly as the endpoint takes them today", () => {
    const { body, perSerialFields } = build(batch);

    expect(perSerialFields).toEqual([]);
    expect(body.cost).toBe(258.42);
    expect(body.location).toBe("Miami, FL");
    expect(body.current_location).toBe("Miami, FL");
    expect(body.sub_location).toBe('["Section A","Locker A110"]');
    expect(body.list).toEqual(["AUD-1", "AUD-2"]);
    expect(body).not.toHaveProperty("per_serial_fields");
  });
});

describe("a batch whose units differ", () => {
  const batch = [
    unit({ serial_number: "AUD-1", cost: 258.42 }),
    unit({ serial_number: "AUD-2", cost: 235.56, location: "Orlando, FL" }),
  ];

  /* The heart of it: no scalar is invented for a field the rows disagree on.
     Sending one is how 482 of 500 units came to carry a cost that was not
     theirs. */
  it("omits the scalar entirely rather than guessing one", () => {
    const { body } = build(batch);

    expect(body).not.toHaveProperty("cost");
    expect(body).not.toHaveProperty("location");
    expect(body).not.toHaveProperty("current_location");
  });

  it("sends the value per serial in the shape the worker already flattens", () => {
    const { body } = build(batch);

    expect(body.cost_by_serial).toBe('[{"AUD-1":258.42},{"AUD-2":235.56}]');
    expect(body.location_by_serial).toBe(
      '[{"AUD-1":"Miami, FL"},{"AUD-2":"Orlando, FL"}]'
    );
    expect(body.current_location_by_serial).toBe(body.location_by_serial);
  });

  /* So a server that does not read the maps yet can refuse the request
     instead of inserting rows with holes in them. */
  it("declares which fields arrived as maps", () => {
    const { body, perSerialFields } = build(batch);

    expect(perSerialFields).toEqual(["cost", "location"]);
    expect(body.per_serial_fields).toEqual(["cost", "location"]);
  });

  it("leaves the fields they do agree on as scalars", () => {
    const { body } = build(batch);

    expect(body.ownership).toBe("Permanent");
    expect(body.main_warehouse).toBe("Miami, FL");
  });
});

describe("the picture", () => {
  it("sends the uploaded URL for the file the cells pointed at", () => {
    const batch = [
      unit({ serial_number: "A-1", imageMediaPath: "xl/media/image1.jpeg" }),
      unit({ serial_number: "A-2", imageMediaPath: "xl/media/image1.jpeg" }),
    ];

    const { body } = build(batch, {
      imageUrlByMediaPath: new Map([
        ["xl/media/image1.jpeg", "https://res.cloudinary.com/x/image1.jpg"],
      ]),
    });

    expect(body.image_url).toBe("https://res.cloudinary.com/x/image1.jpg");
  });

  /* A group where only some rows carry the picture disagrees on image_url, so
     it goes per serial. The units without one are sent an empty string, which
     is what the column takes — leaving them out of the map would hand their
     value to the insert's default instead of saying "no picture". */
  it("goes per serial when only some rows carry one, and sends '' for the rest", () => {
    const batch = [
      unit({ serial_number: "A-1", imageMediaPath: "xl/media/image1.jpeg" }),
      unit({ serial_number: "A-2", imageMediaPath: null }),
    ];

    const { body, perSerialFields } = build(batch, {
      imageUrlByMediaPath: new Map([["xl/media/image1.jpeg", "https://x/1.jpg"]]),
    });

    expect(perSerialFields).toContain("image_url");
    expect(body.image_url_by_serial).toBe(
      '[{"A-1":"https://x/1.jpg"},{"A-2":""}]'
    );
  });

  /* And a group where nobody has one sends the empty scalar, not nothing. */
  it("sends an empty scalar when no row in the batch has a picture", () => {
    const batch = [
      unit({ serial_number: "A-1" }),
      unit({ serial_number: "A-2" }),
    ];

    const { body, perSerialFields } = build(batch);

    expect(body.image_url).toBe("");
    expect(perSerialFields).not.toContain("image_url");
  });

  /* An upload that failed leaves the row without a URL. The unit is still
     created — without a picture — rather than the batch carrying `undefined`. */
  it("falls back to an empty string when the upload produced no URL", () => {
    const batch = [unit({ serial_number: "A-1", imageMediaPath: "xl/media/image1.jpeg" })];

    expect(build(batch, { imageUrlByMediaPath: new Map() }).body.image_url).toBe("");
  });
});

describe("the extra identifiers column", () => {
  it("keys the entries by serial, through the shared codec", () => {
    const batch = [
      unit({ serial_number: "AUD-1", extra_serial_number: "Band=G50;Type=Handheld" }),
      unit({ serial_number: "AUD-2", extra_serial_number: "" }),
    ];

    expect(JSON.parse(build(batch).body.extra_serial_number)).toEqual([
      {
        "AUD-1": [
          { keyObject: "Band", valueObject: "G50" },
          { keyObject: "Type", valueObject: "Handheld" },
        ],
      },
    ]);
  });

  it("discards a pair with no '=', as the template says it does", () => {
    expect(parseExtraInfoCell("Band=G50;garbage;MAC=00:1B:44")).toEqual([
      { keyObject: "Band", valueObject: "G50" },
      { keyObject: "MAC", valueObject: "00:1B:44" },
    ]);
  });
});
