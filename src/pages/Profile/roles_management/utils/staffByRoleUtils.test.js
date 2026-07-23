import { describe, it, expect } from "vitest";
import {
  groupEmployeesByRoleConcept,
  canReassign,
  getRowLockReason,
} from "./staffByRoleUtils";

const owner = {
  user: "owner@co.com",
  email: "owner@co.com",
  role: "0",
  roleType: "root_admin",
  status: "confirmed",
  userId: "u-owner",
  firstName: "Olivia",
  lastName: "Owner",
};

const admin = {
  user: "admin@co.com",
  email: "admin@co.com",
  role: "1",
  roleType: "admin",
  status: "confirmed",
  userId: "u-admin",
  firstName: "Adam",
  lastName: "Admin",
};

const assistant = {
  user: "assistant@co.com",
  email: "assistant@co.com",
  role: "5",
  roleType: "assistant",
  status: "confirmed",
  userId: "u-assist",
  firstName: "Ann",
  lastName: "Assist",
};

const pending = {
  user: "pending@co.com",
  email: "pending@co.com",
  role: "3",
  roleType: "event_manager",
  status: "Pending",
  userId: null,
  firstName: "Pat",
  lastName: "Pending",
};

// Employee carrying only a numeric-string role (pre-migration record, no roleType)
const numericOnly = {
  user: "legacy@co.com",
  email: "legacy@co.com",
  role: "4",
  status: "confirmed",
  userId: "u-legacy",
  firstName: "Lee",
  lastName: "Legacy",
};

const actorRoot = {
  email: "owner@co.com",
  roleType: "root_admin",
  companyData: { owner: { email: "owner@co.com" } },
};

// A root_admin actor who is NOT the owner
const actorRootNotOwner = {
  email: "root2@co.com",
  roleType: "root_admin",
  companyData: { owner: { email: "owner@co.com" } },
};

const actorEventManager = {
  email: "em@co.com",
  roleType: "event_manager", // level 3
  companyData: { owner: { email: "owner@co.com" } },
};

// A staff member holding one of the 4 new scoped roles (Phase A groundwork).
const scopedLocationManager = {
  user: "loc-mgr@co.com",
  email: "loc-mgr@co.com",
  role: null,
  roleType: "inventory_location_manager",
  status: "confirmed",
  userId: "u-locmgr",
  firstName: "Lena",
  lastName: "Locations",
};

describe("groupEmployeesByRoleConcept", () => {
  it("groups employees under their legacy role-concept key", () => {
    const grouped = groupEmployeesByRoleConcept([owner, admin, assistant]);
    expect(grouped.root_admin).toHaveLength(1);
    expect(grouped.admin).toHaveLength(1);
    expect(grouped.assistant).toHaveLength(1);
    expect(grouped.root_admin[0].user).toBe("owner@co.com");
  });

  it("resolves numeric-string role when roleType is absent", () => {
    const grouped = groupEmployeesByRoleConcept([numericOnly]);
    expect(grouped.inventory_manager).toHaveLength(1);
  });

  it("puts unresolvable roles in the 'unknown' bucket", () => {
    const grouped = groupEmployeesByRoleConcept([
      { user: "x@co.com", roleType: "not_a_role" },
    ]);
    expect(grouped.unknown).toHaveLength(1);
  });

  it("buckets a scoped role (Phase A) under its own group key, NOT 'unknown'", () => {
    const grouped = groupEmployeesByRoleConcept([scopedLocationManager]);
    expect(grouped.inventory_location_manager).toHaveLength(1);
    expect(grouped.unknown).toBeUndefined();
  });

  it("handles empty / non-array input", () => {
    expect(groupEmployeesByRoleConcept([])).toEqual({});
    expect(groupEmployeesByRoleConcept(null)).toEqual({});
    expect(groupEmployeesByRoleConcept(undefined)).toEqual({});
  });
});

