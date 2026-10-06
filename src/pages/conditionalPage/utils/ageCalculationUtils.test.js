import { describe, it, expect } from "vitest";
import {
  calculateAge,
  isMinor,
  isMinorMember,
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

describe("isMinorMember", () => {
  /* El servidor confirmó el 2026-10-06 que la columna es tinyint(1) y que él
     compara Number(minor) === 1 en todas sus lecturas. El cliente recibe ese
     número casi siempre, pero no siempre: un registro recién creado trae el
     booleano que mandamos, las filas viejas traen null, y por varios caminos
     ha llegado el texto "1" — que es como un tutor se quedó fuera de un
     correo (ver Reminders.jsx). */
  it("reconoce al menor venga como venga el campo", () => {
    expect(isMinorMember({ minor: 1 })).toBe(true);
    expect(isMinorMember({ minor: "1" })).toBe(true);
    expect(isMinorMember({ minor: true })).toBe(true);
  });

  it("no da por menor a un adulto, ni a una fila sin el dato", () => {
    expect(isMinorMember({ minor: 0 })).toBe(false);
    expect(isMinorMember({ minor: "0" })).toBe(false);
    expect(isMinorMember({ minor: false })).toBe(false);
    expect(isMinorMember({ minor: null })).toBe(false);
    expect(isMinorMember({})).toBe(false);
    expect(isMinorMember(undefined)).toBe(false);
  });
});
