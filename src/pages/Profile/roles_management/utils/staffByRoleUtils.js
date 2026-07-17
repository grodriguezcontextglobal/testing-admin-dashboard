import {
  ROLE_LABEL_GROUPS,
  ROLE_LEVELS,
  getRoleLabelGroupKey,
  getRoleScopeDimension,
  resolveRoleType,
} from "../../../../config/roles";

// Scoped roles (Phase A) are not draggable/droppable in v1: staff holding one
// render locked, and scoped-role columns never accept drops. See
// FRONTEND_scoped_roles_phaseA_plan.md §0/§3.
const SCOPED_ROLE_LOCK_REASON = "Scoped roles are managed from the staff profile.";
const isScopedRoleGroup = (groupKey) => getRoleScopeDimension(groupKey) !== null;

/**
 * Pure helpers for the Roles-tab staff board. Grouping + guard-rail logic lives
 * here (under pages/**\/utils/**) so it is unit-coverable and the board
 * component stays thin. Nothing here mutates permissions.
 */

const GROUP_KEYS = new Set(Object.keys(ROLE_LABEL_GROUPS));

/**
 * Groups a company's employees array into { [groupKey]: employee[] }, keyed by
 * the ROLE_LABEL_GROUPS concept. Employees whose role resolves outside the 6
 * concepts land in an "unknown" bucket. Empty for null/non-array input.
 */
export const groupEmployeesByRoleConcept = (employees) => {
  if (!Array.isArray(employees)) return {};
  return employees.reduce((acc, emp) => {
    const resolved = getRoleLabelGroupKey(emp?.roleType ?? emp?.role);
    const bucket = GROUP_KEYS.has(resolved) ? resolved : "unknown";
    if (!acc[bucket]) acc[bucket] = [];
    acc[bucket].push(emp);
    return acc;
  }, {});
};

/**
 * Resolves the numeric level of an employee record (roleType first, numeric
 * role fallback). Returns 99 (lowest privilege) for anything unresolvable.
 */
const employeeLevel = (employee) => {
  const groupKey = getRoleLabelGroupKey(employee?.roleType ?? employee?.role);
  return ROLE_LEVELS[groupKey] ?? 99;
};

const employeeEmail = (employee) => employee?.user ?? employee?.email ?? null;

/**
 * Decides whether `actorUser` may move `targetEmployee` into role `toGroupKey`.
 * Returns { allowed: boolean, reason: string }.
 *
 * Mirrors UpdateRoleInCompany.jsx's optionsBasedOnCurrentRolePermission and
 * extends it with board-specific guards (self, owner, pending, same-role).
 */
export const canReassign = ({ actorUser, targetEmployee, toGroupKey }) => {
  const targetEmail = employeeEmail(targetEmployee);
  const ownerEmail = actorUser?.companyData?.owner?.email ?? null;

  // Self guard — nobody reassigns themselves from this board.
  if (targetEmail && actorUser?.email && targetEmail === actorUser.email) {
    return { allowed: false, reason: "You cannot change your own role." };
  }

  // Owner guard — the company owner's role is immutable here.
  if (ownerEmail && targetEmail && targetEmail === ownerEmail) {
    return {
      allowed: false,
      reason: "The company owner's role cannot be changed.",
    };
  }

  // Pending guard — invite not accepted yet (Pending status or no userId).
  if (targetEmployee?.status === "Pending" || !targetEmployee?.userId) {
    return {
      allowed: false,
      reason: "This member's invitation is still pending.",
    };
  }

  // Scoped-role guard (Phase A, v1 decision) — neither direction is allowed:
  // a staff member already holding a scoped role cannot be dragged out of it,
  // and no one can be dropped onto a scoped-role column. Checked before the
  // "unknown role" guard so a recognized scoped role gets this specific
  // message instead of "not recognized".
  const currentGroupKeyForScopeCheck = getRoleLabelGroupKey(
    targetEmployee?.roleType ?? targetEmployee?.role
  );
  if (
    isScopedRoleGroup(currentGroupKeyForScopeCheck) ||
    isScopedRoleGroup(toGroupKey)
  ) {
    return { allowed: false, reason: SCOPED_ROLE_LOCK_REASON };
  }

  // Unknown target role.
  if (!GROUP_KEYS.has(toGroupKey) || ROLE_LEVELS[toGroupKey] === undefined) {
    return { allowed: false, reason: "That role is not recognized." };
  }

  // Same-role no-op.
  const currentGroupKey = getRoleLabelGroupKey(
    targetEmployee?.roleType ?? targetEmployee?.role
  );
  if (currentGroupKey === toGroupKey) {
    return { allowed: false, reason: "This member already holds that role." };
  }

  const actorLevel = ROLE_LEVELS[resolveRoleType(actorUser)] ?? 99;

  // Root admin (level 0) can assign any role to anyone (self/owner already excluded).
  if (actorLevel === 0) {
    return { allowed: true, reason: "" };
  }

  // Non-root actors may only move employees strictly below them, and only TO
  // roles strictly below them.
  const targetLevel = employeeLevel(targetEmployee);
  const toLevel = ROLE_LEVELS[toGroupKey];
  if (targetLevel > actorLevel && toLevel > actorLevel) {
    return { allowed: true, reason: "" };
  }

  return {
    allowed: false,
    reason: "You do not have permission to change this member's role.",
  };
};

/**
 * Target-independent check for whether a row should even be draggable on the
 * board. Returns null when the row is movable, otherwise a reason string to
 * show in a tooltip (self / owner / pending / insufficient authority).
 */
export const getRowLockReason = ({ actorUser, targetEmployee }) => {
  const targetEmail = employeeEmail(targetEmployee);
  const ownerEmail = actorUser?.companyData?.owner?.email ?? null;

  if (targetEmail && actorUser?.email && targetEmail === actorUser.email) {
    return "You cannot change your own role.";
  }
  if (ownerEmail && targetEmail && targetEmail === ownerEmail) {
    return "The company owner's role cannot be changed.";
  }
  if (targetEmployee?.status === "Pending" || !targetEmployee?.userId) {
    return "This member's invitation is still pending.";
  }

  // Scoped-role guard (Phase A, v1 decision) — locked regardless of actor
  // level, including root_admin.
  const currentGroupKeyForScopeCheck = getRoleLabelGroupKey(
    targetEmployee?.roleType ?? targetEmployee?.role
  );
  if (isScopedRoleGroup(currentGroupKeyForScopeCheck)) {
    return SCOPED_ROLE_LOCK_REASON;
  }

  const actorLevel = ROLE_LEVELS[resolveRoleType(actorUser)] ?? 99;
  if (actorLevel === 0) return null;

  const targetLevel = employeeLevel(targetEmployee);
  if (targetLevel <= actorLevel) {
    return "You do not have permission to change this member's role.";
  }
  return null;
};
