import { describe, it, expect } from "vitest";
import {
  buildConsentRequestPayload,
  buildGuardianPayload,
  getConsentStatusCopy,
  isConsentAgreed,
  isConsentBlockingAssignment,
  isPolicyStale,
  normalizeConsentStatus,
} from "./guardianConsentUtils";

describe("normalizeConsentStatus", () => {
  it("returns missing for null response", () => {
    expect(normalizeConsentStatus(null)).toBe("missing");
  });

  it("returns missing for undefined response", () => {
    expect(normalizeConsentStatus(undefined)).toBe("missing");
  });

  it("returns missing for empty response", () => {
    expect(normalizeConsentStatus({})).toBe("missing");
  });

  it("returns pending from status", () => {
    expect(normalizeConsentStatus({ status: "pending" })).toBe("pending");
  });

  it("returns agreed from state", () => {
    expect(normalizeConsentStatus({ state: "agreed" })).toBe("agreed");
  });

  it("returns refused from status", () => {
    expect(normalizeConsentStatus({ status: "refused" })).toBe("refused");
  });

  it("returns expired from state", () => {
    expect(normalizeConsentStatus({ state: "expired" })).toBe("expired");
  });

  it("returns stale when consent policy version does not match required version", () => {
    expect(
      normalizeConsentStatus({
        consent: { status: "agreed", policy_version: "1" },
        required_consent_policy_version: "2",
      })
    ).toBe("stale");
  });

  it("returns missing when response says no consent exists", () => {
    expect(normalizeConsentStatus({ consent: null })).toBe("missing");
  });

  it("returns missing for unknown status", () => {
    expect(normalizeConsentStatus({ status: "unknown" })).toBe("missing");
  });
});

describe("isConsentAgreed", () => {
  it("returns true for agreed consent with matching policy version", () => {
    expect(
      isConsentAgreed({ status: "agreed", policy_version: "2" }, "2")
    ).toBe(true);
  });

  it("returns true for agreed consent without version requirement", () => {
    expect(isConsentAgreed({ state: "agreed", policy_version: "1" })).toBe(true);
  });

  it.each(["missing", "pending", "refused", "expired", "stale"])(
    "returns false for %s consent",
    (status) => {
      expect(isConsentAgreed({ status, policy_version: "2" }, "2")).toBe(false);
    }
  );

  it("returns false when required policy version does not match", () => {
    expect(
      isConsentAgreed({ status: "agreed", policy_version: "1" }, "2")
    ).toBe(false);
  });
});

describe("isConsentBlockingAssignment", () => {
  it("returns false when both enforcement settings are off", () => {
    expect(
      isConsentBlockingAssignment("missing", {
        enforce: false,
        enforce_under_13: false,
        required_consent_policy_version: null,
      })
    ).toBe(false);
  });

  it("returns false when consent is agreed", () => {
    expect(
      isConsentBlockingAssignment("agreed", {
        enforce: true,
        enforce_under_13: false,
        required_consent_policy_version: "2",
      })
    ).toBe(false);
  });

  it.each(["pending", "missing", "refused", "expired", "stale"])(
    "returns true for %s when enforcement is on",
    (status) => {
      expect(
        isConsentBlockingAssignment(status, {
          enforce: true,
          enforce_under_13: false,
          required_consent_policy_version: "2",
        })
      ).toBe(true);
    }
  );
});

describe("isPolicyStale", () => {
  it("returns false when policy version matches", () => {
    expect(isPolicyStale({ policy_version: "2" }, "2")).toBe(false);
  });

  it("returns true when policy version does not match", () => {
    expect(isPolicyStale({ policy_version: "1" }, "2")).toBe(true);
  });

  it("returns false for null consent", () => {
    expect(isPolicyStale(null, "2")).toBe(false);
  });
});

describe("buildGuardianPayload", () => {
  it("builds the guardian API payload with all fields", () => {
    expect(
      buildGuardianPayload({
        memberId: 42,
        companyId: 137,
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@test.com",
        phoneNumber: "555-1",
      })
    ).toEqual({
      member_id: 42,
      company_id: 137,
      first_name: "Jane",
      last_name: "Doe",
      email: "jane@test.com",
      phone_number: "555-1",
    });
  });
});

describe("buildConsentRequestPayload", () => {
  it("builds the consent request API payload with all fields", () => {
    expect(
      buildConsentRequestPayload({
        companyId: 137,
        memberId: 42,
        guardianId: 7,
        policyType: "minor_device_lease",
        policyVersion: "2",
      })
    ).toEqual({
      company_id: 137,
      member_id: 42,
      guardian_id: 7,
      policy_type: "minor_device_lease",
      policy_version: "2",
    });
  });
});

describe("getConsentStatusCopy", () => {
  it.each([
    ["missing", "Consent has not been requested yet."],
    ["pending", "Waiting for guardian response."],
    ["agreed", "Consent completed."],
    ["refused", "Guardian refused consent."],
    ["expired", "Consent link expired. Resend request."],
    ["stale", "A new policy version requires consent again."],
    ["other", "Unknown consent status."],
  ])("returns copy for %s status", (status, copy) => {
    expect(getConsentStatusCopy(status)).toBe(copy);
  });
});
