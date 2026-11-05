import { describe, expect, it } from "vitest";
import { deviceTypeKey, requestedDevicesByType } from "./requestedDevices";

describe("deviceTypeKey", () => {
  it("trims and collapses whitespace", () => {
    expect(deviceTypeKey("  Radio   Receiver ")).toBe("Radio Receiver");
  });

  it("returns an empty key for a missing type", () => {
    expect(deviceTypeKey(undefined)).toBe("");
    expect(deviceTypeKey(null)).toBe("");
  });
});

describe("requestedDevicesByType", () => {
  it("returns an empty map for a record without devices", () => {
    expect(requestedDevicesByType(undefined)).toEqual({});
    expect(requestedDevicesByType({ device: "x" })).toEqual({});
  });

  it("adds nested device entries by type", () => {
    const record = {
      device: [
        {
          device: [
            { deviceType: "Radio", deviceNeeded: 2 },
            { deviceType: " Radio ", deviceNeeded: "1" },
          ],
        },
      ],
    };
    expect(requestedDevicesByType(record)).toEqual({ Radio: 3 });
  });

  it("adds flat entries too", () => {
    const record = {
      device: [
        { deviceType: "Headset", deviceNeeded: 4 },
        { device: [{ deviceType: "Headset", deviceNeeded: 1 }] },
      ],
    };
    expect(requestedDevicesByType(record)).toEqual({ Headset: 5 });
  });

  it("skips zero quantities, missing types and the text 'undefined'", () => {
    const record = {
      device: [
        { deviceType: "Radio", deviceNeeded: 0 },
        { deviceType: undefined, deviceNeeded: 3 },
        { deviceType: "undefined", deviceNeeded: 3 },
        { deviceType: "   ", deviceNeeded: 3 },
        { deviceType: "Radio", deviceNeeded: "abc" },
      ],
    };
    expect(requestedDevicesByType(record)).toEqual({});
  });
});
