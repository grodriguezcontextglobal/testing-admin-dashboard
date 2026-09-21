import { describe, expect, it } from "vitest";

import {
  IMPORT_MODES,
  buildImportPlan,
  encodeBySerial,
} from "./inventoryImportPlan";

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

/* Three units of one model that differ the way the real file differs: cost on
   every unit, and location and ownership on some. */
const threeMicrophones = [
  unit({ serial_number: "AUD-1", cost: 258.42 }),
  unit({
    serial_number: "AUD-2",
    cost: 235.56,
    location: "Washington, DC",
    ownership: "Rent",
    sub_location: ["Equipment Cage A"],
  }),
  unit({ serial_number: "AUD-3", cost: 231.61, location: "Orlando, FL" }),
];

describe("encoding a value per serial number", () => {
  /* The shape the backend already flattens for extra_serial_number:
     `[{serial: value}]`, read with Object.keys(item)[0]. Mirroring it is the
     whole reason the other per-unit fields can travel the same way. */
  it("writes the array-of-one-key-objects shape the worker reads", () => {
    expect(
      encodeBySerial([
        ["AUD-1", 258.42],
        ["AUD-2", 235.56],
      ])
    ).toBe('[{"AUD-1":258.42},{"AUD-2":235.56}]');
  });

  it("takes a Map and keeps its order", () => {
    const map = new Map([
      ["B", "second"],
      ["A", "first"],
    ]);

    expect(encodeBySerial(map)).toBe('[{"B":"second"},{"A":"first"}]');
  });

  /* An empty string is an answer — "this unit has no picture" — and the column
     takes it. Dropping it would leave the serial out of the map and the value
     up to whatever the insert defaults to. */
  it("keeps an empty string, and drops only a missing answer", () => {
    expect(
      encodeBySerial([
        ["AUD-1", "x"],
        ["AUD-2", ""],
        ["AUD-3", null],
        ["AUD-4", undefined],
      ])
    ).toBe('[{"AUD-1":"x"},{"AUD-2":""}]');
  });
});

describe("one request per device name", () => {
  const plan = () =>
    buildImportPlan(threeMicrophones, { mode: IMPORT_MODES.PER_SERIAL });

  it("puts every unit of a model in a single group", () => {
    const { groups, stats } = plan();

    expect(groups).toHaveLength(1);
    expect(stats.requests).toBe(1);
    expect(groups[0].units).toHaveLength(3);
    expect(groups[0].item_group).toBe("Wireless Microphone");
  });

  /* The point of the mode: what differs per unit stays per unit. */
  it("keeps each unit's own cost, location and ownership", () => {
    const [group] = plan().groups;

    expect(group.units.map((u) => u.cost)).toEqual([258.42, 235.56, 231.61]);
    expect(group.units.map((u) => u.location)).toEqual([
      "Miami, FL",
      "Washington, DC",
      "Orlando, FL",
    ]);
  });

  it("names every location the group touches, for the scope anchor", () => {
    const [group] = plan().groups;

    expect(group.locations).toEqual([
      "Miami, FL",
      "Washington, DC",
      "Orlando, FL",
    ]);
    expect(group.spansSeveralLocations).toBe(true);
  });

  /* A model sold under two categories cannot share one request: the payload
     carries a single category_name. */
  it("still splits a device name that appears under two categories", () => {
    const units = [
      unit({ serial_number: "A-1" }),
      unit({ serial_number: "B-1", category_name: "Interpretation" }),
    ];

    expect(buildImportPlan(units, { mode: IMPORT_MODES.PER_SERIAL }).groups).toHaveLength(2);
  });
});

describe("the mode that works with today's payload", () => {
  it("splits until every request carries one value per flattened field", () => {
    const { groups, stats } = buildImportPlan(threeMicrophones, {
      mode: IMPORT_MODES.COMPATIBLE,
    });

    expect(groups).toHaveLength(3);
    expect(stats.requests).toBe(3);
    for (const group of groups) expect(group.spansSeveralLocations).toBe(false);
  });

  it("keeps units together when they really are identical", () => {
    const units = [
      unit({ serial_number: "AUD-1" }),
      unit({ serial_number: "AUD-2" }),
    ];

    const { groups } = buildImportPlan(units, { mode: IMPORT_MODES.COMPATIBLE });

    expect(groups).toHaveLength(1);
    expect(groups[0].units).toHaveLength(2);
  });
});

