import { describe, expect, it } from "vitest";
import { auditSummaryMarkdown, evaluateAudit } from "./auditGate";

// FedRAMP plan 2026-10-26, A1: high and critical advisories fail CI unless a
// written, dated exception accepts them (RA-5, SI-2).

const advisory = (name, severity, ghsa) => ({
  source: 1,
  name,
  dependency: name,
  title: `${name} issue`,
  url: `https://github.com/advisories/${ghsa}`,
  severity,
  range: "<9.9.9",
});

const report = (...vias) => ({
  vulnerabilities: Object.fromEntries(
    vias.map((via) => [via.name, { name: via.name, severity: via.severity, via: [via] }])
  ),
});

const TODAY = "2026-10-26";

describe("evaluateAudit", () => {
  it("blocks a high or critical advisory with no exception", () => {
    const result = evaluateAudit({
      report: report(advisory("dompurify", "critical", "GHSA-aaaa"), advisory("vite", "high", "GHSA-bbbb")),
      exceptions: [],
      today: TODAY,
    });
    expect(result.blocking.map((a) => a.id)).toEqual(["GHSA-aaaa", "GHSA-bbbb"]);
  });

  it("ignores moderate and low", () => {
    const result = evaluateAudit({
      report: report(advisory("quill", "low", "GHSA-cccc"), advisory("esbuild", "moderate", "GHSA-dddd")),
      exceptions: [],
      today: TODAY,
    });
    expect(result.blocking).toEqual([]);
  });

  it("excuses an advisory with a current exception for that package", () => {
    const result = evaluateAudit({
      report: report(advisory("vite", "high", "GHSA-bbbb")),
      exceptions: [{ advisory: "GHSA-bbbb", package: "vite", reason: "dev server only", expires: "2026-12-31" }],
      today: TODAY,
    });
    expect(result.blocking).toEqual([]);
    expect(result.excused.map((a) => a.id)).toEqual(["GHSA-bbbb"]);
  });

  it("blocks again once the exception has expired", () => {
    const result = evaluateAudit({
      report: report(advisory("vite", "high", "GHSA-bbbb")),
      exceptions: [{ advisory: "GHSA-bbbb", package: "vite", reason: "x", expires: "2026-10-25" }],
      today: TODAY,
    });
    expect(result.blocking.map((a) => a.id)).toEqual(["GHSA-bbbb"]);
    expect(result.blocking[0].expiredException).toBe("2026-10-25");
  });

  it("an exception for one package does not cover the same advisory in another", () => {
    const result = evaluateAudit({
      report: report(advisory("sharp", "high", "GHSA-bbbb")),
      exceptions: [{ advisory: "GHSA-bbbb", package: "vite", reason: "x", expires: "2026-12-31" }],
      today: TODAY,
    });
    expect(result.blocking.map((a) => a.package)).toEqual(["sharp"]);
  });

  it("an exception without a reason or a valid date covers nothing", () => {
    const result = evaluateAudit({
      report: report(advisory("vite", "high", "GHSA-bbbb"), advisory("sharp", "high", "GHSA-eeee")),
      exceptions: [
        { advisory: "GHSA-bbbb", package: "vite", reason: "", expires: "2026-12-31" },
        { advisory: "GHSA-eeee", package: "sharp", reason: "x", expires: "someday" },
      ],
      today: TODAY,
    });
    expect(result.blocking).toHaveLength(2);
  });

  it("lists exceptions that no longer match anything, so they get removed", () => {
    const result = evaluateAudit({
      report: report(),
      exceptions: [{ advisory: "GHSA-ffff", package: "vite", reason: "x", expires: "2026-12-31" }],
      today: TODAY,
    });
    expect(result.unused.map((e) => e.advisory)).toEqual(["GHSA-ffff"]);
  });

  it("counts an advisory once even if npm repeats it", () => {
    const via = advisory("sharp", "high", "GHSA-gggg");
    const result = evaluateAudit({
      report: { vulnerabilities: { sharp: { via: [via, via, "sharp-ico"] } } },
      exceptions: [],
      today: TODAY,
    });
    expect(result.blocking).toHaveLength(1);
  });

  it("treats a report with no vulnerabilities as clean", () => {
    expect(evaluateAudit({ report: {}, exceptions: undefined, today: TODAY }).blocking).toEqual([]);
  });
});

// GovRAMP decision D3 (RA-5, SI-2): a low or moderate advisory with no fix is
// accepted in writing too, with a review date, and every release records the
// audit result and the accepted risks in its notes. The gate itself still
// blocks only high and critical.
describe("accepted low and moderate advisories", () => {
  const quill = advisory("quill", "low", "GHSA-v3m3-f69x-jf25");
  const acceptance = {
    advisory: "GHSA-v3m3-f69x-jf25",
    package: "quill",
    reason: "No fix; HTML is inserted only through DOMPurify.",
    expires: "2027-02-10",
  };

  it("records a current acceptance as accepted, never as blocking or unused", () => {
    const result = evaluateAudit({ report: report(quill), exceptions: [acceptance], today: TODAY });
    expect(result.blocking).toEqual([]);
    expect(result.unused).toEqual([]);
    expect(result.accepted).toEqual([
      expect.objectContaining({ id: "GHSA-v3m3-f69x-jf25", package: "quill", severity: "low", expires: "2027-02-10" }),
    ]);
  });

  it("lists a low or moderate advisory nobody accepted as unreviewed, without blocking", () => {
    const result = evaluateAudit({ report: report(quill, advisory("esbuild", "moderate", "GHSA-dddd")), exceptions: [], today: TODAY });
    expect(result.blocking).toEqual([]);
    expect(result.unreviewed.map((a) => a.id)).toEqual(["GHSA-v3m3-f69x-jf25", "GHSA-dddd"]);
  });

  it("puts an expired acceptance back among the unreviewed", () => {
    const result = evaluateAudit({ report: report(quill), exceptions: [{ ...acceptance, expires: "2026-10-01" }], today: TODAY });
    expect(result.accepted).toEqual([]);
    expect(result.unreviewed).toEqual([expect.objectContaining({ id: "GHSA-v3m3-f69x-jf25", expiredException: "2026-10-01" })]);
  });
});

describe("auditSummaryMarkdown", () => {
  it("states the counts, the accepted risks with their review date and what is unreviewed", () => {
    const result = evaluateAudit({
      report: { ...report(advisory("quill", "low", "GHSA-v3m3-f69x-jf25"), advisory("esbuild", "moderate", "GHSA-dddd")), metadata: { vulnerabilities: { critical: 0, high: 0, moderate: 1, low: 1 } } },
      exceptions: [{ advisory: "GHSA-v3m3-f69x-jf25", package: "quill", reason: "Only through DOMPurify.", expires: "2027-02-10" }],
      today: TODAY,
    });
    const markdown = auditSummaryMarkdown(result, { counts: { critical: 0, high: 0, moderate: 1, low: 1 }, today: TODAY });
    expect(markdown).toContain("0 critical, 0 high, 1 moderate, 1 low");
    expect(markdown).toMatch(/quill.*GHSA-v3m3-f69x-jf25.*low.*2027-02-10.*Only through DOMPurify\./);
    expect(markdown).toMatch(/Unreviewed[\s\S]*esbuild.*GHSA-dddd/);
  });

  it("says so when nothing is accepted or unreviewed", () => {
    const markdown = auditSummaryMarkdown(evaluateAudit({ report: {}, exceptions: [], today: TODAY }), { counts: {}, today: TODAY });
    expect(markdown).toContain("0 critical, 0 high, 0 moderate, 0 low");
    expect(markdown).toContain("None.");
  });
});