describe("canReassign", () => {
  it("root_admin can move a normal employee to another role", () => {
    const result = canReassign({
      actorUser: actorRoot,
      targetEmployee: assistant,
      toGroupKey: "event_manager",
    });
    expect(result.allowed).toBe(true);
  });

  it("nobody can change their own role", () => {
    const result = canReassign({
      actorUser: actorRootNotOwner,
      targetEmployee: {
        ...admin,
        user: "root2@co.com",
        email: "root2@co.com",
      },
      toGroupKey: "assistant",
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/own role/i);
  });

  it("nobody can change the company owner's role", () => {
    const result = canReassign({
      actorUser: actorRootNotOwner,
      targetEmployee: owner,
      toGroupKey: "admin",
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/owner/i);
  });

  it("cannot move a member whose invite is still pending", () => {
    const result = canReassign({
      actorUser: actorRoot,
      targetEmployee: pending,
      toGroupKey: "assistant",
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/pending/i);
  });

  it("cannot move a member missing a userId (not accepted yet)", () => {
    const result = canReassign({
      actorUser: actorRoot,
      targetEmployee: { ...assistant, userId: null, status: "confirmed" },
      toGroupKey: "event_manager",
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/pending|accepted/i);
  });

  it("a non-root actor can only move employees strictly below them", () => {
    // event_manager (level 3) moving an assistant (level 5) -> allowed target level 5? must be > 3
    const okResult = canReassign({
      actorUser: actorEventManager,
      targetEmployee: assistant, // level 5 > 3
      toGroupKey: "inventory_manager", // level 4 > 3
    });
    expect(okResult.allowed).toBe(true);
  });

  it("a non-root actor cannot move an employee at or above their own level", () => {
    const result = canReassign({
      actorUser: actorEventManager, // level 3
      targetEmployee: admin, // level 1 (above actor)
      toGroupKey: "assistant",
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/permission|higher|level/i);
  });

  it("a non-root actor cannot move an employee TO a role at or above their level", () => {
    const result = canReassign({
      actorUser: actorEventManager, // level 3
      targetEmployee: assistant, // level 5 (below actor - ok)
      toGroupKey: "admin", // level 1 (above actor - not allowed)
    });
    expect(result.allowed).toBe(false);
  });

  it("rejects a drop onto the role the employee already holds", () => {
    const result = canReassign({
      actorUser: actorRoot,
      targetEmployee: assistant,
      toGroupKey: "assistant",
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/already/i);
  });

  it("rejects an unknown target role", () => {
    const result = canReassign({
      actorUser: actorRoot,
      targetEmployee: assistant,
      toGroupKey: "not_a_role",
    });
    expect(result.allowed).toBe(false);
  });

  // ── Scoped roles (Phase A) — v1 decision: not draggable/droppable ────────

  it("even root_admin cannot reassign a staff member who holds a scoped role", () => {
    const result = canReassign({
      actorUser: actorRoot,
      targetEmployee: scopedLocationManager,
      toGroupKey: "assistant",
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/scoped role/i);
  });

  it("even root_admin cannot drop a normal employee onto a scoped-role column", () => {
    const result = canReassign({
      actorUser: actorRoot,
      targetEmployee: assistant,
      toGroupKey: "category_manager",
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/scoped role/i);
  });
});

describe("getRowLockReason", () => {
  it("returns null for a movable employee (root actor)", () => {
    expect(
      getRowLockReason({ actorUser: actorRoot, targetEmployee: assistant })
    ).toBeNull();
  });

  it("locks self", () => {
    expect(
      getRowLockReason({
        actorUser: actorRootNotOwner,
        targetEmployee: {
          ...admin,
          user: "root2@co.com",
          email: "root2@co.com",
        },
      })
    ).toMatch(/own role/i);
  });

  it("locks the owner", () => {
    expect(
      getRowLockReason({ actorUser: actorRootNotOwner, targetEmployee: owner })
    ).toMatch(/owner/i);
  });

  it("locks pending members", () => {
    expect(
      getRowLockReason({ actorUser: actorRoot, targetEmployee: pending })
    ).toMatch(/pending/i);
  });

  it("locks employees at or above a non-root actor's level", () => {
    expect(
      getRowLockReason({ actorUser: actorEventManager, targetEmployee: admin })
    ).toMatch(/permission/i);
  });

  it("allows a non-root actor to move a lower employee", () => {
    expect(
      getRowLockReason({
        actorUser: actorEventManager,
        targetEmployee: assistant,
      })
    ).toBeNull();
  });

  it("locks a staff member holding a scoped role, even for root_admin", () => {
    expect(
      getRowLockReason({
        actorUser: actorRoot,
        targetEmployee: scopedLocationManager,
      })
    ).toMatch(/scoped role/i);
  });
});
