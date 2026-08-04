import { describe, expect, it } from "vitest";
import { resolveSearchCategoryParam } from "./searchCategoryUtils";

describe("resolveSearchCategoryParam", () => {
  it("returns null for 'View All' (no single area selected)", () => {
    expect(
      resolveSearchCategoryParam({
        "View All": 1,
        Consumers: 0,
        Staff: 0,
        Devices: 0,
        Events: 0,
      })
    ).toBe(null);
  });

  it("maps 'Consumers' to the backend's 'consumers' category value", () => {
    expect(
      resolveSearchCategoryParam({
        "View All": 0,
        Consumers: 1,
        Staff: 0,
        Devices: 0,
        Events: 0,
      })
    ).toBe("consumers");
  });

  it("maps 'Staff' to the backend's 'staff' category value", () => {
    expect(
      resolveSearchCategoryParam({
        "View All": 0,
        Consumers: 0,
        Staff: 1,
        Devices: 0,
        Events: 0,
      })
    ).toBe("staff");
  });

  it("maps 'Devices' to the backend's singular 'device' category value", () => {
    expect(
      resolveSearchCategoryParam({
        "View All": 0,
        Consumers: 0,
        Staff: 0,
        Devices: 1,
        Events: 0,
      })
    ).toBe("device");
  });

  it("maps 'Events' to the backend's singular 'event' category value", () => {
    expect(
      resolveSearchCategoryParam({
        "View All": 0,
        Consumers: 0,
        Staff: 0,
        Devices: 0,
        Events: 1,
      })
    ).toBe("event");
  });

  it("returns null when more than one area is active (backend only accepts a single category)", () => {
    expect(
      resolveSearchCategoryParam({
        "View All": 0,
        Consumers: 1,
        Staff: 1,
        Devices: 0,
        Events: 0,
      })
    ).toBe(null);
  });

  it("returns null when every flag is 0 (defensive default, same as View All)", () => {
    expect(
      resolveSearchCategoryParam({
        "View All": 0,
        Consumers: 0,
        Staff: 0,
        Devices: 0,
        Events: 0,
      })
    ).toBe(null);
  });

  it("returns null for missing/empty filterOptions instead of throwing", () => {
    expect(resolveSearchCategoryParam(null)).toBe(null);
    expect(resolveSearchCategoryParam(undefined)).toBe(null);
    expect(resolveSearchCategoryParam({})).toBe(null);
  });

  it("ignores unrecognized keys when counting active areas", () => {
    expect(
      resolveSearchCategoryParam({
        "View All": 0,
        Consumers: 1,
        Posts: 1,
      })
    ).toBe("consumers");
  });
});
