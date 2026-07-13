import { describe, it, expect } from "vitest";
import { LEGACY_ROLE_MAP } from "../../../../config/roles";
import {
  ALL_ROLE_OPTIONS,
  buildRoleOptions,
  buildEmployeeEntry,
  buildInvitationLink,
  newStaffSchema,
} from "./newStaffMemberUtils";

// ─── buildRoleOptions (filtro por nivel de permiso) ───────────────────────────

describe("buildRoleOptions", () => {
  it("root_admin (nivel 0) ve todos los roles", () => {
    expect(buildRoleOptions(0)).toHaveLength(ALL_ROLE_OPTIONS.length);
  });

  it("un nivel intermedio solo ve roles por debajo de él", () => {
    const options = buildRoleOptions(2);
    expect(options.every((o) => o.value > 2)).toBe(true);
    expect(options.map((o) => o.value)).toEqual([3, 4, 5]);
  });

  it("un nivel bajo no puede crear a nadie por encima", () => {
    expect(buildRoleOptions(5)).toEqual([]);
  });
});

// ─── buildEmployeeEntry ───────────────────────────────────────────────────────

describe("buildEmployeeEntry", () => {
  const entry = buildEmployeeEntry({
    name: "New",
    lastName: "Hire",
    email: "newhire@devitrak.com",
    role: 3,
  });

  it("marca el empleado como Pending y activo", () => {
    expect(entry.status).toBe("Pending");
    expect(entry.active).toBe(true);
    expect(entry.super_user).toBe(false);
  });

  it("guarda role como string y deriva el roleType correcto", () => {
    expect(entry.user).toBe("newhire@devitrak.com");
    expect(entry.role).toBe("3");
    expect(entry.roleType).toBe(LEGACY_ROLE_MAP[3]);
  });

  it("cae a 'assistant' cuando el role no mapea", () => {
    const unknown = buildEmployeeEntry({ name: "x", lastName: "y", email: "z@z.com", role: 99 });
    expect(unknown.roleType).toBe("assistant");
  });
});

// ─── buildInvitationLink ──────────────────────────────────────────────────────

describe("buildInvitationLink", () => {
  it("incluye los parámetros codificados", () => {
    const link = buildInvitationLink({
      name: "Ada Grace",
      lastName: "Lovelace",
      email: "ada@devitrak.com",
      company: "Dev & Co",
      companyId: "co-1",
      role: 3,
      roleType: "event_manager",
    });
    expect(link).toContain("first=Ada%20Grace");
    expect(link).toContain("email=ada%40devitrak.com");
    expect(link).toContain("answer=Dev%20%26%20Co");
    expect(link).toContain("roleType=event_manager");
    expect(link).toContain("company=co-1");
  });
});

// ─── newStaffSchema ───────────────────────────────────────────────────────────

describe("newStaffSchema", () => {
  it("exige email válido y role siempre", () => {
    expect(newStaffSchema.isValidSync({ email: "bad", role: 3 })).toBe(false);
    expect(newStaffSchema.isValidSync({ email: "ok@x.com", role: 3 })).toBe(true);
  });

  it("cuando needCreate=true exige name, lastName y phoneNumber", () => {
    const base = { email: "ok@x.com", role: 3 };
    expect(newStaffSchema.isValidSync(base, { context: { needCreate: true } })).toBe(false);
    expect(
      newStaffSchema.isValidSync(
        { ...base, name: "A", lastName: "B", phoneNumber: "123" },
        { context: { needCreate: true } },
      ),
    ).toBe(true);
  });
});
