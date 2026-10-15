import { describe, expect, it } from "vitest";

import { staffRoleChip } from "./staffRoleChip";

/* The staff table read the label from `roleType || role` as written, and the
   chip colour and the sort from resolveRoleType. With a roleType the app does
   not know, the label showed that raw string while the colour and the order
   came from the numeric role: one row, two different roles. */
describe("staffRoleChip", () => {
  it("label, colour and order come from the same role", () => {
    expect(staffRoleChip({ role: "1", roleType: "not_a_role" })).toEqual({
      roleType: "admin",
      color: "primary",
      level: 1,
    });
  });

  it("prefers a known roleType over the numeric role", () => {
    expect(staffRoleChip({ role: "5", roleType: "sale_manager" })).toEqual({
      roleType: "sale_manager",
      color: "info",
      level: 2,
    });
  });

  it("reads the legacy numeric role when there is no roleType", () => {
    expect(staffRoleChip({ role: 0 }).roleType).toBe("root_admin");
    expect(staffRoleChip({ role: "4" }).roleType).toBe("inventory_manager");
  });

  it("a scoped role keeps its name, goes last and is not coloured", () => {
    expect(staffRoleChip({ role: "category_manager", roleType: "category_manager" })).toEqual({
      roleType: "category_manager",
      color: "default",
      level: 99,
    });
  });

  /* resolveRoleType falls back to "assistant" for anything it cannot read.
     In a table that would name an unknown person an Assistant. */
  it("a role nobody can read says so instead of passing for an assistant", () => {
    for (const record of [{}, { role: "" }, { role: null }, { roleType: "nope", role: "x" }]) {
      expect(staffRoleChip(record)).toEqual({ roleType: null, color: "default", level: 99 });
    }
  });
});
