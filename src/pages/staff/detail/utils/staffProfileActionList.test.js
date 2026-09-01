import { describe, expect, it } from "vitest";
import {
  EDIT_DETAILS,
  staffProfileActionList,
} from "./staffProfileActionList";

const all = {
  assignDevices: true,
  editDetails: true,
  assignEvent: true,
  assignLocation: true,
  changeRole: true,
  updateContact: true,
  resetPassword: true,
};

describe("staffProfileActionList", () => {
  it("leads with the one blue action and keeps the rest flat", () => {
    const rail = staffProfileActionList(all);
    expect(rail[0].label).toBe("Assign devices");
    expect(rail[0].tone).toBe("primary");
    // Exactly one primary: a rail with two blue buttons has no primary at all.
    expect(rail.filter((item) => item.tone === "primary")).toHaveLength(1);
    expect(rail.slice(1).every((item) => item.tone === "secondary")).toBe(true);
  });

  it("says what the member profile says for the same action", () => {
    // The member rail reads "Assign devices". Staff used to read "Assign a
    // device" — the same button, two labels, on two pages of one product.
    expect(staffProfileActionList(all)[0].label).toBe("Assign devices");
  });

  it("shows every action at the top level, not behind a dropdown", () => {
    expect(staffProfileActionList(all).map((item) => item.label)).toEqual([
      "Assign devices",
      "Edit details",
      "Assign to an event",
      "Locations & permissions",
      "Change role",
      "Update contact info",
      "Send password reset email",
    ]);
  });

  it("drops what the viewer may not do", () => {
    const rail = staffProfileActionList({
      assignDevices: true,
      editDetails: true,
    });
    expect(rail.map((item) => item.key)).toEqual([
      "assign-devices",
      EDIT_DETAILS,
    ]);
  });

  it("is empty for a viewer who may do none of it", () => {
    expect(staffProfileActionList({})).toEqual([]);
    expect(staffProfileActionList()).toEqual([]);
  });

  it("routes every action but the one that opens in place", () => {
    // Edit details is a modal over the profile; everything else is a route
    // under /staff/:id, so a null route is the signal to call back instead of
    // navigating.
    staffProfileActionList(all).forEach((item) => {
      if (item.key === EDIT_DETAILS) {
        expect(item.route).toBeNull();
      } else {
        expect(item.route).toBeTruthy();
      }
    });
  });
});
