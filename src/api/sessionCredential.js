import { jwtDecode } from "jwt-decode";
import { COOKIE_SESSION } from "../config/featureFlags";

/**
 * How a request proves the session (GovRAMP #12 · SC-23, AC-12; decision D6).
 *
 * Today the JWT sits in localStorage ("admin-token") and travels as x-token,
 * so any script running in the page can read it. The server's phase 1 sets it
 * in an HttpOnly cookie instead (backend reply 2026-11-04 §1.1):
 * - the cookie is set on /admin/login and GET /admin/renew, SameSite=Strict;
 * - the CSRF token comes in the login body and goes back as X-CSRF-Token on
 *   cookie-authenticated writes;
 * - x-token stays accepted until phase 3.
 *
 * VITE_APP_COOKIE_SESSION=true switches the client to it: requests go with
 * credentials and the CSRF token, and the token is no longer stored. Off by
 * default, and with it off nothing changes. Everything that reads or writes
 * the session token goes through this file.
 *
 * Still to confirm with the backend: CSRF_FIELD, the name of the field in the
 * login body, and that the body keeps the token (its expiry and sqlStaffId
 * tell App.jsx whether the session is still valid).
 */

export const TOKEN_KEY = "admin-token";
export const CSRF_KEY = "devitrak-csrf";
export const SESSION_CLAIMS_KEY = "devitrak-session";
export const CSRF_HEADER = "X-CSRF-Token";
/** To confirm with the backend: the CSRF token's field in the login body. */
export const CSRF_FIELD = "csrfToken";

const SAFE_METHODS = new Set(["get", "head", "options"]);

const defaults = (options = {}) => ({
  storage: options.storage ?? globalThis.localStorage,
  cookieSession: options.cookieSession ?? COOKIE_SESSION,
});

const read = (storage, key) => {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
};

/** The two claims the client needs from a token: when it ends, and who. */
const claimsFrom = (token) => {
  if (typeof token !== "string" || !token) return null;
  try {
    const { exp, sqlStaffId } = jwtDecode(token);
    return { exp, sqlStaffId };
  } catch {
    return null;
  }
};

/**
 * Stores what a sign-in answer leaves for the session and returns its
 * claims. Throws when the answer cannot open a session.
 */
export const storeSession = (answer, options) => {
  const { storage, cookieSession } = defaults(options);
  const claims = claimsFrom(answer?.token);
  if (!claims) throw new Error("The sign-in answer has no session token.");
  if (!cookieSession) {
    storage.setItem(TOKEN_KEY, answer.token);
    return claims;
  }
  const csrf = answer?.[CSRF_FIELD];
  if (typeof csrf !== "string" || !csrf) {
    throw new Error("The sign-in answer has no CSRF token, so changes could not be saved.");
  }
  storage.setItem(CSRF_KEY, csrf);
  storage.setItem(SESSION_CLAIMS_KEY, JSON.stringify(claims));
  return claims;
};

/** The stored value that changes when the session does. */
export const readSessionMarker = (options) => {
  const { storage, cookieSession } = defaults(options);
  return read(storage, cookieSession ? SESSION_CLAIMS_KEY : TOKEN_KEY);
};

export const readSessionClaims = (options) => {
  const { cookieSession } = defaults(options);
  const marker = readSessionMarker(options);
  if (!marker) return null;
  if (!cookieSession) return claimsFrom(marker);
  try {
    const claims = JSON.parse(marker);
    return claims && typeof claims === "object" ? claims : null;
  } catch {
    return null;
  }
};

export const hasSession = (options) => readSessionMarker(options) !== null;

/**
 * Not expired, and carrying the SQL staff id: tokens issued before the
 * backend's sqlStaffId fix lack it and must sign in again.
 */
export const isSessionValid = (claims, now = Date.now()) =>
  Boolean(claims) &&
  typeof claims.exp === "number" &&
  now < claims.exp * 1000 &&
  typeof claims.sqlStaffId === "number";

/** devitrakApi's request interceptor: how this request proves the session. */
export const attachSession = (config, options) => {
  const { storage, cookieSession } = defaults(options);
  config.headers = config.headers ?? {};
  if (!cookieSession) {
    const token = read(storage, TOKEN_KEY);
    if (token) config.headers["x-token"] = token;
    return config;
  }
  config.withCredentials = true;
  const method = String(config.method ?? "get").toLowerCase();
  const csrf = read(storage, CSRF_KEY);
  if (csrf && !SAFE_METHODS.has(method)) config.headers[CSRF_HEADER] = csrf;
  return config;
};

/** Whether a failed request was sent as part of a session (sessionExpiry.js). */
export const requestCarriedSession = (config, options) => {
  const { cookieSession } = defaults(options);
  if (cookieSession) return config?.withCredentials === true;
  const headers = config?.headers ?? {};
  return Boolean(headers["x-token"] ?? headers["X-Token"]);
};

/**
 * Headers for the sign-in calls made before the session is stored: the staff
 * lookup, the company list, the company picker's sign-out.
 */
export const preSessionHeaders = (answer, options) => {
  const { cookieSession } = defaults(options);
  if (!cookieSession) return answer?.token ? { "x-token": answer.token } : {};
  const csrf = answer?.[CSRF_FIELD];
  return csrf ? { [CSRF_HEADER]: csrf } : {};
};
