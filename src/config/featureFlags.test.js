import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// FEATURE_SCOPED_ROLES is read once at module-eval time from
// import.meta.env.VITE_APP_FEATURE_SCOPED_ROLES, so each test re-imports the
// module fresh (vi.resetModules) after stubbing the env var.

describe("FEATURE_SCOPED_ROLES", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults to false when the env var is unset", async () => {
    vi.stubEnv("VITE_APP_FEATURE_SCOPED_ROLES", undefined);
    const { FEATURE_SCOPED_ROLES } = await import("./featureFlags");
    expect(FEATURE_SCOPED_ROLES).toBe(false);
  });

  it("is false for any value other than the exact string 'true'", async () => {
    vi.stubEnv("VITE_APP_FEATURE_SCOPED_ROLES", "1");
    const { FEATURE_SCOPED_ROLES } = await import("./featureFlags");
    expect(FEATURE_SCOPED_ROLES).toBe(false);
  });

  it("is true only when the env var is the string 'true'", async () => {
    vi.stubEnv("VITE_APP_FEATURE_SCOPED_ROLES", "true");
    const { FEATURE_SCOPED_ROLES } = await import("./featureFlags");
    expect(FEATURE_SCOPED_ROLES).toBe(true);
  });
});

describe("FEATURE_MEMBER_FEES", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults to false when the env var is unset", async () => {
    vi.stubEnv("VITE_APP_FEATURE_MEMBER_FEES", undefined);
    const { FEATURE_MEMBER_FEES } = await import("./featureFlags");
    expect(FEATURE_MEMBER_FEES).toBe(false);
  });

  it("is true only when the env var is the string 'true'", async () => {
    vi.stubEnv("VITE_APP_FEATURE_MEMBER_FEES", "true");
    const { FEATURE_MEMBER_FEES } = await import("./featureFlags");
    expect(FEATURE_MEMBER_FEES).toBe(true);
  });
});

describe("FEATURE_EVENT_INVITATIONS", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // Default ON, unlike the others: it is a kill switch for a live feature,
  // so a build that forgets the variable keeps offering invitations.
  it("defaults to true when the env var is unset", async () => {
    vi.stubEnv("VITE_APP_FEATURE_EVENT_INVITATIONS", undefined);
    const { FEATURE_EVENT_INVITATIONS } = await import("./featureFlags");
    expect(FEATURE_EVENT_INVITATIONS).toBe(true);
  });

  it("is false only for the exact string 'false'", async () => {
    vi.stubEnv("VITE_APP_FEATURE_EVENT_INVITATIONS", "false");
    const off = await import("./featureFlags");
    expect(off.FEATURE_EVENT_INVITATIONS).toBe(false);

    vi.resetModules();
    vi.stubEnv("VITE_APP_FEATURE_EVENT_INVITATIONS", "0");
    const on = await import("./featureFlags");
    expect(on.FEATURE_EVENT_INVITATIONS).toBe(true);
  });
});

describe("FEATURE_SUBSCRIPTION_PLANS", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults to false when the env var is unset", async () => {
    vi.stubEnv("VITE_APP_FEATURE_SUBSCRIPTION_PLANS", undefined);
    const { FEATURE_SUBSCRIPTION_PLANS } = await import("./featureFlags");
    expect(FEATURE_SUBSCRIPTION_PLANS).toBe(false);
  });

  it("is true only when the env var is the string 'true'", async () => {
    vi.stubEnv("VITE_APP_FEATURE_SUBSCRIPTION_PLANS", "true");
    const { FEATURE_SUBSCRIPTION_PLANS } = await import("./featureFlags");
    expect(FEATURE_SUBSCRIPTION_PLANS).toBe(true);
  });
});

describe("FEATURE_PLATFORM_CONSOLE", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults to false when the env var is unset", async () => {
    vi.stubEnv("VITE_APP_FEATURE_PLATFORM_CONSOLE", undefined);
    const { FEATURE_PLATFORM_CONSOLE } = await import("./featureFlags");
    expect(FEATURE_PLATFORM_CONSOLE).toBe(false);
  });

  it("is false for any value other than the exact string 'true'", async () => {
    vi.stubEnv("VITE_APP_FEATURE_PLATFORM_CONSOLE", "1");
    const { FEATURE_PLATFORM_CONSOLE } = await import("./featureFlags");
    expect(FEATURE_PLATFORM_CONSOLE).toBe(false);
  });

  it("is true only when the env var is the string 'true'", async () => {
    vi.stubEnv("VITE_APP_FEATURE_PLATFORM_CONSOLE", "true");
    const { FEATURE_PLATFORM_CONSOLE } = await import("./featureFlags");
    expect(FEATURE_PLATFORM_CONSOLE).toBe(true);
  });
});

