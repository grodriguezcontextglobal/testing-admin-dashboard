import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  CONSOLE_HOST,
  CONSOLE_PATH,
  DASHBOARD_HOST,
  consoleUrl,
  dashboardUrl,
  isConsoleHost,
  isConsolePath,
  isDashboardHost,
  shouldLandOnConsole,
  shouldSendToConsole,
} from "./consoleHosts";
import { hasPlatformAccess } from "./roles";

const operator = { email: "grodriguez@devitrak.com", platformAccess: true };
const operatorWithoutFlag = { email: "ccaminero@devitrak.com" };
const staff = { email: "grodriguez@contextglobal.com", platformAccess: true };

describe("which host is this", () => {
  it("recognises each host by its whole name", () => {
    expect(isConsoleHost(CONSOLE_HOST)).toBe(true);
    expect(isDashboardHost(DASHBOARD_HOST)).toBe(true);
    expect(isConsoleHost(DASHBOARD_HOST)).toBe(false);
  });

  it("is not fooled by a name that merely contains it", () => {
    // The same rule as the email domain: compared whole, never by suffix.
    for (const lookalike of [
      "ops.devitrak.net.attacker.test",
      "notops.devitrak.net",
      "ops.devitrak.net.evil.example",
    ]) {
      expect(isConsoleHost(lookalike)).toBe(false);
    }
  });

  it("says no to a dev server, so nothing redirects while developing", () => {
    for (const local of ["localhost", "127.0.0.1", "", undefined, null]) {
      expect(isConsoleHost(local)).toBe(false);
      expect(isDashboardHost(local)).toBe(false);
    }
  });

  it("builds absolute https urls", () => {
    expect(consoleUrl()).toBe(`https://${CONSOLE_HOST}${CONSOLE_PATH}`);
    expect(consoleUrl("/platform/clients")).toBe(`https://${CONSOLE_HOST}/platform/clients`);
    expect(dashboardUrl()).toBe(`https://${DASHBOARD_HOST}/`);
  });
});

describe("which paths belong to the console", () => {
  it("is the console path and everything under it, and nothing else", () => {
    expect(isConsolePath(CONSOLE_PATH)).toBe(true);
    expect(isConsolePath("/platform/clients")).toBe(true);
    expect(isConsolePath("/")).toBe(false);
    expect(isConsolePath("/events/event-quickglance")).toBe(false);
    // A path that merely starts with the same letters is not under it.
    expect(isConsolePath("/platformers")).toBe(false);
    expect(isConsolePath(undefined)).toBe(false);
  });
});

describe("sending an operator to the console host", () => {
  it("sends a request for a console path made on the dashboard host", () => {
    expect(
      shouldSendToConsole({ hostname: DASHBOARD_HOST, pathname: CONSOLE_PATH, user: operator }),
    ).toBe(true);
    expect(
      shouldSendToConsole({ hostname: DASHBOARD_HOST, pathname: "/platform/clients", user: operator }),
    ).toBe(true);
  });

  it("leaves an operator alone on every dashboard page", () => {
    // The bug this test exists for, found in production on 2026-11-19 with a
    // real operator account: the redirect ignored the path, so a devitrak.com
    // account was thrown to the console host from EVERY page and could not
    // open the dashboard at all. Operators are staff too; the console is one
    // of the places they work, not the only one.
    for (const pathname of ["/", "/events/event-quickglance", "/inventory", "/profile"]) {
      expect(shouldSendToConsole({ hostname: DASHBOARD_HOST, pathname, user: operator })).toBe(false);
    }
  });

  it("goes by the sign-in domain, not by the server's answer", () => {
    // Deliberate: this is navigation, not access. A devitrak.com account whose
    // platformAccess was revoked still has its /platform request sent to the
    // console host, where the guard refuses it and sends it back. Deciding it
    // here instead would mean a second place that can say yes, and the second
    // place is always the one nobody updates.
    expect(hasPlatformAccess(operatorWithoutFlag)).toBe(false);
    expect(
      shouldSendToConsole({
        hostname: DASHBOARD_HOST,
        pathname: CONSOLE_PATH,
        user: operatorWithoutFlag,
      }),
    ).toBe(true);
  });

  it("leaves every client account where it is", () => {
    const where = { hostname: DASHBOARD_HOST, pathname: CONSOLE_PATH };
    expect(shouldSendToConsole({ ...where, user: staff })).toBe(false);
    expect(shouldSendToConsole({ ...where, user: null })).toBe(false);
    expect(shouldSendToConsole({ ...where, user: {} })).toBe(false);
  });

  it("does not send anyone who is already on the console host", () => {
    expect(
      shouldSendToConsole({ hostname: CONSOLE_HOST, pathname: CONSOLE_PATH, user: operator }),
    ).toBe(false);
  });

  it("does nothing on a dev server", () => {
    expect(
      shouldSendToConsole({ hostname: "localhost", pathname: CONSOLE_PATH, user: operator }),
    ).toBe(false);
  });
});

