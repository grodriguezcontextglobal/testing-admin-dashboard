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
