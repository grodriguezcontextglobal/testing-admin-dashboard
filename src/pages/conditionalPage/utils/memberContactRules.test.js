import { describe, expect, it } from "vitest";
import {
  memberContactErrors,
  memberContactMissing,
  memberEditContactErrors,
  memberRowAfterUpdate,
  memberServerErrorMessage,
  memberServerFieldErrors,
} from "./memberContactRules";

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

/**
 * The server rule (branch feat/member-contact-minors), which
 * PATCH /db_member/update-member-info applies to how the WHOLE row ends up,
 * not just the fields sent:
 *
 *   adult                                   -> email and phone_number
 *   minor with own email and phone_number   -> nothing else
 *   minor missing either                    -> parent_guardian_email
 *
 * The edit page applies this one, not memberContactErrors: a student who turns
 * out to be a minor saves their own section first, and only then gets the
 * guardian section. Demanding the full guardian there would lock them out.
 */
describe("memberContactMissing — the server rule, in server field names", () => {
  const adult = { minor: 0, email: "a@x.com", phone_number: "555" };

  it("asks an adult for their own email and phone", () => {
    expect(memberContactMissing(adult)).toEqual([]);
    expect(memberContactMissing({ ...adult, email: "  ", phone_number: "" })).toEqual([
      "email",
      "phone_number",
    ]);
  });

  it("treats a missing or non-1 minor flag as adult", () => {
    expect(memberContactMissing({ email: "" , phone_number: "555" })).toEqual(["email"]);
    expect(memberContactMissing({ minor: 0, email: "", phone_number: "555" })).toEqual(["email"]);
  });

  it("asks nothing more of a minor with their own email and phone", () => {
    expect(memberContactMissing({ minor: 1, email: "k@x.com", phone_number: "555" })).toEqual([]);
  });

  it("asks a minor missing email or phone for a guardian email", () => {
    expect(memberContactMissing({ minor: 1, email: "", phone_number: "555" })).toEqual([
      "parent_guardian_email",
    ]);
    expect(
      memberContactMissing({ minor: true, email: "", phone_number: "", parent_guardian_email: "p@x.com" })
    ).toEqual([]);
  });
});

describe("memberRowAfterUpdate — the row the server will validate", () => {
  const stored = {
    minor: 1,
    email: "k@x.com",
    phone_number: "555",
    parent_guardian_email: "p@x.com",
  };

  it("lays the form's fields over the stored row, phone onto phone_number", () => {
    expect(memberRowAfterUpdate(stored, { email: "", phone: "777" })).toMatchObject({
      email: "",
      phone_number: "777",
      parent_guardian_email: "p@x.com",
      minor: 1,
    });
  });

  it("keeps the stored minor flag when the update does not send one", () => {
    expect(memberRowAfterUpdate(stored, { first_name: "Kim" }).minor).toBe(1);
    expect(memberRowAfterUpdate(stored, { minor: false }).minor).toBe(false);
  });

  it("copes with no stored row", () => {
    expect(memberRowAfterUpdate(undefined, { email: "a@x.com" }).email).toBe("a@x.com");
  });
});

describe("memberEditContactErrors — the three edits the server refuses", () => {
  const minorWithoutContact = { minor: 1, email: "", phone_number: "", parent_guardian_email: "p@x.com" };

  it("refuses emptying an adult's email or phone", () => {
    const adult = { minor: 0, email: "a@x.com", phone_number: "555" };
    expect(memberEditContactErrors(adult, { email: "", phone: "555" })).toHaveProperty("email");
    expect(memberEditContactErrors(adult, { email: "a@x.com", phone: " " })).toHaveProperty("phone");
  });

  it("refuses turning a student without own contact into an adult", () => {
    expect(memberEditContactErrors(minorWithoutContact, { minor: false })).toEqual({
      email: expect.any(String),
      phone: expect.any(String),
    });
  });

  it("refuses emptying the guardian email of a minor without own contact", () => {
    const errors = memberEditContactErrors(
      minorWithoutContact,
      { parent_guardian_email: "" },
      { representativeLabel: "Parent" }
    );
    expect(errors.parent_guardian_email).toMatch(/^Parent email/);
  });

  it("lets a minor drop their own email when a guardian email is on file", () => {
    expect(memberEditContactErrors(minorWithoutContact, { email: "" })).toEqual({});
  });

  /* Contract: changes that touch none of email, phone_number, minor and
     parent_guardian_email "siguen igual" — even on a legacy row that breaks
     the rule already. */
  it("does not check an update that sends no contact field", () => {
    const legacyAdult = { minor: 0, email: "a@x.com", phone_number: "" };
    expect(memberEditContactErrors(legacyAdult, { grade: "6", homeroom: "B" })).toEqual({});
  });

  it("does not block edits that leave contact as the server already has it", () => {
    expect(memberEditContactErrors(minorWithoutContact, { grade: "5" })).toEqual({});
  });
});

/**
 * The server's 400 for new-member and update-member-info:
 *   { ok: false, message, missing: ["email" | "phone_number" | "parent_guardian_email"] }
 * `missing` marks the field; `message` is never parsed. The old server sends
 * neither, so both must read as "nothing to mark".
 */
const axiosError = (status, data) => ({ message: "Request failed", response: { status, data } });

describe("memberServerFieldErrors", () => {
  it("marks each field the server says is missing, in form field names", () => {
    const error = axiosError(400, {
      ok: false,
      message: "Adult members require phone_number.",
      missing: ["phone_number", "email"],
    });
    expect(memberServerFieldErrors(error)).toEqual({
      phone: "Phone is required for adults.",
      email: "Email is required for adults.",
    });
  });

  it("names the representative in the guardian message", () => {
    const error = axiosError(400, { missing: ["parent_guardian_email"] });
    expect(
      memberServerFieldErrors(error, { representativeLabel: "Parent" }).parent_guardian_email
    ).toMatch(/^Parent email is required/);
  });

  it("is empty for the old contract, other errors, and names it does not know", () => {
    expect(memberServerFieldErrors(axiosError(400, { ok: false, message: "Bad" }))).toEqual({});
    expect(memberServerFieldErrors(axiosError(500, { missing: ["email"] }))).toEqual({});
    expect(memberServerFieldErrors(axiosError(400, { missing: ["shoe_size"] }))).toEqual({});
    expect(memberServerFieldErrors(new Error("Network Error"))).toEqual({});
    expect(memberServerFieldErrors(undefined)).toEqual({});
  });
});

describe("memberServerErrorMessage", () => {
  /* Members endpoints answer `message`; events answer `msg`. */
  it("reads `message`, the key the members endpoints use", () => {
    expect(memberServerErrorMessage(axiosError(400, { message: "Adult members require email." }))).toBe(
      "Adult members require email."
    );
  });

  it("falls back to msg, then the error, then the fallback", () => {
    expect(memberServerErrorMessage(axiosError(500, { msg: "boom" }))).toBe("boom");
    expect(memberServerErrorMessage(new Error("Network Error"))).toBe("Network Error");
    expect(memberServerErrorMessage(undefined, "Nothing was saved.")).toBe("Nothing was saved.");
  });
});
