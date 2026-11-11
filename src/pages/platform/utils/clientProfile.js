// Pure helpers for the Admin Console client profile
// (reports/FRONTEND_admin_console_plan_2026-11-11.md, B3 and F7). No React, no I/O.
//
// Field names below are the dashboard's PROPOSAL for the server's responses.
// If the backend picks other names, this file is the only place to change.

import { formatCents, formatLastActivity } from "./platformClients";

const DEFAULT_LIMIT = 25;

/**
 * Profile places, in the designed order. Each tab except Overview loads its
 * own GET /api/platform/companies/:id/<resource> when it is opened.
 * kind "list" = paginated rows; "record" = one object (Stripe account, plan).
 */
export const CLIENT_PROFILE_TABS = [
  { key: "overview", label: "Overview", resource: null, kind: "overview" },
  { key: "activity", label: "Activity", resource: "activity", kind: "list" },
  { key: "transactions", label: "Transactions", resource: "transactions", kind: "list" },
  { key: "events", label: "Events", resource: "events", kind: "list" },
  { key: "merchant", label: "Merchant", resource: "merchant", kind: "record" },
  { key: "inventory", label: "Inventory", resource: "inventory", kind: "list" },
  { key: "members", label: "Members", resource: "members", kind: "list" },
  { key: "consumers", label: "Consumers", resource: "consumers", kind: "list" },
  { key: "staff", label: "Staff", resource: "staff", kind: "list" },
  { key: "subscription", label: "Subscription", resource: "subscription", kind: "record" },
];

/** Activity filter (plan B3: ?category). */
export const ACTIVITY_CATEGORIES = [
  { key: "all", label: "All" },
  { key: "transaction", label: "Transactions" },
  { key: "event", label: "Events" },
  { key: "inventory", label: "Inventory" },
  { key: "member", label: "Members" },
  { key: "staff", label: "Staff" },
];

/** Table columns per list tab: { key, title, format, align? }. */
export const SECTION_COLUMNS = {
  activity: [
    { key: "at", title: "When", format: "datetime" },
    { key: "category", title: "Category", format: "status" },
    { key: "actorName", title: "Who", format: "text" },
    { key: "summary", title: "What happened", format: "text" },
    { key: "source", title: "Source", format: "status" },
  ],
  transactions: [
    { key: "createdAt", title: "Date", format: "datetime" },
    { key: "type", title: "Type", format: "status" },
    { key: "consumerEmail", title: "Consumer", format: "text" },
    { key: "eventName", title: "Event", format: "text" },
    { key: "amountCents", title: "Amount", format: "cents", align: "right" },
    { key: "status", title: "Status", format: "status" },
  ],
  events: [
    { key: "name", title: "Event", format: "text" },
    { key: "status", title: "Status", format: "status" },
    { key: "startsAt", title: "Starts", format: "date" },
    { key: "endsAt", title: "Ends", format: "date" },
    { key: "devicesAssigned", title: "Assigned", format: "number", align: "right" },
    { key: "devicesNotReturned", title: "Not returned", format: "number", align: "right" },
    { key: "consumersCount", title: "Consumers", format: "number", align: "right" },
    { key: "revenueCents", title: "Revenue", format: "cents", align: "right" },
    { key: "leadName", title: "Lead", format: "text" },
  ],
  inventory: [
    { key: "groupName", title: "Group", format: "text" },
    { key: "category", title: "Category", format: "text" },
    // Serials are text with a trailing counter: never Number() them.
    { key: "serialRange", title: "Serials", format: "text" },
    { key: "total", title: "Total", format: "number", align: "right" },
    { key: "available", title: "Available", format: "number", align: "right" },
    { key: "out", title: "Out", format: "number", align: "right" },
    { key: "lost", title: "Lost", format: "number", align: "right" },
    { key: "location", title: "Location", format: "text" },
  ],
  members: [
    { key: "name", title: "Member", format: "text" },
    { key: "memberId", title: "Member ID", format: "text" },
    { key: "email", title: "Email", format: "text" },
    { key: "status", title: "Status", format: "status" },
    { key: "devicesOut", title: "Devices out", format: "number", align: "right" },
    { key: "joinedAt", title: "Joined", format: "date" },
  ],
  consumers: [
    { key: "name", title: "Consumer", format: "text" },
    { key: "email", title: "Email", format: "text" },
    { key: "status", title: "Status", format: "status" },
    { key: "devicesOut", title: "Devices out", format: "number", align: "right" },
    { key: "transactionsCount", title: "Transactions", format: "number", align: "right" },
    { key: "lastSeenAt", title: "Last seen", format: "relative" },
  ],
  staff: [
    { key: "name", title: "Staff", format: "text" },
    { key: "email", title: "Email", format: "text" },
    { key: "role", title: "Role", format: "status" },
    { key: "scope", title: "Scope", format: "text" },
    { key: "twoStepEnabled", title: "Two-step", format: "bool" },
    { key: "lastLoginAt", title: "Last sign-in", format: "relative" },
    { key: "actions30d", title: "Actions 30d", format: "number", align: "right" },
  ],
};

