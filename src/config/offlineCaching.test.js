import { describe, expect, it } from "vitest";
import { MUTATION_QUEUE_RETENTION_MINUTES, buildApiRuntimeCaching } from "./offlineCaching";
import { IDLE_TIMEOUT_MS } from "../hooks/idleSession";

// fedRAMP/FRONTEND_action_plan_2026-10-26.md, A3 (SC-28, AC-12), decided
// 2026-10-29: no API response is kept on disk, and a queued write cannot
// outlive the session that made it.
const API = /^(https:\/\/db\.devitrak\.net\/api)/;

describe("buildApiRuntimeCaching", () => {
  it("registers nothing without API origins", () => {
    expect(buildApiRuntimeCaching(null)).toEqual([]);
  });

  it("does not cache API GET responses", () => {
    const rules = buildApiRuntimeCaching(API);
    expect(rules.some((rule) => (rule.method ?? "GET") === "GET")).toBe(false);
    rules.forEach((rule) => expect(rule.options?.cacheName).toBeUndefined());
  });

  it("queues offline POST and PUT, each in its own queue", () => {
    const rules = buildApiRuntimeCaching(API);
    expect(rules.map((rule) => rule.method)).toEqual(["POST", "PUT"]);
    rules.forEach((rule) => {
      expect(rule.urlPattern).toBe(API);
      expect(rule.handler).toBe("NetworkOnly");
    });
    const names = rules.map((rule) => rule.options.backgroundSync.name);
    expect(new Set(names).size).toBe(2);
  });

  it("drops a queued write once an idle session would have ended", () => {
    expect(MUTATION_QUEUE_RETENTION_MINUTES * 60 * 1000).toBeLessThanOrEqual(IDLE_TIMEOUT_MS);
    buildApiRuntimeCaching(API).forEach((rule) =>
      expect(rule.options.backgroundSync.options.maxRetentionTime).toBe(MUTATION_QUEUE_RETENTION_MINUTES)
    );
  });
});
