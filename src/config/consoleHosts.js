import { hasPlatformDomain } from "./roles";

/**
 * The two hosts one build serves, and who belongs on which.
 *
 *   admin.devitrak.net   the customer dashboard
 *   ops.devitrak.net     the Admin Console, at /platform
 *
 * IIS does the server half of the split (deploy/iis/README.md, and the rules
 * in public/web.config). This file is the client half: an operator who signs
 * in on the dashboard is taken to the console host, and anyone the console
 * refuses is taken back.
 *
 * Nothing here decides access. The gate is hasPlatformAccess, which needs the
 * server's answer; this only decides which address a browser ends up at.
 */
export const CONSOLE_HOST = "ops.devitrak.net";
export const DASHBOARD_HOST = "admin.devitrak.net";
export const CONSOLE_PATH = "/platform";

// Compared whole and lower-cased, the same rule as the email domain: a
// look-alike (ops.devitrak.net.attacker.test) and a subdomain are both simply
// not it. An unknown host — a dev server, a preview — matches neither, which
// is what keeps every redirect here out of local development.
const normalize = (hostname) => String(hostname ?? "").trim().toLowerCase();

export const isConsoleHost = (hostname) => normalize(hostname) === CONSOLE_HOST;
export const isDashboardHost = (hostname) => normalize(hostname) === DASHBOARD_HOST;

/**
 * The console's own paths: /platform and what is under it. Compared this way
 * rather than by prefix, so /platformers is a dashboard path like any other.
 */
export const isConsolePath = (pathname) => {
  const path = String(pathname ?? "");
  return path === CONSOLE_PATH || path.startsWith(`${CONSOLE_PATH}/`);
};

export const consoleUrl = (path = CONSOLE_PATH) => `https://${CONSOLE_HOST}${path}`;
export const dashboardUrl = (path = "/") => `https://${DASHBOARD_HOST}${path}`;

/**
 * Whether this request for a CONSOLE PATH, made on the dashboard host by this
 * account, should be served from the console host instead.
 *
 * The path is half the question, and leaving it out was a real bug: shipped on
 * 2026-11-19, it threw every @devitrak.com account off the dashboard from every
 * page, because being an operator was read as never having any other business
 * here. An operator is staff as well; the console is one of the places they
 * work. All this moves is /platform.
 *
 * Whose request it is, is answered by the sign-in domain alone, on purpose:
 * every @devitrak.com account is an operator account — client-facing staff sign
 * in at @contextglobal.com — so the domain answers "where does this person
 * work", which is what a redirect asks. Whether they may READ anything is a
 * different question, asked once, by the guard, with the server's answer in
 * hand. Deciding it here instead would put a second yes in the codebase, and
 * the second yes is the one nobody updates.
 */
export const shouldSendToConsole = ({ hostname, pathname, user }) =>
  isDashboardHost(hostname) && isConsolePath(pathname) && hasPlatformDomain(user);

/**
 * Whether a page on the console host should go to the console instead.
 *
 * public/web.config already redirects a REQUEST for "/" on that host. This is
 * the half IIS cannot see: signing in ends in navigate("/") inside React
 * Router, which makes no request, so a sign-in on ops.devitrak.net used to
 * render the customer dashboard on the console host. Measured in production on
 * 2026-11-19 with an account the server had already granted the console.
 *
 * It takes no user, and must not: it answers which app this address is, not
 * who may read it. Someone the console refuses is turned away by PlatformGuard,
 * which sends them off this host entirely — and that, not a condition here, is
 * what stops the two from passing a visitor back and forth.
 */
export const shouldLandOnConsole = ({ hostname, pathname }) =>
  isConsoleHost(hostname) && !isConsolePath(pathname);
