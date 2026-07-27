import { describe, it, expect } from "vitest";
import {
  buildConsentRecordPayload,
  hasValidConsent,
  isConsentRequired,
  getConsentStatusMessage,
} from "./consentCheckUtils";

describe("buildConsentRecordPayload", () => {
  it("construye payload con campos requeridos", () => {
    const result = buildConsentRecordPayload({
      memberId: 42,
      companyId: 137,
      guardianFirstName: "Jane",
      guardianLastName: "Doe",
      guardianEmail: "jane@test.com",
      guardianPhone: "555-1",
      consentScope: "minor_device_lease",
      policyVersion: "1",
    });
    expect(result).toEqual({
      member_id: 42,
      company_id: 137,
      guardian_first_name: "Jane",
      guardian_last_name: "Doe",
      guardian_email: "jane@test.com",
      guardian_phone: "555-1",
      consent_scope: "minor_device_lease",
      policy_version: "1",
    });
  });

  it("usa policy_version null cuando no se provee", () => {
    const result = buildConsentRecordPayload({
      memberId: 42,
      companyId: 137,
      guardianFirstName: "Jane",
      guardianLastName: "Doe",
      guardianEmail: "jane@test.com",
      guardianPhone: "555-1",
      consentScope: "minor_device_lease",
    });
    expect(result.policy_version).toBeNull();
  });
});

describe("hasValidConsent", () => {
  it("true cuando consent tiene guardian_email y consent_scope", () => {
    expect(
      hasValidConsent({
        guardian_email: "jane@test.com",
        consent_scope: "minor_device_lease",
      })
    ).toBe(true);
  });

  it("true cuando consent es un objeto no vacío con campos básicos", () => {
    expect(
      hasValidConsent({
        guardian_email: "jane@test.com",
        consent_scope: "ferpa",
      })
    ).toBe(true);
  });

  it("false cuando consent es null", () => {
    expect(hasValidConsent(null)).toBe(false);
  });

  it("false cuando consent es undefined", () => {
    expect(hasValidConsent(undefined)).toBe(false);
  });

  it("false cuando consent es objeto vacío", () => {
    expect(hasValidConsent({})).toBe(false);
  });

  it("false cuando falta guardian_email", () => {
    expect(hasValidConsent({ consent_scope: "minor_device_lease" })).toBe(false);
  });

  it("false cuando falta consent_scope", () => {
    expect(hasValidConsent({ guardian_email: "jane@test.com" })).toBe(false);
  });

  it("false cuando consent es string vacío", () => {
    expect(hasValidConsent("")).toBe(false);
  });

  it("false cuando consent es un array", () => {
    expect(hasValidConsent([])).toBe(false);
  });
});

describe("isConsentRequired", () => {
  it("true cuando member es menor y settings enforce consent", () => {
    expect(
      isConsentRequired({
        isMinor: true,
        enforceMemberConsent: true,
        consentExists: false,
      })
    ).toBe(true);
  });

  it("true cuando member es under_13 y settings enforce under_13", () => {
    expect(
      isConsentRequired({
        isMinor: true,
        isUnder13: true,
        enforceUnder13: true,
        consentExists: false,
      })
    ).toBe(true);
  });

  it("false cuando member es adulto", () => {
    expect(
      isConsentRequired({
        isMinor: false,
        enforceMemberConsent: true,
        consentExists: false,
      })
    ).toBe(false);
  });

  it("false cuando consent ya existe", () => {
    expect(
      isConsentRequired({
        isMinor: true,
        enforceMemberConsent: true,
        consentExists: true,
      })
    ).toBe(false);
  });

  it("false cuando settings no enforce consent", () => {
    expect(
      isConsentRequired({
        isMinor: true,
        enforceMemberConsent: false,
        consentExists: false,
      })
    ).toBe(false);
  });

  it("false cuando isMinor es undefined", () => {
    expect(
      isConsentRequired({
        enforceMemberConsent: true,
        consentExists: false,
      })
    ).toBe(false);
  });
});

describe("getConsentStatusMessage", () => {
  it("retorna mensaje para consent requerido (general)", () => {
    const msg = getConsentStatusMessage({
      isMinor: true,
      isUnder13: false,
      consentRequired: true,
    });
    expect(msg).toContain("consent");
    expect(msg).toContain("Guardian");
  });

  it("retorna mensaje para under_13 consent requerido", () => {
    const msg = getConsentStatusMessage({
      isMinor: true,
      isUnder13: true,
      consentRequired: true,
    });
    expect(msg).toContain("COPPA");
  });

  it("retorna null cuando consent no es requerido", () => {
    const msg = getConsentStatusMessage({
      isMinor: false,
      consentRequired: false,
    });
    expect(msg).toBeNull();
  });

  it("retorna null cuando consent ya existe", () => {
    const msg = getConsentStatusMessage({
      isMinor: true,
      consentRequired: false,
      consentExists: true,
    });
    expect(msg).toBeNull();
  });
});
