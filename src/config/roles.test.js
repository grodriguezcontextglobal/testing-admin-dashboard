import { describe, it, expect } from "vitest";
import {
  ROLE_TYPES,
  ROLE_LEVELS,
  PERMISSIONS,
  LEGACY_ROLE_MAP,
  ROLE_UPGRADE_MAP,
  hasPermission,
  resolveRoleType,
  getRoleLabel,
} from "./roles";

// ─── ROLE_TYPES ──────────────────────────────────────────────────────────────

describe("ROLE_TYPES", () => {
  it("exports los 6 tipos de rol como strings", () => {
    expect(ROLE_TYPES.ROOT_ADMIN).toBe("root_admin");
    expect(ROLE_TYPES.ADMIN).toBe("admin");
    expect(ROLE_TYPES.SALE_MANAGER).toBe("sale_manager");
    expect(ROLE_TYPES.EVENT_MANAGER).toBe("event_manager");
    expect(ROLE_TYPES.INVENTORY_MANAGER).toBe("inventory_manager");
    expect(ROLE_TYPES.ASSISTANT).toBe("assistant");
  });
});

// ─── ROLE_LEVELS ─────────────────────────────────────────────────────────────

describe("ROLE_LEVELS", () => {
  it("cada rol tiene un nivel numérico único (0-5)", () => {
    expect(ROLE_LEVELS["root_admin"]).toBe(0);
    expect(ROLE_LEVELS["admin"]).toBe(1);
    expect(ROLE_LEVELS["sale_manager"]).toBe(2);
    expect(ROLE_LEVELS["event_manager"]).toBe(3);
    expect(ROLE_LEVELS["inventory_manager"]).toBe(4);
    expect(ROLE_LEVELS["assistant"]).toBe(5);
  });

  it("los 6 roles originales tienen niveles distintos entre sí", () => {
    const originalRoles = ["root_admin", "admin", "sale_manager", "event_manager", "inventory_manager", "assistant"];
    const levels = originalRoles.map((r) => ROLE_LEVELS[r]);
    expect(new Set(levels).size).toBe(levels.length);
  });
});

// ─── PERMISSIONS — acceso completo (root_admin + admin) ──────────────────────

const ADMIN_ROLES = ["root_admin", "admin"];
const ALL_DOMAINS_ACTIONS = [
  "staff:create", "staff:read", "staff:update", "staff:delete",
  "inventory:create", "inventory:read", "inventory:update", "inventory:delete",
  "event:create", "event:read", "event:update", "event:delete",
  "consumer:create", "consumer:read", "consumer:update", "consumer:delete",
  "transaction:create", "transaction:read", "transaction:update", "transaction:delete",
  "location:create", "location:read", "location:update", "location:delete",
  "post:create", "post:read", "post:update", "post:delete",
];

describe("PERMISSIONS — root_admin y admin tienen CRUD en todos los dominios", () => {
  ADMIN_ROLES.forEach((role) => {
    ALL_DOMAINS_ACTIONS.forEach((action) => {
      it(`${role} puede ${action}`, () => {
        expect(PERMISSIONS[action]).toContain(role);
      });
    });
  });
});

// ─── PERMISSIONS — sale_manager ──────────────────────────────────────────────
// Solo Read + Update en inventory y events. Sin acceso a otros dominios.

describe("PERMISSIONS — sale_manager (RU inventory + events)", () => {
  const allowed = [
    "event:read", "event:update",
    "inventory:read", "inventory:update",
  ];
  const denied = [
    "event:create", "event:delete",
    "inventory:create", "inventory:delete",
    "consumer:create", "consumer:read", "consumer:update", "consumer:delete",
    "transaction:create", "transaction:read", "transaction:update", "transaction:delete",
    "location:create", "location:read", "location:update", "location:delete",
    "staff:create", "staff:update", "staff:delete",
    "post:create", "post:read", "post:update", "post:delete",
    "profile:billing",
  ];

  allowed.forEach((action) => {
    it(`puede ${action}`, () => {
      expect(PERMISSIONS[action]).toContain("sale_manager");
    });
  });

  denied.forEach((action) => {
    it(`no puede ${action}`, () => {
      expect(PERMISSIONS[action]).not.toContain("sale_manager");
    });
  });
});

// ─── PERMISSIONS — event_manager ─────────────────────────────────────────────
// CRUD en events, consumers, transactions, posts. Sin inventory/locations/staff.

