import { describe, expect, it } from "vitest";
import { employeeWithRoleType, resolveRoleType } from "./roles";

// GovRAMP code action #7 (FRONTEND_govramp_pending_2026-11-09.md, AC-6). Since
// the backend's 2026-11-04 batch, Company.employees[] entries save with
// roleType alone. An entry the dashboard writes carries roleType only: a
// stale numeric role next to it could contradict it.
describe("employeeWithRoleType", () => {
  it("sets roleType and drops the numeric role", () => {
    const entry = { user: "ana@x.com", role: "4", roleType: "inventory_manager", active: true };
    expect(employeeWithRoleType(entry, "admin")).toEqual({ user: "ana@x.com", roleType: "admin", active: true });
  });

  it("does not change the entry it was given", () => {
    const entry = { user: "ana@x.com", role: "4" };
    employeeWithRoleType(entry, "admin");
    expect(entry).toEqual({ user: "ana@x.com", role: "4" });
  });

  it("reads back as the role it was given", () => {
    expect(resolveRoleType(employeeWithRoleType({ role: "5" }, "event_manager"))).toBe("event_manager");
  });

  it("refuses a role type that does not exist", () => {
    expect(() => employeeWithRoleType({ role: "1" }, "3")).toThrow();
    expect(() => employeeWithRoleType({ role: "1" }, "superuser")).toThrow();
  });
});
