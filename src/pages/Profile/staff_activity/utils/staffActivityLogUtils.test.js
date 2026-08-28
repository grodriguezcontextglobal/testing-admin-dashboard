import { describe, it, expect } from "vitest";
import {
  ACTIVITY_LOG_ACTIONS,
  mapLogToListItem,
  filterLogsByHierarchy,
  buildActionFilterOptions,
  buildStaffFilterOptions,
} from "./staffActivityLogUtils";

const buildLog = (overrides = {}) => ({
  id: "log-1",
  staff_member_id: {
    _id: "staff-1",
    name: "Jane",
    lastName: "Doe",
    email: "jane@x.com",
    roleType: "admin",
  },
  company_id: "company-1",
  action: "LOGIN",
  target_model: "AdminUser",
  target_id: "staff-1",
  details: { email: "jane@x.com" },
  timestamp: "2026-08-05T12:04:41.000Z",
  ...overrides,
});

// ─── mapLogToListItem ─────────────────────────────────────────────────────────

describe("mapLogToListItem(log)", () => {
  it("separa quién actuó de lo que hizo, para que la lista muestre nombre y email", () => {
    const result = mapLogToListItem(buildLog());
    expect(result.staffName).toBe("Jane Doe");
    expect(result.staffEmail).toBe("jane@x.com");
    expect(result.actionTaken).toBe("LOGIN AdminUser");
  });

  it("cae al email de los detalles cuando el staff poblado no lo trae", () => {
    // El registro guarda `details.email` en el login; es la misma persona.
    const result = mapLogToListItem(
      buildLog({ staff_member_id: { _id: "staff-1", name: "Jane", lastName: "Doe" } })
    );
    expect(result.staffEmail).toBe("jane@x.com");
  });

  it("deja el email en null cuando nadie lo sabe, en vez de inventarlo", () => {
    const result = mapLogToListItem(
      buildLog({ staff_member_id: { _id: "s", name: "Jane" }, details: {} })
    );
    expect(result.staffEmail).toBeNull();
  });

  it("conserva el timestamp crudo en 'time' (Body.jsx ya lo formatea con new Date())", () => {
    const result = mapLogToListItem(buildLog());
    expect(result.time).toBe("2026-08-05T12:04:41.000Z");
  });

  it("conserva el id del log", () => {
    const result = mapLogToListItem(buildLog());
    expect(result.id).toBe("log-1");
  });

  it("usa 'Unknown staff' cuando staff_member_id viene null (staff eliminado)", () => {
    const result = mapLogToListItem(buildLog({ staff_member_id: null }));
    expect(result.staffName).toBe("Unknown staff");
    expect(result.actionTaken).toBe("LOGIN AdminUser");
  });
});

// ─── filterLogsByHierarchy ────────────────────────────────────────────────────

describe("filterLogsByHierarchy(logs, viewerRoleType, viewerId)", () => {
  it("admin ve su propia actividad y la de roles inferiores, no la de root_admin", () => {
    const logs = [
      buildLog({ id: "l-root", staff_member_id: { _id: "s-root", roleType: "root_admin" } }),
      buildLog({ id: "l-admin", staff_member_id: { _id: "s-admin", roleType: "admin" } }),
      buildLog({ id: "l-assistant", staff_member_id: { _id: "s-assistant", roleType: "assistant" } }),
    ];
    const result = filterLogsByHierarchy(logs, "admin", "s-admin");
    expect(result.map((log) => log.id)).toEqual(["l-admin", "l-assistant"]);
  });

  it("event_manager NO ve actividad de admin ni sale_manager, sí la de inventory_manager/assistant", () => {
    const logs = [
      buildLog({ id: "l-admin", staff_member_id: { _id: "s-admin", roleType: "admin" } }),
      buildLog({ id: "l-sale", staff_member_id: { _id: "s-sale", roleType: "sale_manager" } }),
      buildLog({ id: "l-event", staff_member_id: { _id: "s-event", roleType: "event_manager" } }),
      buildLog({ id: "l-inv", staff_member_id: { _id: "s-inv", roleType: "inventory_manager" } }),
    ];
    const result = filterLogsByHierarchy(logs, "event_manager", "s-event");
    expect(result.map((log) => log.id)).toEqual(["l-event", "l-inv"]);
  });

  it("un rol con scope (sin nivel) solo ve su propia actividad, aunque haya logs de roles inferiores", () => {
    const logs = [
      buildLog({ id: "l-self", staff_member_id: { _id: "s-cat", roleType: "category_manager" } }),
      buildLog({ id: "l-assistant", staff_member_id: { _id: "s-assistant", roleType: "assistant" } }),
    ];
    const result = filterLogsByHierarchy(logs, "category_manager", "s-cat");
    expect(result.map((log) => log.id)).toEqual(["l-self"]);
  });

  it("root_admin ve todo, incluidos los roles con scope", () => {
    const logs = [
      buildLog({ id: "l-admin", staff_member_id: { _id: "s-admin", roleType: "admin" } }),
      buildLog({ id: "l-cat", staff_member_id: { _id: "s-cat", roleType: "category_manager" } }),
    ];
    const result = filterLogsByHierarchy(logs, "root_admin", "s-root");
    expect(result.map((log) => log.id)).toEqual(["l-admin", "l-cat"]);
  });

  it("siempre incluye la propia actividad del viewer, aunque el log tenga el rol vacío/desconocido", () => {
    const logs = [buildLog({ id: "l-self", staff_member_id: { _id: "s-event", role: undefined } })];
    const result = filterLogsByHierarchy(logs, "event_manager", "s-event");
    expect(result.map((log) => log.id)).toEqual(["l-self"]);
  });

  it("retorna [] cuando logs no es un array", () => {
    expect(filterLogsByHierarchy(undefined, "admin", "s-admin")).toEqual([]);
    expect(filterLogsByHierarchy(null, "admin", "s-admin")).toEqual([]);
  });

  it("resuelve el rol legacy numérico del staff populado (mismo formato que /company/search-company)", () => {
    const logs = [
      buildLog({ id: "l-root", staff_member_id: { _id: "s-root", role: "0" } }),
      buildLog({ id: "l-assistant", staff_member_id: { _id: "s-assistant", role: "5" } }),
    ];
    const result = filterLogsByHierarchy(logs, "admin", "s-admin");
    expect(result.map((log) => log.id)).toEqual(["l-assistant"]);
  });
});

