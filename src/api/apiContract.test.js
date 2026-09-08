import { describe, expect, it } from "vitest";
import {
  bodyFromAxiosArgs,
  checkPayload,
  findEndpoint,
  normalizePath,
  requiredBodyFields,
} from "./apiContract";

const CONTRACT = [
  {
    method: "POST",
    endpoint: "/api/db_item/delete-item",
    required: ["company_id", "item_id"],
    body: ["company_id", "item_id"],
    params: [],
    dynamic: [],
    source: "controller/item.js:1",
  },
  {
    method: "POST",
    endpoint: "/api/db_item/:id",
    required: ["company_id", "item_id"],
    body: ["company_id", "item_id"],
    params: [],
    dynamic: [],
    source: "controller/item.js:2",
  },
  {
    method: "GET",
    endpoint: "/api/company/provider-companies",
    required: ["creator"],
    body: ["creator"],
    params: [],
    dynamic: [],
    source: "controller/company.js:3",
  },
  {
    method: "GET",
    endpoint: "/api/db_inventory/container-items/:container_item_id",
    required: ["container_item_id"],
    body: [],
    params: ["container_item_id"],
    dynamic: [],
    source: "controller/inventory.js:4",
  },
  {
    method: "POST",
    endpoint: "/api/db_item/edit-item",
    required: ["company_id"],
    body: ["company_id"],
    params: [],
    dynamic: ["update"],
    source: "controller/item.js:5",
  },
  {
    method: "DELETE",
    endpoint: "/api/db_item/event-items",
    required: ["event_id"],
    body: ["event_id", "items"],
    params: [],
    dynamic: [],
    source: "controller/item.js:6",
  },
];

describe("normalizePath", () => {
  it("drops the query string and collapses slashes", () => {
    expect(normalizePath("/api//db_item/x/?a=1")).toBe("/api/db_item/x");
  });

  it("survives nothing", () => {
    expect(normalizePath(undefined)).toBe("/");
  });
});

describe("findEndpoint", () => {
  it("prefers the literal route over the parameter route of the same shape", () => {
    // Both `/api/db_item/delete-item` and `/api/db_item/:id` have two segments
    // after /api; matching by segment count alone picks whichever comes first.
    expect(findEndpoint(CONTRACT, "POST", "/api/db_item/delete-item").source).toBe(
      "controller/item.js:1"
    );
  });

  it("falls back to the parameter route for a real id", () => {
    expect(findEndpoint(CONTRACT, "POST", "/api/db_item/4471").source).toBe(
      "controller/item.js:2"
    );
  });

  it("matches regardless of the method's case", () => {
    expect(findEndpoint(CONTRACT, "post", "/api/db_item/delete-item")).toBeTruthy();
  });

  it("does not match a different method or a different length", () => {
    expect(findEndpoint(CONTRACT, "PUT", "/api/db_item/delete-item")).toBeNull();
    expect(findEndpoint(CONTRACT, "POST", "/api/db_item")).toBeNull();
  });

  it("returns null for an endpoint the contract does not carry", () => {
    expect(findEndpoint(CONTRACT, "POST", "/api/nope/at-all")).toBeNull();
    expect(findEndpoint(undefined, "POST", "/api/x")).toBeNull();
  });
});

describe("requiredBodyFields", () => {
  it("drops what the URL already carries", () => {
    // `container_item_id` is in the path; asking for it in the body too is how
    // a naive check reports a missing field on a perfectly good request.
    const entry = findEndpoint(
      CONTRACT,
      "GET",
      "/api/db_inventory/container-items/9"
    );
    expect(requiredBodyFields(entry)).toEqual([]);
  });

  it("keeps what only the body can carry", () => {
    const entry = findEndpoint(CONTRACT, "POST", "/api/db_item/delete-item");
    expect(requiredBodyFields(entry)).toEqual(["company_id", "item_id"]);
  });

  it("survives a missing entry", () => {
    expect(requiredBodyFields(null)).toEqual([]);
  });
});

describe("checkPayload", () => {
  it("names exactly what is missing, and what was sent instead", () => {
    const result = checkPayload(CONTRACT, {
      method: "POST",
      url: "/api/db_item/delete-item",
      body: { item_id: 7 },
    });
    expect(result).toMatchObject({
      endpoint: "POST /api/db_item/delete-item",
      missing: ["company_id"],
      sent: ["item_id"],
      source: "controller/item.js:1",
    });
  });

  it("treats an explicit undefined or null as absent", () => {
    // `{ company_id: undefined }` reaches the server as no field at all.
    expect(
      checkPayload(CONTRACT, {
        method: "POST",
        url: "/api/db_item/delete-item",
        body: { item_id: 7, company_id: undefined },
      }).missing
    ).toEqual(["company_id"]);
  });

  it("says nothing when the payload is complete", () => {
    expect(
      checkPayload(CONTRACT, {
        method: "POST",
        url: "/api/db_item/delete-item",
        body: { item_id: 7, company_id: 1 },
      })
    ).toBeNull();
  });

  it("says nothing about an endpoint it does not know", () => {
    expect(
      checkPayload(CONTRACT, { method: "POST", url: "/api/unknown", body: {} })
    ).toBeNull();
  });

  it("says nothing about a dynamic body, where any field is legitimate", () => {
    expect(
      checkPayload(CONTRACT, { method: "POST", url: "/api/db_item/edit-item", body: {} })
    ).toBeNull();
  });

  it("reports a call that sends no body at all", () => {
    expect(
      checkPayload(CONTRACT, { method: "POST", url: "/api/db_item/4471" }).missing
    ).toEqual(["company_id", "item_id"]);
  });
});

describe("bodyFromAxiosArgs", () => {
  it("takes the second argument as the body for a write", () => {
    expect(bodyFromAxiosArgs("POST", { a: 1 })).toEqual({ a: 1 });
  });

  it("reads `params` for a get — the second argument is a config", () => {
    expect(bodyFromAxiosArgs("GET", { params: { creator: "x" } })).toEqual({
      creator: "x",
    });
  });

  it("reads `data` for a delete", () => {
    expect(bodyFromAxiosArgs("DELETE", { data: { event_id: 3 } })).toEqual({
      event_id: 3,
    });
  });

  it("survives a get with no config", () => {
    expect(bodyFromAxiosArgs("GET", undefined)).toBeUndefined();
  });
});

describe("findEndpoint in pattern mode", () => {
  it("prefers the parameter route for an interpolated segment", () => {
    // A path read out of source can carry `${id}`; the audit collapses it to a
    // placeholder, and `/api/db_item/:id` is a better answer for it than the
    // literal `/api/db_item/delete-item` that happens to have the same shape.
    expect(
      findEndpoint(CONTRACT, "POST", "/api/db_item/:x", { pattern: true })?.source
    ).toBe("controller/item.js:2");
  });

  it("still prefers a literal route over a parameter one", () => {
    expect(
      findEndpoint(CONTRACT, "POST", "/api/db_item/delete-item", { pattern: true })
        ?.source
    ).toBe("controller/item.js:1");
  });
});
