import { describe, expect, it } from "vitest";
import { evaluateAudit } from "./auditGate";

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
