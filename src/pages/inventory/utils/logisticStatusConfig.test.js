import { describe, expect, it } from "vitest";
import {
  getLogisticStatusLabel,
  logisticStatusConfig,
} from "./logisticStatusConfig";

describe("getLogisticStatusLabel", () => {
  it("names a status the config knows", () => {
    expect(getLogisticStatusLabel("in-stock")).toBe("In Stock");
    expect(getLogisticStatusLabel("under-maintenance")).toBe("Under Maintenance");
  });

  // The filter dropdown used to read a hand-written map of seven statuses while
  // the config held twenty. Anything outside those seven rendered as an empty
  // row: a pickable option with no text. With the server's facets covering the
  // whole company, the thirteen that used to be rare started showing up.
  it("reads something for every status the config defines", () => {
    for (const status of Object.keys(logisticStatusConfig)) {
      expect(getLogisticStatusLabel(status)).not.toBe("");
      expect(getLogisticStatusLabel(status)).toBeTypeOf("string");
    }
  });

  // `received` and `in-idle` are named as allowed transitions inside the config
  // but never defined as entries, so a unit can reach a state the dictionary
  // has no word for. Showing the token beats showing nothing.
  it("makes an unknown status readable instead of blank", () => {
    expect(getLogisticStatusLabel("in-idle")).toBe("In idle");
    expect(getLogisticStatusLabel("received")).toBe("Received");
    expect(getLogisticStatusLabel("quarantined")).toBe("Quarantined");
    expect(getLogisticStatusLabel("under_inspection_v2")).toBe(
      "Under inspection v2",
    );
  });

  it("says nothing for nothing", () => {
    expect(getLogisticStatusLabel("")).toBe("");
    expect(getLogisticStatusLabel(undefined)).toBe("");
    expect(getLogisticStatusLabel(null)).toBe("");
  });
});
