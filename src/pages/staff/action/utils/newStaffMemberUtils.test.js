import { describe, it, expect } from "vitest";
import { LEGACY_ROLE_MAP } from "../../../../config/roles";
import {
  ALL_ROLE_OPTIONS,
  buildRoleOptions,
  buildEmployeeEntry,
  buildInvitationLink,
  existingEmployeeMessage,
  findCompanyEmployee,
  newStaffSchema,
  roleHintFor,
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

// ─── roleHintFor ──────────────────────────────────────────────────────────────

describe("roleHintFor", () => {
  it("da una frase para cada rol que el selector puede ofrecer", () => {
    for (const option of ALL_ROLE_OPTIONS) {
      expect(roleHintFor(option.value)).toBeTruthy();
    }
  });

  it("describe el rol, no lo inventa", () => {
    // sale_manager es R/U en inventario y eventos, sin staff ni ubicaciones.
    expect(roleHintFor(2)).toMatch(/inventory and events/i);
    // assistant es CRU sin delete.
    expect(roleHintFor(5)).toMatch(/cannot delete/i);
  });

  it("no revienta con un rol desconocido", () => {
    expect(roleHintFor(99)).toBe(roleHintFor(5));
    expect(roleHintFor(undefined)).toBeTruthy();
  });
});

// ─── findCompanyEmployee ──────────────────────────────────────────────────────

describe("findCompanyEmployee", () => {
  const employees = [
    { user: "Ada@Devitrak.com", firstName: "Ada", lastName: "L", roleType: "event_manager", status: "Active" },
    { user: "bob@devitrak.com", firstName: "Bob", lastName: "M", roleType: "assistant", status: "Pending" },
  ];

  it("encuentra al empleado sin importar mayúsculas ni espacios", () => {
    expect(findCompanyEmployee(employees, "  ada@devitrak.com ")?.firstName).toBe("Ada");
  });

  it("devuelve null cuando el correo no está en la compañía", () => {
    expect(findCompanyEmployee(employees, "carol@devitrak.com")).toBeNull();
  });

  it("sobrevive a una lista ausente o a un correo vacío", () => {
    expect(findCompanyEmployee(undefined, "ada@devitrak.com")).toBeNull();
    expect(findCompanyEmployee(employees, "")).toBeNull();
  });
});

// ─── existingEmployeeMessage ──────────────────────────────────────────────────

describe("existingEmployeeMessage", () => {
  it("dice quién es y con qué rol ya está, para no invitar dos veces", () => {
    // El modal añadía una segunda entrada a company.employees sin mirar la
    // lista que ya tenía cargada, así que reinvitar duplicaba al empleado.
    const message = existingEmployeeMessage({
      user: "ada@devitrak.com",
      firstName: "Ada",
      lastName: "Lovelace",
      roleType: "event_manager",
      status: "Pending",
    });
    expect(message).toContain("Ada Lovelace");
    expect(message).toContain("Event Manager");
    expect(message).toContain("Pending");
  });

  it("cae al correo cuando la entrada no tiene nombre", () => {
    expect(existingEmployeeMessage({ user: "ada@devitrak.com" })).toContain(
      "ada@devitrak.com",
    );
  });
});

describe("newStaffSchema role field", () => {
  it("pide el rol con su propio mensaje cuando el selector está vacío", () => {
    // Sin el transform, "" se castea a NaN y yup responde con un error de tipo.
    try {
      newStaffSchema.validateSync({ email: "ok@x.com", role: "" });
      throw new Error("should not validate");
    } catch (error) {
      expect(error.message).toBe("Role is required");
    }
  });

  it("acepta el valor numérico que emite el selector", () => {
    expect(newStaffSchema.isValidSync({ email: "ok@x.com", role: 0 })).toBe(true);
  });
});

describe("newStaffSchema email field", () => {
  it("acepta un correo pegado con espacios y lo entrega recortado", () => {
    expect(newStaffSchema.isValidSync({ email: " ada@x.com ", role: 3 })).toBe(true);
    expect(newStaffSchema.cast({ email: " ada@x.com ", role: 3 }).email).toBe(
      "ada@x.com",
    );
  });

  it("sigue rechazando lo que no es un correo", () => {
    expect(newStaffSchema.isValidSync({ email: "ada@", role: 3 })).toBe(false);
  });
});
