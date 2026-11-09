import { legacyRoleType } from "../../../config/roles";

/**
 * Derives the roleType string from an employee record.
 *
 * Priority:
 * 1. Use employee.roleType if the backend already provides it (post-migration).
 * 2. Fall back to the legacy numeric role (legacyRoleType) (pre-migration).
 * 3. Default to "assistant" as the safest/lowest-privilege fallback.
 *
 * @param {Object|null} employeeInfo
 * @returns {string} roleType
 */
export const deriveRoleType = (employeeInfo) => {
  if (!employeeInfo) return "assistant";
  if (employeeInfo.roleType) return employeeInfo.roleType;
  return legacyRoleType(employeeInfo.role) ?? "assistant";
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
 * Safely extracts a single staff_id from a /db_staff/consulting-member response.
 * Handles both array and single-object `member` shapes.
 *
 * The SQL staff table can transiently hold duplicate rows for one email while
 * the server dedupes them. Resolution must be DETERMINISTIC and independent of
 * array ordering so every call site (login, role update, scope assign) picks
 * the SAME staff_id — otherwise a role/scope PATCH can target a different row
 * than the one login resolves. We keep only records that actually carry a
 * staff_id and choose the most recently created (newest created_at, falling
 * back to updated_at), which mirrors the previous "last element" behavior when
 * the response is already ordered ascending.
 *
 * @param {{ member: Array|Object }|null|undefined} memberApiData
 * @returns {number|null}
 */
export const extractStaffId = (memberApiData) => {
  if (!memberApiData) return null;
  const members = Array.isArray(memberApiData.member)
    ? memberApiData.member
    : memberApiData.member
      ? [memberApiData.member]
      : [];
  const withId = members.filter((m) => m?.staff_id != null);
  if (withId.length === 0) return null;
  const newest = withId.reduce((latest, current) => {
    const t = (rec) => Date.parse(rec?.created_at ?? rec?.updated_at ?? "") || 0;
    return t(current) >= t(latest) ? current : latest;
  });
  return newest.staff_id;
};

/**
 * Builds the setPermissions dispatch payload from an active company entry.
 * Works with both buildActiveCompaniesFromSQL output (SQL path) and
 * buildActiveCompanies output (legacy MongoDB path).
 *
 * @param {{ company, role, roleType, locations?, categories? }} activeCompany
 * @returns {{ role, roleType, companyName, locations, categories }}
 */
export const buildSetPermissionsPayload = ({ company, role, roleType, locations, categories }) => ({
  role,
  roleType,
  companyName: company,
  locations: locations ?? [],
  categories: categories ?? [],
});

/**
 * Maps the SQL /db_staff/companies response to the shape consumed by Login.jsx.
 * Locations are already normalized by the backend — no client-side transformation needed.
 *
 * Each company keeps its SQL `company_id` as `sqlCompanyId`: the company is
 * chosen by it, never by name (GovRAMP #4, AC-4). A row without a usable id
 * cannot be signed into, so it is left out.
 *
 * @param {Array|null|undefined} sqlCompanies
 * @returns {Array<{ company, sqlCompanyId, role, roleType, locations, categories }>}
 */
export const buildActiveCompaniesFromSQL = (sqlCompanies) => {
  if (!Array.isArray(sqlCompanies)) return [];
  return sqlCompanies
    .map((row) => ({ row, sqlCompanyId: toCompanyId(row.company_id) }))
    .filter(({ row, sqlCompanyId }) => row.company_name && sqlCompanyId !== null)
    .map(({ row: { company_name, role_level, roleType, locations, categories }, sqlCompanyId }) => ({
      company: company_name,
      sqlCompanyId,
      role: role_level,
      roleType,
      locations: locations ?? [],
      categories: categories ?? [],
    }));
};

/** A positive integer SQL company id, or null. */
const toCompanyId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 && String(value).trim() !== "" ? id : null;
};

/** The active company with this SQL id, or null. */
export const findActiveCompany = (activeCompanies, sqlCompanyId) => {
  const id = toCompanyId(sqlCompanyId);
  if (id === null || !Array.isArray(activeCompanies)) return null;
  return activeCompanies.find((company) => company.sqlCompanyId === id) ?? null;
};

/**
 * The row with this id from POST /db_company/consulting-company, which answers
 * either `companies: [...]` or `company: row | [row]`. Null when it is not
 * there: the session must never fall back to another company's row.
 */
export const pickCompanyRecord = (rawCompanies, sqlCompanyId) => {
  const id = toCompanyId(sqlCompanyId);
  if (id === null || !rawCompanies) return null;
  const rows = Array.isArray(rawCompanies)
    ? rawCompanies
    : [rawCompanies.company].flat().filter(Boolean);
  return rows.find((row) => toCompanyId(row?.company_id) === id) ?? null;
};

const SUPPORT_MESSAGE =
  "We could not tell which company account to open. Please contact support.";

const sameName = (a, b) =>
  String(a ?? "").trim().toLowerCase() === String(b ?? "").trim().toLowerCase();

/**
 * The Mongo company document (x-company-id) for the SQL company chosen.
 * Mongo documents carry no SQL id, so the name is the link here, and it must
 * be unambiguous:
 * - several documents with the name: the one where the account is an active
 *   employee; still several, it throws rather than guess;
 * - none with the name: the account's only document if it has exactly one
 *   (how a single-company sign-in always worked), else it throws.
 */
export const resolveMongoCompany = (mongoCompanies, { companyName, email }) => {
  const companies = Array.isArray(mongoCompanies) ? mongoCompanies.filter(Boolean) : [];
  const named = companies.filter((company) => sameName(company.company_name, companyName));
  if (named.length === 1) return named[0];
  if (named.length > 1) {
    const active = named.filter((company) =>
      (company.employees ?? []).some((employee) => employee?.user === email && employee?.active)
    );
    if (active.length === 1) return active[0];
    throw new Error(SUPPORT_MESSAGE);
  }
  if (companies.length === 1) return companies[0];
  throw new Error(SUPPORT_MESSAGE);
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