describe("what the preview has to be able to say", () => {
  it("counts the units, the requests and the locations to create", () => {
    const { stats } = buildImportPlan(threeMicrophones, {
      mode: IMPORT_MODES.PER_SERIAL,
    });

    expect(stats.units).toBe(3);
    expect(stats.groups).toBe(1);
    expect(stats.locations).toEqual([
      "Miami, FL",
      "Washington, DC",
      "Orlando, FL",
    ]);
  });

  /* A serial repeated in the file is the one error that cannot be fixed after
     the fact: both rows are inserted and nothing tells them apart afterwards. */
  it("names duplicated serial numbers and the rows they are on", () => {
    const units = [
      unit({ serial_number: "AUD-1", rowNumber: 2 }),
      unit({ serial_number: "AUD-1", rowNumber: 9 }),
      unit({ serial_number: "AUD-2", rowNumber: 3 }),
    ];

    const { stats } = buildImportPlan(units, { mode: IMPORT_MODES.PER_SERIAL });

    expect(stats.duplicateSerials).toEqual([
      { serial_number: "AUD-1", rows: [2, 9] },
    ]);
  });

  /* Brand, description and image are group-level in the payload. The file this
     was built against never disagrees within a group — but another file can,
     and taking the first row silently is the bug being fixed everywhere else
     in this plan, so it is reported instead. */
  it("reports a group whose group-level fields disagree", () => {
    const units = [
      unit({ serial_number: "AUD-1", brand: "Shure" }),
      unit({ serial_number: "AUD-2", brand: "Sennheiser" }),
      unit({ serial_number: "AUD-3", brand: "Sennheiser" }),
    ];

    const [group] = buildImportPlan(units, { mode: IMPORT_MODES.PER_SERIAL }).groups;

    expect(group.brand).toBe("Sennheiser");
    expect(group.conflicts).toEqual([
      {
        field: "brand",
        chosen: "Sennheiser",
        discarded: [{ value: "Shure", rows: [2] }],
      },
    ]);
  });

  /* In the real file one Headphones row in 29 carries the picture and the
     other 28 leave the cell empty. Counting the empties elects "no picture"
     and the group loses its image — so a blank does not get a vote. */
  it("takes the one picture in a group even when most cells are empty", () => {
    const units = [
      unit({ serial_number: "A-1", imageMediaPath: "xl/media/image1.jpeg" }),
      unit({ serial_number: "A-2", imageMediaPath: null }),
      unit({ serial_number: "A-3", imageMediaPath: null }),
    ];

    const [group] = buildImportPlan(units, { mode: IMPORT_MODES.PER_SERIAL }).groups;

    expect(group.imageMediaPath).toBe("xl/media/image1.jpeg");
    expect(group.conflicts).toEqual([]);
  });

  it("still calls two different pictures in one group a conflict", () => {
    const units = [
      unit({ serial_number: "A-1", imageMediaPath: "xl/media/image1.jpeg" }),
      unit({ serial_number: "A-2", imageMediaPath: "xl/media/image2.jpeg", rowNumber: 3 }),
      unit({ serial_number: "A-3", imageMediaPath: "xl/media/image2.jpeg" }),
    ];

    const [group] = buildImportPlan(units, { mode: IMPORT_MODES.PER_SERIAL }).groups;

    expect(group.imageMediaPath).toBe("xl/media/image2.jpeg");
    expect(group.conflicts).toHaveLength(1);
  });

  it("lists the distinct pictures, so each is uploaded once", () => {
    const units = [
      unit({ serial_number: "A-1", imageMediaPath: "xl/media/image1.jpeg" }),
      unit({ serial_number: "A-2", imageMediaPath: "xl/media/image1.jpeg" }),
      unit({
        serial_number: "B-1",
        item_group: "IR Receiver",
        imageMediaPath: "xl/media/image2.jpeg",
      }),
    ];

    expect(
      buildImportPlan(units, { mode: IMPORT_MODES.PER_SERIAL }).stats.images
    ).toEqual(["xl/media/image1.jpeg", "xl/media/image2.jpeg"]);
  });
});

describe("batching inside a group", () => {
  const many = Array.from({ length: 25 }, (_, index) =>
    unit({ serial_number: `AUD-${index}` })
  );

  it("splits a large group into batches without losing a unit", () => {
    const [group] = buildImportPlan(many, {
      mode: IMPORT_MODES.PER_SERIAL,
      batchSize: 10,
    }).groups;

    expect(group.batches.map((batch) => batch.length)).toEqual([10, 10, 5]);
    expect(group.batches.flat()).toHaveLength(25);
  });

  it("counts a batch as a request, because that is what it is", () => {
    const { stats } = buildImportPlan(many, {
      mode: IMPORT_MODES.PER_SERIAL,
      batchSize: 10,
    });

    expect(stats.groups).toBe(1);
    expect(stats.requests).toBe(3);
  });

  it("sends one request for a group that fits", () => {
    const [group] = buildImportPlan(threeMicrophones, {
      mode: IMPORT_MODES.PER_SERIAL,
    }).groups;

    expect(group.batches).toHaveLength(1);
  });
});