describe("PERMISSIONS — event_manager", () => {
  const allowed = [
    "event:create", "event:read", "event:update", "event:delete",
    "consumer:create", "consumer:read", "consumer:update", "consumer:delete",
    "transaction:create", "transaction:read", "transaction:update", "transaction:delete",
    "post:create", "post:read", "post:update", "post:delete",
  ];
  const denied = [
    "inventory:create", "inventory:read", "inventory:update", "inventory:delete",
    "location:create", "location:read", "location:update", "location:delete",
    "staff:create", "staff:update", "staff:delete",
    "profile:billing",
  ];

  allowed.forEach((action) => {
    it(`puede ${action}`, () => {
      expect(PERMISSIONS[action]).toContain("event_manager");
    });
  });

  denied.forEach((action) => {
    it(`no puede ${action}`, () => {
      expect(PERMISSIONS[action]).not.toContain("event_manager");
    });
  });
});

// ─── PERMISSIONS — inventory_manager ─────────────────────────────────────────
// CRUD en inventory, locations, posts. Sin events/consumers/transactions/staff.

describe("PERMISSIONS — inventory_manager", () => {
  const allowed = [
    "inventory:create", "inventory:read", "inventory:update", "inventory:delete",
    "location:create", "location:read", "location:update", "location:delete",
    "post:create", "post:read", "post:update", "post:delete",
  ];
  const denied = [
    "event:create", "event:read", "event:update", "event:delete",
    "consumer:create", "consumer:read", "consumer:update", "consumer:delete",
    "transaction:create", "transaction:read", "transaction:update", "transaction:delete",
    "staff:create", "staff:update", "staff:delete",
    "profile:billing",
  ];

  allowed.forEach((action) => {
    it(`puede ${action}`, () => {
      expect(PERMISSIONS[action]).toContain("inventory_manager");
    });
  });

  denied.forEach((action) => {
    it(`no puede ${action}`, () => {
      expect(PERMISSIONS[action]).not.toContain("inventory_manager");
    });
  });
});

// ─── PERMISSIONS — assistant ─────────────────────────────────────────────────
// CRU (sin delete) en events, consumers, transactions. Sin inventory/staff/posts.

describe("PERMISSIONS — assistant", () => {
  const allowed = [
    "event:create", "event:read", "event:update",
    "consumer:create", "consumer:read", "consumer:update",
    "transaction:create", "transaction:read", "transaction:update",
  ];
  const denied = [
    "event:delete",
    "consumer:delete",
    "transaction:delete",
    "inventory:create", "inventory:read", "inventory:update", "inventory:delete",
    "location:create", "location:read",
    "staff:create", "staff:update", "staff:delete",
    "post:create", "post:read",
    "profile:billing",
  ];

  allowed.forEach((action) => {
    it(`puede ${action}`, () => {
      expect(PERMISSIONS[action]).toContain("assistant");
    });
  });

  denied.forEach((action) => {
    it(`no puede ${action}`, () => {
      expect(PERMISSIONS[action]).not.toContain("assistant");
    });
  });
});

// ─── PERMISSIONS — staff:update_contact y reset_password (ALL_ROLES) ─────────

describe("PERMISSIONS — staff:update_contact y staff:reset_password", () => {
  it("todos los roles pueden actualizar su propio contacto", () => {
    ["root_admin", "admin", "sale_manager", "event_manager", "inventory_manager", "assistant"].forEach((role) => {
      expect(hasPermission("staff:update_contact", role)).toBe(true);
    });
  });

  it("todos los roles pueden solicitar reset de contraseña", () => {
    ["root_admin", "admin", "sale_manager", "event_manager", "inventory_manager", "assistant"].forEach((role) => {
      expect(hasPermission("staff:reset_password", role)).toBe(true);
    });
  });
});

// ─── resolveRoleType ─────────────────────────────────────────────────────────

