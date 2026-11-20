// Cross-client console screens (plan B3 and F7): what each list asks for and
// shows. Field names are the dashboard's PROPOSAL for the server's responses;
// this file and clientProfile.js are the only places to change if they differ.
// No React, no I/O.

import { formatSectionValue } from "./clientProfile";

const DEFAULT_LIMIT = 25;

/** The audit log's date range (design board Audit). */
export const AUDIT_RANGES = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

const company = { key: "companyName", title: "Client", format: "company" };

export const PLATFORM_LIST_SCREENS = {
  inventory: {
    title: "Inventory",
    resource: "inventory",
    companyFilter: true,
    description: "Every device across every client. Search by serial to find where a device is.",
    filterParam: "status",
    defaultFilter: "all",
    filters: [
      { key: "all", label: "All" },
      { key: "available", label: "Available" },
      { key: "assigned", label: "Out" },
      { key: "lost", label: "Lost" },
      { key: "in_repair", label: "In repair" },
    ],
    searchPlaceholder: "Search serial, device or client",
    columns: [
      // Serials are text with a trailing counter: never Number() them.
      { key: "serial", title: "Serial", format: "text" },
      { key: "deviceName", title: "Device", format: "text" },
      { key: "category", title: "Category", format: "text" },
      company,
      { key: "status", title: "Status", format: "status" },
      { key: "location", title: "Location", format: "text" },
    ],
    totals: [
      { key: "total", label: "Devices", format: "number" },
      { key: "available", label: "Available", format: "number" },
      { key: "assigned", label: "Out now", format: "number" },
      { key: "lost", label: "Lost", format: "number", critical: true },
    ],
  },
  transactions: {
    title: "Transactions",
    resource: "transactions",
    companyFilter: true,
    description: "Payments, deposits and refunds from every client.",
    filterParam: "type",
    defaultFilter: "all",
    filters: [
      { key: "all", label: "All" },
      { key: "deposit", label: "Deposits" },
      { key: "rental", label: "Rentals" },
      { key: "sale", label: "Sales" },
      { key: "refund", label: "Refunds" },
    ],
    searchPlaceholder: "Search consumer, client or event",
    columns: [
      { key: "createdAt", title: "Date", format: "datetime" },
      company,
      // The name, not the email. This list is cross-client, and a consumer's
      // email address in a cross-client list is the same exposure the people
      // screen was removed for, arriving by the door marked money instead of
      // the one marked people -- which is exactly why it was easy to miss.
      // The full address is still on the transaction inside that client's own
      // profile (clientProfile.js), where the read carries a company id.
      { key: "consumerName", title: "Consumer", format: "text" },
      { key: "eventName", title: "Event", format: "text" },
      { key: "type", title: "Type", format: "status" },
      { key: "amountCents", title: "Amount", format: "cents", align: "right" },
      { key: "status", title: "Status", format: "status" },
    ],
    totals: [
      { key: "count", label: "Transactions", format: "number" },
      { key: "volumeCents", label: "Volume", format: "cents" },
      { key: "refundsCents", label: "Refunds", format: "cents" },
      { key: "failed", label: "Failed", format: "number", critical: true },
    ],
  },
  events: {
    title: "Events",
    resource: "events",
    companyFilter: true,
    description: "Every client's events, with the devices still out.",
    filterParam: "status",
    defaultFilter: "all",
    filters: [
      { key: "all", label: "All" },
      { key: "live", label: "Live" },
      { key: "upcoming", label: "Upcoming" },
      { key: "closed", label: "Closed" },
    ],
    searchPlaceholder: "Search event, client or lead",
    columns: [
      { key: "name", title: "Event", format: "text" },
      company,
      { key: "status", title: "Status", format: "status" },
      { key: "startsAt", title: "Starts", format: "date" },
      { key: "devicesAssigned", title: "Assigned", format: "number", align: "right" },
      { key: "devicesNotReturned", title: "Not returned", format: "number", align: "right" },
      { key: "revenueCents", title: "Revenue", format: "cents", align: "right" },
    ],
    totals: [
      { key: "live", label: "Live now", format: "number" },
      { key: "upcoming", label: "Upcoming", format: "number" },
      { key: "devicesNotReturned", label: "Not returned", format: "number", critical: true },
      { key: "revenueCents", label: "Revenue", format: "cents" },
    ],
  },
  // There is deliberately no cross-client "people" screen.
  //
  // It existed here: members and consumers of every client, searchable by name
  // and email, with an export. Members are school and club rosters, so that is
  // a vendor-side, cross-client, exportable index of children by name and
  // email -- the thing our own plan of 2026-11-10 ruled out in §2.4, and the
  // backend refused to build on 2026-11-19 after reading this file.
  //
  // The notice we put on it ("every search here is written to the audit log
  // with your name") was the right instinct and did not solve it: it tells an
  // operator they are watched, which is a different question from whether a
  // district's students are searchable by a vendor at all.
  //
  // Members and consumers remain where the support case actually starts --
  // inside one client's profile, after an operator has deliberately opened
  // that client (clientProfile.js). Every read there carries a company id, so
  // the client can see it in their own audit view. Decided by Gustavo on
  // 2026-11-19, option B.
  audit: {
    title: "Audit log",
    resource: "audit",
    companyFilter: true,
    description:
      "Everything Devitrak staff did in this console. Written by the server, append-only, kept while the client is active plus 120 days.",
    filterParam: "action",
    defaultFilter: "all",
    filters: [
      { key: "all", label: "All" },
      { key: "view", label: "Views" },
      { key: "search", label: "Searches" },
      { key: "export", label: "Exports" },
      { key: "signin", label: "Sign-ins" },
      { key: "access_change", label: "Access changes" },
    ],
    searchPlaceholder: "Search staff, client or resource",
    columns: [
      { key: "at", title: "When", format: "datetime" },
      { key: "actorEmail", title: "Staff", format: "text" },
      { key: "action", title: "Action", format: "status" },
      company,
      { key: "resource", title: "Resource", format: "text" },
      { key: "details", title: "Details", format: "text" },
      { key: "result", title: "Result", format: "status" },
      { key: "ip", title: "IP", format: "text" },
    ],
    // The design board's four, which are about oversight rather than row
    // counts: who is using the console, how much they are reading, how much
    // is leaving it, and whether anyone is failing to get in.
    totals: [
      { key: "activeOperators", label: "Operators active today", format: "text" },
      { key: "profilesOpenedToday", label: "Client profiles opened today", format: "number" },
      { key: "exportsThisWeek", label: "Exports this week", format: "number" },
      { key: "failedSignIns", label: "Failed sign-ins (7 days)", format: "number", critical: true },
    ],
    staffFilter: true,
    dateRange: true,
    notes: [
      "Entries are written by the server and cannot be edited or deleted, by anyone. Each client's entries are kept while the client is active and for 120 days after the account closes. Exporting this log is itself recorded.",
      // This sentence describes a control, on the screen an assessor is shown,
      // so it has to be the control the server actually runs: active ->
      // platform_observer -> domain -> allowlist -> mfaEnabled. It used to say
      // the gate was the Context Global super users. It never has been, and
      // the exclusion is deliberate: the owner of every client company has
      // super_user: true in their own company, so admitting that flag would
      // open a cross-client console to clients. Described one way and
      // implemented another is a finding even when, as here, the
      // implementation is the stricter of the two. Caught by the backend on
      // 2026-11-19, reading our code before writing their routes.
      "Who can use this console: Devitrak operators on a closed list, each signing in with an @devitrak.com address, the platform_observer flag and MFA enabled. Any one of those missing is a denial, and the denial is recorded with its reason.",
    ],
  },
};

