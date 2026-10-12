import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { describe, expect, it } from "vitest";
import { checkEnv, formatEnvReport, KNOWN_ENV } from "./envValidation";
import featureFlagsSource from "./featureFlags.js?raw";
import serverManagerSource from "../api/serverManager.js?raw";

const valid = {
  VITE_APP_DEVITRACK_API: "https://api.devitrak.net",
  VITE_APP_PUBLIC_STRIPE_KEY: "pk_test_123",
};

// FedRAMP F0.4 (fedRAMP/FRONTEND_action_plan_2026-09-28.md).
describe("checkEnv", () => {
  it("passes a complete environment", () => {
    expect(checkEnv(valid)).toEqual({ errors: [], warnings: [] });
  });

  it("names every missing required variable", () => {
    const { errors } = checkEnv({});
    expect(errors).toHaveLength(2);
    expect(errors[0]).toMatch(/VITE_APP_DEVITRACK_API/);
    expect(errors[1]).toMatch(/VITE_APP_PUBLIC_STRIPE_KEY/);
  });

  it("treats a blank value as missing", () => {
    const { errors } = checkEnv({ ...valid, VITE_APP_DEVITRACK_API: "   " });
    expect(errors).toEqual([
      expect.stringMatching(/VITE_APP_DEVITRACK_API is missing/),
    ]);
  });

  it("refuses an API origin that is not an http(s) URL", () => {
    for (const bad of ["api.devitrak.net", "ftp://api.devitrak.net"]) {
      const { errors } = checkEnv({ ...valid, VITE_APP_DEVITRACK_API: bad });
      expect(errors).toEqual([expect.stringMatching(/http\(s\) URL/)]);
    }
    const { errors } = checkEnv({
      ...valid,
      VITE_APP_DEVITRACK_API_BACKUP: "nope",
    });
    expect(errors).toEqual([
      expect.stringMatching(/VITE_APP_DEVITRACK_API_BACKUP/),
    ]);
  });

  // Every VITE_* value ships in the public bundle: a secret Stripe key there
  // is a leaked key.
  it("refuses a secret or restricted Stripe key", () => {
    for (const key of ["sk_live_abc", "sk_test_abc", "rk_live_abc"]) {
      const { errors } = checkEnv({ ...valid, VITE_APP_PUBLIC_STRIPE_KEY: key });
      expect(errors).toEqual([expect.stringMatching(/publishable key/)]);
    }
  });

  it("warns, without failing, about VITE_APP_ variables nothing reads", () => {
    const result = checkEnv({
      ...valid,
      VITE_APP_AWS_HEADER_AUTH: "x",
      VITE_APP_TWILIO_AUTH_TOKEN: "y",
    });
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([
      expect.stringMatching(/VITE_APP_AWS_HEADER_AUTH/),
      expect.stringMatching(/VITE_APP_TWILIO_AUTH_TOKEN/),
    ]);
  });

  it("ignores variables outside the VITE_APP_ prefix", () => {
    expect(checkEnv({ ...valid, PORT: "1", NODE_ENV: "x" })).toEqual({
      errors: [],
      warnings: [],
    });
  });
});

describe("KNOWN_ENV", () => {
  it("covers every variable the client reads directly", () => {
    const read = new Set(
      [featureFlagsSource, serverManagerSource]
        .join("\n")
        .match(/VITE_APP_[A-Z_]+/g)
    );
    for (const name of read) expect(KNOWN_ENV).toContain(name);
  });

  it("is exactly what .env.dev.example declares", () => {
    // Vite refuses to serve .env* files, so read it from disk.
    const devTemplate = readFileSync(
      resolve(process.cwd(), ".env.dev.example"),
      "utf8"
    );
    const declared = devTemplate.match(/^VITE_APP_[A-Z_]+/gm);
    expect([...declared].sort()).toEqual([...KNOWN_ENV].sort());
  });
});

describe("formatEnvReport", () => {
  it("lists errors and warnings under their own headings", () => {
    const report = formatEnvReport({ errors: ["e1"], warnings: ["w1"] });
    expect(report).toMatch(/Environment errors:\n {2}- e1/);
    expect(report).toMatch(/Environment warnings:\n {2}- w1/);
  });

  it("is empty when there is nothing to report", () => {
    expect(formatEnvReport({ errors: [], warnings: [] })).toBe("");
  });
});
