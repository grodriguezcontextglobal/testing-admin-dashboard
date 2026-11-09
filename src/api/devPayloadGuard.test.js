import { beforeEach, describe, expect, it } from "vitest";
import {
  inspectCompanyContext,
  inspectRequest,
  requestBody,
  requestCompanyId,
  requestPath,
  resetGuard,
} from "./devPayloadGuard";

const CONTRACT = [
  {
    method: "POST",
    endpoint: "/api/db_item/delete-item",
    required: ["company_id", "item_id"],
    params: [],
    dynamic: [],
    source: "controller/item.js:1",
  },
  {
    method: "GET",
    endpoint: "/api/company/provider-companies",
    required: ["creator"],
    params: [],
    dynamic: [],
    source: "controller/company.js:2",
  },
];

describe("requestPath", () => {
  it("strips the origin from an absolute baseURL", () => {
    expect(
      requestPath({ baseURL: "https://api.devitrak.net/api", url: "/db_item/delete-item" })
    ).toBe("/api/db_item/delete-item");
  });

  it("handles a bare path baseURL, as the dev proxy uses", () => {
    expect(requestPath({ baseURL: "/api", url: "/db_item/delete-item" })).toBe(
      "/api/db_item/delete-item"
    );
  });

  it("drops the query string and collapses double slashes", () => {
    expect(requestPath({ baseURL: "/api/", url: "/x?y=1" })).toBe("/api/x");
  });
});

describe("requestBody", () => {
  it("reads `data` for a write", () => {
    expect(requestBody({ method: "post", data: { a: 1 } })).toEqual({ a: 1 });
  });

  it("reads `params` for a get, which has no body", () => {
    expect(requestBody({ method: "get", params: { creator: "x" } })).toEqual({
      creator: "x",
    });
  });

  it("accepts either for a delete", () => {
    expect(requestBody({ method: "delete", data: { a: 1 } })).toEqual({ a: 1 });
    expect(requestBody({ method: "delete", params: { a: 2 } })).toEqual({ a: 2 });
  });
});

describe("inspectRequest", () => {
  beforeEach(resetGuard);

  it("catches a payload assembled at runtime, which the static audit cannot read", () => {
    const body = {};
    body.item_id = 7; // built dynamically — no object literal to scan
    const problem = inspectRequest(
      { method: "post", baseURL: "/api", url: "/db_item/delete-item", data: body },
      CONTRACT
    );
    expect(problem).toMatchObject({
      endpoint: "POST /api/db_item/delete-item",
      missing: ["company_id"],
    });
  });

  it("says nothing when the payload is complete", () => {
    expect(
      inspectRequest(
        {
          method: "post",
          baseURL: "/api",
          url: "/db_item/delete-item",
          data: { item_id: 7, company_id: 1 },
        },
        CONTRACT
      )
    ).toBeNull();
  });

  it("checks a get against its query string", () => {
    expect(
      inspectRequest(
        { method: "get", baseURL: "/api", url: "/company/provider-companies", params: {} },
        CONTRACT
      ).missing
    ).toEqual(["creator"]);
  });

  it("reports one endpoint once, so a request in a loop cannot bury the console", () => {
    const config = {
      method: "post",
      baseURL: "/api",
      url: "/db_item/delete-item",
      data: {},
    };
    expect(inspectRequest(config, CONTRACT)).toBeTruthy();
    expect(inspectRequest(config, CONTRACT)).toBeNull();
    resetGuard();
    expect(inspectRequest(config, CONTRACT)).toBeTruthy();
  });

  it("stays quiet until a contract is available", () => {
    // Requests fired before the dynamic import resolves are simply not checked;
    // a guard that cannot read the contract must not invent a complaint.
    expect(
      inspectRequest({ method: "post", baseURL: "/api", url: "/db_item/delete-item" })
    ).toBeNull();
  });
});

// GovRAMP code action #6 (FRONTEND_govramp_pending_2026-11-09.md, AC-4). The
// server's authorizePermission checks the permission against the company_id
// it reads from the path, the body or the query, while controllers act on the
// s-company-lq header. With COMPANY_CONTEXT_MODE=warn it logs a mismatch; with
// enforce it answers 403. This finds the call sites before enforce does.
describe("company context", () => {
  const CONTEXT_CONTRACT = [
    {
      method: "GET",
      endpoint: "/api/db_item/check-inventory/:company_id",
      required: [],
      params: ["company_id"],
      dynamic: [],
      source: "controller/item.js:3",
    },
  ];
  const request = (overrides) => ({
    baseURL: "/api",
    method: "post",
    url: "/db_item/delete-item",
    headers: { "s-company-lq": "12" },
    data: { company_id: 12, item_id: 1 },
    ...overrides,
  });

  beforeEach(() => resetGuard());

  it("reads company_id from the body, then the query", () => {
    expect(requestCompanyId(request())).toBe("12");
    expect(requestCompanyId(request({ data: {}, params: { company_id: 7 } }))).toBe("7");
    expect(requestCompanyId(request({ method: "get", data: undefined, params: { company_id: 5 } }))).toBe("5");
  });

  it("reads company_id from the path of a route that has it there", () => {
    const config = request({ method: "get", url: "/db_item/check-inventory/34", data: undefined });
    expect(requestCompanyId(config, CONTEXT_CONTRACT)).toBe("34");
  });

  it("says nothing when the request and the header name the same company", () => {
    expect(inspectCompanyContext(request(), [])).toBeNull();
    expect(inspectCompanyContext(request({ data: { company_id: "12" } }), [])).toBeNull();
  });

  it("flags a request whose company differs from s-company-lq", () => {
    expect(inspectCompanyContext(request({ data: { company_id: 99 } }), [])).toEqual({
      endpoint: "POST /api/db_item/delete-item",
      sent: "99",
      header: "12",
    });
  });

  it("flags a path company that differs from the header", () => {
    const config = request({ method: "get", url: "/db_item/check-inventory/34", data: undefined });
    expect(inspectCompanyContext(config, CONTEXT_CONTRACT)).toMatchObject({ sent: "34", header: "12" });
  });

  it("flags a Mongo id sent as the SQL company", () => {
    const problem = inspectCompanyContext(request({ data: { company_id: "65f0c0ffee0000000000abcd" } }), []);
    expect(problem?.sent).toBe("65f0c0ffee0000000000abcd");
  });

  it("only checks the SQL routes, where s-company-lq is sent", () => {
    const mongo = request({ url: "/company/update-company/abc", data: { company_id: "abc" } });
    expect(inspectCompanyContext(mongo, [])).toBeNull();
  });

  it("says nothing without a header or without a company in the request", () => {
    expect(inspectCompanyContext(request({ headers: {} }), [])).toBeNull();
    expect(inspectCompanyContext(request({ data: { item_id: 1 } }), [])).toBeNull();
    expect(inspectCompanyContext(request({ data: new FormData() }), [])).toBeNull();
  });

  it("reports one endpoint once", () => {
    const config = request({ data: { company_id: 99 } });
    expect(inspectCompanyContext(config, [])).not.toBeNull();
    expect(inspectCompanyContext(config, [])).toBeNull();
  });
});