export const buildListQuery = ({ filterParam, filter, search, company, staff, range, page, limit } = {}) => {
  const query = {};
  if (filterParam && filter && filter !== "all") query[filterParam] = filter;
  const term = String(search ?? "").trim();
  if (term) query.search = term;
  // The console is cross-client by default; a chosen client narrows it. This
  // goes in the query, never in a company header: the header would scope the
  // whole request and empty every other client out of the answer.
  if (company && company !== "all") query.company = company;
  if (staff && staff !== "all") query.staff = staff;
  if (range) query.range = range;
  query.page = Math.max(1, Number(page) || 1);
  query.limit = Number(limit) || DEFAULT_LIMIT;
  return query;
};

/** Total tiles above a list. A `critical` total turns red only when above zero. */
export const screenTotalsTiles = (screen, totals) =>
  screen.totals.map((total) => {
    const raw = totals?.[total.key];
    return {
      label: total.label,
      value: formatSectionValue(total.format, raw),
      tone: total.critical && Number(raw) > 0 ? "critical" : "neutral",
      testId: `platform-total-${total.key}`,
    };
  });

const RANGE_DAYS = { "7d": 7, "30d": 30, "90d": 90 };

/** "+20% vs previous 30 days". Null when there is nothing to compare. */
export const formatDelta = (current, previous, range) => {
  const now = Number(current);
  const before = Number(previous);
  if (!Number.isFinite(now) || !Number.isFinite(before) || before === 0) return null;
  const days = RANGE_DAYS[range] ?? 30;
  const percent = Math.round(((now - before) / Math.abs(before)) * 100);
  if (percent === 0) return `No change vs previous ${days} days`;
  return `${percent > 0 ? "+" : "−"}${Math.abs(percent)}% vs previous ${days} days`;
};

