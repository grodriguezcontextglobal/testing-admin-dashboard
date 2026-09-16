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

  // Two fields, two vocabularies. This file is the item's
  // (`item_inv.logistic_status`), where a unit out at an event is `in-event`.
  // `received`, `in-idle` and `completed` belong to the event's
  // `logistic_inventory_status` — a different column, read in CardEventDisplay
  // and eventStatusHelpers. They were named in allowedTransitions here, which
  // is how they came to look like item states that someone had forgotten to
  // define.
  it("keeps the event's vocabulary out of the item's", () => {
    expect(logisticStatusConfig["in-idle"]).toBeUndefined();
    expect(logisticStatusConfig.received).toBeUndefined();
    expect(logisticStatusConfig.completed).toBeUndefined();
  });

  // The invariant that would have caught the mix-up: a transition can only
  // point at a state this file defines.
  it("only allows transitions into states it defines", () => {
    for (const [status, { allowedTransitions }] of Object.entries(
      logisticStatusConfig,
    )) {
      for (const next of allowedTransitions) {
        expect(
          { status, next, defined: next in logisticStatusConfig },
        ).toStrictEqual({ status, next, defined: true });
      }
    }
  });

  it("makes an unknown status readable instead of blank", () => {
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
