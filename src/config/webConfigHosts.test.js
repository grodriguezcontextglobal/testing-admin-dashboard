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

  it("has no comment XML forbids, which this parser accepts and IIS does not", () => {
    // 2026-11-23: both sites answered 500 for roughly three hours. The cause
    // was a comment in this file containing "--", which XML forbids inside a
    // comment. IIS reported it exactly:
    //
    //   Config Error: Configuration file is not well-formed XML
    //   Config Source: 110: ... answered 500 -- static files included ...
    //
    // The test above did not catch it, and its own comment already said what
    // was at stake: a file that does not parse takes down the whole
    // dashboard. happy-dom's DOMParser is lenient about this and reports no
    // parsererror, so the guard has to be explicit.
    //
    // It happened twice. The second time was the fix for the first, rewritten
    // with "--" again -- which is why an hour of rollbacks and redeploys
    // changed nothing.
    const comments = text.match(/<!--[\s\S]*?-->/g) ?? [];
    expect(comments.length).toBeGreaterThan(0);
    for (const comment of comments) {
      const body = comment.slice(4, -3);
      const at = body.indexOf("--");
      const where = at === -1 ? "" : body.slice(Math.max(0, at - 40), at + 40).trim();
      expect(body.includes("--"), `comment contains "--" near: ${where}`).toBe(false);
      // A comment may not end with a hyphen either: it would make "--->".
      expect(body.endsWith("-"), "comment ends with a hyphen").toBe(false);
    }
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

describe("version.json, so production can state what it serves", () => {
  // POA&M DVK-ADMIN-2026-001, M4. On 2026-11-18 a released build sat
  // undeployed and the only way to tell was to fingerprint a hashed bundle
  // filename and compare Last-Modified -- indirect, and useless the moment a
  // build is byte-identical to the one before it.
  //
  // release.yml writes dist/version.json at package time; this file is what
  // makes it readable. deploy-check.yml reads it from outside the VM, so if
  // either half goes, the monitor silently stops monitoring.
  const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

  it("is served as a plain static file, with no <location> block at all", () => {
    // This assertion is inverted from what it said this morning, and the
    // reason is an outage.
    //
    // Two attempts were made to serve version.json uncached. A Cache-Control
    // custom header scoped with <location> deployed fine and never appeared
    // in the response. Replacing it with <staticContent><clientCache
    // cacheControlMode="DisableCache" /> inside the same <location> also
    // produced no header, and roughly twenty minutes later every request to
    // both sites answered 500 -- static files included, which is an IIS
    // configuration error and not an application fault. staticContent is
    // commonly locked at machine level, and a worker process still holding
    // the previous configuration would not fail until it recycled.
    //
    // The cache header is tracked in the POA&M as risk accepted with a
    // compensating control. It is not worth a second outage: the monitor
    // busts cache itself.
    // No comment stripping. An earlier version of this test removed comments
    // with a regex first, and CodeQL flagged it as incomplete sanitization --
    // correctly as a pattern, harmlessly in a test that reads a repository
    // file. Rather than carry a dismissed alert, the file's own prose avoids
    // writing these elements in angle brackets, so matching the element form
    // cannot hit the explanation of why the element is absent.
    expect(text).not.toMatch(/<location/);
    // Nothing should reintroduce the section that took the site down. The one
    // staticContent this file has is the mimeMap block, at the top level,
    // where it has always worked.
    expect(text).not.toMatch(/<clientCache/);
    expect(text.match(/<staticContent>/g) ?? []).toHaveLength(1);
  });

  it("is written by the release with the tag it is publishing", () => {
    const release = fs.readFileSync(
      path.join(ROOT_DIR, ".github", "workflows", "release.yml"),
      "utf8",
    );
    expect(release).toContain("dist/version.json");
    // The tag must be the one in the same step, not recomputed: two clocks
    // one second apart would publish a release whose artifact names a
    // different build, and the monitor would compare two tags and conclude
    // wrongly -- the exact failure mode M3 was written to avoid.
    const step = release.slice(release.indexOf("- name: Package"));
    expect(step.slice(0, step.indexOf("- name: SBOM"))).toMatch(/"tag": "\$tag"/);
  });

  it("is read by a check that lives off the machine it checks", () => {
    const check = fs.readFileSync(
      path.join(ROOT_DIR, ".github", "workflows", "deploy-check.yml"),
      "utf8",
    );
    expect(check).toContain("version.json");
    expect(check).toMatch(/schedule:/);
    // runs-on a GitHub runner, never a self-hosted one on DEVITRACKAPP: a
    // monitor on the machine it monitors shares its failure modes, and the
    // failure mode is "the thing on that machine stopped running".
    expect(check).toMatch(/runs-on: ubuntu-latest/);
    expect(check).not.toMatch(/self-hosted/);
    // Two samples before concluding, because one can be confidently wrong.
    expect(check).toContain("RESAMPLE_SECONDS");
  });
});
