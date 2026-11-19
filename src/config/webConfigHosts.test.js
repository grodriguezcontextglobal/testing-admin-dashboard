import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * One build serves two hosts: admin.devitrak.net (the customer dashboard) and
 * ops.devitrak.net (the Admin Console). The split is made by IIS, in
 * public/web.config, so these rules are the only thing keeping the console on
 * its own origin. A wrong edit here is invisible in every test that exercises
 * the app, because the dev server and vite preview never read web.config.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const WEB_CONFIG = path.join(ROOT, "public", "web.config");
const CONSOLE_HOST = "ops.devitrak.net";

const text = fs.readFileSync(WEB_CONFIG, "utf8");

describe("public/web.config", () => {
  it("is well-formed XML", () => {
    // IIS answers 500 on every request of a site whose web.config does not
    // parse, so a stray tag here takes down the whole dashboard, not a route.
    const doc = new DOMParser().parseFromString(text, "text/xml");
    expect(doc.querySelector("parsererror")).toBeNull();
  });

  it("still carries the security-headers marker", () => {
    // vite.config.js replaces it at build time; without it the build throws
    // rather than shipping a site with no CSP (securityHeaders.js).
    expect(text).toContain("<!-- SECURITY_HEADERS -->");
  });

  describe("the console lives on its own origin", () => {
    it("sends /platform to the console host from anywhere else", () => {
      const rule = text.slice(text.indexOf('<rule name="Console host'));
      expect(rule).toContain("^platform");
      expect(rule).toContain(`https://${CONSOLE_HOST}/`);
    });

    it("matches the console host on the Host header, not on the path", () => {
      expect(text).toContain("{HTTP_HOST}");
      expect(text).toContain("ops\\.devitrak\\.net");
    });

    it("redirects with 302, never 301", () => {
      // A permanent redirect for /platform is cached by the browser until the
      // user clears it: moving the console back, or to a third host, would
      // then be undoable for the people already redirected.
      expect(text).not.toContain('redirectType="Permanent"');
      expect(text).toContain('redirectType="Found"');
    });

    it("opens the console host on the console", () => {
      const rule = text.slice(text.indexOf('<rule name="Console host root'));
      expect(rule).toContain('<match url="^$" />');
      expect(rule).toContain(`url="https://${CONSOLE_HOST}/platform"`);
    });

    it("never redirects to a plain-http URL", () => {
      // Measured against production on 2026-11-19: with a relative
      // url="/platform", IIS built the Location header as
      // http://ops.devitrak.net/platform even for an https request. The chain
      // still ended on https (a 301 http->https sits in front, and HSTS is a
      // year), but a first visit without HSTS cached made one cleartext hop
      // that nobody needs. Both console rules carry the scheme themselves.
      const actions = text.match(/<action type="Redirect"[^>]*>/g) ?? [];
      expect(actions.length).toBeGreaterThan(0);
      for (const action of actions) {
        expect(action).toContain(`url="https://${CONSOLE_HOST}/`);
        expect(action).not.toContain('url="http://');
      }
    });
  });

  it("puts both console rules ahead of the React Router catch-all", () => {
    // The catch-all matches ".*" with stopProcessing="true". Anything after it
    // never runs, so an append-at-the-end edit silently disables the split.
    const catchAll = text.indexOf('<rule name="React Router"');
    const offHost = text.indexOf('<rule name="Console host only"');
    const hostRoot = text.indexOf('<rule name="Console host root"');
    expect(offHost).toBeGreaterThan(-1);
    expect(hostRoot).toBeGreaterThan(-1);
    expect(offHost).toBeLessThan(catchAll);
    expect(hostRoot).toBeLessThan(catchAll);
  });
});
