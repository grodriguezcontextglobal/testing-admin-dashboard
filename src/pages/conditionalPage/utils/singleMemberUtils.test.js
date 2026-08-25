import { describe, it, expect } from "vitest";
import {
  EMPTY_SINGLE_MEMBER_FORM,
  buildSingleMemberPayload,
  singleMemberFieldErrors,
  validateSingleMemberForm,
} from "./singleMemberUtils";

const validAdult = {
  first_name: "Ada",
  last_name: "Lovelace",
  email: "ada@test.com",
  phone: "555-0100",
  address_street: "123 Main St",
  address_city: "London",
  address_state: "NY",
  address_zip: "10001",
  date_of_birth: "2000-01-01",
  minor: false,
};

const validMinor = {
  ...validAdult,
  date_of_birth: "2015-05-10",
  parent_guardian_first_name: "Jane",
  parent_guardian_last_name: "Doe",
  parent_guardian_email: "jane@test.com",
  parent_guardian_phone_number: "555-1",
};

describe("EMPTY_SINGLE_MEMBER_FORM", () => {
  it("expone todos los campos del formulario vacíos", () => {
    expect(EMPTY_SINGLE_MEMBER_FORM).toMatchObject({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      date_of_birth: "",
      minor: false,
      parent_guardian_first_name: "",
    });
  });
});

describe("validateSingleMemberForm", () => {
  it("no retorna errores para un adulto válido", () => {
    expect(validateSingleMemberForm(validAdult)).toEqual([]);
  });

  it("exige los campos core obligatorios", () => {
    const errs = validateSingleMemberForm({ minor: false });
    expect(errs).toContain("First name is required.");
    expect(errs).toContain("Last name is required.");
    expect(errs).toContain("Email is required.");
    expect(errs).toContain("Phone is required.");
  });

  it("no exige datos del guardián cuando no es menor", () => {
    const errs = validateSingleMemberForm(validAdult);
    expect(errs.some((e) => e.includes("Guardian"))).toBe(false);
  });

  it("exige los datos del guardián cuando el DOB indica menor", () => {
    const errs = validateSingleMemberForm({
      ...validAdult,
      date_of_birth: "2015-05-10",
      parent_guardian_first_name: "",
      parent_guardian_last_name: "",
      parent_guardian_email: "",
      parent_guardian_phone_number: "",
    });
    expect(errs).toContain("Guardian first name is required for minors.");
    expect(errs).toContain("Guardian last name is required for minors.");
    expect(errs).toContain("Guardian email is required for minors.");
    expect(errs).toContain("Guardian phone number is required for minors.");
  });

  it("no exige datos del guardián de un menor cuando ya están completos", () => {
    const errs = validateSingleMemberForm(validMinor);
    expect(errs).toEqual([]);
  });

  it("usa el label del representante de la industria en los mensajes (schools)", () => {
    const errs = validateSingleMemberForm(
      { ...validAdult, date_of_birth: "2015-05-10" },
      { representativeLabel: "Parent / Guardian" }
    );
    expect(errs).toContain("Parent / Guardian first name is required for minors.");
    expect(errs).toContain("Parent / Guardian email is required for minors.");
    expect(errs.some((e) => e.startsWith("Guardian "))).toBe(false);
  });

  it("requiere DOB cuando requireDob=true", () => {
    const errs = validateSingleMemberForm(
      { ...validAdult, date_of_birth: "" },
      { requireDob: true }
    );
    expect(errs).toContain("Date of birth is required.");
  });

  it("no requiere DOB cuando requireDob=false (default)", () => {
    const errs = validateSingleMemberForm(validAdult);
    expect(errs.some((e) => e.includes("Date of birth"))).toBe(false);
  });

  it("no exige DOB cuando tiene DOB válido y requireDob=true", () => {
    const errs = validateSingleMemberForm(validAdult, { requireDob: true });
    expect(errs.some((e) => e.includes("Date of birth"))).toBe(false);
  });
});

describe("buildSingleMemberPayload", () => {
  it("compone la dirección a partir de las partes", () => {
    const payload = buildSingleMemberPayload(validAdult);
    expect(payload.address).toBe("123 Main St, London, NY 10001");
  });

  it("conserva el resto de los campos del formulario", () => {
    const payload = buildSingleMemberPayload(validAdult);
    expect(payload).toMatchObject({
      first_name: "Ada",
      email: "ada@test.com",
    });
  });

  it("incluye date_of_birth en el payload", () => {
    const payload = buildSingleMemberPayload(validAdult);
    expect(payload.date_of_birth).toBe("2000-01-01");
  });

  it("calcula minor=true para DOB de menor", () => {
    const payload = buildSingleMemberPayload({
      ...validAdult,
      date_of_birth: "2015-05-10",
    });
    expect(payload.minor).toBe(true);
  });

  it("calcula minor=false para DOB de adulto", () => {
    const payload = buildSingleMemberPayload(validAdult);
    expect(payload.minor).toBe(false);
  });

  it("calcula under_13=true para DOB < 13 años", () => {
    const payload = buildSingleMemberPayload({
      ...validAdult,
      date_of_birth: "2016-01-01",
    });
    expect(payload.under_13).toBe(true);
    expect(payload.minor).toBe(true);
  });

  it("calcula under_13=false para DOB >= 13 años", () => {
    const payload = buildSingleMemberPayload({
      ...validAdult,
      date_of_birth: "2010-01-01",
    });
    expect(payload.under_13).toBe(false);
    expect(payload.minor).toBe(true);
  });
});

describe("singleMemberFieldErrors", () => {
  it("keys each message by the field it belongs to", () => {
    expect(singleMemberFieldErrors({})).toMatchObject({
      first_name: "First name is required.",
      last_name: "Last name is required.",
      email: "Email is required.",
      phone: "Phone is required.",
    });
  });

  it("keys the guardian messages too, using the industry's label", () => {
    const errors = singleMemberFieldErrors(
      { first_name: "A", last_name: "B", email: "c@d.e", phone: "1", date_of_birth: "2015-01-01" },
      { representativeLabel: "Parent / Guardian" }
    );
    expect(errors.parent_guardian_email).toBe(
      "Parent / Guardian email is required for minors."
    );
  });

  it("is empty for a valid form", () => {
    expect(singleMemberFieldErrors(validAdult)).toEqual({});
  });

  it("is the same content the array form reports, in the same order", () => {
    // The two shapes must not be able to disagree.
    expect(Object.values(singleMemberFieldErrors({}))).toEqual(
      validateSingleMemberForm({})
    );
  });
});
