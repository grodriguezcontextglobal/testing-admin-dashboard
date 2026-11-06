import { describe, expect, it } from "vitest";
import { getEquipmentStatus } from "./eventStatusHelpers";

const withStatus = (logistic_inventory_status) => ({ logistic_inventory_status });

describe("getEquipmentStatus", () => {
  it("names the wait before the devices reach the event", () => {
    expect(getEquipmentStatus(withStatus("no_received_yet"))).toMatchObject({
      label: "Awaiting delivery",
      tone: "warning",
    });
  });

  // `received` and `in-idle` are both written for an event that holds its
  // devices; the card used to show them as "Received" and "Received At Event"
  // in one place and "At event" (or nothing) in another.
  it.each(["received", "in-idle"])("shows %s as At event", (status) => {
    expect(getEquipmentStatus(withStatus(status))).toMatchObject({
      label: "At event",
      tone: "primary",
    });
  });

  it("names the trip back to the warehouse", () => {
    expect(getEquipmentStatus(withStatus("in-transit"))).toMatchObject({
      label: "Returning",
      tone: "info",
    });
  });

  it("names the devices checked back in", () => {
    expect(getEquipmentStatus(withStatus("completed"))).toMatchObject({
      label: "Returned",
      tone: "success",
    });
  });

  it("gives every known status a one-line explanation and colors", () => {
    for (const status of ["no_received_yet", "received", "in-idle", "in-transit", "completed"]) {
      const result = getEquipmentStatus(withStatus(status));
      expect(result.hint).toEqual(expect.any(String));
      expect(result.hint.length).toBeGreaterThan(0);
      expect(result.dot).toEqual(expect.any(String));
      expect(result.text).toEqual(expect.any(String));
    }
  });

  it("returns null when the event has no status or an unknown one", () => {
    expect(getEquipmentStatus({})).toBeNull();
    expect(getEquipmentStatus(undefined)).toBeNull();
    expect(getEquipmentStatus(withStatus("something-else"))).toBeNull();
  });
});
