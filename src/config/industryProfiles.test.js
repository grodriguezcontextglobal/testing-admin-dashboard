import { describe, expect, it } from "vitest";
import { assignableTargetsLabel, getIndustryProfile } from "./industryProfiles";

describe("getIndustryProfile", () => {
  it("names the audience a school's members module is about", () => {
    expect(getIndustryProfile("Education").audience).toBe("Students");
  });

  it("has no audience for an industry with no members section", () => {
    expect(getIndustryProfile("Not An Industry").audience).toBeNull();
  });
});

describe("assignableTargetsLabel", () => {
  /* The add-inventory form asked "Is device assignable to staff/events?" while
     the third thing a device is assigned to — the people in the members module
     — went unmentioned. What they are called depends on the company's
     industry, so the question has to say it in that company's own word. */

  it("names the industry's own audience alongside staff and events", () => {
    expect(assignableTargetsLabel("Education")).toBe("staff, events or students");
  });

  it("uses the industry's word, not a school one", () => {
    expect(assignableTargetsLabel("Construction")).toBe(
      "staff, events or contractors"
    );
  });

  it("falls back to staff and events when the industry has no members module", () => {
    expect(assignableTargetsLabel("Not An Industry")).toBe("staff or events");
    expect(assignableTargetsLabel(undefined)).toBe("staff or events");
    expect(assignableTargetsLabel("")).toBe("staff or events");
  });

  it("lower-cases the audience, since it sits mid-sentence", () => {
    expect(assignableTargetsLabel("Education")).not.toContain("Students");
  });
});
