import { describe, it, expect } from "vitest";
import {
  calculateAge,
  isMinor,
  isUnder13,
  calculateStudentAgeFlags,
} from "./ageCalculationUtils";

describe("calculateAge", () => {
  it("calcula edad correcta desde DOB", () => {
    // Person born 2000-01-01, today is 2026-07-23 → age 26
    expect(calculateAge("2000-01-01")).toBe(26);
  });

  it("retorna null para DOB inválida", () => {
    expect(calculateAge("not-a-date")).toBeNull();
    expect(calculateAge("")).toBeNull();
    expect(calculateAge(null)).toBeNull();
    expect(calculateAge(undefined)).toBeNull();
  });

  it("retorna null para DOB futura", () => {
    expect(calculateAge("2030-01-01")).toBeNull();
  });

  it("calcula edad para alguien que cumple años hoy", () => {
    const today = new Date();
    const dob = `${today.getFullYear() - 15}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    expect(calculateAge(dob)).toBe(15);
  });

  it("aún no ha cumplido años este año", () => {
    const today = new Date();
    // Born one year ago but birthday hasn't happened yet this year
    const futureMonth = today.getMonth() + 2;
    if (futureMonth <= 11) {
      const dob = `${today.getFullYear() - 16}-${String(futureMonth).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      expect(calculateAge(dob)).toBe(15);
    }
  });
});

describe("isMinor", () => {
  it("true si edad < 18", () => {
    expect(isMinor("2015-01-01")).toBe(true); // ~11 years old
  });

  it("false si edad >= 18", () => {
    expect(isMinor("2000-01-01")).toBe(false); // ~26 years old
  });

  it("false para DOB inválido", () => {
    expect(isMinor(null)).toBe(false);
    expect(isMinor("invalid")).toBe(false);
  });
});

describe("isUnder13", () => {
  it("true si edad < 13", () => {
    expect(isUnder13("2015-01-01")).toBe(true); // ~11 years old
  });

  it("false si edad >= 13", () => {
    expect(isUnder13("2010-01-01")).toBe(false); // ~16 years old
  });

  it("false para DOB inválido", () => {
    expect(isUnder13(null)).toBe(false);
    expect(isUnder13("invalid")).toBe(false);
  });
});

describe("calculateStudentAgeFlags", () => {
  it("retorna flags completos para menor", () => {
    const result = calculateStudentAgeFlags("2015-05-10");
    expect(result).toEqual({
      age: expect.any(Number),
      minor: true,
      under_13: true,
      dob_valid: true,
    });
    expect(result.age).toBeLessThan(13);
  });

  it("retorna flags para mayor de edad", () => {
    const result = calculateStudentAgeFlags("2000-01-01");
    expect(result).toEqual({
      age: expect.any(Number),
      minor: false,
      under_13: false,
      dob_valid: true,
    });
    expect(result.age).toBeGreaterThanOrEqual(18);
  });

  it("retorna flags para rango 13-17 (minor pero no under_13)", () => {
    const result = calculateStudentAgeFlags("2012-06-15");
    expect(result.minor).toBe(true);
    expect(result.under_13).toBe(false);
    expect(result.dob_valid).toBe(true);
  });

  it("maneja DOB inválido", () => {
    const result = calculateStudentAgeFlags(null);
    expect(result).toEqual({
      age: null,
      minor: false,
      under_13: false,
      dob_valid: false,
    });
  });
});
