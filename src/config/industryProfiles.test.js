import { describe, expect, it } from "vitest";
import {
  assignableTargetsLabel,
  audienceWords,
  getIndustryProfile,
  singularizeAudience,
} from "./industryProfiles";

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

/**
 * One directory decides what the people in this module are called: the same
 * industriesList entry that titles the nav tab. A school says Student
 * everywhere, a clinic says Patient, a rental company says Renter — the word is
 * never written into a screen.
 */
describe("audienceWords", () => {
  it("takes the word from the industry directory, both numbers", () => {
    expect(audienceWords("Education")).toEqual({
      singular: "student",
      plural: "students",
      Singular: "Student",
      Plural: "Students",
    });
  });

  it("serves the other industries from the same directory", () => {
    expect(audienceWords("Healthcare and Social Assistance").Singular).toBe(
      "Patient"
    );
    expect(audienceWords("Construction").Plural).toBe("Contractors");
  });

  it("falls back to member for an industry with no audience", () => {
    expect(audienceWords("Not An Industry")).toEqual({
      singular: "member",
      plural: "members",
      Singular: "Member",
      Plural: "Members",
    });
    expect(audienceWords(undefined).Singular).toBe("Member");
  });

  it("keeps a multi-word audience whole", () => {
    // "IT Professionals" must not become "IT Professional" via the first word.
    expect(audienceWords("Information Technology").Singular).toBe(
      "IT Professional"
    );
  });

  it("leaves a word that is not a plural alone", () => {
    expect(singularizeAudience("Staff")).toBe("Staff");
    expect(singularizeAudience("Press")).toBe("Press");
  });

  it("drops only a trailing s, never a double one", () => {
    expect(singularizeAudience("Students")).toBe("Student");
    expect(singularizeAudience("End-users")).toBe("End-user");
    expect(singularizeAudience("")).toBe("");
  });
});
