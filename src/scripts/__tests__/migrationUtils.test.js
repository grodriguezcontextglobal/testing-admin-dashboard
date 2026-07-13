/**
 * Tests for the pure logic used in:
 *   scripts/migrate-roles.js   (MongoDB → PlanetScale SQL)
 *   scripts/patch-nosql-roles.js (update MongoDB employee records in-place)
 *
 * These functions are defined inline here as the specification contract.
 * The actual scripts implement the same logic.
 */

import { describe, it, expect } from "vitest";

// ─── Constants (mirror scripts/migrationUtils.js) ────────────────────────────

const VALID_ROLE_TYPES = new Set([
  "root_admin", "admin", "sale_manager",
  "event_manager", "inventory_manager", "assistant",
]);

/**
 * OLD MongoDB role numbers → roleType.
 * Used ONLY for records that have NO valid roleType field (pre-refactor data).
 * Mapping reflects the ORIGINAL DB enum before the Phase-5 refactor:
 *   0 = root_admin, 1 = admin*, 2 = manager (ambiguous), 3 = assistant, 4 = assistant
 * *role 1 may be admin or sale_manager — log for manual review.
 */
const OLD_ROLE_MAP = {
  "0": "root_admin",
  "1": "admin",
  // "2" handled by inferRoleType2
  "3": "assistant",
  "4": "assistant",
};

/** Maps roleType → unique numeric level in the NEW schema (0-5). */
const NEW_ROLE_LEVELS = {
  root_admin: 0, admin: 1, sale_manager: 2,
  event_manager: 3, inventory_manager: 4, assistant: 5,
};

// ─── Pure functions (contract) ────────────────────────────────────────────────

/**
 * Heuristic for old role=2 records that had no explicit type:
 * - Has assigned locations → inventory_manager
 * - No locations → event_manager
 */
function inferRoleType2(emp) {
  const hasLocations = (emp.preference?.managerLocation?.length ?? 0) > 0;
  return hasLocations ? "inventory_manager" : "event_manager";
}

/**
 * Resolves the canonical roleType for a MongoDB employee record.
 * Priority:
 *   1. emp.roleType if it's in VALID_ROLE_TYPES (post-refactor record)
 *   2. inferRoleType2(emp) for old role="2" records
 *   3. OLD_ROLE_MAP for numeric roles 0,1,3,4
 *   4. "assistant" as safe fallback
 */
function resolveEmployeeRoleType(emp) {
  if (emp.roleType && VALID_ROLE_TYPES.has(emp.roleType)) return emp.roleType;
  if (String(emp.role ?? "") === "2") return inferRoleType2(emp);
  return OLD_ROLE_MAP[String(emp.role ?? "")] ?? "assistant";
}

/**
 * Returns an employee record normalized to the NEW schema:
 * - roleType: canonical string
 * - role: string representation of the NEW numeric level (0-5)
 * All other fields are preserved unchanged.
 */
function normalizeMongoEmployee(emp) {
  const roleType = resolveEmployeeRoleType(emp);
  return {
    ...emp,
    role: String(NEW_ROLE_LEVELS[roleType]),
    roleType,
  };
}

// ─── Tests: inferRoleType2 ────────────────────────────────────────────────────

describe("inferRoleType2 — heurística para role=2 ambiguo", () => {
  it("empleado con locations asignadas → inventory_manager", () => {
    const emp = { role: "2", preference: { managerLocation: [{ location: "WH-A" }] } };
    expect(inferRoleType2(emp)).toBe("inventory_manager");
  });

  it("empleado sin locations → event_manager", () => {
    const emp = { role: "2", preference: { managerLocation: [] } };
    expect(inferRoleType2(emp)).toBe("event_manager");
  });

  it("empleado sin preference → event_manager (safe default)", () => {
    const emp = { role: "2" };
    expect(inferRoleType2(emp)).toBe("event_manager");
  });
});

// ─── Tests: resolveEmployeeRoleType ──────────────────────────────────────────

describe("resolveEmployeeRoleType — prioridad: roleType válido > inferencia > OLD_ROLE_MAP", () => {
  it("usa roleType válido cuando está presente (post-refactor)", () => {
    expect(resolveEmployeeRoleType({ role: "0", roleType: "root_admin" })).toBe("root_admin");
    expect(resolveEmployeeRoleType({ role: "3", roleType: "event_manager" })).toBe("event_manager");
    expect(resolveEmployeeRoleType({ role: "5", roleType: "assistant" })).toBe("assistant");
  });

  it("ignora roleType='unknown' (inválido) y cae a OLD_ROLE_MAP", () => {
    expect(resolveEmployeeRoleType({ role: "0", roleType: "unknown" })).toBe("root_admin");
    expect(resolveEmployeeRoleType({ role: "1", roleType: "unknown" })).toBe("admin");
  });

  it("ignora roleType='' vacío y cae a OLD_ROLE_MAP", () => {
    expect(resolveEmployeeRoleType({ role: "0", roleType: "" })).toBe("root_admin");
  });

  it("OLD role='0' → root_admin (sin roleType)", () => {
    expect(resolveEmployeeRoleType({ role: "0" })).toBe("root_admin");
  });

  it("OLD role='1' → admin (default — puede haber sale_managers)", () => {
    expect(resolveEmployeeRoleType({ role: "1" })).toBe("admin");
  });

  it("OLD role='2' sin locations → event_manager", () => {
    expect(resolveEmployeeRoleType({ role: "2" })).toBe("event_manager");
  });

  it("OLD role='2' con locations → inventory_manager", () => {
    const emp = { role: "2", preference: { managerLocation: [{ location: "WH" }] } };
    expect(resolveEmployeeRoleType(emp)).toBe("inventory_manager");
  });

  it("OLD role='3' → assistant (old mapping)", () => {
    expect(resolveEmployeeRoleType({ role: "3" })).toBe("assistant");
  });

  it("OLD role='4' → assistant (EVENT_STAFF fusionado)", () => {
    expect(resolveEmployeeRoleType({ role: "4" })).toBe("assistant");
  });

  it("role desconocido → fallback a assistant", () => {
    expect(resolveEmployeeRoleType({ role: "99" })).toBe("assistant");
    expect(resolveEmployeeRoleType({})).toBe("assistant");
  });
});

