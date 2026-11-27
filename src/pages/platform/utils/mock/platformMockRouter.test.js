import { describe, it, expect } from "vitest";
import { createPlatformMockData } from "./platformMockData";
import { createPlatformMockRouter } from "./platformMockRouter";

const NOW = new Date("2026-11-12T15:00:00Z");

describe("createPlatformMockData", () => {
  it("is the same every time for the same clock (a demo looks the same twice)", () => {
    const a = createPlatformMockData(NOW);
    const b = createPlatformMockData(NOW);
    expect(a.companies).toEqual(b.companies);
    expect(a.audit.slice(0, 5)).toEqual(b.audit.slice(0, 5));
  });

  it("has a realistic set of clients with every status", () => {
    const { companies } = createPlatformMockData(NOW);
    expect(companies.length).toBeGreaterThanOrEqual(30);
    const statuses = new Set(companies.map((c) => c.status));
    expect([...statuses].sort()).toEqual(["active", "at_risk", "paused", "trial"]);
  });

  it("uses only example contact addresses, never real domains", () => {
    const { companies, details } = createPlatformMockData(NOW);
    for (const c of companies) expect(c.ownerEmail).toMatch(/@[a-z0-9-]+\.example$/);
    const people = Object.values(details).flatMap((d) => [...d.members, ...d.consumers]);
    expect(people.length).toBeGreaterThan(0);
    for (const p of people.slice(0, 50)) expect(p.email).toMatch(/\.example$/);
  });

  it("keeps serials as text with leading zeros", () => {
    const { inventory } = createPlatformMockData(NOW);
    expect(typeof inventory[0].serial).toBe("string");
    expect(inventory.some((d) => /^[A-Z]+-0\d+/.test(d.serial))).toBe(true);
  });

  it("gives at-risk clients an alert", () => {
    const { companies } = createPlatformMockData(NOW);
    for (const c of companies.filter((x) => x.status === "at_risk")) {
      expect(c.alerts.length).toBeGreaterThan(0);
    }
  });
});

