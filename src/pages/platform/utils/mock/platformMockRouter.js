// Answers /api/platform/* requests from sample data, in the response shape the
// plan proposes ({ ok, data, page, limit, total, totals? }; plan B3). Used only
// by the dev-server demo mode (VITE_APP_PLATFORM_CONSOLE_MOCK). Pure: no I/O.

import { createPlatformMockData } from "./platformMockData";

const DAY = 24 * 60 * 60 * 1000;

const ok = (body) => ({ status: 200, data: { ok: true, ...body } });
const notFound = (url) => ({ status: 404, data: { ok: false, msg: `No mock for ${url}` } });

const matches = (term, ...fields) => {
  const needle = String(term ?? "").trim().toLowerCase();
  if (!needle) return true;
  return fields.some((field) => String(field ?? "").toLowerCase().includes(needle));
};

const isFilter = (value) => value !== undefined && value !== null && value !== "" && value !== "all";

const paginate = (rows, params = {}, totals) => {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.max(1, Number(params.limit) || 25);
  const start = (page - 1) * limit;
  return ok({
    data: rows.slice(start, start + limit),
    page,
    limit,
    total: rows.length,
    ...(totals ? { totals } : {}),
  });
};

const sum = (rows, field) => rows.reduce((acc, row) => acc + (Number(row[field]) || 0), 0);
const countBy = (rows, field, value) => rows.filter((row) => row[field] === value).length;

const summaryFor = (data, range) => {
  const days = { "7d": 7, "30d": 30, "90d": 90 }[range] ?? 30;
  const end = data.now;
  const start = end - days * DAY;
  const previousStart = start - days * DAY;
  const inWindow = (from, to) => (row) => {
    const at = Date.parse(row.createdAt);
    return at >= from && at < to;
  };
  const period = (from, to) => {
    const transactions = data.transactions.filter(inWindow(from, to));
    const succeeded = transactions.filter((t) => t.status === "succeeded" || t.status === "refunded");
    return {
      revenueCents: sum(succeeded, "amountCents"),
      transactions: transactions.length,
      failedPayments: countBy(transactions, "status", "failed"),
    };
  };
  const current = period(start, end);
  const previous = period(previousStart, start);
  const live = data.companies.filter((c) => c.status !== "paused");
  // Precomputed on the server (plan B4): the console must never pull every
  // company down just to draw six bars.
  const topClientsByRevenue = [...data.companies]
    .sort((a, b) => (b.revenue30dCents || 0) - (a.revenue30dCents || 0))
    .slice(0, 6)
    .map((c) => ({ companyId: c.id, companyName: c.name, revenueCents: c.revenue30dCents }));
  return {
    range: range in { "7d": 1, "30d": 1, "90d": 1 } ? range : "30d",
    topClientsByRevenue,
    current: {
      ...current,
      activeClients: live.length,
      devicesOut: sum(data.companies, "devicesOut"),
      devicesOverdue: sum(data.companies, "devicesOverdue"),
      activeEvents: data.events.filter((e) => e.status === "live").length,
    },
    previous: {
      ...previous,
      activeClients: live.length - 2,
      devicesOut: Math.round(sum(data.companies, "devicesOut") * 0.92),
      devicesOverdue: Math.round(sum(data.companies, "devicesOverdue") * 0.7),
      activeEvents: Math.max(0, data.events.filter((e) => e.status === "live").length - 1),
    },
  };
};

const companySection = (data, company, section, params) => {
  const detail = data.details[company.id];
  switch (section) {
    case "activity":
      return paginate(
        detail.activity.filter((row) => !isFilter(params.category) || row.category === params.category),
        params,
      );
    case "transactions":
      return paginate(detail.transactions, params, {
        volumeCents: sum(detail.transactions.filter((t) => t.status === "succeeded"), "amountCents"),
      });
    case "events":
      return paginate(detail.events, params);
    case "inventory":
      return paginate(detail.inventoryGroups, params);
    case "members":
      return paginate(detail.members, params);
    case "consumers":
      return paginate(detail.consumers, params);
    case "staff":
      return paginate(detail.staff, params);
    case "merchant":
      return ok({ data: detail.merchant });
    case "subscription":
      return ok({ data: detail.subscription });
    default:
      return null;
  }
};

