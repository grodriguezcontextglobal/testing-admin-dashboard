import {
  ROLE_TYPES,
  isCompanyAdmin,
  legacyRoleType,
  resolveRoleType,
  roleLevelOf,
} from "../../../config/roles";

const KNOWN_ROLE_TYPES = new Set(Object.values(ROLE_TYPES));

/** Whether resolveRoleType can read the record, rather than defaulting it. */
const hasReadableRole = (record) =>
  KNOWN_ROLE_TYPES.has(record?.roleType) ||
  KNOWN_ROLE_TYPES.has(record?.role) ||
  legacyRoleType(record?.role) !== undefined;

/**
 * The role chip of a staff table row: which role it names, its colour and its
 * place in the sort, all from one resolveRoleType read.
 *
 * Root admin / Admin -> primary, Sales (level 2) -> info, everyone else ->
 * default. A role nobody can read is `roleType: null` (the table says
 * "Unknown") and sorts last, instead of passing for resolveRoleType's
 * "assistant" fallback.
 *
 * @param {{role?: unknown, roleType?: unknown}} record
 * @returns {{roleType: string|null, color: "primary"|"info"|"default", level: number}}
 */
export const staffRoleChip = (record) => {
  if (!hasReadableRole(record)) return { roleType: null, color: "default", level: 99 };
  const roleType = resolveRoleType(record);
  const level = roleLevelOf(record);
  const color = isCompanyAdmin(record) ? "primary" : level === 2 ? "info" : "default";
  return { roleType, color, level };
};
