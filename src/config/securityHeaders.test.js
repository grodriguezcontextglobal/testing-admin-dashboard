import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  SECURITY_HEADERS_MARKER,
  buildContentSecurityPolicy,
  buildSecurityHeaders,
  cspReportUri,
  injectSecurityHeaders,
  previewSecurityHeaders,
} from "./securityHeaders";

// fedRAMP/FRONTEND_action_plan_2026-10-26.md, A2: admin.devitrak.net answered
// with no security header at all and advertised X-Powered-By (SC-8, SC-7).

const API = ["https://api.devitrak.net", "https://api-backup.devitrak.net"];

const directive = (policy, name) =>
  policy
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name} `));

describe("buildContentSecurityPolicy", () => {
  const policy = buildContentSecurityPolicy({ apiOrigins: API });

  it("lets the page talk only to itself, the API, Stripe and the status page", () => {
    const connect = directive(policy, "connect-src");
    expect(connect).toContain("'self'");
    API.forEach((origin) => expect(connect).toContain(origin));
    expect(connect).toContain("https://api.stripe.com");
    expect(connect).toContain("https://devitrak-status.cacaminero.workers.dev");
    expect(connect).not.toMatch(/(^|\s)https:(\s|$)/);
  });

  // 2026-10-29: with the CSP enforced in production, @iconify/react could not
  // fetch icons and they vanished. The icons now ship with the app
  // (iconifyIcons.js), so the page has no reason to reach Iconify's API.
  it("does not let the page reach Iconify's API", () => {
    const connect = directive(policy, "connect-src");
    ["iconify.design", "simplesvg.com", "unisvg.com"].forEach((host) => expect(connect).not.toContain(host));
  });

  // Signed contracts, profile documents, platform policies and school consent
  // open in an <iframe> on a 5-minute S3 link from the server
  // (server-testing helpers/s3Upload.js, getTemporaryDownloadUrl). The bucket
  // name has dots, so over https the AWS SDK signs it path-style.
  it("lets the document viewers frame the documents bucket, and no other bucket", () => {
    const frame = directive(policy, "frame-src");
    expect(frame).toContain("https://s3.us-east-2.amazonaws.com/devitrak.documents.admin.dashboard/");
    expect(frame).toContain("https://devitrak.documents.admin.dashboard.s3.us-east-2.amazonaws.com");
    expect(frame).not.toMatch(/(^|\s)https:\/\/s3\.us-east-2\.amazonaws\.com(\s|$)/);
    expect(frame).not.toContain("*.s3");
    expect(frame).not.toContain("*.amazonaws.com");
  });

  it("runs scripts from itself and Stripe only, never inline or eval", () => {
    const script = directive(policy, "script-src");
    expect(script).toContain("'self'");
    expect(script).toContain("https://js.stripe.com");
    expect(script).not.toContain("'unsafe-inline'");
    expect(script).not.toContain("'unsafe-eval'");
  });

  it("cannot be framed, and plugins and base tags are off", () => {
    expect(directive(policy, "frame-ancestors")).toBe("frame-ancestors 'none'");
    expect(directive(policy, "object-src")).toBe("object-src 'none'");
    expect(directive(policy, "base-uri")).toBe("base-uri 'self'");
    expect(directive(policy, "form-action")).toBe("form-action 'self'");
  });

  it("drops trailing slashes and blanks from the API origins", () => {
    const loose = buildContentSecurityPolicy({ apiOrigins: ["https://api.devitrak.net/", "", undefined] });
    expect(directive(loose, "connect-src")).toContain("https://api.devitrak.net ");
    expect(loose).not.toContain("undefined");
  });

  // Production builds with VITE_APP_DEVITRACK_API=https://db.devitrak.net/api.
  // A CSP source with a path and no trailing slash matches that exact URL
  // only, so every /api/... call was a violation and would be blocked once
  // the policy is enforced.
  it("names API hosts by origin only, once, so every API path is allowed", () => {
    const prod = buildContentSecurityPolicy({
      apiOrigins: ["https://db.devitrak.net/api", "https://db.devitrak.net/api/"],
    });
    const connect = directive(prod, "connect-src");
    expect(connect).toContain("https://db.devitrak.net ");
    expect(connect).not.toMatch(/devitrak\.net\/api/);
    expect(connect.match(/https:\/\/db\.devitrak\.net/g)).toHaveLength(1);
  });
});

describe("buildSecurityHeaders", () => {
  const headers = Object.fromEntries(
    buildSecurityHeaders({ apiOrigins: API }).map(({ name, value }) => [name, value])
  );

  it("sets the baseline headers", () => {
    expect(headers["Strict-Transport-Security"]).toBe("max-age=31536000; includeSubDomains");
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["Permissions-Policy"]).toContain("camera=()");
  });

  it("ships the CSP in report-only mode first", () => {
    expect(headers["Content-Security-Policy-Report-Only"]).toBe(
      buildContentSecurityPolicy({ apiOrigins: API, trustedTypes: true })
    );
    expect(headers["Content-Security-Policy"]).toBeUndefined();
  });

  it("enforces the CSP when asked to", () => {
    const enforced = Object.fromEntries(
      buildSecurityHeaders({ apiOrigins: API, enforceCsp: true }).map(({ name, value }) => [name, value])
    );
    expect(enforced["Content-Security-Policy"]).toBe(buildContentSecurityPolicy({ apiOrigins: API }));
    // Only Trusted Types stays report-only (see "Trusted Types reporting").
    expect(directive(enforced["Content-Security-Policy-Report-Only"], "default-src")).toBeUndefined();
  });
});

// GovRAMP code action #2 (FRONTEND_govramp_code_actions_2026-11-09.md, SI-10):
// every string that reaches a DOM sink able to run script (innerHTML,
// script src, eval-like calls) is reported, never blocked. The reports decide
// whether Trusted Types can be enforced later (decision D2).
describe("Trusted Types reporting", () => {
  const PROD_API = ["https://db.devitrak.net/api"];
  const REPORT_URI = "https://db.devitrak.net/api/csp-report";
  const TRUSTED_TYPES = "require-trusted-types-for 'script'";
  const headersFor = (options) =>
    Object.fromEntries(buildSecurityHeaders(options).map(({ name, value }) => [name, value]));

  it("reports Trusted Types violations while the CSP is report-only", () => {
    const policy = headersFor({ apiOrigins: PROD_API })["Content-Security-Policy-Report-Only"];
    expect(directive(policy, "require-trusted-types-for")).toBe(TRUSTED_TYPES);
    expect(directive(policy, "report-uri")).toBe(`report-uri ${REPORT_URI}`);
  });

  it("is off in the policy itself unless asked for", () => {
    const policy = buildContentSecurityPolicy({ apiOrigins: PROD_API });
    expect(directive(policy, "require-trusted-types-for")).toBeUndefined();
  });

  it("never blocks on Trusted Types when the CSP is enforced", () => {
    const headers = headersFor({ apiOrigins: PROD_API, enforceCsp: true });
    expect(directive(headers["Content-Security-Policy"], "require-trusted-types-for")).toBeUndefined();
  });

  it("keeps reporting Trusted Types in a separate report-only policy once the CSP is enforced", () => {
    const reportOnly = headersFor({ apiOrigins: PROD_API, enforceCsp: true })["Content-Security-Policy-Report-Only"];
    expect(reportOnly).toBe(`${TRUSTED_TYPES}; report-uri ${REPORT_URI}; report-to csp`);
  });

  it("still reports to the console when there is no endpoint", () => {
    const headers = headersFor({ apiOrigins: ["http://localhost:34001"], enforceCsp: true });
    expect(headers["Content-Security-Policy-Report-Only"]).toBe(TRUSTED_TYPES);
  });

  // IIS refuses a web.config that adds the same header twice.
  it("never sends the same header name twice", () => {
    for (const enforceCsp of [false, true]) {
      const names = buildSecurityHeaders({ apiOrigins: PROD_API, enforceCsp }).map(({ name }) => name);
      expect(new Set(names).size).toBe(names.length);
    }
  });
});

// GovRAMP code action #1 (FRONTEND_govramp_code_actions_2026-11-09.md): the
// backend's POST /api/csp-report is live, so violations reach the server
// instead of only the browser console. A week of them is the evidence for
// switching the policy to enforce (SC-18).
describe("CSP reporting", () => {
  const PROD_API = ["https://db.devitrak.net/api", "https://db-backup.devitrak.net/api"];
  const REPORT_URI = "https://db.devitrak.net/api/csp-report";

  it("reports to the primary API's /csp-report", () => {
    expect(cspReportUri(PROD_API)).toBe(REPORT_URI);
    expect(cspReportUri(["https://db.devitrak.net/api/"])).toBe(REPORT_URI);
  });

  it("names the endpoint in the policy, both ways browsers read it", () => {
    const policy = buildContentSecurityPolicy({ apiOrigins: PROD_API });
    expect(directive(policy, "report-uri")).toBe(`report-uri ${REPORT_URI}`);
    expect(directive(policy, "report-to")).toBe("report-to csp");
  });

  it("declares the csp reporting group the policy points to", () => {
    const headers = Object.fromEntries(
      buildSecurityHeaders({ apiOrigins: PROD_API }).map(({ name, value }) => [name, value])
    );
    expect(headers["Reporting-Endpoints"]).toBe(`csp="${REPORT_URI}"`);
  });

  it("keeps reporting once the policy is enforced", () => {
    const headers = Object.fromEntries(
      buildSecurityHeaders({ apiOrigins: PROD_API, enforceCsp: true }).map(({ name, value }) => [name, value])
    );
    expect(directive(headers["Content-Security-Policy"], "report-uri")).toBe(`report-uri ${REPORT_URI}`);
    expect(headers["Reporting-Endpoints"]).toBe(`csp="${REPORT_URI}"`);
  });

  it("reports nowhere rather than to an unusable endpoint", () => {
    for (const apiOrigins of [[], ["", undefined], ["http://db.devitrak.net/api"], ["not a url"]]) {
      expect(cspReportUri(apiOrigins)).toBeNull();
      const policy = buildContentSecurityPolicy({ apiOrigins });
      expect(directive(policy, "report-uri")).toBeUndefined();
      expect(directive(policy, "report-to")).toBeUndefined();
      const names = buildSecurityHeaders({ apiOrigins }).map(({ name }) => name);
      expect(names).not.toContain("Reporting-Endpoints");
    }
  });
});

describe("injectSecurityHeaders", () => {
  const config = `<configuration>\n  <system.webServer>\n    ${SECURITY_HEADERS_MARKER}\n  </system.webServer>\n</configuration>\n`;

  it("replaces the marker with IIS customHeaders and removes X-Powered-By", () => {
    const out = injectSecurityHeaders(config, [{ name: "X-Frame-Options", value: "DENY" }]);
    expect(out).not.toContain(SECURITY_HEADERS_MARKER);
    expect(out).toContain('<remove name="X-Powered-By" />');
    expect(out).toContain('<add name="X-Frame-Options" value="DENY" />');
  });

  it("escapes values for XML", () => {
    const out = injectSecurityHeaders(config, [{ name: "X", value: `a "b" & <c>` }]);
    expect(out).toContain('value="a &quot;b&quot; &amp; &lt;c&gt;"');
  });

  it("refuses a web.config without the marker, so headers are never silently lost", () => {
    expect(() => injectSecurityHeaders("<configuration/>", [])).toThrow(/marker/);
  });

  it("public/web.config carries the marker exactly once", () => {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const webConfig = fs.readFileSync(path.resolve(here, "../../public/web.config"), "utf8");
    expect(webConfig.split(SECURITY_HEADERS_MARKER)).toHaveLength(2);
  });
});

// GovRAMP code action #9 (FRONTEND_govramp_pending_2026-11-10.md, SC-18,
// SA-11): the E2E CSP check serves the build with vite preview. It has to
// enforce the policy production would enforce, and must never send reports to
// a real API's /csp-report: they would mix into the production summary.
describe("previewSecurityHeaders", () => {
  const preview = previewSecurityHeaders({ apiOrigins: API });
  const production = Object.fromEntries(
    buildSecurityHeaders({ apiOrigins: API, enforceCsp: true }).map(({ name, value }) => [name, value])
  );
  const withoutReporting = (policy) =>
    policy
      .split("; ")
      .filter((part) => !part.startsWith("report-uri") && !part.startsWith("report-to"))
      .join("; ");

  it("enforces the same policy as an enforcing production build", () => {
    expect(preview["Content-Security-Policy"]).toBe(withoutReporting(production["Content-Security-Policy"]));
  });

  it("keeps the other production headers", () => {
    expect(preview["X-Frame-Options"]).toBe("DENY");
    expect(preview["X-Content-Type-Options"]).toBe("nosniff");
  });

  it("reports nowhere", () => {
    Object.values(preview).forEach((value) => {
      expect(value).not.toMatch(/report-uri|report-to|csp-report/);
    });
    expect(preview["Reporting-Endpoints"]).toBeUndefined();
  });

  it("still surfaces Trusted Types violations, report-only", () => {
    expect(preview["Content-Security-Policy-Report-Only"]).toBe("require-trusted-types-for 'script'");
  });
});