describe("resolveRoleType(user)", () => {
  it("retorna roleType explícito cuando es válido", () => {
    expect(resolveRoleType({ role: "0", roleType: "root_admin" })).toBe("root_admin");
    expect(resolveRoleType({ role: "1", roleType: "admin" })).toBe("admin");
    expect(resolveRoleType({ role: "3", roleType: "event_manager" })).toBe("event_manager");
  });

  it("hace fallback a LEGACY_ROLE_MAP cuando roleType está ausente", () => {
    expect(resolveRoleType({ role: "0" })).toBe("root_admin");
    expect(resolveRoleType({ role: "1" })).toBe("admin");
    expect(resolveRoleType({ role: "4" })).toBe("inventory_manager");
    expect(resolveRoleType({ role: "5" })).toBe("assistant");
  });

  it("hace fallback a LEGACY_ROLE_MAP cuando roleType es inválido ('unknown')", () => {
    expect(resolveRoleType({ role: "3", roleType: "unknown" })).toBe("event_manager");
    expect(resolveRoleType({ role: "0", roleType: "unknown" })).toBe("root_admin");
  });

  it("retorna 'assistant' como fallback seguro cuando no hay información", () => {
    expect(resolveRoleType({})).toBe("assistant");
    expect(resolveRoleType(null)).toBe("assistant");
    expect(resolveRoleType(undefined)).toBe("assistant");
    expect(resolveRoleType({ role: "99" })).toBe("assistant");
  });

  it("maneja strings numéricos y números en role", () => {
    expect(resolveRoleType({ role: 0 })).toBe("root_admin");
    expect(resolveRoleType({ role: "2" })).toBe("sale_manager");
  });
});

// ─── hasPermission ────────────────────────────────────────────────────────────

describe("hasPermission(action, roleType)", () => {
  it("retorna true cuando el roleType está en la lista", () => {
    expect(hasPermission("inventory:create", "root_admin")).toBe(true);
    expect(hasPermission("inventory:create", "inventory_manager")).toBe(true);
    expect(hasPermission("event:create", "event_manager")).toBe(true);
    expect(hasPermission("event:create", "assistant")).toBe(true);
    expect(hasPermission("transaction:create", "assistant")).toBe(true);
    expect(hasPermission("inventory:read", "sale_manager")).toBe(true);
    expect(hasPermission("event:read", "sale_manager")).toBe(true);
    expect(hasPermission("post:create", "event_manager")).toBe(true);
    expect(hasPermission("post:create", "inventory_manager")).toBe(true);
  });

  it("retorna false cuando el roleType no tiene permiso", () => {
    expect(hasPermission("inventory:create", "event_manager")).toBe(false);
    expect(hasPermission("inventory:create", "assistant")).toBe(false);
    expect(hasPermission("event:create", "inventory_manager")).toBe(false);
    expect(hasPermission("staff:create", "assistant")).toBe(false);
    expect(hasPermission("event:create", "sale_manager")).toBe(false);
    expect(hasPermission("consumer:create", "sale_manager")).toBe(false);
    expect(hasPermission("event:delete", "assistant")).toBe(false);
    expect(hasPermission("transaction:delete", "assistant")).toBe(false);
    expect(hasPermission("post:create", "sale_manager")).toBe(false);
    expect(hasPermission("post:create", "assistant")).toBe(false);
  });

  it("retorna false para acción desconocida", () => {
    expect(hasPermission("unknown:action", "root_admin")).toBe(false);
  });

  it("retorna false para roleType desconocido", () => {
    expect(hasPermission("inventory:create", "super_hero")).toBe(false);
  });

  it("retorna false si action o roleType son undefined/null", () => {
    expect(hasPermission(undefined, "root_admin")).toBe(false);
    expect(hasPermission("inventory:create", undefined)).toBe(false);
    expect(hasPermission(null, null)).toBe(false);
  });
});

// ─── F-01: ROLE_TYPES — nuevos constants ─────────────────────────────────────

describe("F-01 — ROLE_TYPES: guard backward compat", () => {
  it("los 6 roleType originales siguen presentes sin modificación", () => {
    expect(ROLE_TYPES.ROOT_ADMIN).toBe("root_admin");
    expect(ROLE_TYPES.ADMIN).toBe("admin");
    expect(ROLE_TYPES.SALE_MANAGER).toBe("sale_manager");
    expect(ROLE_TYPES.EVENT_MANAGER).toBe("event_manager");
    expect(ROLE_TYPES.INVENTORY_MANAGER).toBe("inventory_manager");
    expect(ROLE_TYPES.ASSISTANT).toBe("assistant");
  });
});

describe("F-01 — ROLE_TYPES: nuevos roleType strings", () => {
  it("incluye root_administrator", () => {
    expect(ROLE_TYPES.ROOT_ADMINISTRATOR).toBe("root_administrator");
  });
  it("incluye sales_associate", () => {
    expect(ROLE_TYPES.SALES_ASSOCIATE).toBe("sales_associate");
  });
  it("incluye manager_event", () => {
    expect(ROLE_TYPES.MANAGER_EVENT).toBe("manager_event");
  });
  it("incluye manager_inventory", () => {
    expect(ROLE_TYPES.MANAGER_INVENTORY).toBe("manager_inventory");
  });
  it("incluye associate_inventory", () => {
    expect(ROLE_TYPES.ASSOCIATE_INVENTORY).toBe("associate_inventory");
  });
  it("incluye event_assistant", () => {
    expect(ROLE_TYPES.EVENT_ASSISTANT).toBe("event_assistant");
  });
});

