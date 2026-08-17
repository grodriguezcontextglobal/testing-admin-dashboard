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
  const link = buildInvitationLink({
    name: "Ada Grace",
    lastName: "Lovelace",
    email: "ada@devitrak.com",
    company: "Dev & Co",
    companyId: "co-1",
  });

  it("incluye los parámetros codificados", () => {
    expect(link).toContain("first=Ada%20Grace");
    expect(link).toContain("last=Lovelace");
    expect(link).toContain("email=ada%40devitrak.com");
    expect(link).toContain("company=co-1");
    expect(link).toContain("company_name=Dev%20%26%20Co");
  });

  // El rol de la invitación vive en Company.employees y el backend lo lee de ahí.
  // Mientras viajó en el link, el invitado podía editar la URL y pedir
  // roleType=root_admin: la ruta de aceptación no lleva autenticación, así que
  // ese valor terminaba tal cual en company_staff, que es la fuente de verdad
  // del lado SQL. question/answer nunca los leyó ningún flujo.
  it("no lleva el rol ni la pregunta secreta", () => {
    expect(link).not.toContain("role=");
    expect(link).not.toContain("roleType=");
    expect(link).not.toContain("question=");
    expect(link).not.toContain("answer=");
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
