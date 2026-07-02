/**
 * Single source of truth for the localStorage-backed session/auth headers and
 * the helpers used to persist, clear, and attach them to outgoing requests.
 *
 * Keeping every key and the route-scoping rules in one place avoids the drift
 * that happens when logout/cleanup sites forget about a header.
 */

// Every localStorage key that belongs to an authenticated session.
export const SESSION_STORAGE_KEYS = [
  "admin-token", // JWT (x-token)
  "sqlStaffId", // staff SQL id decoded from the JWT
  "s-token-lq", // staff member SQL id (attached on every request)
  "x-company-id", // Mongo ObjectId of the active company
  "s-company-lq", // SQL company_id of the active company
];

/**
 * Persists the company-scoped default headers at login time.
 * Values are coerced to strings; null/undefined/empty values are skipped so a
 * partial login never blanks out a previously stored value.
 *
 * @param {{ companyId?: string|number, companySqlId?: string|number }} values
 */
export const persistCompanyHeaders = ({ companyId, companySqlId } = {}) => {
  console.log("companyId", companyId);
  console.log("companySqlId", companySqlId);
  if (companyId != null && companyId !== "") {
    localStorage.setItem("x-company-id", String(companyId));
  }
  if (companySqlId != null && companySqlId !== "") {
    localStorage.setItem("s-company-lq", String(companySqlId));
  }
};

/** Removes every session/auth key from localStorage on logout. */
export const clearSessionStorage = () => {
  SESSION_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
};

/**
 * Builds the effective request path (baseURL pathname + url) used for route
 * matching. Mirrors axios' baseURL + url join (NOT URL resolution), so a
 * leading-slash url does not discard the baseURL suffix (e.g. /api/admin).
 *
 * @param {string} baseURL
 * @param {string} [url]
 * @returns {string}
 */
export const buildRequestPath = (baseURL = "", url = "") => {
  let basePath = "";
  try {
    basePath = new URL(baseURL).pathname;
  } catch {
    basePath = baseURL || "";
  }
  return `${basePath}${url || ""}`.replace(/\/{2,}/g, "/");
};

// x-company-id → /api/staff | /api/admin | /api/company | /api/stripe
const COMPANY_ID_ROUTE = /\/api\/(staff|admin|company|stripe)(\/|$)/;
// s-company-lq → any /api/db_* route
const COMPANY_SQL_ROUTE = /\/api\/db_/;

/**
 * Returns the route-scoped headers to merge onto a request, given its path and
 * the stored company values. Empty when nothing applies.
 *
 * @param {string} path                effective request path
 * @param {{ companyId?: string, companySqlId?: string }} values
 * @returns {Record<string,string>}
 */
export const buildRouteScopedHeaders = (
  path = "",
  { companyId, companySqlId } = {},
) => {
  const headers = {};
  if (companyId && COMPANY_ID_ROUTE.test(path)) {
    headers["x-company-id"] = companyId;
  }
  if (companySqlId && COMPANY_SQL_ROUTE.test(path)) {
    headers["s-company-lq"] = companySqlId;
  }
  return headers;
};
