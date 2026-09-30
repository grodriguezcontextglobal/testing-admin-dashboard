import { describe, expect, it } from "vitest";
import { memberContactErrors } from "./memberContactRules";

/**
 * Meeting 2026-09-29 `12:43`: "some kids don't have an e-mail address. And
 * what do you do then?" A school imports minors, and the import refused every
 * one of them without an email of their own.
 *
 * Decided the same day: a minor's own email and phone are optional, because
 * every notice about a minor already goes to the guardian. The guardian stays
 * fully required — it is found, linked and asked for consent by email.
 */

const adult = {
  minor: false,
  first_name: "Ada",
  last_name: "Lovelace",
  email: "ada@test.com",
  phone: "555-0100",
};

const minor = {
  minor: true,
  first_name: "Blaise",
  last_name: "Pascal",
  email: "",
  phone: "",
  parent_guardian_first_name: "Etienne",
  parent_guardian_last_name: "Pascal",
  parent_guardian_email: "etienne@home.com",
  parent_guardian_phone_number: "555-0101",
};

describe("memberContactErrors — adults", () => {
  it("accepts an adult with name, email and phone", () => {
    expect(memberContactErrors(adult)).toEqual({});
  });

  it("still requires an adult's own email and phone", () => {
    expect(memberContactErrors({ ...adult, email: "", phone: "" })).toEqual({
      email: "Email is required.",
      phone: "Phone is required.",
    });
  });

  it("requires a name from everyone", () => {
    expect(memberContactErrors({ minor: false })).toMatchObject({
      first_name: "First name is required.",
      last_name: "Last name is required.",
    });
  });
});

describe("memberContactErrors — minors", () => {
  it("accepts a minor with no email and no phone of their own", () => {
    expect(memberContactErrors(minor)).toEqual({});
  });

  it("still requires the whole guardian", () => {
    expect(
      memberContactErrors({
        ...minor,
        parent_guardian_first_name: "",
        parent_guardian_last_name: "",
        parent_guardian_email: "",
        parent_guardian_phone_number: "",
      })
    ).toEqual({
      parent_guardian_first_name: "Guardian first name is required for minors.",
      parent_guardian_last_name: "Guardian last name is required for minors.",
      parent_guardian_email: "Guardian email is required for minors.",
      parent_guardian_phone_number: "Guardian phone number is required for minors.",
    });
  });

  it("names the guardian with the industry's word", () => {
    const errors = memberContactErrors(
      { ...minor, parent_guardian_first_name: "" },
      { representativeLabel: "Parent / Guardian" }
    );
    expect(errors.parent_guardian_first_name).toBe(
      "Parent / Guardian first name is required for minors."
    );
  });

  it("treats blank-looking cells as empty", () => {
    expect(
      memberContactErrors({ ...minor, parent_guardian_email: "   " })
    ).toHaveProperty("parent_guardian_email");
  });
});
