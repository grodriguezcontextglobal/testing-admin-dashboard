/**
 * School compliance (FERPA/COPPA) settings utilities.
 *
 * Wraps the /api/school/settings and /api/school/settings/consent-enforcement
 * endpoints and provides form-shape conversion helpers.
 *
 * @see FRONTEND_server_updates_2026-07.md §3.5
 */

import { devitrakApi } from "../../../../api/devitrakApi";


/**
 * Fetch current school compliance settings for a company.
 * @param {number} companyId
 * @returns {Promise<{ok: boolean, settings: object}>}
 */
export async function fetchSchoolSettings(companyId) {
  const response = await devitrakApi.post("/school/settings", {
    company_id: companyId,
  });
  return response.data;
}

/**
 * Update consent enforcement settings.
 * @param {number} companyId
 * @param {{ enforce: boolean, enforce_under_13: boolean, required_consent_policy_version: string|null }} payload
 * @returns {Promise<{ok: boolean, settings: object}>}
 */
export async function updateConsentEnforcement(companyId, payload) {
  const response = await devitrakApi.post(
    "/school/settings/consent-enforcement",
    {
      company_id: companyId,
      ...payload,
    }
  );
  return response.data;
}

/**
 * Convert form values to the API payload shape.
 * Form uses camelCase (enforceUnder13, policyVersion); API uses snake_case.
 *
 * @param {number} companyId
 * @param {{ enforce: boolean, enforceUnder13: boolean, policyVersion: string, consentDocumentId?: string }} formValues
 * @returns {{ company_id: number, enforce: boolean, enforce_under_13: boolean, required_consent_policy_version: string|null, consent_document_id: string|null }}
 */
export function buildConsentEnforcementPayload(companyId, formValues) {
  return {
    company_id: companyId,
    enforce: formValues.enforce,
    enforce_under_13: formValues.enforceUnder13,
    required_consent_policy_version: formValues.policyVersion || null,
    consent_document_id: formValues.consentDocumentId || null,
  };
}

/**
 * Check whether the form has unsaved changes compared to the server state.
 *
 * @param {{ enforce: boolean, enforceUnder13: boolean, policyVersion: string, consentDocumentId?: string }} current - current form values
 * @param {{ enforce: boolean, enforceUnder13: boolean, policyVersion: string, consentDocumentId?: string }} original - last saved values from server
 * @returns {boolean}
 */
export function hasSettingsChanges(current, original) {
  if (!current || !original) return current !== original;
  return (
    current.enforce !== original.enforce ||
    current.enforceUnder13 !== original.enforceUnder13 ||
    current.policyVersion !== original.policyVersion ||
    current.consentDocumentId !== original.consentDocumentId
  );
}

/**
 * Fetch the company's documents tagged for the school consent flow
 * (`trigger_action: "school_consent"`), for use in the consent-document
 * assignment picker.
 *
 * @param {number} companyId
 * @returns {Promise<Array<object>>}
 */
export async function fetchSchoolConsentDocuments(companyId) {
  const response = await devitrakApi.get(`/document/?company_id=${companyId}`);
  const documents = response?.data?.documents ?? [];
  return documents.filter((doc) => doc.trigger_action === "school_consent");
}
