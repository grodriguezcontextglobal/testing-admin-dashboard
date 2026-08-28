import { describe, expect, it } from "vitest";
import { resolveItemRowId } from "./itemRowId";

describe("resolveItemRowId", () => {
  it("reads the id straight off the row", () => {
    expect(resolveItemRowId({ item_id: 200602 })).toBe("200602");
  });

  it("accepts the other spelling a query might use", () => {
    expect(resolveItemRowId({ id: 200602 })).toBe("200602");
  });

  it("falls back to the nested row the detail tables carry", () => {
    expect(resolveItemRowId({ data: { item_id: 200602 } })).toBe("200602");
    expect(resolveItemRowId({ data: { id: 200602 } })).toBe("200602");
  });

  it("prefers the top-level id over the nested one", () => {
    // The nested `data` is the inventory row, which can be a different
    // record for the same serial number.
    expect(resolveItemRowId({ item_id: 1, data: { item_id: 2 } })).toBe("1");
  });

  it("recovers the id from the row key the detail tables build", () => {
    expect(resolveItemRowId({ key: "200602-47" })).toBe("200602");
  });

  it("does not read the string 'undefined' out of a broken key", () => {
    /* This is the bug the arrow icon had. The detail tables build
       `key: `${data.item_id}-${uniqueId()}``, so a row with no `item_id`
       gets the key "undefined-47". Splitting on "-" returned the *string*
       "undefined", which is truthy, so the disabled guard never tripped and
       the icon navigated to /inventory/item?id=undefined — a page with no
       item to load. To the operator the icon simply did nothing. */
    expect(resolveItemRowId({ key: "undefined-47" })).toBeNull();
    expect(resolveItemRowId({ key: "null-47" })).toBeNull();
    expect(resolveItemRowId({ key: "NaN-47" })).toBeNull();
  });

  it("rejects an id that is not an id", () => {
    expect(resolveItemRowId({ item_id: "" })).toBeNull();
    expect(resolveItemRowId({ item_id: "   " })).toBeNull();
    expect(resolveItemRowId({ item_id: null })).toBeNull();
    expect(resolveItemRowId({ item_id: undefined })).toBeNull();
    expect(resolveItemRowId({ item_id: "undefined" })).toBeNull();
  });

  it("keeps a non-numeric id the server may legitimately use", () => {
    // Mongo-style ids are used elsewhere in this API; only the known
    // stringified-nothing values are rejected.
    expect(resolveItemRowId({ item_id: "64f0a1b2c3d4e5f60718293a" })).toBe(
      "64f0a1b2c3d4e5f60718293a"
    );
  });

  it("survives a row that is nothing at all", () => {
    expect(resolveItemRowId(null)).toBeNull();
    expect(resolveItemRowId(undefined)).toBeNull();
    expect(resolveItemRowId({})).toBeNull();
  });

  it("skips a key with no counter suffix rather than guessing", () => {
    // A bare key is the item id in the All devices table, so it is usable.
    expect(resolveItemRowId({ key: "200602" })).toBe("200602");
  });

  it("does not mistake a zero for absent", () => {
    expect(resolveItemRowId({ item_id: 0 })).toBe("0");
  });
});