describe("landing on the console host", () => {
  it("takes a signed-in person on the console host to the console", () => {
    // Why this is not IIS's job: public/web.config redirects a REQUEST for "/"
    // on the console host, and signing in ends with navigate("/") inside React
    // Router, which makes no request. Without this, signing in on
    // ops.devitrak.net rendered the customer dashboard on the console host --
    // measured in production on 2026-11-19, with platformAccess: true.
    expect(shouldLandOnConsole({ hostname: CONSOLE_HOST, pathname: "/" })).toBe(true);
    expect(shouldLandOnConsole({ hostname: CONSOLE_HOST, pathname: "/inventory" })).toBe(true);
  });

  it("leaves the console's own paths alone, so it cannot loop", () => {
    expect(shouldLandOnConsole({ hostname: CONSOLE_HOST, pathname: CONSOLE_PATH })).toBe(false);
    expect(shouldLandOnConsole({ hostname: CONSOLE_HOST, pathname: "/platform/clients" })).toBe(false);
  });

  it("never fires on the dashboard host or in development", () => {
    expect(shouldLandOnConsole({ hostname: DASHBOARD_HOST, pathname: "/" })).toBe(false);
    expect(shouldLandOnConsole({ hostname: "localhost", pathname: "/" })).toBe(false);
  });

  it("decides on the host alone, never on who is signed in", () => {
    // It answers "which app is this address", so it takes no user at all. A
    // person the console refuses is still turned away by PlatformGuard, which
    // sends them off the host entirely -- that is what ends the bounce.
    expect(shouldLandOnConsole.length).toBe(1);
    expect(String(shouldLandOnConsole)).not.toContain("user");
  });
});

describe("the redirect never decides access", () => {
  const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

  it("PlatformGuard still gates on the server's answer", () => {
    const text = fs.readFileSync(path.join(SRC, "routes", "authorized", "PlatformGuard.jsx"), "utf8");
    expect(text).toContain("hasPlatformAccess");
    expect(text).not.toContain("shouldSendToConsole");
  });

  it("a refusal on the console host says so, instead of navigating anywhere", () => {
    // Measured on 2026-11-19 with a real account that correctly has no console
    // access: the refusal was a window.location.replace to the dashboard host,
    // where that origin has no session, so the person landed on a login screen
    // with no explanation. "The console does not open" was the report; the gate
    // was working perfectly.
    //
    // A refusal now renders a page on the console host. It cannot loop, because
    // it does not navigate: the IIS rule that sends "/" to /platform never
    // fires, and neither does shouldLandOnConsole.
    const text = fs.readFileSync(path.join(SRC, "routes", "authorized", "PlatformGuard.jsx"), "utf8");
    expect(text).toContain("isConsoleHost");
    expect(text).toContain("PlatformNoAccess");
    expect(text).not.toContain("ExternalRedirect");
  });

  it("the refusal page can end the session it is refusing", () => {
    // Otherwise the person is held on a host they cannot use and cannot leave
    // properly: signing out elsewhere does not reach this origin's session, and
    // clearing storage by hand leaves it open on the server.
    const text = fs.readFileSync(path.join(SRC, "pages", "platform", "PlatformNoAccess.jsx"), "utf8");
    expect(text).toContain("useLogout");
    expect(text).toContain("dashboardUrl");
  });

  it("AuthRoutes sends to the console host only when the console is built in", () => {
    const text = fs.readFileSync(path.join(SRC, "routes", "authorized", "AuthRoutes.jsx"), "utf8");
    expect(text).toContain("FEATURE_PLATFORM_CONSOLE && shouldSendToConsole");
    expect(text).toContain("FEATURE_PLATFORM_CONSOLE && shouldLandOnConsole");
  });

  it("the console offers a way out that works on its own host", () => {
    // The console has no dashboard navigation bar by design, so the only way
    // out is the one it draws itself. Its link used to be href="/", which on
    // the console host is a request IIS sends straight back to /platform: the
    // way out led nowhere. It has to name the dashboard host.
    const text = fs.readFileSync(path.join(SRC, "pages", "platform", "PlatformLayout.jsx"), "utf8");
    expect(text).toContain("dashboardUrl");
    expect(text).not.toContain('href="/"');
  });

  it("the console can end the session, server side too", () => {
    // Without this the only way off an operator session on the console host
    // was clearing localStorage by hand, which leaves the session open on the
    // server: the next sign-in is refused with "Active session already
    // exists" (hooks/useLogout.js). The shared hook is the one that posts
    // /admin/logout.
    const text = fs.readFileSync(path.join(SRC, "pages", "platform", "PlatformLayout.jsx"), "utf8");
    expect(text).toContain("useLogout");
  });

  it("AuthRoutes asks both questions with the current path", () => {
    // Both bugs of 2026-11-19 were a decision taken without the path: one
    // redirect that ignored it and one that could not see it. Neither may be
    // called without pathname again.
    const text = fs.readFileSync(path.join(SRC, "routes", "authorized", "AuthRoutes.jsx"), "utf8");
    for (const call of ["shouldSendToConsole({", "shouldLandOnConsole({"]) {
      const at = text.indexOf(call);
      expect(at).toBeGreaterThan(-1);
      expect(text.slice(at, text.indexOf("})", at))).toContain("pathname");
    }
  });
});