// The demo mode used to be one flag doing two jobs: it chose the sample-data
// source AND it opened the console without the server's platformAccess. That
// second job is a gate bypass, which is why the whole thing was pinned to the
// dev server and could never be deployed. Split in two so the sample data can
// ship to a real URL while the gate still decides who sees it.
describe("PLATFORM_CONSOLE_SAMPLE_DATA (the data source)", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is true with the env var in a dev server", async () => {
    vi.stubEnv("DEV", true);
    vi.stubEnv("VITE_APP_PLATFORM_CONSOLE_MOCK", "true");
    const { PLATFORM_CONSOLE_SAMPLE_DATA } = await import("./featureFlags");
    expect(PLATFORM_CONSOLE_SAMPLE_DATA).toBe(true);
  });

  it("is ALSO true in a build, which is the point of the split", async () => {
    vi.stubEnv("DEV", false);
    vi.stubEnv("VITE_APP_PLATFORM_CONSOLE_MOCK", "true");
    const { PLATFORM_CONSOLE_SAMPLE_DATA } = await import("./featureFlags");
    expect(PLATFORM_CONSOLE_SAMPLE_DATA).toBe(true);
  });

  it("is false without the env var", async () => {
    vi.stubEnv("DEV", true);
    vi.stubEnv("VITE_APP_PLATFORM_CONSOLE_MOCK", undefined);
    const { PLATFORM_CONSOLE_SAMPLE_DATA } = await import("./featureFlags");
    expect(PLATFORM_CONSOLE_SAMPLE_DATA).toBe(false);
  });
});

describe("PLATFORM_CONSOLE_DEV_BYPASS (skips the access gate)", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is true with the env var in a dev server", async () => {
    vi.stubEnv("DEV", true);
    vi.stubEnv("VITE_APP_PLATFORM_CONSOLE_MOCK", "true");
    const { PLATFORM_CONSOLE_DEV_BYPASS } = await import("./featureFlags");
    expect(PLATFORM_CONSOLE_DEV_BYPASS).toBe(true);
  });

  // The one that matters. A build must never contain a way into the console
  // that does not go through the server's answer, whatever any env var says.
  it("is always false in a build, even with the env var", async () => {
    vi.stubEnv("DEV", false);
    vi.stubEnv("VITE_APP_PLATFORM_CONSOLE_MOCK", "true");
    const { PLATFORM_CONSOLE_DEV_BYPASS } = await import("./featureFlags");
    expect(PLATFORM_CONSOLE_DEV_BYPASS).toBe(false);
  });

  it("is false without the env var", async () => {
    vi.stubEnv("DEV", true);
    vi.stubEnv("VITE_APP_PLATFORM_CONSOLE_MOCK", undefined);
    const { PLATFORM_CONSOLE_DEV_BYPASS } = await import("./featureFlags");
    expect(PLATFORM_CONSOLE_DEV_BYPASS).toBe(false);
  });

  it("no longer exists under its old name, so a stale import cannot bypass", async () => {
    vi.stubEnv("DEV", false);
    vi.stubEnv("VITE_APP_PLATFORM_CONSOLE_MOCK", "true");
    const flags = await import("./featureFlags");
    expect(flags.PLATFORM_CONSOLE_MOCK).toBeUndefined();
  });
});

describe("FEATURE_ASSISTANT", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults to false when the env var is unset", async () => {
    vi.stubEnv("VITE_APP_FEATURE_ASSISTANT", undefined);
    const { FEATURE_ASSISTANT } = await import("./featureFlags");
    expect(FEATURE_ASSISTANT).toBe(false);
  });

  it("is false for any value other than the exact string 'true'", async () => {
    vi.stubEnv("VITE_APP_FEATURE_ASSISTANT", "1");
    const { FEATURE_ASSISTANT } = await import("./featureFlags");
    expect(FEATURE_ASSISTANT).toBe(false);
  });

  it("is true only when the env var is the string 'true'", async () => {
    vi.stubEnv("VITE_APP_FEATURE_ASSISTANT", "true");
    const { FEATURE_ASSISTANT } = await import("./featureFlags");
    expect(FEATURE_ASSISTANT).toBe(true);
  });
});

// Unlike the console's sample data, which is allowed in a build because
// invented numbers there announce themselves and open nothing, invented
// ANSWERS are different in kind: an answer is a sentence a staff member acts
// on, and it arrives in the same window a real one would. So this one is
// pinned to the dev server the way the console's gate bypass is.
describe("ASSISTANT_STUB (invented answers)", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is true with the env var in a dev server", async () => {
    vi.stubEnv("DEV", true);
    vi.stubEnv("VITE_APP_ASSISTANT_STUB", "true");
    const { ASSISTANT_STUB } = await import("./featureFlags");
    expect(ASSISTANT_STUB).toBe(true);
  });

  // The one that matters: no release can ever answer a staff question with
  // text we invented, whatever any env var says.
  it("is always false in a build, even with the env var", async () => {
    vi.stubEnv("DEV", false);
    vi.stubEnv("VITE_APP_ASSISTANT_STUB", "true");
    const { ASSISTANT_STUB } = await import("./featureFlags");
    expect(ASSISTANT_STUB).toBe(false);
  });

  it("is false without the env var", async () => {
    vi.stubEnv("DEV", true);
    vi.stubEnv("VITE_APP_ASSISTANT_STUB", undefined);
    const { ASSISTANT_STUB } = await import("./featureFlags");
    expect(ASSISTANT_STUB).toBe(false);
  });
});
