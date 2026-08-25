import { describe, it, expect } from "vitest";
import {
  buildConsentRequestPayload,
  buildGuardianPayload,
  getConsentStatusCopy,
  isConsentAgreed,
  isAssignmentBlockedByConsent,
  isConsentBlockingAssignment,
  isConsentRequiredForMember,
  resolveConsentEnforcement,
  isPolicyStale,
  normalizeConsentStatus,
  resolveConsentRecord,
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

  it("returns agreed from the real POST /school/consent envelope (consents[], confirmed backend 2026-08-04)", () => {
    expect(
      normalizeConsentStatus({
        ok: true,
        count: 1,
        consents: [
          {
            status: "agreed",
            policy_version: "1",
            requested_at: "2026-08-04T17:40:34.000Z",
          },
        ],
      })
    ).toBe("agreed");
  });
});

describe("resolveConsentRecord", () => {
  it("returns null for null, undefined, or array input", () => {
    expect(resolveConsentRecord(null)).toBeNull();
    expect(resolveConsentRecord(undefined)).toBeNull();
    expect(resolveConsentRecord([])).toBeNull();
  });

  it("extracts the single record from a real consents[] envelope", () => {
    const record = {
      status: "agreed",
      requested_at: "2026-08-04T17:40:34.000Z",
    };
    expect(
      resolveConsentRecord({ ok: true, count: 1, consents: [record] })
    ).toEqual(record);
  });

  it("picks the most recently requested record when there are several", () => {
    const older = { status: "refused", requested_at: "2026-01-01T00:00:00.000Z" };
    const newer = { status: "agreed", requested_at: "2026-08-04T17:40:34.000Z" };
    expect(resolveConsentRecord({ consents: [older, newer] })).toEqual(newer);
  });

  it("falls through past an empty consents array to other shapes", () => {
    expect(
      resolveConsentRecord({ consents: [], consent: { status: "agreed" } })
    ).toEqual({ status: "agreed" });
  });

  it("falls back to .consent, then .record, then .data.consent, then the whole response", () => {
    expect(resolveConsentRecord({ consent: { status: "agreed" } })).toEqual({
      status: "agreed",
    });
    expect(resolveConsentRecord({ record: { status: "refused" } })).toEqual({
      status: "refused",
    });
    expect(
      resolveConsentRecord({ data: { consent: { status: "pending" } } })
    ).toEqual({ status: "pending" });
    expect(resolveConsentRecord({ status: "expired" })).toEqual({
      status: "expired",
    });
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

// ─── El piso del servidor ────────────────────────────────────────────────────
// Bug de prueba manual (2026-08-14): se asignó un equipo a un menor sin
// consentimiento. El servidor devolvió CONSENT_REQUIRED y rechazó el lease —
// pero el equipo YA había salido del almacén, así que quedó "assigned" sin
// ninguna fila que diga quién lo tiene.
//
// La causa de que el gate no disparara: el frontend modelaba el consentimiento
// como una política OPCIONAL por empresa (settings.enforce), y el servidor lo
// aplica SIEMPRE que el miembro es menor. Un colegio con enforcement apagado
// pasaba el chequeo local y chocaba con el servidor.

describe("resolveConsentEnforcement — lee la llave que el servidor manda de verdad", () => {
  it("lee `enforce`, que es lo que devuelve /school/settings", () => {
    expect(resolveConsentEnforcement({ enforce: true })).toBe(true);
    expect(resolveConsentEnforcement({ enforce_under_13: true })).toBe(true);
    expect(resolveConsentEnforcement({ enforce: false })).toBe(false);
  });

  // `enforce_member_consent` es la llave que leían AssignmentDevicesToMember y
  // useAssignmentConsentGate. No existe en la respuesta: el chequeo evaluaba
  // undefined y por eso el enforcement se leía como apagado siempre.
  it("tolera el nombre viejo `enforce_member_consent` en lugar de ignorarlo", () => {
    expect(resolveConsentEnforcement({ enforce_member_consent: true })).toBe(true);
  });

  it("apagado por defecto cuando no hay settings", () => {
    expect(resolveConsentEnforcement(undefined)).toBe(false);
    expect(resolveConsentEnforcement({})).toBe(false);
  });
});

// Cada toggle es un ALCANCE DE EDAD, no un interruptor general. Antes los dos
// prendían el mismo enforcement sin mirar edad, así que "Require COPPA consent
// for under-13" bloqueaba también a los adultos.
describe("isConsentRequiredForMember — cada toggle cubre su propia edad", () => {
  const OFF = { enforce: false, enforce_under_13: false };

  // Apagados no se verifica edad: se asigna sin preguntar por consentimiento.
  it("con ambos apagados no exige consentimiento a nadie", () => {
    for (const who of [
      { isMinor: true, isUnder13: true },
      { isMinor: true, isUnder13: false },
      { isMinor: false, isUnder13: false },
    ]) {
      expect(isConsentRequiredForMember({ ...who, settings: OFF })).toBe(false);
    }
  });

  it("`enforce` cubre a todo menor de 18, incluidos los de menos de 13", () => {
    const settings = { enforce: true };
    expect(
      isConsentRequiredForMember({ isMinor: true, isUnder13: false, settings })
    ).toBe(true);
    expect(
      isConsentRequiredForMember({ isMinor: true, isUnder13: true, settings })
    ).toBe(true);
  });

  it("`enforce` no alcanza a un adulto", () => {
    expect(
      isConsentRequiredForMember({
        isMinor: false,
        isUnder13: false,
        settings: { enforce: true },
      })
    ).toBe(false);
  });

  // El punto del cambio: COPPA solo, exige a los de menos de 13 y a nadie más.
  it("`enforce_under_13` solo exige a los menores de 13", () => {
    const settings = { enforce: false, enforce_under_13: true };
    expect(
      isConsentRequiredForMember({ isMinor: true, isUnder13: true, settings })
    ).toBe(true);
    expect(
      isConsentRequiredForMember({ isMinor: true, isUnder13: false, settings })
    ).toBe(false);
    expect(
      isConsentRequiredForMember({ isMinor: false, isUnder13: false, settings })
    ).toBe(false);
  });

  // Respuesta a "¿qué cambia con ambos ON?": nada. under-18 ya contiene
  // under-13, así que el segundo toggle no agrega ningún requisito mientras el
  // consentimiento COPPA no sea un registro distinto del AUP.
  it("ambos encendidos equivale a `enforce` solo", () => {
    const both = { enforce: true, enforce_under_13: true };
    const onlyMinors = { enforce: true, enforce_under_13: false };
    for (const who of [
      { isMinor: true, isUnder13: true },
      { isMinor: true, isUnder13: false },
      { isMinor: false, isUnder13: false },
    ]) {
      expect(isConsentRequiredForMember({ ...who, settings: both })).toBe(
        isConsentRequiredForMember({ ...who, settings: onlyMinors })
      );
    }
  });

  it("tolera el nombre viejo de la llave para el alcance de menores", () => {
    expect(
      isConsentRequiredForMember({
        isMinor: true,
        isUnder13: false,
        settings: { enforce_member_consent: true },
      })
    ).toBe(true);
  });
});

describe("isAssignmentBlockedByConsent", () => {
  const ON = { enforce: true };

  it.each(["missing", "pending", "refused", "expired", "stale"])(
    "bloquea un consentimiento %s cuando la edad del miembro está cubierta",
    (consentStatus) => {
      expect(
        isAssignmentBlockedByConsent({
          consentStatus,
          settings: ON,
          isMinor: true,
        })
      ).toBe(true);
    }
  );

  it("no bloquea cuando el consentimiento está acordado", () => {
    expect(
      isAssignmentBlockedByConsent({
        consentStatus: "agreed",
        settings: ON,
        isMinor: true,
      })
    ).toBe(false);
  });

  it("no bloquea a quien el enforcement no cubre, sin importar su status", () => {
    expect(
      isAssignmentBlockedByConsent({
        consentStatus: "missing",
        settings: { enforce: false, enforce_under_13: true },
        isMinor: true,
        isUnder13: false,
      })
    ).toBe(false);
  });

  it("un status desconocido no cuenta como acordado", () => {
    expect(
      isAssignmentBlockedByConsent({
        consentStatus: undefined,
        settings: ON,
        isMinor: true,
      })
    ).toBe(true);
  });
});
