import { LEGACY_ROLE_MAP } from "../../../config/roles";

/**
 * Derives the roleType string from an employee record.
 *
 * Priority:
 * 1. Use employee.roleType if the backend already provides it (post-migration).
 * 2. Fall back to LEGACY_ROLE_MAP keyed by numeric role (pre-migration).
 * 3. Default to "assistant" as the safest/lowest-privilege fallback.
 *
 * @param {Object|null} employeeInfo
 * @returns {string} roleType
 */
export const deriveRoleType = (employeeInfo) => {
  if (!employeeInfo) return "assistant";
  if (employeeInfo.roleType) return employeeInfo.roleType;
  const level = Number(employeeInfo.role ?? -1);
  return LEGACY_ROLE_MAP[level] ?? "assistant";
};

/**
 * Normalizes the legacy managerLocation array from NoSQL into the new
 * permissions-slice shape.
 *
 * Legacy:  [{ location, actions: { create, update, delete } }]
 * New:     [{ location_id, location, can_create, can_update, can_delete }]
 *
 * location_id is set to the location name until the backend provides SQL IDs.
 *
 * @param {Array|null|undefined} managerLocation
 * @returns {Array}
 */
export const normalizeLocations = (managerLocation) => {
  if (!Array.isArray(managerLocation)) return [];
  return managerLocation.map((loc) => ({
    location_id: loc.location,
    location: loc.location,
    can_create: loc.actions?.create ?? false,
    can_update: loc.actions?.update ?? false,
    can_delete: loc.actions?.delete ?? false,
  }));
};

/**
 * Builds the list of active company assignments for the logging-in user,
 * enriched with a derived roleType.
 *
 * Replaces the inline reduce inside processCompanyData in Login.jsx so the
 * logic is independently testable.
 *
 * @param {string} email
 * @param {Array}  companies  - Array of company documents from NoSQL
 * @returns {Array<{ company, role, roleType }>}
 */
export const buildActiveCompanies = (email, companies) => {
  return companies.reduce((acc, company) => {
    const empInfo = company.employees.find(
      (el) => el.user === email && el.active
    );
    if (empInfo) {
      acc.push({
        company: company.company_name,
        role: empInfo.role,
        roleType: deriveRoleType(empInfo),
      });
    }
    return acc;
  }, []);
};
