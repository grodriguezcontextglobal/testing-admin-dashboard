import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  SECURITY_HEADERS_MARKER,
  buildContentSecurityPolicy,
  buildSecurityHeaders,
  injectSecurityHeaders,
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
  // fetch icons, and every icon not already cached in the browser vanished
  // (the Events and Staff nav tabs first). It fetches from these three hosts.
  it("lets @iconify/react fetch icons from its API and fallbacks", () => {
    const connect = directive(policy, "connect-src");
    ["https://api.iconify.design", "https://api.simplesvg.com", "https://api.unisvg.com"].forEach((host) =>
      expect(connect).toContain(host)
    );
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
      buildContentSecurityPolicy({ apiOrigins: API })
    );
    expect(headers["Content-Security-Policy"]).toBeUndefined();
  });

  it("enforces the CSP when asked to", () => {
    const enforced = Object.fromEntries(
      buildSecurityHeaders({ apiOrigins: API, enforceCsp: true }).map(({ name, value }) => [name, value])
    );
    expect(enforced["Content-Security-Policy"]).toBeDefined();
    expect(enforced["Content-Security-Policy-Report-Only"]).toBeUndefined();
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
