import { buildRequestPath } from "./sessionHeaders";

/**
 * What a 401 means when it reaches devitrakApi.
 *
 * Since 2026-10-19 the server answers 401 on routes that used to be anonymous
 * (BACKEND_fedramp_server_tasks_REPLY_2026-10-19.md). With an expired session a
 * screen loaded what was still anonymous and failed on the rest, half drawn,
 * because nothing handled a 401 globally. Now an authenticated request that
 * comes back 401 ends the session; App registers what that does (clear it, so
 * the router lands on /login), and the page the person was on is kept so the
 * next sign-in returns there.
 *
 * Left alone, because a 401 there is part of the flow and the screen says it:
 * - requests that sign in, enrol or check MFA, check or reset a password, or
 *   answer a link from an email;
 * - public pages, which may run with a staff session still in the browser.
 */

/** Requests whose 401 the calling screen handles itself. Matched as prefixes. */
const OWN_401_REQUESTS = [
  "/api/admin/login",
  // Signing out with a token that already expired is still signing out.
  "/api/admin/logout",
  "/api/admin/mfa/",
  "/api/admin/verify-password",
  "/api/admin/update-password",
  "/api/staff/force-logout",
  "/api/registration/",
  "/api/school/event-invitations/",
  "/api/school/consent/",
  "/api/db_member/my-devices",
];

/** Pages reachable without a session (routes/no-authorized/NoAuthRoutes.jsx). */
const PUBLIC_PAGES = [
  "/login",
  "/authenticate",
  "/invitation",
  "/register",
  "/reset-password",
  "/force-logout",
  "/attendance-confirmation",
  "/display-contracts",
  "/my-devices",
  "/receipt",
  "/status",
  "/school/consent/respond",
];

export const RETURN_PATH_KEY = "devitrak-return-path";

const startsWithAny = (path, prefixes) => prefixes.some((prefix) => path.startsWith(prefix));

const isPublicPage = (pathname) =>
  PUBLIC_PAGES.some((page) => pathname === page || pathname.startsWith(`${page}/`));

/**
 * @param {{ status?: number, requestPath: string, hadToken: boolean, hasToken: boolean, pathname: string }} input
 *   hadToken: the request carried a session token. hasToken: one is still
 *   stored, so the first 401 of a burst ends the session and the rest do not.
 */
export const isSessionExpiry = ({ status, requestPath, hadToken, hasToken, pathname }) => {
  if (status !== 401 || !hadToken || !hasToken) return false;
  if (startsWithAny(String(requestPath ?? ""), OWN_401_REQUESTS)) return false;
  return !isPublicPage(String(pathname ?? ""));
};

/**
 * Where to come back to after signing in again: a page of this app, never
 * another origin, a public page or the home page (which is the default).
 */
export const returnPathFrom = ({ pathname, search = "" }) => {
  const path = String(pathname ?? "");
  if (!path.startsWith("/") || path.startsWith("//") || path === "/") return null;
  if (isPublicPage(path)) return null;
  return `${path}${search ?? ""}`;
};

let sessionExpiredHandler = null;

/** App registers what ending the session does; null unregisters it. */
export const setSessionExpiredHandler = (handler) => {
  sessionExpiredHandler = typeof handler === "function" ? handler : null;
};

const readStorage = (storage, key) => {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
};

/** Called by devitrakApi's response interceptor for every failed request. */
export const handleUnauthorized = (error) => {
  const config = error?.config ?? {};
  const headers = config.headers ?? {};
  const expired = isSessionExpiry({
    status: error?.response?.status,
    requestPath: buildRequestPath(config.baseURL, config.url),
    hadToken: Boolean(headers["x-token"] ?? headers["X-Token"]),
    hasToken: Boolean(readStorage(localStorage, "admin-token")),
    pathname: window.location.pathname,
  });
  if (!expired) return false;

  const returnPath = returnPathFrom(window.location);
  try {
    if (returnPath) sessionStorage.setItem(RETURN_PATH_KEY, returnPath);
  } catch {
    // Without sessionStorage the person signs in to the home page instead.
  }
  sessionExpiredHandler?.();
  return true;
};

/** The page to return to after signing in, once; null when there is none. */
export const takeReturnPath = () => {
  const stored = readStorage(sessionStorage, RETURN_PATH_KEY);
  try {
    sessionStorage.removeItem(RETURN_PATH_KEY);
  } catch {
    // Nothing to clean up.
  }
  if (!stored) return null;
  const [pathname, ...rest] = stored.split("?");
  return returnPathFrom({ pathname, search: rest.length ? `?${rest.join("?")}` : "" });
};
