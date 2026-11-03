import { describe, expect, it } from "vitest";
import { sumDeviceSetup } from "./sumDeviceSetup";

describe("sumDeviceSetup", () => {
  it("adds the quantity of every device line in the event", () => {
    expect(
      sumDeviceSetup({ deviceSetup: [{ quantity: 3 }, { quantity: "4" }] }),
    ).toBe(7);
  });

  it("counts a missing or non-numeric quantity as zero", () => {
    expect(
      sumDeviceSetup({ deviceSetup: [{ quantity: 2 }, {}, { quantity: "n/a" }] }),
    ).toBe(2);
  });

  it("is zero for an event without a device setup, or no event", () => {
    expect(sumDeviceSetup({})).toBe(0);
    expect(sumDeviceSetup(undefined)).toBe(0);
  });
});