/** A router over one set of sample data. `handle` never throws. */
export const createPlatformMockRouter = ({ now = new Date() } = {}) => {
  const data = createPlatformMockData(now);

  const handle = ({ method = "get", url = "", params = {} } = {}) => {
    if (String(method).toLowerCase() !== "get") return notFound(url);
    const path = String(url).split("?")[0].replace(/\/+$/, "");
    const parts = path.split("/").filter(Boolean).map(decodeURIComponent);
    const p = params ?? {};

    if (parts[0] === "me" && parts.length === 1) {
      return ok({ data: { platformAccess: true, name: "Operator 1", email: "operator1@devitrak.com" } });
    }

    if (parts[0] === "summary" && parts.length === 1) {
      return ok({ data: summaryFor(data, p.range) });
    }

    if (parts[0] === "attention" && parts.length === 1) {
      const rows = data.companies.flatMap((c) =>
        c.alerts.map((alert, i) => ({
          id: `${c.id}_alert_${i}`,
          companyId: c.id,
          companyName: c.name,
          status: c.status,
          kind: alert.kind,
          reason: alert.message,
        })),
      );
      return paginate(rows, { limit: 100, ...p });
    }

    if (parts[0] === "activity" && parts.length === 1) {
      return paginate(
        data.activity.filter((row) => !isFilter(p.category) || row.category === p.category),
        p,
      );
    }

    if (parts[0] === "companies") {
      if (parts.length === 1) {
        const rows = data.companies.filter(
          (c) =>
            (!isFilter(p.status) || c.status === p.status) &&
            // "Pro" also matches "Pro (trial)": the trial is a status, not a
            // different plan.
            (!isFilter(p.plan) ||
              String(c.plan ?? "").toLowerCase().startsWith(String(p.plan).toLowerCase())) &&
            matches(p.search, c.name, c.ownerName, c.ownerEmail),
        );
        return paginate(rows, p);
      }
      const company = data.companies.find((c) => c.id === parts[1]);
      if (!company) return notFound(url);
      if (parts.length === 2) return ok({ data: company });
      if (parts.length === 3) return companySection(data, company, parts[2], p) ?? notFound(url);
      return notFound(url);
    }

    if (parts[0] === "inventory" && parts.length === 1) {
      const rows = data.inventory.filter(
        (d) =>
          (!isFilter(p.status) || d.status === p.status) &&
          (!isFilter(p.company) || d.companyId === p.company) &&
          matches(p.search, d.serial, d.deviceName, d.companyName),
      );
      return paginate(rows, p, {
        total: rows.length,
        available: countBy(rows, "status", "available"),
        assigned: countBy(rows, "status", "assigned"),
        lost: countBy(rows, "status", "lost"),
        inRepair: countBy(rows, "status", "in_repair"),
      });
    }

    if (parts[0] === "transactions" && parts.length === 1) {
      const rows = data.transactions.filter(
        (t) =>
          (!isFilter(p.type) || t.type === p.type) &&
          (!isFilter(p.company) || t.companyId === p.company) &&
          matches(p.search, t.consumerName, t.companyName, t.eventName, t.id),
      );
      return paginate(rows, p, {
        count: rows.length,
        volumeCents: sum(rows.filter((t) => t.status === "succeeded"), "amountCents"),
        refundsCents: -sum(rows.filter((t) => t.type === "refund"), "amountCents"),
        failed: countBy(rows, "status", "failed"),
      });
    }

    if (parts[0] === "events" && parts.length === 1) {
      const rows = data.events.filter(
        (e) =>
          (!isFilter(p.status) || e.status === p.status) &&
          (!isFilter(p.company) || e.companyId === p.company) &&
          matches(p.search, e.name, e.companyName, e.leadName),
      );
      return paginate(rows, p, {
        live: countBy(rows, "status", "live"),
        upcoming: countBy(rows, "status", "upcoming"),
        devicesNotReturned: sum(rows, "devicesNotReturned"),
        revenueCents: sum(rows, "revenueCents"),
      });
    }

    // No /people route. The cross-client roster it answered was removed on
    // 2026-11-19; members and consumers are served per company above, where
    // the request carries a company id. A call here falls through to 404,
    // which is what the real server will do too.

    if (parts[0] === "audit" && parts.length === 1) {
      const windowDays = { "7d": 7, "30d": 30, "90d": 90 }[p.range] ?? 30;
      const since = data.now - windowDays * DAY;
      const rows = data.audit.filter(
        (entry) =>
          Date.parse(entry.at) >= since &&
          (!isFilter(p.action) || entry.action === p.action) &&
          (!isFilter(p.company) || entry.companyId === p.company) &&
          (!isFilter(p.staff) || entry.actorEmail === p.staff) &&
          matches(p.search, entry.actorEmail, entry.actorName, entry.companyName, entry.resource),
      );
      // The tiles answer oversight questions, so they are counted over their
      // own fixed windows, not over whatever the filters happen to show.
      const dayStart = data.now - DAY;
      const weekStart = data.now - 7 * DAY;
      const today = data.audit.filter((e) => Date.parse(e.at) >= dayStart);
      const week = data.audit.filter((e) => Date.parse(e.at) >= weekStart);
      const staffToday = new Set(today.map((e) => e.actorEmail));
      const staffEver = new Set(data.audit.map((e) => e.actorEmail));
      const answer = paginate(rows, p, {
        activeOperators: `${staffToday.size} of ${staffEver.size}`,
        profilesOpenedToday: today.filter((e) => e.action === "view" && e.companyId).length,
        exportsThisWeek: countBy(week, "action", "export"),
        failedSignIns: week.filter((e) => e.action === "signin" && e.result === "denied").length,
      });
      answer.data.filters = {
        staff: [...staffEver]
          .sort()
          .map((email) => ({ value: email, label: email })),
      };
      return answer;
    }

    return notFound(url);
  };

  return { handle, data };
};
