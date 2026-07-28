import { describe, it, expect } from "vitest";
import {
  normalizeHeader,
  resolveKey,
  validateAndNormalizeRows,
} from "./xlsxImportUtils";

describe("normalizeHeader", () => {
  it("pasa a minúsculas y reemplaza espacios/guiones por _", () => {
    expect(normalizeHeader("First Name")).toBe("first_name");
    expect(normalizeHeader("Zip-Code")).toBe("zip_code");
  });

  it("elimina caracteres no alfanuméricos", () => {
    expect(normalizeHeader("E-mail!")).toBe("e_mail");
  });

  it("tolera null/undefined", () => {
    expect(normalizeHeader(null)).toBe("");
    expect(normalizeHeader(undefined)).toBe("");
  });
});

describe("resolveKey", () => {
  it("mapea variantes al target canónico", () => {
    expect(resolveKey("firstname")).toBe("first name");
    expect(resolveKey("phone_number")).toBe("phone");
    expect(resolveKey("zipcode")).toBe("zip");
  });

  it("resuelve alias de date_of_birth", () => {
    expect(resolveKey("date_of_birth")).toBe("date_of_birth");
    expect(resolveKey("dob")).toBe("date_of_birth");
    expect(resolveKey("birth_date")).toBe("date_of_birth");
    expect(resolveKey("birthday")).toBe("date_of_birth");
  });

  it("retorna null para claves desconocidas", () => {
    expect(resolveKey("unknown_column")).toBeNull();
  });
});

describe("validateAndNormalizeRows", () => {
  const validRow = {
    "First Name": "Ada",
    "Last Name": "Lovelace",
    Email: "ada@test.com",
    Phone: "555-0100",
    Street: "123 Main",
    City: "London",
    State: "NY",
    Zip: "10001",
  };

  it("normaliza una fila válida sin errores", () => {
    const { errors, rows } = validateAndNormalizeRows([validRow], 42);
    expect(errors).toEqual([]);
    expect(rows[0]).toMatchObject({
      first_name: "Ada",
      last_name: "Lovelace",
      email: "ada@test.com",
      phone: "555-0100",
      company_id: 42,
      minor: false,
    });
  });

  it("compone la dirección desde las partes cuando no hay address", () => {
    const { rows } = validateAndNormalizeRows([validRow], 1);
    expect(rows[0].address).toBe("123 Main, London, NY 10001");
  });

  it("reporta campos core faltantes con el número de fila", () => {
    const { errors } = validateAndNormalizeRows([{ "First Name": "Ada" }], 1);
    expect(errors.some((e) => e.includes("Row 1"))).toBe(true);
    expect(errors.some((e) => e.includes("last name"))).toBe(true);
  });

  it("exige datos del guardián cuando minor es truthy (manual)", () => {
    const { errors } = validateAndNormalizeRows(
      [{ ...validRow, Minor: "true" }],
      1
    );
    expect(errors.some((e) => e.includes("Guardian first name"))).toBe(true);
  });

  it("interpreta minor con true/1/yes", () => {
    const { rows } = validateAndNormalizeRows(
      [
        { ...validRow, Minor: "yes", "Guardian First Name": "J", "Guardian Last Name": "D", "Guardian Email": "j@d.com", "Guardian Phone": "1" },
      ],
      1
    );
    expect(rows[0].minor).toBe(true);
  });

  it("reporta las columnas detectadas", () => {
    const { columnsDetected } = validateAndNormalizeRows([validRow], 1);
    expect(columnsDetected).toContain("first name");
    expect(columnsDetected).toContain("email");
  });

  it("convierte external id a string", () => {
    const { rows } = validateAndNormalizeRows(
      [{ ...validRow, ID: 123456 }],
      1
    );
    expect(rows[0].external_id).toBe("123456");
  });

  it("calcula minor desde DOB cuando se provee date_of_birth", () => {
    const { rows } = validateAndNormalizeRows(
      [{ ...validRow, "Date of Birth": "2015-05-10" }],
      1
    );
    expect(rows[0].minor).toBe(true);
    expect(rows[0].under_13).toBe(true);
    expect(rows[0].date_of_birth).toBe("2015-05-10");
  });

  it("calcula minor=false desde DOB para adulto", () => {
    const { rows } = validateAndNormalizeRows(
      [{ ...validRow, DOB: "2000-01-01" }],
      1
    );
    expect(rows[0].minor).toBe(false);
    expect(rows[0].under_13).toBe(false);
  });

  it("exige guardian cuando DOB indica menor", () => {
    const { errors } = validateAndNormalizeRows(
      [{ ...validRow, "Date of Birth": "2016-01-01" }],
      1
    );
    expect(errors.some((e) => e.includes("Guardian first name"))).toBe(true);
  });

  it("no exige guardian cuando DOB indica adulto", () => {
    const { errors } = validateAndNormalizeRows(
      [{ ...validRow, DOB: "2000-01-01" }],
      1
    );
    expect(errors.some((e) => e.includes("Guardian"))).toBe(false);
  });

  it("incluye under_13 en el output cuando DOB < 13", () => {
    const { rows } = validateAndNormalizeRows(
      [{ ...validRow, "Date of Birth": "2018-01-01" }],
      1
    );
    expect(rows[0].under_13).toBe(true);
  });

  it("incluye under_13=false cuando DOB >= 13", () => {
    const { rows } = validateAndNormalizeRows(
      [{ ...validRow, DOB: "2012-01-01" }],
      1
    );
    expect(rows[0].under_13).toBe(false);
    expect(rows[0].minor).toBe(true);
  });
});
