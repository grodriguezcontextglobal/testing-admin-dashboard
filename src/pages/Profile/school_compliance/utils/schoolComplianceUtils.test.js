import { describe, it, expect, vi, beforeEach } from "vitest";
import { devitrakApi } from "../../../../api/devitrakApi";
import {
  fetchSchoolSettings,
  updateConsentEnforcement,
  buildConsentEnforcementPayload,
  hasSettingsChanges,
  fetchSchoolConsentDocuments,
} from "./schoolComplianceUtils";

vi.mock("../../../../api/devitrakApi", () => ({
  devitrakApi: { post: vi.fn(), get: vi.fn() },
}));

beforeEach(() => {
  devitrakApi.post.mockReset();
  devitrakApi.get.mockReset();
});

describe("fetchSchoolSettings", () => {
  it("llama POST /school/settings con company_id", async () => {
    devitrakApi.post.mockResolvedValue({
      data: { ok: true, settings: { enforce_member_consent: false } },
    });
    const result = await fetchSchoolSettings(137);
    expect(devitrakApi.post).toHaveBeenCalledWith("/school/settings", {
      company_id: 137,
    });
    expect(result).toEqual({
      ok: true,
      settings: { enforce_member_consent: false },
    });
  });

  it("propaga errores del servidor", async () => {
    devitrakApi.post.mockRejectedValue(new Error("Forbidden"));
    await expect(fetchSchoolSettings(137)).rejects.toThrow("Forbidden");
  });
});

describe("updateConsentEnforcement", () => {
  it("llama POST /school/settings/consent-enforcement con payload completo", async () => {
    devitrakApi.post.mockResolvedValue({
      data: { ok: true, settings: { enforce_member_consent: true } },
    });
    const result = await updateConsentEnforcement(137, {
      enforce: true,
      enforce_under_13: true,
      required_consent_policy_version: "1",
    });
    expect(devitrakApi.post).toHaveBeenCalledWith(
      "/school/settings/consent-enforcement",
      {
        company_id: 137,
        enforce: true,
        enforce_under_13: true,
        required_consent_policy_version: "1",
      }
    );
    expect(result.ok).toBe(true);
  });

  it("envía required_consent_policy_version como string o null", async () => {
    devitrakApi.post.mockResolvedValue({ data: { ok: true } });
    await updateConsentEnforcement(137, {
      enforce: false,
      enforce_under_13: false,
      required_consent_policy_version: null,
    });
    expect(devitrakApi.post).toHaveBeenCalledWith(
      "/school/settings/consent-enforcement",
      expect.objectContaining({ required_consent_policy_version: null })
    );
  });
});

describe("buildConsentEnforcementPayload", () => {
  it("construye payload desde valores del formulario", () => {
    const result = buildConsentEnforcementPayload(137, {
      enforce: true,
      enforceUnder13: true,
      policyVersion: "2",
      consentDocumentId: "doc-1",
    });
    expect(result).toEqual({
      company_id: 137,
      enforce: true,
      enforce_under_13: true,
      required_consent_policy_version: "2",
      consent_document_id: "doc-1",
    });
  });

  it("mapea enforceUnder13 a enforce_under_13", () => {
    const result = buildConsentEnforcementPayload(137, {
      enforce: false,
      enforceUnder13: false,
      policyVersion: "",
    });
    expect(result.enforce_under_13).toBe(false);
    expect(result).not.toHaveProperty("enforceUnder13");
  });

  it("convierte policyVersion vacío a null", () => {
    const result = buildConsentEnforcementPayload(137, {
      enforce: true,
      enforceUnder13: false,
      policyVersion: "",
    });
    expect(result.required_consent_policy_version).toBeNull();
  });

  it("preserva policyVersion cuando tiene valor", () => {
    const result = buildConsentEnforcementPayload(137, {
      enforce: true,
      enforceUnder13: true,
      policyVersion: "3",
    });
    expect(result.required_consent_policy_version).toBe("3");
  });

  it("convierte consentDocumentId ausente a null", () => {
    const result = buildConsentEnforcementPayload(137, {
      enforce: true,
      enforceUnder13: false,
      policyVersion: "1",
    });
    expect(result.consent_document_id).toBeNull();
  });

  it("preserva consentDocumentId cuando tiene valor", () => {
    const result = buildConsentEnforcementPayload(137, {
      enforce: true,
      enforceUnder13: false,
      policyVersion: "1",
      consentDocumentId: "doc-42",
    });
    expect(result.consent_document_id).toBe("doc-42");
  });
});

describe("hasSettingsChanges", () => {
  it("detecta cambios en enforce", () => {
    expect(
      hasSettingsChanges(
        { enforce: false, enforceUnder13: false, policyVersion: "1" },
        { enforce: true, enforceUnder13: false, policyVersion: "1" }
      )
    ).toBe(true);
  });

  it("detecta cambios en enforceUnder13", () => {
    expect(
      hasSettingsChanges(
        { enforce: true, enforceUnder13: false, policyVersion: "1" },
        { enforce: true, enforceUnder13: true, policyVersion: "1" }
      )
    ).toBe(true);
  });

  it("detecta cambios en policyVersion", () => {
    expect(
      hasSettingsChanges(
        { enforce: true, enforceUnder13: true, policyVersion: "1" },
        { enforce: true, enforceUnder13: true, policyVersion: "2" }
      )
    ).toBe(true);
  });

  it("retorna false cuando no hay cambios", () => {
    expect(
      hasSettingsChanges(
        { enforce: true, enforceUnder13: false, policyVersion: "1" },
        { enforce: true, enforceUnder13: false, policyVersion: "1" }
      )
    ).toBe(false);
  });

  it("tolera valores nulos", () => {
    expect(hasSettingsChanges(null, null)).toBe(false);
    expect(hasSettingsChanges(null, { enforce: true })).toBe(true);
  });

  it("detecta cambios en consentDocumentId", () => {
    expect(
      hasSettingsChanges(
        {
          enforce: true,
          enforceUnder13: true,
          policyVersion: "1",
          consentDocumentId: "doc-1",
        },
        {
          enforce: true,
          enforceUnder13: true,
          policyVersion: "1",
          consentDocumentId: "doc-2",
        }
      )
    ).toBe(true);
  });
});

describe("fetchSchoolConsentDocuments", () => {
  it("llama GET /document/ con company_id y filtra por trigger_action school_consent", async () => {
    devitrakApi.get.mockResolvedValue({
      data: {
        documents: [
          { _id: "doc-1", title: "AUP 2026", trigger_action: "school_consent" },
          { _id: "doc-2", title: "Staff handbook", trigger_action: "onboarding" },
        ],
      },
    });
    const result = await fetchSchoolConsentDocuments(137);
    expect(devitrakApi.get).toHaveBeenCalledWith("/document/?company_id=137");
    expect(result).toEqual([
      { _id: "doc-1", title: "AUP 2026", trigger_action: "school_consent" },
    ]);
  });

  it("retorna arreglo vacío cuando no hay documentos", async () => {
    devitrakApi.get.mockResolvedValue({ data: {} });
    const result = await fetchSchoolConsentDocuments(137);
    expect(result).toEqual([]);
  });
});
