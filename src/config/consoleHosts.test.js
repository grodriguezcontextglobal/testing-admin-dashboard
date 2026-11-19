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
  isDashboardHost,
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

describe("sending an operator to the console host", () => {
  it("sends a devitrak.com account that lands on the dashboard", () => {
    expect(shouldSendToConsole({ hostname: DASHBOARD_HOST, user: operator })).toBe(true);
  });

  it("goes by the sign-in domain, not by the server's answer", () => {
    // Deliberate: this is navigation, not access. A devitrak.com account whose
    // platformAccess was revoked is still sent to the console host, where the
    // guard refuses it and sends it back. Deciding it here instead would mean
    // a second place that can say yes, and the second place is always the one
    // nobody updates.
    expect(hasPlatformAccess(operatorWithoutFlag)).toBe(false);
    expect(shouldSendToConsole({ hostname: DASHBOARD_HOST, user: operatorWithoutFlag })).toBe(true);
  });

  it("leaves every client account where it is", () => {
    expect(shouldSendToConsole({ hostname: DASHBOARD_HOST, user: staff })).toBe(false);
    expect(shouldSendToConsole({ hostname: DASHBOARD_HOST, user: null })).toBe(false);
    expect(shouldSendToConsole({ hostname: DASHBOARD_HOST, user: {} })).toBe(false);
  });

  it("does not send anyone who is already on the console host", () => {
    expect(shouldSendToConsole({ hostname: CONSOLE_HOST, user: operator })).toBe(false);
  });

  it("does nothing on a dev server", () => {
    expect(shouldSendToConsole({ hostname: "localhost", user: operator })).toBe(false);
  });
});

describe("the redirect never decides access", () => {
  const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

  it("PlatformGuard still gates on the server's answer", () => {
    const text = fs.readFileSync(path.join(SRC, "routes", "authorized", "PlatformGuard.jsx"), "utf8");
    expect(text).toContain("hasPlatformAccess");
    expect(text).not.toContain("shouldSendToConsole");
  });

  it("a refusal on the console host leaves the host, instead of looping", () => {
    // IIS sends "/" on the console host straight back to /platform, so a
    // refusal that navigated to "/" would bounce on every reload.
    const text = fs.readFileSync(path.join(SRC, "routes", "authorized", "PlatformGuard.jsx"), "utf8");
    expect(text).toContain("isConsoleHost");
    expect(text).toContain("dashboardUrl");
  });

  it("AuthRoutes sends to the console host only when the console is built in", () => {
    const text = fs.readFileSync(path.join(SRC, "routes", "authorized", "AuthRoutes.jsx"), "utf8");
    expect(text).toContain("FEATURE_PLATFORM_CONSOLE && shouldSendToConsole");
  });
});
