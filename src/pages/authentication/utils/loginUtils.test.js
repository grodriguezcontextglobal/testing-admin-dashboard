import { describe, it, expect } from "vitest";
import {
  deriveRoleType,
  normalizeLocations,
  buildActiveCompanies,
  buildActiveCompaniesFromSQL,
  buildSetPermissionsPayload,
  extractStaffId,
} from "./loginUtils";

// ─── deriveRoleType ───────────────────────────────────────────────────────────

describe("deriveRoleType", () => {
  it("usa roleType explícito si el backend ya lo envía", () => {
    expect(deriveRoleType({ role: "1", roleType: "sale_manager" })).toBe("sale_manager");
    expect(deriveRoleType({ role: "2", roleType: "event_manager" })).toBe("event_manager");
  });

  it("mapea role '0' → 'root_admin'", () => {
    expect(deriveRoleType({ role: "0" })).toBe("root_admin");
    expect(deriveRoleType({ role: 0 })).toBe("root_admin");
  });

  it("mapea role '1' → 'admin' por defecto (sin roleType explícito)", () => {
    expect(deriveRoleType({ role: "1" })).toBe("admin");
    expect(deriveRoleType({ role: 1 })).toBe("admin");
  });

  it("mapea role '2' → 'sale_manager'", () => {
    expect(deriveRoleType({ role: "2" })).toBe("sale_manager");
    expect(deriveRoleType({ role: 2 })).toBe("sale_manager");
  });

  it("mapea role '3' → 'event_manager'", () => {
    expect(deriveRoleType({ role: "3" })).toBe("event_manager");
    expect(deriveRoleType({ role: 3 })).toBe("event_manager");
  });

  it("mapea role '4' → 'inventory_manager'", () => {
    expect(deriveRoleType({ role: "4" })).toBe("inventory_manager");
    expect(deriveRoleType({ role: 4 })).toBe("inventory_manager");
  });

  it("mapea role '5' → 'assistant'", () => {
    expect(deriveRoleType({ role: "5" })).toBe("assistant");
    expect(deriveRoleType({ role: 5 })).toBe("assistant");
  });

  it("retorna 'assistant' para role desconocido como fallback seguro", () => {
    expect(deriveRoleType({ role: "99" })).toBe("assistant");
    expect(deriveRoleType({})).toBe("assistant");
    expect(deriveRoleType(null)).toBe("assistant");
  });
});

// ─── normalizeLocations ───────────────────────────────────────────────────────

describe("normalizeLocations", () => {
  it("retorna [] para undefined o null", () => {
    expect(normalizeLocations(undefined)).toEqual([]);
    expect(normalizeLocations(null)).toEqual([]);
  });

  it("retorna [] para array vacío", () => {
    expect(normalizeLocations([])).toEqual([]);
  });

  it("convierte formato legacy {location, actions} al nuevo formato", () => {
    const input = [
      {
        location: "Warehouse A",
        actions: { create: true, update: true, delete: false },
      },
    ];
    const [result] = normalizeLocations(input);
    expect(result.location).toBe("Warehouse A");
    expect(result.location_id).toBe("Warehouse A");
    expect(result.can_create).toBe(true);
    expect(result.can_update).toBe(true);
    expect(result.can_delete).toBe(false);
  });

  it("maneja actions ausentes con defaults false", () => {
    const input = [{ location: "Dock B" }];
    const [result] = normalizeLocations(input);
    expect(result.can_create).toBe(false);
    expect(result.can_update).toBe(false);
    expect(result.can_delete).toBe(false);
  });

  it("convierte múltiples locations", () => {
    const input = [
      { location: "A", actions: { create: true, update: false, delete: false } },
      { location: "B", actions: { create: false, update: true, delete: true } },
    ];
    const result = normalizeLocations(input);
    expect(result).toHaveLength(2);
    expect(result[1].location).toBe("B");
    expect(result[1].can_update).toBe(true);
    expect(result[1].can_delete).toBe(true);
  });
});