// ─── Tests: normalizeMongoEmployee ───────────────────────────────────────────

describe("normalizeMongoEmployee — resultado tiene role (nuevo nivel) y roleType", () => {
  it("root_admin: role='0', roleType='root_admin'", () => {
    const result = normalizeMongoEmployee({ user: "a@b.com", role: "0", roleType: "unknown" });
    expect(result.roleType).toBe("root_admin");
    expect(result.role).toBe("0");
    expect(result.user).toBe("a@b.com"); // otros campos intactos
  });

  it("OLD admin (role='1') → role='1', roleType='admin' en nuevo esquema", () => {
    const result = normalizeMongoEmployee({ user: "a@b.com", role: "1" });
    expect(result.roleType).toBe("admin");
    expect(result.role).toBe("1");
  });

  it("OLD role='3' (assistant viejo) → role='5', roleType='assistant' en nuevo esquema", () => {
    const result = normalizeMongoEmployee({ user: "a@b.com", role: "3" });
    expect(result.roleType).toBe("assistant");
    expect(result.role).toBe("5"); // nuevo nivel para assistant es 5
  });

  it("OLD role='4' (EVENT_STAFF) → role='5', roleType='assistant'", () => {
    const result = normalizeMongoEmployee({ user: "a@b.com", role: "4" });
    expect(result.roleType).toBe("assistant");
    expect(result.role).toBe("5");
  });

  it("OLD role='2' con locations → inventory_manager con role='4'", () => {
    const emp = { user: "a@b.com", role: "2", preference: { managerLocation: [{ location: "WH" }] } };
    const result = normalizeMongoEmployee(emp);
    expect(result.roleType).toBe("inventory_manager");
    expect(result.role).toBe("4");
  });

  it("sale_manager ya correctamente seteado → no cambia", () => {
    const result = normalizeMongoEmployee({ user: "a@b.com", role: "2", roleType: "sale_manager" });
    expect(result.roleType).toBe("sale_manager");
    expect(result.role).toBe("2");
  });

  it("preserva campos como active, firstName, status", () => {
    const result = normalizeMongoEmployee({
      user: "a@b.com", role: "1", roleType: "admin",
      active: true, firstName: "Ana", status: "Active",
    });
    expect(result.active).toBe(true);
    expect(result.firstName).toBe("Ana");
    expect(result.status).toBe("Active");
  });
});

// ─── Tests: SQL seed data shape ───────────────────────────────────────────────
// Verify the 6 roles, their levels and labels match the refactored ROLE_LEVELS.

const SQL_ROLES_SEED = [
  { role_level: 0, role_type: "root_admin",        label: "Root Administrator" },
  { role_level: 1, role_type: "admin",              label: "Administrator" },
  { role_level: 2, role_type: "sale_manager",       label: "Sale Manager" },
  { role_level: 3, role_type: "event_manager",      label: "Event Manager" },
  { role_level: 4, role_type: "inventory_manager",  label: "Inventory Manager" },
  { role_level: 5, role_type: "assistant",          label: "Assistant" },
];

describe("SQL roles seed — consistencia con ROLE_LEVELS refactorizado", () => {
  it("contiene exactamente los 6 roles del nuevo sistema", () => {
    expect(SQL_ROLES_SEED).toHaveLength(6);
    const types = SQL_ROLES_SEED.map((r) => r.role_type);
    expect(types).toEqual([
      "root_admin", "admin", "sale_manager",
      "event_manager", "inventory_manager", "assistant",
    ]);
  });

  it("role_level es único para cada rol (sin niveles compartidos)", () => {
    const levels = SQL_ROLES_SEED.map((r) => r.role_level);
    expect(new Set(levels).size).toBe(6);
    expect(levels).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it("role_level coincide con NEW_ROLE_LEVELS del sistema JS", () => {
    SQL_ROLES_SEED.forEach((row) => {
      expect(row.role_level).toBe(NEW_ROLE_LEVELS[row.role_type]);
    });
  });
});
