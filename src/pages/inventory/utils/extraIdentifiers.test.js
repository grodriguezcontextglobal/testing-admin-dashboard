import { describe, expect, it } from "vitest";
import {
  encodeExtraIdentifiers,
  parseExtraIdentifiers,
} from "./extraIdentifiers";

const entries = [
  { keyObject: "IMEI", valueObject: "kdhfhk" },
  { keyObject: "device id", valueObject: "d654f64" },
];

describe("encodeExtraIdentifiers", () => {
  it("writes the canonical shape: an array of one-key objects", () => {
    expect(JSON.parse(encodeExtraIdentifiers([["SN-1", entries]]))).toEqual([
      { "SN-1": entries },
    ]);
  });

  it("keeps one object per serial, in the order given", () => {
    expect(
      JSON.parse(
        encodeExtraIdentifiers([
          ["SN-1", entries],
          ["SN-2", [{ keyObject: "IMEI", valueObject: "oirl" }]],
        ]),
      ),
    ).toEqual([
      { "SN-1": entries },
      { "SN-2": [{ keyObject: "IMEI", valueObject: "oirl" }] },
    ]);
  });

  it("drops serials with no identifiers rather than writing empty buckets", () => {
    expect(
      JSON.parse(
        encodeExtraIdentifiers([
          ["SN-1", entries],
          ["SN-2", []],
        ]),
      ),
    ).toEqual([{ "SN-1": entries }]);
  });

  it("returns an empty array literal when there is nothing to store", () => {
    expect(encodeExtraIdentifiers([])).toBe("[]");
    expect(encodeExtraIdentifiers()).toBe("[]");
  });

  it("accepts a Map, since callers build these keyed by serial", () => {
    expect(
      JSON.parse(encodeExtraIdentifiers(new Map([["SN-1", entries]]))),
    ).toEqual([{ "SN-1": entries }]);
  });
});

describe("parseExtraIdentifiers", () => {
  it("reads the canonical array-of-one-key-objects shape", () => {
    expect(
      parseExtraIdentifiers(JSON.stringify([{ "SN-1": entries }]), "SN-1"),
    ).toEqual(entries);
  });

  it("reads the plain object shape the XLSX importer writes", () => {
    // This is the shape that made extra identifiers invisible in the edit
    // modal: the reader bailed on anything that was not an array, so an item
    // created by spreadsheet import looked like it had none.
    expect(
      parseExtraIdentifiers(
        JSON.stringify({ "SN-1": entries, "SN-2": [] }),
        "SN-1",
      ),
    ).toEqual(entries);
  });

  it("reads a flat entry list, which older single-item records carry", () => {
    expect(parseExtraIdentifiers(JSON.stringify(entries), "SN-1")).toEqual(
      entries,
    );
  });

  it("accepts an already-parsed value as well as a JSON string", () => {
    expect(parseExtraIdentifiers([{ "SN-1": entries }], "SN-1")).toEqual(
      entries,
    );
  });

  it("matches the serial as a string, since ids come back numeric", () => {
    expect(parseExtraIdentifiers(JSON.stringify([{ 100001: entries }]), 100001))
      .toEqual(entries);
  });

  it("returns only this item's entries when several serials are stored", () => {
    expect(
      parseExtraIdentifiers(
        JSON.stringify([
          { "SN-1": entries },
          { "SN-2": [{ keyObject: "IMEI", valueObject: "oirl" }] },
        ]),
        "SN-2",
      ),
    ).toEqual([{ keyObject: "IMEI", valueObject: "oirl" }]);
  });

  it("drops the internal item_id entry", () => {
    expect(
      parseExtraIdentifiers(
        JSON.stringify([
          { "SN-1": [{ keyObject: "item_id", valueObject: "91" }, ...entries] },
        ]),
        "SN-1",
      ),
    ).toEqual(entries);
  });

  it("returns an empty list for anything unusable instead of throwing", () => {
    expect(parseExtraIdentifiers("{", "SN-1")).toEqual([]);
    expect(parseExtraIdentifiers("", "SN-1")).toEqual([]);
    expect(parseExtraIdentifiers(null, "SN-1")).toEqual([]);
    expect(parseExtraIdentifiers(JSON.stringify([{ "SN-9": entries }]), "SN-1"))
      .toEqual([]);
    expect(parseExtraIdentifiers(JSON.stringify("nope"), "SN-1")).toEqual([]);
  });

  it("round-trips what it encodes", () => {
    const encoded = encodeExtraIdentifiers([
      ["SN-1", entries],
      ["SN-2", [{ keyObject: "MAC", valueObject: "00:1B" }]],
    ]);
    expect(parseExtraIdentifiers(encoded, "SN-1")).toEqual(entries);
    expect(parseExtraIdentifiers(encoded, "SN-2")).toEqual([
      { keyObject: "MAC", valueObject: "00:1B" },
    ]);
  });
});