// ─── buildActiveCompanies ─────────────────────────────────────────────────────

describe("buildActiveCompanies", () => {
  const companies = [
    {
      company_name: "Acme Corp",
      employees: [
        { user: "ana@test.com", role: "0", active: true },
        { user: "bob@test.com", role: "1", active: true },
        { user: "inactive@test.com", role: "2", active: false },
      ],
    },
    {
      company_name: "Globex",
      employees: [
        { user: "ana@test.com", role: "2", active: true },
      ],
    },
  ];

  it("retorna solo las empresas donde el email está activo", () => {
    const result = buildActiveCompanies("ana@test.com", companies);
    expect(result).toHaveLength(2);
    expect(result[0].company).toBe("Acme Corp");
    expect(result[1].company).toBe("Globex");
  });

  it("incluye roleType derivado en cada entrada", () => {
    const result = buildActiveCompanies("ana@test.com", companies);
    expect(result[0].roleType).toBe("root_admin");   // role "0" → root_admin
    expect(result[1].roleType).toBe("sale_manager");  // role "2" → sale_manager
  });

  it("excluye empleados inactivos", () => {
    const result = buildActiveCompanies("inactive@test.com", companies);
    expect(result).toHaveLength(0);
  });

  it("retorna [] si el email no existe en ninguna empresa", () => {
    const result = buildActiveCompanies("nobody@test.com", companies);
    expect(result).toEqual([]);
  });

  it("respeta roleType explícito si el empleado ya lo tiene", () => {
    const companiesWithRoleType = [
      {
        company_name: "Beta",
        employees: [
          { user: "mgr@test.com", role: "2", roleType: "event_manager", active: true },
        ],
      },
    ];
    const result = buildActiveCompanies("mgr@test.com", companiesWithRoleType);
    expect(result[0].roleType).toBe("event_manager");
  });
});

// ─── buildActiveCompaniesFromSQL ──────────────────────────────────────────────

describe("buildActiveCompaniesFromSQL", () => {
  const sqlCompanies = [
    {
      company_name: "Acme Corp",
      company_id: 1,
      roleType: "admin",
      role_level: 1,
      locations: [
        { location_id: 5, location: "Warehouse A", can_create: true, can_update: true, can_delete: false },
      ],
    },
    {
      company_name: "Globex",
      company_id: 2,
      roleType: "sale_manager",
      role_level: 2,
      locations: [],
    },
  ];

  it("retorna [] para null o undefined", () => {
    expect(buildActiveCompaniesFromSQL(null)).toEqual([]);
    expect(buildActiveCompaniesFromSQL(undefined)).toEqual([]);
  });

  it("retorna [] para array vacío", () => {
    expect(buildActiveCompaniesFromSQL([])).toEqual([]);
  });

  it("mapea company_name → company", () => {
    const result = buildActiveCompaniesFromSQL(sqlCompanies);
    expect(result[0].company).toBe("Acme Corp");
    expect(result[1].company).toBe("Globex");
  });

  it("preserva roleType y role_level del backend sin re-derivar", () => {
    const result = buildActiveCompaniesFromSQL(sqlCompanies);
    expect(result[0].roleType).toBe("admin");
    expect(result[0].role).toBe(1);
    expect(result[1].roleType).toBe("sale_manager");
    expect(result[1].role).toBe(2);
  });

  it("preserva locations[] ya normalizadas del backend", () => {
    const result = buildActiveCompaniesFromSQL(sqlCompanies);
    expect(result[0].locations).toHaveLength(1);
    expect(result[0].locations[0].location_id).toBe(5);
    expect(result[0].locations[0].can_create).toBe(true);
    expect(result[1].locations).toEqual([]);
  });

  it("usa [] para locations ausente en un registro", () => {
    const input = [{ company_name: "Solo", company_id: 3, roleType: "assistant", role_level: 5 }];
    const result = buildActiveCompaniesFromSQL(input);
    expect(result[0].locations).toEqual([]);
  });

  it("preserva categories[] del backend (scope de categoría)", () => {
    const input = [
      {
        company_name: "Cat Co",
        company_id: 4,
        roleType: "category_manager",
        role_level: 8,
        categories: [
          { category_id: 11, category_name: "Audio", can_create: true, can_update: true, can_delete: true },
        ],
      },
    ];
    const result = buildActiveCompaniesFromSQL(input);
    expect(result[0].categories).toHaveLength(1);
    expect(result[0].categories[0].category_id).toBe(11);
    expect(result[0].categories[0].category_name).toBe("Audio");
  });

  it("usa [] para categories ausente en un registro", () => {
    const input = [{ company_name: "Solo", company_id: 3, roleType: "assistant", role_level: 5 }];
    const result = buildActiveCompaniesFromSQL(input);
    expect(result[0].categories).toEqual([]);
  });
});

