import { describe, it, expect } from "vitest";
import { buildMemberRows, filterMemberRows } from "./memberTableUtils";

const member = {
  member_id: 7,
  first_name: "Ada",
  last_name: "Lovelace",
  email: "ada@test.com",
  phone_number: "+1-555-0100",
  address_street: "123 Main St",
  address_city: "London",
  address_state: "NY",
  address_zip: "10001",
};

// ─── buildMemberRows ──────────────────────────────────────────────────────────

describe("buildMemberRows", () => {
  it("retorna [] cuando la data no es un array", () => {
    expect(buildMemberRows(null)).toEqual([]);
    expect(buildMemberRows(undefined)).toEqual([]);
    expect(buildMemberRows({})).toEqual([]);
  });

  it("mapea cada miembro a la forma que consume la tabla", () => {
    const [row] = buildMemberRows([member]);
    expect(row).toMatchObject({
      name: "Ada Lovelace",
      email: "ada@test.com",
      phone: "+1-555-0100",
      member_id: 7,
      key: 7,
      entireData: member,
    });
  });

  it("compone la dirección desde las partes cuando no hay address", () => {
    const [row] = buildMemberRows([member]);
    expect(row.address).toContain("123 Main St");
    expect(row.address).toContain("London");
    expect(row.address).toContain("NY");
    expect(row.address).toContain("10001");
  });

  it("prefiere el campo address explícito si existe", () => {
    const [row] = buildMemberRows([{ ...member, address: "Explicit Addr" }]);
    expect(row.address).toBe("Explicit Addr");
  });

  it("usa phone cuando phone_number está ausente", () => {
    const [row] = buildMemberRows([
      { ...member, phone_number: undefined, phone: "555-9" },
    ]);
    expect(row.phone).toBe("555-9");
  });

  it("usa member_id como key", () => {
    const rows = buildMemberRows([
      { ...member, member_id: 1 },
      { ...member, member_id: 2 },
    ]);
    expect(rows.map((r) => r.key)).toEqual([1, 2]);
  });

  it("no lanza error con campos ausentes", () => {
    const rows = buildMemberRows([{ member_id: 9 }]);
    expect(rows).toHaveLength(1);
    expect(rows[0].key).toBe(9);
  });

  it("precomputa un _haystack en minúsculas", () => {
    const [row] = buildMemberRows([member]);
    expect(row._haystack).toContain("ada");
    expect(row._haystack).toBe(row._haystack.toLowerCase());
  });
});

// ─── filterMemberRows ─────────────────────────────────────────────────────────

const rows = buildMemberRows([
  { ...member, member_id: 1, first_name: "Ada", last_name: "Lovelace", email: "ada@test.com" },
  { ...member, member_id: 2, first_name: "Alan", last_name: "Turing", email: "alan@test.com" },
  { ...member, member_id: 3, first_name: "Grace", last_name: "Hopper", email: "grace@test.com" },
]);

describe("filterMemberRows", () => {
  it("retorna todas las filas cuando el término está vacío", () => {
    expect(filterMemberRows(rows, "")).toHaveLength(3);
    expect(filterMemberRows(rows, null)).toHaveLength(3);
    expect(filterMemberRows(rows, "   ")).toHaveLength(3);
  });

  it("filtra por nombre sin distinguir mayúsculas", () => {
    const result = filterMemberRows(rows, "TURING");
    expect(result).toHaveLength(1);
    expect(result[0].email).toBe("alan@test.com");
  });

  it("filtra por email", () => {
    const result = filterMemberRows(rows, "grace@test.com");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Grace Hopper");
  });

  it("recorta espacios del término de búsqueda", () => {
    expect(filterMemberRows(rows, "  hopper  ")).toHaveLength(1);
  });

  it("retorna [] cuando ninguna fila coincide", () => {
    expect(filterMemberRows(rows, "zzz-no-match")).toHaveLength(0);
  });
});
