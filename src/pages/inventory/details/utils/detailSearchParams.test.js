import { describe, expect, it } from "vitest";
import { readDetailSearchValue } from "./detailSearchParams";

// The category, group, brand and ownership pages are opened as
// `/inventory/<kind>?<name>&search=<value>`. The search box starts with that
// value, and a missing one must read as empty, never as "undefined".
describe("readDetailSearchValue", () => {
  it("reads the value after `search=`, decoded", () => {
    expect(readDetailSearchValue("?Radios&search=SN-100")).toBe("SN-100");
    expect(readDetailSearchValue("?Radios&search=front%20desk")).toBe("front desk");
  });

  it("is empty when there is no search value", () => {
    expect(readDetailSearchValue("?Radios&search=")).toBe("");
    expect(readDetailSearchValue("?Radios")).toBe("");
    expect(readDetailSearchValue("")).toBe("");
    expect(readDetailSearchValue(undefined)).toBe("");
  });

  it("never fills the box with the words undefined or null", () => {
    expect(readDetailSearchValue("?Radios&search=undefined")).toBe("");
    expect(readDetailSearchValue("?Radios&search=null")).toBe("");
  });

  it("keeps a value it cannot decode as it came", () => {
    expect(readDetailSearchValue("?Radios&search=100%")).toBe("100%");
  });
});
