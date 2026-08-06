import { describe, expect, it } from "vitest";
import { normalizeConsentStatus, isPolicyStale } from "./guardianConsentUtils";

/**
 * Contract between /api/school/consent and normalizeConsentStatus.
 *
 * resolveConsentRecord() falls back to the whole response body when `consent`
 * is null. That makes the no-consent response shape load-bearing: if the server
 * also echoes required_consent_policy_version at the top level, isPolicyStale
 * compares it against the response object's (absent) policy_version and the
 * student reads as "stale" rather than "missing" — a consent problem invented
 * out of nothing.
 *
 * These are the exact payloads mysql/controllers/school.js returns.
 */

const noConsent = { ok: true, count: 0, consent: null };

const pendingConsent = {
  ok: true,
  count: 1,
  consent: {
    id: 1,
    status: "pending",
    policy_type: "AUP",
    policy_version: "1",
    expires_at: "2026-08-19T12:00:00.000Z",
    mutable: true,
  },
  required_consent_policy_version: null,
};

const agreedConsent = {
  ...pendingConsent,
  consent: {
    ...pendingConsent.consent,
    status: "agreed",
    signer_name: "Lucas Lopez",
    mutable: false,
  },
};

describe("no-consent response", () => {
  it("reads as missing, not stale", () => {
    expect(normalizeConsentStatus(noConsent)).toBe("missing");
  });

  it("would read as stale if the server echoed the policy version", () => {
    // Guards the shape itself: this is the mistake the endpoint must not make.
    const wrong = { ...noConsent, required_consent_policy_version: "2" };
    expect(normalizeConsentStatus(wrong)).toBe("stale");
  });

  it("would also break if the version were nested under settings", () => {
    const wrong = {
      ...noConsent,
      settings: { required_consent_policy_version: "2" },
    };
    expect(normalizeConsentStatus(wrong)).toBe("stale");
  });
});

describe("live consent responses", () => {
  it("passes pending through", () => {
    expect(normalizeConsentStatus(pendingConsent)).toBe("pending");
  });

  it("passes agreed through", () => {
    expect(normalizeConsentStatus(agreedConsent)).toBe("agreed");
  });

  it("passes refused through", () => {
    expect(
      normalizeConsentStatus({
        ...pendingConsent,
        consent: { ...pendingConsent.consent, status: "refused" },
      })
    ).toBe("refused");
  });

  it("passes the server-derived expired status through", () => {
    // The server derives expiry on read rather than sweeping with a cron, so
    // the frontend never has to compare expires_at itself.
    expect(
      normalizeConsentStatus({
        ...pendingConsent,
        consent: { ...pendingConsent.consent, status: "expired" },
      })
    ).toBe("expired");
  });
});

describe("policy version staleness", () => {
  it("reports stale when a recorded consent predates the required version", () => {
    expect(
      normalizeConsentStatus({
        ...agreedConsent,
        required_consent_policy_version: "2",
      })
    ).toBe("stale");
  });

  it("stays agreed when the versions match", () => {
    expect(
      normalizeConsentStatus({
        ...agreedConsent,
        required_consent_policy_version: "1",
      })
    ).toBe("agreed");
  });

  it("stays agreed when no version is required", () => {
    expect(isPolicyStale(agreedConsent.consent, null)).toBe(false);
    expect(normalizeConsentStatus(agreedConsent)).toBe("agreed");
  });
});
