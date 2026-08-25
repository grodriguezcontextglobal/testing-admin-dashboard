import { describe, it, expect } from "vitest";
import {
  MEMBER_IMPORT_COLUMNS,
  buildTemplateRow,
  headerAliasMap,
  normalizeHeader,
  parseImportedDob,
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

// ─── La plantilla y el importador no pueden divergir ─────────────────────────
// El bug que esto corrige: el importador aceptaba grade y homeroom desde hacía
// tiempo, pero la plantilla que descarga el colegio no ofrecía esas columnas, así
// que NADIE las mandó nunca. Todos los alumnos importados quedaron sin grado —
// justo el campo por el que filtra OverdueDevicesTable y sobre el que opera
// AdvanceGrades. Dos listas mantenidas a mano en archivos distintos siempre
// terminan así; estos dos tests son lo que lo impide.

describe("MEMBER_IMPORT_COLUMNS — plantilla ↔ importador", () => {
  it("toda columna de la plantilla la reconoce el importador", () => {
    MEMBER_IMPORT_COLUMNS.forEach((column) => {
      expect(
        resolveKey(normalizeHeader(column.header)),
        `la plantilla ofrece "${column.header}" y el importador lo ignoraría`
      ).not.toBeNull();
    });
  });

  it("todo campo importable aparece en la plantilla", () => {
    // Exenciones, con motivo — no son olvidos:
    //   address: se arma desde street/city/state/zip; ofrecer las dos formas
    //            invita a que se contradigan.
    //   minor:   se deriva de date_of_birth. Sigue siendo un alias aceptado para
    //            archivos viejos sin fecha de nacimiento, pero pedirlo en la
    //            plantilla crearía dos fuentes de verdad para la misma cosa.
    const DERIVED = ["address", "minor"];
    const offered = new Set(
      MEMBER_IMPORT_COLUMNS.map((column) => resolveKey(normalizeHeader(column.header)))
    );
    Object.keys(headerAliasMap)
      .filter((target) => !DERIVED.includes(target))
      .forEach((target) => {
        expect(
          offered.has(target),
          `el importador acepta "${target}" pero la plantilla no lo ofrece`
        ).toBe(true);
      });
  });

  it("los campos obligatorios de la plantilla son los que valida el importador", () => {
    const required = MEMBER_IMPORT_COLUMNS.filter((c) => c.required).map((c) =>
      resolveKey(normalizeHeader(c.header))
    );
    expect(required.sort()).toEqual(
      ["first name", "last name", "email", "phone"].sort()
    );
  });

  it("cada columna trae ejemplo y descripción para la guía y la plantilla", () => {
    MEMBER_IMPORT_COLUMNS.forEach((column) => {
      expect(column.title, `${column.header} sin title`).toBeTruthy();
      expect(column.description, `${column.header} sin description`).toBeTruthy();
      expect(column.example, `${column.header} sin example`).toBeDefined();
    });
  });
});

describe("buildTemplateRow — la fila de ejemplo del .xlsx", () => {
  it("usa los headers de la plantilla como claves", () => {
    const row = buildTemplateRow();
    MEMBER_IMPORT_COLUMNS.forEach((column) => {
      expect(Object.keys(row)).toContain(column.header);
    });
  });

  // El viaje completo: lo que el colegio descarga tiene que volver a entrar sin
  // perder nada. Si esto pasa, la plantilla es utilizable tal cual.
  it("sobrevive el viaje de vuelta por el importador, sin errores", () => {
    const { rows, errors } = validateAndNormalizeRows([buildTemplateRow()], 62);
    expect(errors).toEqual([]);
    expect(rows[0]).toMatchObject({
      first_name: expect.any(String),
      grade: expect.any(String),
      homeroom: expect.any(String),
      external_id: expect.any(String),
      date_of_birth: expect.any(String),
      company_id: 62,
    });
    expect(rows[0].grade).not.toBe("");
    expect(rows[0].homeroom).not.toBe("");
    expect(rows[0].external_id).not.toBe("");
  });
});

describe("columnas que antes se perdían", () => {
  const base = {
    "First Name": "Blaise",
    "Last Name": "Pascal",
    Email: "b@school.edu",
    Phone: "555-0100",
    date_of_birth: "2015-06-12",
    parent_guardian_first_name: "Guardian",
    parent_guardian_last_name: "One",
    parent_guardian_email: "g@home.com",
    parent_guardian_phone_number: "555-0101",
  };

  it("transporta grade y homeroom", () => {
    const { rows } = validateAndNormalizeRows(
      [{ ...base, Grade: "6", Homeroom: "Rivera 7B" }],
      62
    );
    expect(rows[0].grade).toBe("6");
    expect(rows[0].homeroom).toBe("Rivera 7B");
  });

  it("transporta image_url", () => {
    const { rows } = validateAndNormalizeRows(
      [{ ...base, "Image URL": "https://cdn.school.edu/b.jpg" }],
      62
    );
    expect(rows[0].image_url).toBe("https://cdn.school.edu/b.jpg");
  });

  it("acepta external_id además del header ambiguo 'id'", () => {
    expect(
      validateAndNormalizeRows([{ ...base, external_id: "ED_9" }], 62).rows[0]
        .external_id
    ).toBe("ED_9");
    expect(
      validateAndNormalizeRows([{ ...base, id: "ED_9" }], 62).rows[0].external_id
    ).toBe("ED_9");
  });
});

// Sin fecha de nacimiento el importador cae al valor manual de `minor`, y si
// tampoco viene, el alumno entra como ADULTO. Eso es exactamente lo que manda
// los avisos de equipo perdido al menor en vez de a su representante. No se
// bloquea la importación (una empresa no-colegio importa adultos legítimamente),
// pero tiene que decirlo.
describe("edad indeterminable — avisa, no bloquea", () => {
  const adultRow = {
    "First Name": "Ada",
    "Last Name": "Lovelace",
    Email: "ada@x.com",
    Phone: "555-0000",
  };

  it("avisa cuando no hay fecha de nacimiento ni columna minor", () => {
    const { warnings, errors, rows } = validateAndNormalizeRows([adultRow], 62);
    expect(errors).toEqual([]);
    expect(rows[0].minor).toBe(false);
    expect(warnings.join(" ")).toMatch(/date of birth/i);
    expect(warnings.join(" ")).toMatch(/adult/i);
  });

  it("no avisa cuando la fecha de nacimiento resuelve la edad", () => {
    const { warnings } = validateAndNormalizeRows(
      [{ ...adultRow, date_of_birth: "1990-01-01" }],
      62
    );
    expect(warnings).toEqual([]);
  });

  it("no avisa cuando la columna minor viene explícita", () => {
    expect(
      validateAndNormalizeRows([{ ...adultRow, minor: "false" }], 62).warnings
    ).toEqual([]);
  });
});

// ─── Fecha de nacimiento: lo que Excel entrega de verdad ─────────────────────
// calculateAge exige `typeof dob === "string"`, y una celda con formato de fecha
// en Excel NO llega como string: sheet_to_json la devuelve como número de serie
// (40344) o como Date. En ambos casos la edad quedaba en null, el alumno entraba
// como ADULTO, y no había ni aviso porque el campo venía "lleno". Es el mismo
// fallo que le manda al chico de 15 el aviso de su propio laptop perdido.

describe("parseImportedDob — normaliza a YYYY-MM-DD", () => {
  it("acepta el número de serie de Excel, que es lo que manda una celda de fecha", () => {
    expect(parseImportedDob(40344)).toBe("2010-06-15");
    expect(parseImportedDob(42167)).toBe("2015-06-12");
  });

  it("acepta un Date (sheet_to_json con cellDates)", () => {
    expect(parseImportedDob(new Date(2010, 5, 15))).toBe("2010-06-15");
  });

  it("acepta el MM-DD-YYYY que documenta la plantilla", () => {
    expect(parseImportedDob("06-15-2010")).toBe("2010-06-15");
    expect(parseImportedDob("6/15/2010")).toBe("2010-06-15");
  });

  it("acepta ISO sin tocarlo", () => {
    expect(parseImportedDob("2010-06-15")).toBe("2010-06-15");
  });

  // 15 no puede ser un mes: no hay ambigüedad que adivinar, y la alternativa es
  // que el alumno entre como adulto.
  it("acepta DD-MM-YYYY cuando el día es inequívoco", () => {
    expect(parseImportedDob("15-06-2010")).toBe("2010-06-15");
  });

  it("devuelve null para lo que no se puede leer, en vez de una fecha inventada", () => {
    for (const bad of ["", "   ", "ayer", "13-13-2010", "0", null, undefined, {}]) {
      expect(parseImportedDob(bad)).toBeNull();
    }
  });
});

describe("date_of_birth en la importación", () => {
  const base = {
    "First Name": "Blaise",
    "Last Name": "Pascal",
    Email: "b@school.edu",
    Phone: "555-0100",
    parent_guardian_first_name: "Guardian",
    parent_guardian_last_name: "One",
    parent_guardian_email: "g@home.com",
    parent_guardian_phone_number: "555-0101",
  };

  it("detecta al menor desde una celda de fecha de Excel, no solo desde texto", () => {
    const { rows } = validateAndNormalizeRows(
      [{ ...base, date_of_birth: 42167 }],
      62
    );
    expect(rows[0].date_of_birth).toBe("2015-06-12");
    expect(rows[0].minor).toBe(true);
  });

  it("guarda la fecha normalizada, no el número de serie", () => {
    const { rows } = validateAndNormalizeRows(
      [{ ...base, date_of_birth: new Date(2015, 5, 12) }],
      62
    );
    expect(rows[0].date_of_birth).toBe("2015-06-12");
  });

  // Una fecha ilegible con la columna presente es un error, no un aviso: quien
  // llenó esa celda quiso declarar una edad, y equivocarse invierte a quién le
  // llegan los avisos del equipo.
  it("es un error cuando la fecha viene pero no se puede leer", () => {
    const { errors, rows } = validateAndNormalizeRows(
      [{ ...base, date_of_birth: "ayer" }],
      62
    );
    expect(errors.join(" ")).toMatch(/date of birth/i);
    expect(rows[0].date_of_birth).toBe("");
  });

  it("un adulto con fecha legible no genera ni error ni aviso", () => {
    const { errors, warnings } = validateAndNormalizeRows(
      [{ ...base, date_of_birth: "01-01-1990" }],
      62
    );
    expect(errors).toEqual([]);
    expect(warnings).toEqual([]);
  });
});
