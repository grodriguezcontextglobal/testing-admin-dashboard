import { describe, it, expect } from "vitest";
import {
  ROLE_LABELS,
  getRoleLabel,
  isAssistant,
  isCoordinatorLevel,
  isNotAssistant,
} from "./roles";
import dicRole from "../components/general/dicRole";

// ─── ROLE_LABELS ──────────────────────────────────────────────────────────────

describe("ROLE_LABELS", () => {
  it("tiene una etiqueta para cada uno de los 6 roleTypes", () => {
    expect(ROLE_LABELS["root_admin"]).toBe("Root Administrator");
    expect(ROLE_LABELS["admin"]).toBe("Administrator");
    expect(ROLE_LABELS["sale_manager"]).toBe("Sale Manager");
    expect(ROLE_LABELS["event_manager"]).toBe("Event Manager");
    expect(ROLE_LABELS["inventory_manager"]).toBe("Inventory Manager");
    expect(ROLE_LABELS["assistant"]).toBe("Assistant");
  });
});

// ─── getRoleLabel ─────────────────────────────────────────────────────────────

describe("getRoleLabel", () => {
  it("retorna la etiqueta legible para cada roleType", () => {
    expect(getRoleLabel("root_admin")).toBe("Root Administrator");
    expect(getRoleLabel("sale_manager")).toBe("Sale Manager");
    expect(getRoleLabel("assistant")).toBe("Assistant");
  });

  it("retorna el roleType crudo si no hay etiqueta definida", () => {
    expect(getRoleLabel("unknown_role")).toBe("unknown_role");
  });

  it("retorna string vacío para undefined/null", () => {
    expect(getRoleLabel(undefined)).toBe("");
    expect(getRoleLabel(null)).toBe("");
  });
});

// ─── isCoordinatorLevel ───────────────────────────────────────────────────────

describe("isCoordinatorLevel", () => {
  it("retorna true para root_admin, admin y sale_manager (niveles 0-2)", () => {
    expect(isCoordinatorLevel("root_admin")).toBe(true);
    expect(isCoordinatorLevel("admin")).toBe(true);
    expect(isCoordinatorLevel("sale_manager")).toBe(true);
  });

  it("retorna false para event_manager, inventory_manager y assistant (niveles 3-5)", () => {
    expect(isCoordinatorLevel("event_manager")).toBe(false);
    expect(isCoordinatorLevel("inventory_manager")).toBe(false);
    expect(isCoordinatorLevel("assistant")).toBe(false);
  });

  it("retorna false para roleType desconocido", () => {
    expect(isCoordinatorLevel(undefined)).toBe(false);
    expect(isCoordinatorLevel(null)).toBe(false);
    expect(isCoordinatorLevel("super_hero")).toBe(false);
  });
});

// ─── isAssistant ──────────────────────────────────────────────────────────────

describe("isAssistant", () => {
  it("retorna true solo para assistant", () => {
    expect(isAssistant("assistant")).toBe(true);
  });

  it("retorna false para cualquier otro roleType", () => {
    expect(isAssistant("root_admin")).toBe(false);
    expect(isAssistant("event_manager")).toBe(false);
    expect(isAssistant("inventory_manager")).toBe(false);
    expect(isAssistant(undefined)).toBe(false);
  });
});

// ─── isNotAssistant ───────────────────────────────────────────────────────────

describe("isNotAssistant", () => {
  it("retorna true para todos los roles excepto assistant", () => {
    expect(isNotAssistant("root_admin")).toBe(true);
    expect(isNotAssistant("admin")).toBe(true);
    expect(isNotAssistant("sale_manager")).toBe(true);
    expect(isNotAssistant("event_manager")).toBe(true);
    expect(isNotAssistant("inventory_manager")).toBe(true);
  });

  it("retorna false para assistant", () => {
    expect(isNotAssistant("assistant")).toBe(false);
  });

  it("retorna true para roleType desconocido (safe default)", () => {
    expect(isNotAssistant(undefined)).toBe(true);
    expect(isNotAssistant(null)).toBe(true);
  });
});

// ─── dicRole — claves por roleType ────────────────────────────────────────────

describe("dicRole — soporte de claves roleType string", () => {
  it("resuelve los 6 roleType strings a etiquetas legibles", () => {
    expect(dicRole["root_admin"]).toBe("Root Administrator");
    expect(dicRole["admin"]).toBe("Administrator");
    expect(dicRole["sale_manager"]).toBe("Sale Manager");
    expect(dicRole["event_manager"]).toBe("Event Manager");
    expect(dicRole["inventory_manager"]).toBe("Inventory Manager");
    expect(dicRole["assistant"]).toBe("Assistant");
  });

  it("mantiene claves numéricas legacy para retrocompatibilidad", () => {
    expect(dicRole[0]).toBeTruthy();
    expect(dicRole[1]).toBeTruthy();
  });
});
