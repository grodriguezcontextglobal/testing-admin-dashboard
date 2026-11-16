import { describe, it, expect } from "vitest";
import {
  buildExportRequest,
  exportJob,
  exportStartError,
  readExportJobId,
} from "./platformExports";

describe("buildExportRequest", () => {
  it("asks for the resource as CSV", () => {
    const body = buildExportRequest({ resource: "transactions" });
    expect(body.resource).toBe("transactions");
    expect(body.format).toBe("csv");
  });

  // The whole point of the export: the user wants every matching row, not the
  // 25 they happen to be looking at.
  it("drops the pagination, so the export is the whole filtered set", () => {
    const body = buildExportRequest({
      resource: "inventory",
      query: { status: "lost", search: "RX-0", page: 4, limit: 25 },
    });
    expect(body.filters).toEqual({ status: "lost", search: "RX-0" });
    expect(body.filters.page).toBeUndefined();
    expect(body.filters.limit).toBeUndefined();
  });

  it("keeps every other filter, including a company scope", () => {
    const body = buildExportRequest({
      resource: "people",
      query: { kind: "members", company: "cmp_001", page: 1, limit: 25 },
    });
    expect(body.filters).toEqual({ kind: "members", company: "cmp_001" });
  });

  it("leaves out empty values instead of sending them", () => {
    const body = buildExportRequest({
      resource: "events",
      query: { status: "", search: undefined, lead: null, page: 1 },
    });
    expect(body.filters).toEqual({});
  });

  it("survives being called with nothing", () => {
    expect(buildExportRequest()).toEqual({ resource: undefined, format: "csv", filters: {} });
  });
});

describe("readExportJobId", () => {
  it("reads the id at the top of the answer", () => {
    expect(readExportJobId({ ok: true, jobId: "job_1" })).toBe("job_1");
  });

  it("reads it from data, for the console's usual envelope", () => {
    expect(readExportJobId({ ok: true, data: { jobId: "job_2" } })).toBe("job_2");
  });

  it("is null when the server sent no id, so nothing is tracked forever", () => {
    expect(readExportJobId({ ok: true })).toBeNull();
    expect(readExportJobId(null)).toBeNull();
    expect(readExportJobId({ ok: true, jobId: "" })).toBeNull();
    expect(readExportJobId({ ok: true, jobId: 7 })).toBeNull();
  });
});

describe("exportJob", () => {
  it("describes the job for BackgroundJobsTracker", () => {
    const job = exportJob({ jobId: "job_1", title: "Transactions" });
    expect(job.jobId).toBe("job_1");
    expect(job.type).toBe("platform-export");
    expect(job.successMessage).toContain("Transactions");
    expect(job.failureMessage).toContain("Transactions");
  });

  // The tracker invalidates with `exact: true`, and a console list key is
  // ["platform", resource, query] — the query object included. A key such as
  // ["platform", "audit"] matches nothing, so sending one would be a quiet
  // no-op that reads like a refresh.
  it("asks for no query invalidation", () => {
    expect(exportJob({ jobId: "job_1", title: "Audit log" }).invalidateKeys).toEqual([]);
  });
});

describe("exportStartError", () => {
  it("names the endpoint on a 404, like the rest of the console", () => {
    const notice = exportStartError({ response: { status: 404 } });
    expect(notice.title).toMatch(/does not have this yet/i);
    expect(notice.description).toContain("POST /api/platform/exports");
  });

  it("tells the user to wait when the server is rate limiting", () => {
    expect(exportStartError({ response: { status: 429 } }).title).toMatch(/too many/i);
  });

  it("says nothing was exported for anything else", () => {
    const notice = exportStartError(new Error("boom"));
    expect(notice.title).toMatch(/could not start/i);
    expect(notice.description).toMatch(/nothing was exported/i);
  });
});