// ─── buildSetPermissionsPayload ───────────────────────────────────────────────

describe("buildSetPermissionsPayload", () => {
  const activeCompany = {
    company: "Acme Corp",
    role: 1,
    roleType: "admin",
    locations: [
      { location_id: 5, location: "Warehouse A", can_create: true, can_update: true, can_delete: false },
    ],
  };

  it("construye el payload correcto para el dispatch setPermissions", () => {
    const payload = buildSetPermissionsPayload(activeCompany);
    expect(payload.role).toBe(1);
    expect(payload.roleType).toBe("admin");
    expect(payload.companyName).toBe("Acme Corp");
    expect(payload.locations).toHaveLength(1);
  });

  it("usa locations: [] cuando el activeCompany no tiene locations", () => {
    const payload = buildSetPermissionsPayload({ company: "Beta", role: 5, roleType: "assistant" });
    expect(payload.locations).toEqual([]);
  });

  it("propaga categories y usa [] cuando están ausentes", () => {
    const withCats = buildSetPermissionsPayload({
      company: "Cat Co",
      role: 8,
      roleType: "category_manager",
      categories: [{ category_id: 11, category_name: "Audio" }],
    });
    expect(withCats.categories).toHaveLength(1);
    expect(withCats.categories[0].category_name).toBe("Audio");

    const without = buildSetPermissionsPayload({ company: "Beta", role: 5, roleType: "assistant" });
    expect(without.categories).toEqual([]);
  });

  it("preserva roleType del backend sin re-derivar", () => {
    const payload = buildSetPermissionsPayload({ ...activeCompany, roleType: "event_manager" });
    expect(payload.roleType).toBe("event_manager");
  });

  it("las locations preservan el shape exacto del slice (can_create, can_update, can_delete)", () => {
    const payload = buildSetPermissionsPayload(activeCompany);
    const [loc] = payload.locations;
    expect(loc).toEqual({ location_id: 5, location: "Warehouse A", can_create: true, can_update: true, can_delete: false });
  });
});

// ─── extractStaffId ───────────────────────────────────────────────────────────

describe("extractStaffId", () => {
  it("extrae staff_id del último elemento cuando member es array", () => {
    const data = { member: [{ staff_id: 7 }, { staff_id: 12 }] };
    expect(extractStaffId(data)).toBe(12);
  });

  it("extrae staff_id cuando member es objeto único", () => {
    const data = { member: { staff_id: 5 } };
    expect(extractStaffId(data)).toBe(5);
  });

  it("retorna null para null o undefined", () => {
    expect(extractStaffId(null)).toBeNull();
    expect(extractStaffId(undefined)).toBeNull();
  });

  it("retorna null si el member no tiene staff_id", () => {
    expect(extractStaffId({ member: [{ email: "x@x.com" }] })).toBeNull();
    expect(extractStaffId({ member: {} })).toBeNull();
  });

  it("retorna null para array vacío", () => {
    expect(extractStaffId({ member: [] })).toBeNull();
  });
});
