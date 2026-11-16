// Cross-client console screens (plan B3 and F7): what each list asks for and
// shows. Field names are the dashboard's PROPOSAL for the server's responses;
// this file and clientProfile.js are the only places to change if they differ.
// No React, no I/O.

import { formatSectionValue } from "./clientProfile";

const DEFAULT_LIMIT = 25;

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
      { key: "consumerEmail", title: "Consumer", format: "text" },
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
  people: {
    title: "Members & consumers",
    resource: "people",
    companyFilter: true,
    description: "Members (school and club rosters) and consumers (event attendees) of every client.",
    // Real people. Whoever opens this screen is told, on the screen, that
    // the server records the visit with their name (plan risk "personal
    // data exposure", AU-2; design board People).
    notice:
      "This page shows personal data. Every search, profile view and export here is written to the audit log with your name.",
    filterParam: "kind",
    defaultFilter: "members",
    filters: [
      { key: "members", label: "Members" },
      { key: "consumers", label: "Consumers" },
    ],
    searchPlaceholder: "Search name, email, member ID or client",
    columns: [
      { key: "name", title: "Name", format: "text" },
      { key: "email", title: "Email", format: "text" },
      company,
      { key: "status", title: "Status", format: "status" },
      { key: "devicesOut", title: "Devices out", format: "number", align: "right" },
      { key: "lastSeenAt", title: "Last seen", format: "relative" },
    ],
    totals: [
      { key: "total", label: "People", format: "number" },
      { key: "active", label: "Active", format: "number" },
      { key: "devicesOut", label: "Devices out", format: "number" },
    ],
  },
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
    totals: [
      { key: "total", label: "Entries", format: "number" },
      { key: "exports", label: "Exports", format: "number" },
      { key: "denied", label: "Denied", format: "number", critical: true },
    ],
  },
};

export const buildListQuery = ({ filterParam, filter, search, company, page, limit } = {}) => {
  const query = {};
  if (filterParam && filter && filter !== "all") query[filterParam] = filter;
  const term = String(search ?? "").trim();
  if (term) query.search = term;
  // The console is cross-client by default; a chosen client narrows it. This
  // goes in the query, never in a company header: the header would scope the
  // whole request and empty every other client out of the answer.
  if (company && company !== "all") query.company = company;
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
