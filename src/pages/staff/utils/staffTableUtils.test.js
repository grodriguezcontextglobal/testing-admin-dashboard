import { describe, it, expect } from "vitest";
import { buildStaffRows, filterStaffRows } from "./staffTableUtils";

// ─── buildStaffRows ───────────────────────────────────────────────────────────

const employee = {
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@test.com",
  phone: "+1-555-0100",
  role: "admin",
  status: "Active",
  adminUserInfo: { id: "u1" },
};

describe("buildStaffRows", () => {
  it("retorna [] cuando la data no es un array", () => {
    expect(buildStaffRows(null)).toEqual([]);
    expect(buildStaffRows(undefined)).toEqual([]);
    expect(buildStaffRows({})).toEqual([]);
  });

  it("mapea cada empleado a la forma que consume la tabla", () => {
    const [row] = buildStaffRows([employee]);
    expect(row).toMatchObject({
      name: "Ada Lovelace",
      email: "ada@test.com",
      phone: "+1-555-0100",
      role: "admin",
      active: "Active",
      key: "ada@test.com",
      entireData: employee,
    });
  });

  it("usa el email como key para cada fila", () => {
    const rows = buildStaffRows([
      { ...employee, email: "a@x.com" },
      { ...employee, email: "b@x.com" },
    ]);
    expect(rows.map((r) => r.key)).toEqual(["a@x.com", "b@x.com"]);
  });

  it("precomputa un _haystack en minúsculas para la búsqueda", () => {
    const [row] = buildStaffRows([employee]);
    expect(row._haystack).toContain("ada");
    expect(row._haystack).toContain("lovelace");
    expect(row._haystack).toBe(row._haystack.toLowerCase());
  });

  it("no lanza error con campos ausentes", () => {
    const rows = buildStaffRows([{ email: "x@x.com" }]);
    expect(rows).toHaveLength(1);
    expect(rows[0].key).toBe("x@x.com");
  });
});

// ─── filterStaffRows ──────────────────────────────────────────────────────────

const rows = buildStaffRows([
  { ...employee, firstName: "Ada", lastName: "Lovelace", email: "ada@test.com" },
  { ...employee, firstName: "Alan", lastName: "Turing", email: "alan@test.com" },
  { ...employee, firstName: "Grace", lastName: "Hopper", email: "grace@test.com" },
]);

describe("filterStaffRows", () => {
  it("retorna todas las filas cuando el término está vacío", () => {
    expect(filterStaffRows(rows, "")).toHaveLength(3);
    expect(filterStaffRows(rows, null)).toHaveLength(3);
    expect(filterStaffRows(rows, undefined)).toHaveLength(3);
    expect(filterStaffRows(rows, "   ")).toHaveLength(3);
  });

  it("filtra por nombre sin distinguir mayúsculas", () => {
    const result = filterStaffRows(rows, "TURING");
    expect(result).toHaveLength(1);
    expect(result[0].email).toBe("alan@test.com");
  });

  it("filtra por email", () => {
    const result = filterStaffRows(rows, "grace@test.com");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Grace Hopper");
  });

  it("recorta espacios del término de búsqueda", () => {
    expect(filterStaffRows(rows, "  hopper  ")).toHaveLength(1);
  });

  it("retorna [] cuando ninguna fila coincide", () => {
    expect(filterStaffRows(rows, "zzz-no-match")).toHaveLength(0);
  });
});