const OVERVIEW_TILES = [
  { key: "activeClients", label: "Active clients", format: "number" },
  { key: "revenueCents", label: "Revenue", format: "cents" },
  { key: "transactions", label: "Transactions", format: "number" },
  { key: "devicesOut", label: "Devices out", format: "number" },
  { key: "devicesOverdue", label: "Overdue devices", format: "number", critical: true },
  { key: "activeEvents", label: "Live events", format: "number" },
];

/** Platform KPI tiles for Overview, each with its change vs the previous period. */
export const overviewTiles = (summary) =>
  OVERVIEW_TILES.map((tile) => {
    const current = summary?.current?.[tile.key];
    return {
      label: tile.label,
      value: formatSectionValue(tile.format, current),
      sub: summary ? formatDelta(current, summary.previous?.[tile.key], summary.range) : null,
      tone: tile.critical && Number(current) > 0 ? "critical" : "neutral",
      testId: `platform-kpi-${tile.key}`,
    };
  });

/**
 * "Revenue by client" (design board Main): the handful of clients that
 * brought in the most money in the chosen period, ranked.
 *
 * One measure across named items, so it is a ranked bar — one series, one
 * hue, no legend, and the amount written beside each bar rather than hidden
 * behind an axis. `width` is the percentage of the largest bar, which is what
 * makes a ranked chart readable; `share` is the percentage of the revenue
 * shown, which is what people actually ask ("how much of this is Harbor
 * Point?").
 */
export const revenueByClient = (summary) => {
  const rows = Array.isArray(summary?.topClientsByRevenue) ? summary.topClientsByRevenue : [];
  if (rows.length === 0) return [];
  const amounts = rows.map((row) => Math.max(0, Number(row.revenueCents) || 0));
  const largest = Math.max(...amounts);
  const total = amounts.reduce((sum, value) => sum + value, 0);
  return rows.map((row, index) => {
    const cents = amounts[index];
    return {
      companyId: row.companyId,
      name: row.companyName ?? "Unnamed client",
      amount: formatSectionValue("cents", cents, row),
      width: largest > 0 ? Math.round((cents / largest) * 100) : 0,
      share: `${total > 0 ? Math.round((cents / total) * 100) : 0}%`,
    };
  });
};
