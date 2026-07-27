/**
 * Consent check utilities for student member device assignment.
 *
 * Determines whether a member requires guardian consent before device
 * assignment, builds consent record payloads, and validates existing
 * consent.
 *
 * @see FRONTEND_server_updates_2026-07.md §3.2
 */

/**
 * Build a consent record payload for POST /api/school/consent/record.
 *
 * @param {object} params
 * @param {number} params.memberId
 * @param {number} params.companyId
 * @param {string} params.guardianFirstName
 * @param {string} params.guardianLastName
 * @param {string} params.guardianEmail
 * @param {string} params.guardianPhone
 * @param {string} [params.consentScope="minor_device_lease"]
 * @param {string|null} [params.policyVersion=null]
 * @returns {object} API payload
 */
export function buildConsentRecordPayload({
  memberId,
  companyId,
  guardianFirstName,
  guardianLastName,
  guardianEmail,
  guardianPhone,
  consentScope = "minor_device_lease",
  policyVersion = null,
}) {
  return {
    member_id: memberId,
    company_id: companyId,
    guardian_first_name: guardianFirstName,
    guardian_last_name: guardianLastName,
    guardian_email: guardianEmail,
    guardian_phone: guardianPhone,
    consent_scope: consentScope,
    policy_version: policyVersion,
  };
}

/**
 * Check whether a consent object is valid (has the required fields).
 *
 * @param {object|null|undefined} consent
 * @returns {boolean}
 */
export function hasValidConsent(consent) {
  if (!consent || typeof consent !== "object" || Array.isArray(consent)) return false;
  return Boolean(consent.guardian_email && consent.consent_scope);
}

/**
 * Determine whether consent is required for a member before device assignment.
 *
 * @param {object} params
 * @param {boolean} params.isMinor - whether the member is under 18
 * @param {boolean} [params.isUnder13] - whether the member is under 13
 * @param {boolean} params.enforceMemberConsent - school setting: enforce consent for all minors
 * @param {boolean} [params.enforceUnder13] - school setting: enforce consent specifically for under-13
 * @param {boolean} params.consentExists - whether valid consent already exists
 * @returns {boolean}
 */
export function isConsentRequired({
  isMinor = false,
  isUnder13 = false,
  enforceMemberConsent = false,
  enforceUnder13 = false,
  consentExists = false,
}) {
  if (consentExists) return false;
  if (!isMinor) return false;
  if (isUnder13 && enforceUnder13) return true;
  if (enforceMemberConsent) return true;
  return false;
}

/**
 * Get a user-facing message about consent status.
 *
 * @param {object} params
 * @param {boolean} params.isMinor
 * @param {boolean} [params.isUnder13]
 * @param {boolean} params.consentRequired
 * @param {boolean} [params.consentExists]
 * @returns {string|null}
 */
export function getConsentStatusMessage({
  isMinor,
  isUnder13 = false,
  consentRequired,
  consentExists = false,
}) {
  if (!consentRequired || consentExists) return null;
  if (isUnder13) {
    return "This student is under 13. COPPA regulations require guardian consent before device assignment. Please record consent first.";
  }
  if (isMinor) {
    return "This student is a minor. Guardian consent is required before device assignment. Please record consent first.";
  }
  return null;
}