/** Fields per record tab, plus the Overview "at a glance" list. */
export const RECORD_FIELDS = {
  overview: [
    { key: "plan", label: "Plan", format: "text" },
    { key: "eventsActive", label: "Active events", format: "number" },
    { key: "membersCount", label: "Members", format: "number" },
    { key: "consumersCount", label: "Consumers", format: "number" },
    { key: "lastActivityAt", label: "Last activity", format: "relative" },
  ],
  merchant: [
    { key: "accountId", label: "Stripe account", format: "text" },
    { key: "chargesEnabled", label: "Charges enabled", format: "bool" },
    { key: "payoutsEnabled", label: "Payouts enabled", format: "bool" },
    { key: "payoutSchedule", label: "Payout schedule", format: "text" },
    { key: "bankLast4", label: "Bank account", format: "text" },
    { key: "requirementsDue", label: "Requirements due", format: "list" },
    { key: "balanceCents", label: "Balance", format: "cents" },
    { key: "disputesOpen", label: "Open disputes", format: "number" },
    { key: "fees30dCents", label: "Fees, last 30 days", format: "cents" },
    { key: "lastPayoutAt", label: "Last payout", format: "date" },
  ],
  subscription: [
    { key: "plan", label: "Plan", format: "text" },
    { key: "status", label: "Status", format: "status" },
    { key: "startedAt", label: "Started", format: "date" },
    { key: "renewsAt", label: "Renews", format: "date" },
    { key: "priceCents", label: "Price", format: "cents" },
    { key: "paymentMethodLast4", label: "Payment method", format: "text" },
    { key: "seatsUsed", label: "Seats used", format: "number" },
    { key: "seatsLimit", label: "Seat limit", format: "number" },
  ],
};

export const resolveProfileTab = (requested) =>
  CLIENT_PROFILE_TABS.some((tab) => tab.key === requested) ? requested : "overview";

export const buildSectionQuery = ({ page, limit, category } = {}) => {
  const query = {
    page: Math.max(1, Number(page) || 1),
    limit: Number(limit) || DEFAULT_LIMIT,
  };
  if (category && category !== "all") query.category = category;
  return query;
};

/**
 * `{ ok, data, totals?, page, limit, total }`. `data` is an array for list
 * tabs and an object for record tabs. Always safe to read while loading.
 */
export const normalizeSectionResponse = (body) => {
  const data = body?.data;
  const rows = Array.isArray(data) ? data : [];
  const record = data && typeof data === "object" && !Array.isArray(data) ? data : null;
  const total = Number(body?.total);
  return {
    rows,
    record,
    totals: body?.totals && typeof body.totals === "object" ? body.totals : null,
    page: Number(body?.page) || 1,
    limit: Number(body?.limit) || DEFAULT_LIMIT,
    total: body?.total !== undefined && Number.isFinite(total) ? total : rows.length,
  };
};

