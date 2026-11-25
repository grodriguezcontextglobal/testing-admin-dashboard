// Pure helpers for the Devitrak Admin Console client list
// (reports/FRONTEND_admin_console_plan_2026-11-11.md, F5). No React, no I/O.

const DEFAULT_LIMIT = 25;

/**
 * Query params for GET /api/platform/companies. Leaves out what would not
 * filter anything, so the cache key does not change on a blank search.
 */
export const buildCompaniesQuery = ({ search, status, plan, page, limit } = {}) => {
  const query = {};
  const term = String(search ?? "").trim();
  if (term) query.search = term;
  if (status && status !== "all") query.status = status;
  if (plan && plan !== "all") query.plan = plan;
  query.page = Math.max(1, Number(page) || 1);
  query.limit = Number(limit) || DEFAULT_LIMIT;
  return query;
};

/**
 * The plans the product sells (Profile → Subscription, #71), for the client
 * list's Plan dropdown (design board Clients).
 *
 * A trial is a status, not a plan: "Pro (trial)" is filtered by choosing Pro
 * here, or by the Trial status tab. Kept as plain names because that is what
 * the server stores on the company.
 */
export const PLAN_FILTERS = [
  { value: "all", label: "All plans" },
  { value: "Free", label: "Free" },
  { value: "Pro", label: "Pro" },
  { value: "Enterprise", label: "Enterprise" },
];

/**
 * One page, for the "Client" dropdown the cross-client lists share.
 *
 * It is the server's own cap and not a round number of our choosing: a
 * `/companies` page tops out at 100, and asking for more is not an error --
 * you get 100 and `limit` tells you what you got (backend, 2026-11-20). We
 * asked for 500 for five days, which meant the dropdown was one signup away
 * from showing the first hundred clients as though they were all of them,
 * with nothing on screen to say otherwise. Harmless at 21 clients, and a trap
 * set for a day when nobody would be reading this file.
 *
 * Replaced by GET /api/platform/companies/options -- id and name, uncapped --
 * when the backend ships it. Until then, companyOptionsComplete below is what
 * keeps the control honest.
 */
export const COMPANY_OPTIONS_LIMIT = 100;

/**
 * Whether that one page holds every client there is.
 *
 * When it does not, the dropdown must not offer what it has: a filter listing
 * 100 of 137 clients is not a short list, it is a wrong answer to "which
 * clients exist", and the operator has no way to see the difference. Better a
 * control that does nothing.
 *
 * An unreadable or absent total counts as complete, deliberately. The rows are
 * then all we know, and disabling the filter over a field the server did not
 * send would break the screen for a missing number rather than for a missing
 * client.
 */
export const companyOptionsComplete = ({ rows, total } = {}) => {
  const received = Array.isArray(rows) ? rows.length : 0;
  const counted = Number(total);
  if (!Number.isFinite(counted)) return true;
  return counted <= received;
};

const STATUS_PILLS = {
  active: { label: "Active", color: "success" },
  at_risk: { label: "At risk", color: "error" },
  trial: { label: "Trial", color: "brand" },
  paused: { label: "Paused", color: "gray" },
};

/** Label and PillUIComponent color for a server-computed client status. */
export const companyStatusPill = (status) =>
  STATUS_PILLS[status] ?? { label: "Unknown", color: "gray" };

/** Integer cents → "$15,100.00". A dash for anything that is not a number. */
export const formatCents = (cents, currency = "USD") => {
  if (cents === null || cents === undefined || cents === "") return "—";
  const value = Number(cents);
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value / 100);
};

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** "5 min ago", "3 h ago", "Yesterday", "5 days ago", then a calendar date. */
export const formatLastActivity = (iso, now = new Date()) => {
  if (iso === null || iso === undefined || iso === "") return "Never";
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return "—";
  const elapsed = now.getTime() - at.getTime();
  if (elapsed < MINUTE) return "Just now";
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)} min ago`;
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)} h ago`;
  if (elapsed < 2 * DAY) return "Yesterday";
  if (elapsed < 30 * DAY) return `${Math.floor(elapsed / DAY)} days ago`;
  return at.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
};

/**
 * The agreed list shape is `{ ok, data, page, limit, total }`. Always returns
 * an array of rows, so a table never renders `undefined` while loading.
 */
export const normalizeCompaniesResponse = (body) => {
  const rows = Array.isArray(body?.data) ? body.data : [];
  return {
    rows,
    page: Number(body?.page) || 1,
    limit: Number(body?.limit) || DEFAULT_LIMIT,
    total: Number.isFinite(Number(body?.total)) && body?.total !== undefined
      ? Number(body.total)
      : rows.length,
  };
};
