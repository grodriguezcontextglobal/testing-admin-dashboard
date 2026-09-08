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
  if (companyId != null && companyId !== "") {
    localStorage.setItem("x-company-id", String(companyId));
  }
  if (companySqlId != null && companySqlId !== "") {
    localStorage.setItem("s-company-lq", String(companySqlId));
  }
};

/**
 * Backfills the company headers from the persisted session when they are not in
 * localStorage yet, and only then.
 *
 * persistCompanyHeaders runs at login and at the multiple-companies switch —
 * the two moments the active company is chosen. Nothing else wrote these keys,
 * so a session that was already open when they were introduced (redux-persist
 * keeps `admin.status` authenticated across restarts, and nothing re-runs the
 * login flow) kept working while sending every request without them. For
 * /api/nodemailer that is invisible and expensive: the server resolves
 * Company.email_branding from x-company-id, so a missing header silently sends
 * Devitrak-branded mail on the client's behalf.
 *
 * Deliberately fills gaps only. An existing value belongs to whoever chose the
 * active company last, and the switch modal must not be undone by a later boot
 * reading a stale `companyData` out of the persisted session.
 *
 * @param {{ companyData?: { id?: string }, sqlInfo?: { company_id?: number|string } }} user
 *        the Redux `admin.user`
 * @returns {boolean} whether anything was written
 */
export const ensureCompanyHeaders = (user) => {
  const missing = {};
  if (!localStorage.getItem("x-company-id")) {
    missing.companyId = user?.companyData?.id;
  }
  if (!localStorage.getItem("s-company-lq")) {
    missing.companySqlId = user?.sqlInfo?.company_id;
  }
  const before = SESSION_STORAGE_KEYS.map((key) => localStorage.getItem(key)).join("|");
  persistCompanyHeaders(missing);
  return SESSION_STORAGE_KEYS.map((key) => localStorage.getItem(key)).join("|") !== before;
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

// x-company-id → /api/staff | /api/admin | /api/company | /api/stripe | /api/nodemailer
//
// nodemailer is here so notification emails can wear the company's own
// branding: the server resolves Company.email_branding from this header rather
// than from the payload, which lets all forty-odd notification call sites stay
// as they are. See server nodeMailer/branding.js#resolveBranding.
const COMPANY_ID_ROUTE = /\/api\/(staff|admin|company|stripe|nodemailer)(\/|$)/;
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
