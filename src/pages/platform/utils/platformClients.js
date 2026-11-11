// Pure helpers for the Devitrak Admin Console client list
// (reports/FRONTEND_admin_console_plan_2026-11-11.md, F5). No React, no I/O.

const DEFAULT_LIMIT = 25;

/**
 * Query params for GET /api/platform/companies. Leaves out what would not
 * filter anything, so the cache key does not change on a blank search.
 */
export const buildCompaniesQuery = ({ search, status, page, limit } = {}) => {
  const query = {};
  const term = String(search ?? "").trim();
  if (term) query.search = term;
  if (status && status !== "all") query.status = status;
  query.page = Math.max(1, Number(page) || 1);
  query.limit = Number(limit) || DEFAULT_LIMIT;
  return query;
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
