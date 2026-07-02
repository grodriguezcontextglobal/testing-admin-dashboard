import { describe, it, expect } from "vitest";
import { LEGACY_ROLE_MAP, ROLE_LEVELS, ROLE_LABELS, resolveRoleType } from "../../../config/roles";

// ─── Employee payload builder ────────────────────────────────────────────────
// Pure logic used in addEmployeeAndInvite (NewStaffMember) and
// handleSubmitNewRole (UpdateRoleInCompany).

const buildEmployeePayload = (existing, newRole) => ({
  ...existing,
  role: String(newRole),
  roleType: LEGACY_ROLE_MAP[Number(newRole)] ?? "assistant",
});

const buildNewEmployeePayload = ({ name, lastName, email, role }) => ({
  user: email,
  firstName: name,
  lastName,
  status: "Pending",
  super_user: false,
  role: String(role),
  roleType: LEGACY_ROLE_MAP[Number(role)] ?? "assistant",
  active: true,
});

// ─── Role options list ────────────────────────────────────────────────────────

const ALL_ROLE_OPTIONS = [
  { label: ROLE_LABELS.root_admin,         value: 0 },
  { label: ROLE_LABELS.admin,              value: 1 },
  { label: ROLE_LABELS.sale_manager,       value: 2 },
  { label: ROLE_LABELS.event_manager,      value: 3 },
  { label: ROLE_LABELS.inventory_manager,  value: 4 },
  { label: ROLE_LABELS.assistant,          value: 5 },
];

const filterOptionsByUser = (user) => {
  const userLevel = ROLE_LEVELS[resolveRoleType(user)] ?? 99;
  if (userLevel === 0) return ALL_ROLE_OPTIONS;
  return ALL_ROLE_OPTIONS.filter((o) => o.value > userLevel);
};

// ─── Tests: ALL_ROLE_OPTIONS ─────────────────────────────────────────────────

