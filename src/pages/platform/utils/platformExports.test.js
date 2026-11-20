import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import {
  EXPORT_DOWNLOAD_PATH,
  buildExportRequest,
  exportDownloadError,
  exportFilename,
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
      resource: "inventory",
      query: { status: "lost", company: "cmp_001", page: 1, limit: 25 },
    });
    expect(body.filters).toEqual({ status: "lost", company: "cmp_001" });
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

describe("collecting the finished file", () => {
  it("gives the job a way to be collected, on the console's own client", () => {
    // The whole of §7. The tracker read no link, opened no window and built
    // no anchor, while this very message told the operator to "open it from
    // the job notification". An operator would have asked for an export,
    // been told it was ready, and had no way to get it. It never showed in
    // production only because the server has no POST /exports yet.
    const job = exportJob({ jobId: "job_1", title: "Audit log" });
    // The path the backend confirmed on 2026-11-20:
    // GET /api/platform/exports/:jobId/file. It is requested on the platform
    // client, whose base is /api/platform, so these two halves must stay in
    // agreement -- the gate and the audit row come from being under that
    // prefix, with no exception carved for the download.
    expect(job.download).toMatchObject({ api: "platform", path: "/exports/job_1/file" });
    expect(job.successMessage).not.toMatch(/notification/i);
  });

  it("promises nothing the notification cannot do", () => {
    // The message and the button travel together: if a descriptor ever says
    // the file is ready without carrying a way to fetch it, that is the old
    // bug back.
    const job = exportJob({ jobId: "job_1", title: "Audit log" });
    expect(job.successMessage).toMatch(/ready/i);
    expect(job.download.path).toBeTruthy();
  });

  it("fetches through the gate instead of handing out a url", () => {
    // A link in a notification is a file anyone holding the string can
    // fetch, from a session that never passed the console gate and that
    // leaves no row in platform_audit_log. The path is relative and is
    // requested on the platform client, so the gate runs again.
    expect(EXPORT_DOWNLOAD_PATH("job_1")).not.toMatch(/^https?:/);
    expect(EXPORT_DOWNLOAD_PATH("a/b")).toBe("/exports/a%2Fb/file");
    const tracker = fs.readFileSync(
      path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../../../components/backgroundJobs/BackgroundJobsTracker.jsx",
      ),
      "utf8",
    );
    expect(tracker).toContain("responseType");
    expect(tracker).not.toContain("window.open");
  });

  it("lets the server name the file, and dates its own fallback", () => {
    expect(
      exportFilename({ "content-disposition": 'attachment; filename="audit-2026-11-20.csv"' }),
    ).toBe("audit-2026-11-20.csv");
    expect(exportFilename({}, { title: "Audit log", at: new Date("2026-11-20T10:00:00Z") })).toBe(
      "devitrak-audit-log-2026-11-20.csv",
    );
    expect(exportFilename(undefined, { title: "", at: new Date("2026-11-20T10:00:00Z") })).toBe(
      "devitrak-export-2026-11-20.csv",
    );
  });

  it("says the export survived when only the download failed", () => {
    // Opposite meanings: exportStartError means nothing was exported, this
    // one means the file exists and only collecting it failed -- so "try
    // again" is honest rather than a repeat of expensive work.
    expect(exportDownloadError({ response: { status: 404 } }).title).toMatch(/does not have/i);
    expect(exportDownloadError({ response: { status: 403 } }).title).toMatch(/not allowed/i);
    const gone = exportDownloadError({ response: { status: 410 } });
    expect(gone.title).toMatch(/expired/i);
    // The window is one hour (confirmed by the backend, 2026-11-20). Naming
    // it is what makes re-running read as the normal next step rather than
    // as a failure the operator caused.
    expect(gone.description).toMatch(/one hour/i);
    const other = exportDownloadError(new Error("boom"));
    expect(other.description).toMatch(/still on the server/i);
  });
});