// ─── ACTIVITY_LOG_ACTIONS / buildActionFilterOptions ─────────────────────────

describe("ACTIVITY_LOG_ACTIONS / buildActionFilterOptions", () => {
  it("incluye los valores documentados por backend (FRONTEND_staff_activity_log.md)", () => {
    expect(ACTIVITY_LOG_ACTIONS).toEqual([
      "LOGIN",
      "LOGOUT",
      "FORCE_LOGOUT",
      "CREATE",
      "UPDATE",
      "DELETE",
      "ASSIGN",
      "UNASSIGN",
      "IMPORT",
      "EXPORT",
    ]);
  });

  it("buildActionFilterOptions genera pares {label, value} en el mismo orden", () => {
    const options = buildActionFilterOptions();
    expect(options[0]).toEqual({ label: "LOGIN", value: "LOGIN" });
    expect(options).toHaveLength(ACTIVITY_LOG_ACTIONS.length);
  });
});

// ─── buildStaffFilterOptions ──────────────────────────────────────────────────

describe("buildStaffFilterOptions(staffList, viewerRoleType, viewerId)", () => {
  const staffList = [
    { _id: "s-root", name: "Rita", lastName: "Root", roleType: "root_admin" },
    { _id: "s-admin", name: "Al", lastName: "Admin", roleType: "admin" },
    { _id: "s-assist", name: "Ann", lastName: "Assist", roleType: "assistant" },
  ];

  it("admin ve las opciones de admin y roles inferiores, no root_admin", () => {
    const options = buildStaffFilterOptions(staffList, "admin", "s-admin");
    expect(options.map((option) => option.value)).toEqual(["s-admin", "s-assist"]);
  });

  it("cada opción tiene label con nombre completo y value con el id del staff", () => {
    const options = buildStaffFilterOptions(staffList, "admin", "s-admin");
    expect(options[0]).toEqual({ label: "Al Admin", value: "s-admin" });
  });

  it("incluye siempre la propia entrada del viewer", () => {
    const options = buildStaffFilterOptions(staffList, "assistant", "s-assist");
    expect(options.map((option) => option.value)).toEqual(["s-assist"]);
  });

  it("retorna [] cuando staffList no es un array", () => {
    expect(buildStaffFilterOptions(undefined, "admin", "s-admin")).toEqual([]);
  });

  it("resuelve el rol legacy numérico (staffList real de /company/search-company usa role numérico)", () => {
    const numericStaffList = [
      { _id: "s-root", name: "Rita", lastName: "Root", role: "0" },
      { _id: "s-admin", name: "Al", lastName: "Admin", role: "1" },
      { _id: "s-assist", name: "Ann", lastName: "Assist", role: "5" },
    ];
    const options = buildStaffFilterOptions(numericStaffList, "admin", "s-admin");
    expect(options.map((option) => option.value)).toEqual(["s-admin", "s-assist"]);
  });
});
