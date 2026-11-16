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
    const { companies, people } = createPlatformMockData(NOW);
    for (const c of companies) expect(c.ownerEmail).toMatch(/@[a-z0-9-]+\.example$/);
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
    for (const tab of ["merchant", "subscription"]) {
      const res = get(`/companies/${id}/${tab}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data.data)).toBe(false);
    }
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

  it("splits people into members and consumers", () => {
    const members = get("/people", { kind: "members", limit: 50 }).data.data;
    expect(members.every((p) => p.kind === "member")).toBe(true);
    const consumers = get("/people", { kind: "consumers", limit: 50 }).data.data;
    expect(consumers.every((p) => p.kind === "consumer")).toBe(true);
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