const isEmpty = (value) => value === null || value === undefined || value === "";

/** "past_due" → "Past due". */
export const humanizeStatus = (value) => {
  if (isEmpty(value)) return "—";
  const text = String(value).replace(/[_-]+/g, " ").trim().toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const SUCCESS = new Set(["active", "succeeded", "paid", "enabled", "returned", "completed", "verified"]);
const CRITICAL = new Set(["past_due", "failed", "lost", "overdue", "disputed", "unpaid", "canceled", "cancelled", "denied", "restricted"]);
const WARNING = new Set(["pending", "trial", "trialing", "incomplete", "at_risk", "invited", "paused"]);

/** StatusChip tone for a server status: semantic colors only, never action blue. */
export const sectionStatusTone = (value) => {
  const key = String(value ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (SUCCESS.has(key)) return "success";
  if (CRITICAL.has(key)) return "critical";
  if (WARNING.has(key)) return "warning";
  return "neutral";
};

const formatDate = (iso, withTime) => {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return "—";
  return at.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
    timeZone: "UTC",
  });
};

/** One cell or field as display text. A dash for anything missing. */
export const formatSectionValue = (format, value, row = {}) => {
  if (format === "list") {
    if (!Array.isArray(value)) return isEmpty(value) ? "—" : String(value);
    return value.length ? value.join(", ") : "None";
  }
  if (isEmpty(value)) return "—";
  switch (format) {
    case "number": {
      const number = Number(value);
      return Number.isFinite(number) ? number.toLocaleString("en-US") : "—";
    }
    case "cents":
      return formatCents(value, row?.currency || "USD");
    case "bool":
      return value === true ? "Yes" : value === false ? "No" : "—";
    case "date":
      return formatDate(value, false);
    case "datetime":
      return formatDate(value, true);
    case "relative":
      return formatLastActivity(value);
    case "status":
      return humanizeStatus(value);
    default:
      return String(value);
  }
};

/** Identity card facts. Items the server did not send are left out. */
export const companyFactGroups = (company) => {
  const c = company ?? {};
  const owner = [];
  if (!isEmpty(c.ownerName)) owner.push({ value: c.ownerName });
  if (!isEmpty(c.ownerEmail)) owner.push({ value: c.ownerEmail, href: `mailto:${c.ownerEmail}` });
  if (!isEmpty(c.phone)) owner.push({ value: c.phone });

  const account = [];
  const since = isEmpty(c.createdAt) ? "—" : formatDate(c.createdAt, false);
  if (since !== "—") account.push({ value: `Client since ${since}` });
  if (!isEmpty(c.mongoId)) account.push({ value: `Mongo ID ${c.mongoId}`, muted: true });
  if (!isEmpty(c.sqlId)) account.push({ value: `SQL ID ${c.sqlId}`, muted: true });

  return [
    { label: "Owner", items: owner },
    { label: "Account", items: account },
  ];
};

/** Stat tiles above the tabs. Only Overdue may be critical (one at most). */
export const companyStatTiles = (company) => {
  const c = company ?? {};
  const overdue = Number(c.devicesOverdue);
  const deviceCount = formatSectionValue("number", c.deviceCount);
  return [
    {
      label: "Devices out",
      value: formatSectionValue("number", c.devicesOut),
      sub: deviceCount === "—" ? null : `of ${deviceCount} devices`,
      testId: "platform-stat-devices-out",
    },
    {
      label: "Overdue",
      value: formatSectionValue("number", c.devicesOverdue),
      tone: overdue > 0 ? "critical" : "neutral",
      sub: overdue > 0 ? "Past their return date" : null,
      testId: "platform-stat-overdue",
    },
    {
      label: "Revenue 30d",
      value: formatSectionValue("cents", c.revenue30dCents, c),
      testId: "platform-stat-revenue",
    },
    {
      label: "Staff",
      value: formatSectionValue("number", c.staffCount),
      testId: "platform-stat-staff",
    },
  ];
};