// ─── F-01: ROLE_LEVELS — nuevos strings tienen nivel ─────────────────────────

describe("F-01 — ROLE_LEVELS: niveles para nuevos roleType strings", () => {
  it("root_administrator tiene nivel 0", () => {
    expect(ROLE_LEVELS["root_administrator"]).toBe(0);
  });
  it("sales_associate tiene nivel 2", () => {
    expect(ROLE_LEVELS["sales_associate"]).toBe(2);
  });
  it("manager_event tiene nivel 3", () => {
    expect(ROLE_LEVELS["manager_event"]).toBe(3);
  });
  it("manager_inventory tiene nivel 4", () => {
    expect(ROLE_LEVELS["manager_inventory"]).toBe(4);
  });
  it("associate_inventory tiene nivel 5", () => {
    expect(ROLE_LEVELS["associate_inventory"]).toBe(5);
  });
  it("event_assistant tiene nivel 6", () => {
    expect(ROLE_LEVELS["event_assistant"]).toBe(6);
  });
  it("los niveles originales no cambian", () => {
    expect(ROLE_LEVELS["root_admin"]).toBe(0);
    expect(ROLE_LEVELS["admin"]).toBe(1);
    expect(ROLE_LEVELS["sale_manager"]).toBe(2);
    expect(ROLE_LEVELS["event_manager"]).toBe(3);
    expect(ROLE_LEVELS["inventory_manager"]).toBe(4);
    expect(ROLE_LEVELS["assistant"]).toBe(5);
  });
});

// ─── F-01: ROLE_UPGRADE_MAP ───────────────────────────────────────────────────

describe("F-01 — ROLE_UPGRADE_MAP: mapeo legacy string → nuevo string", () => {
  it("exporta ROLE_UPGRADE_MAP", () => {
    expect(ROLE_UPGRADE_MAP).toBeDefined();
    expect(typeof ROLE_UPGRADE_MAP).toBe("object");
  });
  it("root_admin → root_administrator", () => {
    expect(ROLE_UPGRADE_MAP["root_admin"]).toBe("root_administrator");
  });
  it("admin → admin (sin cambio)", () => {
    expect(ROLE_UPGRADE_MAP["admin"]).toBe("admin");
  });
  it("sale_manager → sales_associate", () => {
    expect(ROLE_UPGRADE_MAP["sale_manager"]).toBe("sales_associate");
  });
  it("event_manager → manager_event", () => {
    expect(ROLE_UPGRADE_MAP["event_manager"]).toBe("manager_event");
  });
  it("inventory_manager → manager_inventory", () => {
    expect(ROLE_UPGRADE_MAP["inventory_manager"]).toBe("manager_inventory");
  });
  it("assistant → associate_inventory", () => {
    expect(ROLE_UPGRADE_MAP["assistant"]).toBe("associate_inventory");
  });
  it("cubre todos los roleType legacy actuales", () => {
    const legacyRoles = ["root_admin", "admin", "sale_manager", "event_manager", "inventory_manager", "assistant"];
    legacyRoles.forEach((role) => {
      expect(ROLE_UPGRADE_MAP[role]).toBeDefined();
    });
  });
  it("LEGACY_ROLE_MAP numérico no cambia (backward compat de BD)", () => {
    expect(LEGACY_ROLE_MAP[0]).toBe("root_admin");
    expect(LEGACY_ROLE_MAP[1]).toBe("admin");
    expect(LEGACY_ROLE_MAP[2]).toBe("sale_manager");
    expect(LEGACY_ROLE_MAP[3]).toBe("event_manager");
    expect(LEGACY_ROLE_MAP[4]).toBe("inventory_manager");
    expect(LEGACY_ROLE_MAP[5]).toBe("assistant");
  });
});

// ─── F-01: PERMISSIONS — nuevas claves (arrays vacíos) ───────────────────────