describe("createPlatformMockRouter", () => {
  const router = createPlatformMockRouter({ now: NOW });
  const get = (url, params) => router.handle({ method: "get", url, params });

  it("answers the agreed list shape for /companies", () => {
    const { status, data } = get("/companies", { page: 1, limit: 10 });
    expect(status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.data).toHaveLength(10);
    expect(data.page).toBe(1);
    expect(data.limit).toBe(10);
    expect(data.total).toBeGreaterThanOrEqual(30);
  });

  it("filters companies by status and search", () => {
    const atRisk = get("/companies", { status: "at_risk", limit: 100 }).data;
    expect(atRisk.data.every((c) => c.status === "at_risk")).toBe(true);
    const first = get("/companies", { limit: 1 }).data.data[0];
    const found = get("/companies", { search: first.name.slice(0, 6).toUpperCase() }).data;
    expect(found.data.map((c) => c.id)).toContain(first.id);
  });

  it("pages: page 2 starts where page 1 ended", () => {
    const one = get("/companies", { page: 1, limit: 5 }).data.data;
    const two = get("/companies", { page: 2, limit: 5 }).data.data;
    expect(two[0].id).not.toBe(one[0].id);
    expect(new Set([...one, ...two].map((c) => c.id)).size).toBe(10);
  });

  it("answers one company, and 404 for an unknown one", () => {
    const id = get("/companies", { limit: 1 }).data.data[0].id;
    const one = get(`/companies/${id}`);
    expect(one.status).toBe(200);
    expect(one.data.data.id).toBe(id);
    expect(one.data.data.mongoId).toMatch(/^[0-9a-f]{24}$/);
    expect(get("/companies/nope").status).toBe(404);
  });

  it("answers every profile tab for a company", () => {
    const id = get("/companies", { limit: 1 }).data.data[0].id;
    for (const tab of ["activity", "transactions", "events", "inventory", "members", "consumers", "staff"]) {
      const res = get(`/companies/${id}/${tab}`, { page: 1, limit: 25 });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data.data)).toBe(true);
    }
    const subscription = get(`/companies/${id}/subscription`);
    expect(subscription.status).toBe(200);
    expect(Array.isArray(subscription.data.data)).toBe(false);
  });

  // The live server answers this 501 (backend note, 2026-11-26): the nine
  // fields are Stripe account state and the database only holds the sign-up
  // form sent the day the account was created. A sample build that answered
  // 200 here would show a finished tab that refuses in production.
  it("refuses merchant the way the live server does, with what it is waiting on", () => {
    const id = get("/companies", { limit: 1 }).data.data[0].id;
    const res = get(`/companies/${id}/merchant`);
    expect(res.status).toBe(501);
    expect(res.data.ok).toBe(false);
    expect(res.data.resource).toBe("merchant");
    expect(res.data.msg).toMatch(/Stripe/);
    expect(res.data.needs.length).toBeGreaterThan(0);
  });

  it("filters a company's activity by category", () => {
    const id = get("/companies", { limit: 1 }).data.data[0].id;
    const rows = get(`/companies/${id}/activity`, { category: "event", limit: 100 }).data.data;
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.category === "event")).toBe(true);
  });

  it("answers the cross-client screens with rows and totals", () => {
    for (const resource of ["/inventory", "/transactions", "/events", "/audit", "/activity", "/attention"]) {
      const res = get(resource, { page: 1, limit: 25 });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data.data)).toBe(true);
    }
    expect(get("/transactions").data.totals.volumeCents).toBeGreaterThan(0);
    expect(get("/inventory").data.totals.total).toBeGreaterThan(0);
  });

  it("serves members and consumers only under a company, never across clients", () => {
    // /people answered a cross-client roster by name and email. It is gone,
    // and the mock has to refuse it the way the real server will -- a mock
    // that keeps answering a route nobody will build is how a removed screen
    // comes back. Decided by Gustavo on 2026-11-19, option B.
    expect(get("/people", { kind: "members" }).status).toBe(404);
    const company = get("/companies", { limit: 1 }).data.data[0];
    const members = get(`/companies/${company.id}/members`, { limit: 50 }).data.data;
    expect(members.length).toBeGreaterThan(0);
    expect(members.every((p) => p.kind === "member")).toBe(true);
    const consumers = get(`/companies/${company.id}/consumers`, { limit: 50 }).data.data;
    expect(consumers.every((p) => p.kind === "consumer")).toBe(true);
  });

  it("searches transactions by consumer name, never by their address", () => {
    const rows = get("/transactions", { limit: 5 }).data.data;
    const row = rows.find((t) => t.consumerName && t.consumerEmail);
    expect(get("/transactions", { search: row.consumerName, limit: 100 }).data.data.length)
      .toBeGreaterThan(0);
    expect(get("/transactions", { search: row.consumerEmail, limit: 100 }).data.data).toEqual([]);
  });

  it("finds a device by serial across every client", () => {
    const device = get("/inventory", { limit: 1 }).data.data[0];
    const found = get("/inventory", { search: device.serial }).data.data;
    expect(found.map((d) => d.id)).toContain(device.id);
  });

  it("answers the overview summary with the previous period", () => {
    const { data } = get("/summary", { range: "30d" }).data;
    expect(data.range).toBe("30d");
    expect(data.current.revenueCents).toBeGreaterThan(0);
    expect(data.previous).toBeDefined();
  });

  it("answers 404 for a route the console does not have", () => {
    expect(get("/nothing").status).toBe(404);
  });

  // The demo stays honest about the export: the server has no
  // POST /api/platform/exports yet, so the button says exactly that rather
  // than pretending a file is on its way.
  it("answers 404 for POST /exports, which the server has not built", () => {
    expect(router.handle({ method: "post", url: "/exports" }).status).toBe(404);
  });

  it("answers 404 for any write, since the console is read-only in v1", () => {
    for (const method of ["post", "put", "patch", "delete"]) {
      expect(router.handle({ method, url: "/companies" }).status).toBe(404);
    }
  });
});

describe("createPlatformMockRouter, plan and client scope", () => {
  const router = createPlatformMockRouter({ now: NOW });
  const get = (url, params) => router.handle({ method: "get", url, params });

  it("filters companies by plan, counting a trial as its plan", () => {
    const pro = get("/companies", { plan: "Pro", limit: 100 }).data.data;
    expect(pro.length).toBeGreaterThan(0);
    expect(pro.every((c) => String(c.plan).startsWith("Pro"))).toBe(true);
    expect(pro.some((c) => c.plan === "Pro (trial)")).toBe(true);
  });

  it("narrows every cross-client list to one client", () => {
    const company = get("/companies", { limit: 1 }).data.data[0];
    for (const resource of ["inventory", "transactions", "events", "audit"]) {
      const rows = get(`/${resource}`, { company: company.id, limit: 100 }).data.data;
      expect(rows.length, `${resource} has rows for one client`).toBeGreaterThan(0);
      expect(
        rows.every((row) => row.companyId === company.id),
        `${resource} rows all belong to the chosen client`,
      ).toBe(true);
    }
  });
});
