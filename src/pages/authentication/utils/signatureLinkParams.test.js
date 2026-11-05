import { describe, expect, it } from "vitest";
import { readSignatureLinkParams } from "./signatureLinkParams";

describe("readSignatureLinkParams", () => {
  it("reads every field of the signature link", () => {
    const search =
      "?company_id=c1&contract_url=https%3A%2F%2Fx%2Fdoc.pdf&date_reference=2026-11-05" +
      "&ver_id=v9&item_ids=1,2,3&consumer_member_id=m1&staff_member_id=s1";
    expect(readSignatureLinkParams(search)).toEqual({
      company_id: "c1",
      documentUrl: "https://x/doc.pdf",
      date_reference: "2026-11-05",
      verification_id: "v9",
      item_ids: "1,2,3",
      consumer_info: "m1",
      staff_member_id: "s1",
    });
  });

  it("returns null for the fields the link leaves out", () => {
    expect(readSignatureLinkParams("?company_id=c1")).toEqual({
      company_id: "c1",
      documentUrl: null,
      date_reference: null,
      verification_id: null,
      item_ids: null,
      consumer_info: null,
      staff_member_id: null,
    });
  });

  it("accepts an empty or missing query string", () => {
    expect(readSignatureLinkParams("").company_id).toBeNull();
    expect(readSignatureLinkParams(undefined).company_id).toBeNull();
  });
});