const F01_MEMBER_ACTIONS = ["member:create", "member:read", "member:update", "member:delete"];
const F01_NAV_ACTIONS    = ["nav:members"];
const F01_QG_ACTIONS     = ["event:quickGlance_read", "event:quickGlance_update"];
const F01_STRIPE_ACTIONS = ["transaction:stripe_create", "transaction:stripe_read", "transaction:stripe_update"];
const F01_ALL_NEW_ACTIONS = [...F01_MEMBER_ACTIONS, ...F01_NAV_ACTIONS, ...F01_QG_ACTIONS, ...F01_STRIPE_ACTIONS];
const ALL_CURRENT_ROLES  = ["root_admin", "admin", "sale_manager", "event_manager", "inventory_manager", "assistant"];

describe("F-01 — PERMISSIONS: nuevas claves existen como arrays vacíos", () => {
  F01_ALL_NEW_ACTIONS.forEach((action) => {
    it(`"${action}" existe en PERMISSIONS y es array vacío`, () => {
      expect(PERMISSIONS[action]).toBeDefined();
      expect(Array.isArray(PERMISSIONS[action])).toBe(true);
      expect(PERMISSIONS[action]).toHaveLength(0);
    });
  });
});

describe("F-01 — PERMISSIONS: ningún rol actual tiene las nuevas acciones", () => {
  F01_ALL_NEW_ACTIONS.forEach((action) => {
    ALL_CURRENT_ROLES.forEach((role) => {
      it(`"${role}" no puede "${action}" en F-01`, () => {
        expect(hasPermission(action, role)).toBe(false);
      });
    });
  });
});

// ─── F-01: resolveRoleType — reconoce nuevos strings ─────────────────────────

describe("F-01 — resolveRoleType: reconoce nuevos roleType strings como válidos", () => {
  it("retorna root_administrator cuando roleType es 'root_administrator'", () => {
    expect(resolveRoleType({ roleType: "root_administrator" })).toBe("root_administrator");
  });
  it("retorna sales_associate cuando roleType es 'sales_associate'", () => {
    expect(resolveRoleType({ roleType: "sales_associate" })).toBe("sales_associate");
  });
  it("retorna manager_event cuando roleType es 'manager_event'", () => {
    expect(resolveRoleType({ roleType: "manager_event" })).toBe("manager_event");
  });
  it("retorna manager_inventory cuando roleType es 'manager_inventory'", () => {
    expect(resolveRoleType({ roleType: "manager_inventory" })).toBe("manager_inventory");
  });
  it("retorna associate_inventory cuando roleType es 'associate_inventory'", () => {
    expect(resolveRoleType({ roleType: "associate_inventory" })).toBe("associate_inventory");
  });
  it("retorna event_assistant cuando roleType es 'event_assistant'", () => {
    expect(resolveRoleType({ roleType: "event_assistant" })).toBe("event_assistant");
  });
  it("los roleType legacy siguen siendo válidos y se retornan sin modificación", () => {
    ALL_CURRENT_ROLES.forEach((role) => {
      expect(resolveRoleType({ roleType: role })).toBe(role);
    });
  });
});

// ─── F-01: getRoleLabel — etiquetas para nuevos roles ────────────────────────

describe("F-01 — getRoleLabel: etiquetas para nuevos roleType strings", () => {
  it("root_administrator → 'Root Administrator'", () => {
    expect(getRoleLabel("root_administrator")).toBe("Root Administrator");
  });
  it("sales_associate → 'Sales Associate'", () => {
    expect(getRoleLabel("sales_associate")).toBe("Sales Associate");
  });
  it("manager_event → 'Event Manager'", () => {
    expect(getRoleLabel("manager_event")).toBe("Event Manager");
  });
  it("manager_inventory → 'Inventory Manager'", () => {
    expect(getRoleLabel("manager_inventory")).toBe("Inventory Manager");
  });
  it("associate_inventory → 'Inventory Associate'", () => {
    expect(getRoleLabel("associate_inventory")).toBe("Inventory Associate");
  });
  it("event_assistant → 'Event Assistant'", () => {
    expect(getRoleLabel("event_assistant")).toBe("Event Assistant");
  });
  it("getRoleLabel para roles legacy no cambia", () => {
    expect(getRoleLabel("root_admin")).toBe("Root Administrator");
    expect(getRoleLabel("admin")).toBe("Administrator");
    expect(getRoleLabel("sale_manager")).toBe("Sale Manager");
    expect(getRoleLabel("event_manager")).toBe("Event Manager");
    expect(getRoleLabel("inventory_manager")).toBe("Inventory Manager");
    expect(getRoleLabel("assistant")).toBe("Assistant");
  });
});