describe("ALL_ROLE_OPTIONS — lista completa de roles", () => {
  it("contiene los 6 roles (0–5 incluyendo assistant)", () => {
    expect(ALL_ROLE_OPTIONS).toHaveLength(6);
    expect(ALL_ROLE_OPTIONS.map((o) => o.value)).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it("labels son los correctos para cada rol", () => {
    expect(ALL_ROLE_OPTIONS[0].label).toBe("Root Administrator");
    expect(ALL_ROLE_OPTIONS[1].label).toBe("Administrator");
    expect(ALL_ROLE_OPTIONS[2].label).toBe("Sale Manager");
    expect(ALL_ROLE_OPTIONS[3].label).toBe("Event Manager");
    expect(ALL_ROLE_OPTIONS[4].label).toBe("Inventory Manager");
    expect(ALL_ROLE_OPTIONS[5].label).toBe("Assistant");
  });
});

// ─── Tests: filterOptionsByUser ───────────────────────────────────────────────

describe("filterOptionsByUser — opciones disponibles según nivel del usuario", () => {
  it("root_admin (nivel 0) puede asignar los 6 roles", () => {
    const opts = filterOptionsByUser({ roleType: "root_admin" });
    expect(opts).toHaveLength(6);
    expect(opts.map((o) => o.value)).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it("admin (nivel 1) puede asignar roles 2–5", () => {
    const opts = filterOptionsByUser({ roleType: "admin" });
    expect(opts.map((o) => o.value)).toEqual([2, 3, 4, 5]);
  });

  it("sale_manager (nivel 2) puede asignar roles 3–5", () => {
    const opts = filterOptionsByUser({ roleType: "sale_manager" });
    expect(opts.map((o) => o.value)).toEqual([3, 4, 5]);
  });

  it("event_manager (nivel 3) puede asignar roles 4–5", () => {
    const opts = filterOptionsByUser({ roleType: "event_manager" });
    expect(opts.map((o) => o.value)).toEqual([4, 5]);
  });

  it("roleType undefined → resolveRoleType fallback a LEGACY_ROLE_MAP", () => {
    // role:0 → root_admin → puede todos
    const opts = filterOptionsByUser({ role: "0", roleType: undefined });
    expect(opts).toHaveLength(6);
  });

  it("sin role ni roleType válido → assistant (nivel 5) → sin opciones disponibles", () => {
    const opts = filterOptionsByUser({ role: undefined, roleType: undefined });
    expect(opts).toHaveLength(0);
  });
});

// ─── Tests: buildNewEmployeePayload (NewStaffMember) ─────────────────────────

describe("buildNewEmployeePayload — nuevo empleado incluye roleType y active:true", () => {
  it("root_admin tiene roleType:'root_admin' y active:true (no false)", () => {
    const p = buildNewEmployeePayload({ name: "A", lastName: "B", email: "a@b.com", role: 0 });
    expect(p.roleType).toBe("root_admin");
    expect(p.active).toBe(true);
    expect(p.role).toBe("0");
  });

  it("admin tiene roleType:'admin' y active:true", () => {
    const p = buildNewEmployeePayload({ name: "A", lastName: "B", email: "a@b.com", role: 1 });
    expect(p.roleType).toBe("admin");
    expect(p.active).toBe(true);
  });

  it("sale_manager tiene roleType:'sale_manager'", () => {
    const p = buildNewEmployeePayload({ name: "A", lastName: "B", email: "a@b.com", role: 2 });
    expect(p.roleType).toBe("sale_manager");
  });

  it("event_manager tiene roleType:'event_manager'", () => {
    const p = buildNewEmployeePayload({ name: "A", lastName: "B", email: "a@b.com", role: 3 });
    expect(p.roleType).toBe("event_manager");
  });

  it("inventory_manager tiene roleType:'inventory_manager'", () => {
    const p = buildNewEmployeePayload({ name: "A", lastName: "B", email: "a@b.com", role: 4 });
    expect(p.roleType).toBe("inventory_manager");
  });

  it("assistant (role 5) tiene roleType:'assistant'", () => {
    const p = buildNewEmployeePayload({ name: "A", lastName: "B", email: "a@b.com", role: 5 });
    expect(p.roleType).toBe("assistant");
    expect(p.active).toBe(true);
  });

  it("role se almacena como string", () => {
    const p = buildNewEmployeePayload({ name: "A", lastName: "B", email: "a@b.com", role: 3 });
    expect(p.role).toBe("3");
    expect(typeof p.role).toBe("string");
  });
});

// ─── Tests: buildEmployeePayload (UpdateRoleInCompany) ───────────────────────

describe("buildEmployeePayload — actualización de rol incluye roleType", () => {
  it("actualizar de sale_manager a event_manager incluye el nuevo roleType", () => {
    const existing = { user: "a@b.com", role: "2", roleType: "sale_manager", active: true };
    const updated = buildEmployeePayload(existing, 3);
    expect(updated.role).toBe("3");
    expect(updated.roleType).toBe("event_manager");
    expect(updated.user).toBe("a@b.com");
    expect(updated.active).toBe(true);
  });

  it("actualizar a assistant asigna roleType:'assistant'", () => {
    const existing = { user: "a@b.com", role: "1", roleType: "admin" };
    const updated = buildEmployeePayload(existing, 5);
    expect(updated.roleType).toBe("assistant");
    expect(updated.role).toBe("5");
  });

  it("dispatch propio (onLogin) también actualiza roleType", () => {
    const currentUser = { email: "a@b.com", role: "0", roleType: "root_admin", company: "Acme" };
    const newRole = 1;
    const dispatched = {
      ...currentUser,
      role: String(newRole),
      roleType: LEGACY_ROLE_MAP[Number(newRole)] ?? "assistant",
    };
    expect(dispatched.roleType).toBe("admin");
    expect(dispatched.role).toBe("1");
    expect(dispatched.email).toBe("a@b.com");
    expect(dispatched.company).toBe("Acme");
  });
});
