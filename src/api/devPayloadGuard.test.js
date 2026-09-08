import { beforeEach, describe, expect, it } from "vitest";
import { inspectRequest, requestBody, requestPath, resetGuard } from "./devPayloadGuard";

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
