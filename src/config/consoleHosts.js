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

export const consoleUrl = (path = CONSOLE_PATH) => `https://${CONSOLE_HOST}${path}`;
export const dashboardUrl = (path = "/") => `https://${DASHBOARD_HOST}${path}`;

/**
 * Whether this signed-in account, on this host, belongs on the console host.
 *
 * By the sign-in domain alone, on purpose. Every @devitrak.com account is an
 * operator account — real staff sign in at @contextglobal.com — so the domain
 * is the right question for "where does this person work", which is what a
 * redirect answers. Whether they may READ anything is a different question,
 * asked once, by the guard, with the server's answer in hand.
 *
 * Deciding it here instead would put a second yes in the codebase, and the
 * second yes is the one nobody updates.
 */
export const shouldSendToConsole = ({ hostname, user }) =>
  isDashboardHost(hostname) && hasPlatformDomain(user);
