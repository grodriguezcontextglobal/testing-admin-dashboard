import { describe, expect, it } from "vitest";
import { buildLeaseEventName } from "./leaseEventName";

describe("buildLeaseEventName", () => {
  it("reproduces the exact name the four records are keyed by", () => {
    // event_name, venue_name, receivers-pool eventSelected and
    // eventInfoDetail.eventName all have to be this same string.
    expect(
      buildLeaseEventName({
        profile: { firstName: "Ada", lastName: "Lovelace", email: "ada@x.com" },
        date: "6/1/2026",
        reference: 1700000000000,
      })
    ).toBe("Ada Lovelace / ada@x.com / 6/1/2026 / reference: 1700000000000");
  });
});
