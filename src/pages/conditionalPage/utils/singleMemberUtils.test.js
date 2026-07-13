import { describe, it, expect } from "vitest";
import {
  EMPTY_SINGLE_MEMBER_FORM,
  buildSingleMemberPayload,
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
  minor: false,
};

describe("EMPTY_SINGLE_MEMBER_FORM", () => {
  it("expone todos los campos del formulario vacíos", () => {
    expect(EMPTY_SINGLE_MEMBER_FORM).toMatchObject({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
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

  it("exige los datos del guardián cuando es menor", () => {
    const errs = validateSingleMemberForm({ ...validAdult, minor: true });
    expect(errs).toContain("Guardian first name is required for minors.");
    expect(errs).toContain("Guardian last name is required for minors.");
    expect(errs).toContain("Guardian email is required for minors.");
    expect(errs).toContain("Guardian phone number is required for minors.");
  });

  it("no exige datos del guardián de un menor cuando ya están completos", () => {
    const errs = validateSingleMemberForm({
      ...validAdult,
      minor: true,
      parent_guardian_first_name: "Jane",
      parent_guardian_last_name: "Doe",
      parent_guardian_email: "jane@test.com",
      parent_guardian_phone_number: "555-1",
    });
    expect(errs).toEqual([]);
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
});
