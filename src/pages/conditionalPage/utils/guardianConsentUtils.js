const CONSENT_STATUSES = new Set([
  "pending",
  "agreed",
  "refused",
  "expired",
]);

/**
 * Resolve the single consent record to inspect, from any of the response
 * shapes the school-consent endpoints return. The real `POST /school/consent`
 * response (confirmed 2026-08-04) is `{ consents: [...] }` — plural, an
 * array, since a member can accumulate more than one request over time (e.g.
 * a stale one left behind after a policy version bump) — so pick the most
 * recently requested record when there's more than one.
 *
 * @param {object|null|undefined} response
 * @returns {object|null}
 */
export function resolveConsentRecord(response) {
  if (!response || typeof response !== "object" || Array.isArray(response)) {
    return null;
  }

  if (Array.isArray(response.consents) && response.consents.length > 0) {
    return [...response.consents].sort(
      (a, b) => new Date(b.requested_at || 0) - new Date(a.requested_at || 0)
    )[0];
  }

  return response.consent || response.record || response.data?.consent || response;
}

function hasConsentRecord(consent) {
  return Boolean(
    consent &&
      typeof consent === "object" &&
      !Array.isArray(consent) &&
      Object.keys(consent).length > 0
  );
}

function resolveRequiredPolicyVersion(response, consent) {
  return (
    response?.required_consent_policy_version ??
    response?.settings?.required_consent_policy_version ??
    consent?.required_consent_policy_version ??
    null
  );
}

/**
 * Normalize server consent response into a canonical status string.
 *
 * @param {object|null|undefined} response
 * @returns {"missing"|"pending"|"agreed"|"refused"|"expired"|"stale"}
 */
export function normalizeConsentStatus(response) {
  const consent = resolveConsentRecord(response);

  if (!hasConsentRecord(consent)) return "missing";

  const requiredPolicyVersion = resolveRequiredPolicyVersion(response, consent);
  if (isPolicyStale(consent, requiredPolicyVersion)) return "stale";

  const status = consent.status || consent.state;
  if (CONSENT_STATUSES.has(status)) return status;

  return "missing";
}

/**
 * Check if consent is agreed and, when required, policy-version current.
 *
 * @param {object|null|undefined} consent
 * @param {string|null|undefined} requiredPolicyVersion
 * @returns {boolean}
 */
export function isConsentAgreed(consent, requiredPolicyVersion = null) {
  const status = consent?.status || consent?.state;
  if (status !== "agreed") return false;
  if (!requiredPolicyVersion) return true;
  return consent?.policy_version === requiredPolicyVersion;
}

/**
 * Determine whether assignment should be blocked by consent enforcement.
 *
 * @param {string} consentStatus
 * @param {{ enforce: boolean, enforce_under_13: boolean, required_consent_policy_version: string|null }} settings
 * @returns {boolean}
 */
export function isConsentBlockingAssignment(consentStatus, settings) {
  if (!resolveConsentEnforcement(settings)) return false;
  if (consentStatus === "agreed") return false;
  return true;
}

/**
 * Whether the company has opted into consent enforcement.
 *
 * `/school/settings` returns `enforce` (see buildConsentEnforcementPayload). Two
 * call sites read `enforce_member_consent`, a key that is not in the response, so
 * the check evaluated `undefined` and enforcement read as OFF for every company
 * that had not also switched on `enforce_under_13`. The old name is tolerated
 * here rather than assumed dead, because a stale cached settings object is
 * cheaper to accept than to prove absent.
 *
 * @param {object|null|undefined} settings
 * @returns {boolean}
 */
export function resolveConsentEnforcement(settings) {
  return enforcesMinorConsent(settings) || enforcesUnder13Consent(settings);
}

/** Company requires consent for every minor (under 18). */
const enforcesMinorConsent = (settings) =>
  Boolean(settings?.enforce ?? settings?.enforce_member_consent ?? false);

/** Company requires consent for under-13s specifically (COPPA). */
const enforcesUnder13Consent = (settings) => Boolean(settings?.enforce_under_13);

/**
 * Does THIS member need a recorded consent before receiving a device?
 *
 * Each toggle is an AGE SCOPE, not a general switch. Both used to flip the same
 * age-blind enforcement, which had two consequences worth naming:
 * "Require COPPA consent for under-13" also blocked adults, and with both off an
 * earlier version of this module blocked every minor regardless — consent was
 * being asked for on a company that had explicitly not asked for it.
 *
 *   both off        -> no age is checked at all; assignment proceeds
 *   enforce         -> every minor (under 18), under-13s included
 *   enforce_under_13-> under-13s only; a 15-year-old is not covered
 *   both on         -> identical to `enforce` alone. under-18 already contains
 *                      under-13, so the second toggle adds no requirement while
 *                      COPPA consent is not a separate policy_type record.
 *
 * @param {{isMinor: boolean, isUnder13: boolean, settings: object}} args
 * @returns {boolean}
 */
export function isConsentRequiredForMember({
  isMinor = false,
  isUnder13 = false,
  settings,
} = {}) {
  if (isUnder13 && enforcesUnder13Consent(settings)) return true;
  if (isMinor && enforcesMinorConsent(settings)) return true;
  return false;
}

/**
 * The pre-assignment verdict: may this member receive a device right now?
 *
 * Blocks only when the company's settings cover this member's age AND consent is
 * not agreed. Takes an object rather than positional args so adding an age scope
 * later cannot silently change what existing callers mean.
 *
 * @param {{consentStatus: string, settings: object, isMinor: boolean, isUnder13: boolean}} args
 * @returns {boolean}
 */
export function isAssignmentBlockedByConsent({
  consentStatus,
  settings,
  isMinor = false,
  isUnder13 = false,
} = {}) {
  if (!isConsentRequiredForMember({ isMinor, isUnder13, settings })) return false;
  return consentStatus !== "agreed";
}

/**
 * Check whether an existing consent was collected for an older policy version.
 *
 * @param {object|null|undefined} consent
 * @param {string|null|undefined} requiredPolicyVersion
 * @returns {boolean}
 */
export function isPolicyStale(consent, requiredPolicyVersion) {
  if (!hasConsentRecord(consent) || !requiredPolicyVersion) return false;
  return consent.policy_version !== requiredPolicyVersion;
}

/**
 * Normalize guardian email for consistent lookup.
 * Lowercases and trims whitespace.
 *
 * @param {string} email
 * @returns {string}
 */
export function normalizeGuardianEmail(email = "") {
  return email.trim().toLowerCase();
}

/**
 * Build the search payload for guardian lookup.
 *
 * @param {{ companyId: number, email: string }} params
 * @returns {object}
 */
export function buildGuardianSearchPayload({ companyId, email }) {
  return {
    company_id: companyId,
    email: normalizeGuardianEmail(email),
  };
}

/**
 * Find an existing guardian by exact email match from search results.
 *
 * @param {Array<object>|undefined} guardians - Array from search response
 * @param {string} email - Normalized email to match
 * @returns {object|null} Matching guardian or null
 */
export function selectGuardianByEmail(guardians, email) {
  if (!Array.isArray(guardians)) return null;
  const normalized = normalizeGuardianEmail(email);
  return guardians.find((g) => normalizeGuardianEmail(g?.email) === normalized) ?? null;
}

/**
 * Build payload to link an existing guardian to a member.
 *
 * @param {{ companyId: number, memberId: number, guardianId: string, relationship: string }} params
 * @returns {object}
 */
export function buildExistingGuardianLinkPayload({ companyId, memberId, guardianId, relationship = "guardian" }) {
  return {
    company_id: companyId,
    member_id: memberId,
    guardian_id: guardianId,
    relationship,
  };
}

/**
 * Build payload to create and link a new guardian to a member.
 *
 * @param {{ companyId: number, memberId: number, firstName: string, lastName: string, email: string, phoneNumber: string, relationship: string }} params
 * @returns {object}
 */
export function buildNewGuardianLinkPayload({ companyId, memberId, firstName, lastName, email, phoneNumber, relationship = "guardian" }) {
  return {
    company_id: companyId,
    member_id: memberId,
    first_name: firstName,
    last_name: lastName,
    email: normalizeGuardianEmail(email),
    phone_number: phoneNumber,
    relationship,
  };
}

/**
 * Extract the created member ID from the API response.
 * Handles multiple possible response shapes.
 *
 * @param {object} response - API response data
 * @returns {number|null} Member ID or null if not found
 */
export function extractCreatedMemberId(response) {
  if (!response || typeof response !== "object") return null;
  // Common response shapes
  return (
    response.member_id ??
    response.id ??
    response.data?.member_id ??
    response.data?.id ??
    response.member?.id ??
    response.member?.member_id ??
    response.memberId ??
    response.data.memberId ??
    null
  );
}

/**
 * Build guardian persistence payload.
 *
 * @param {object} params
 * @param {number} params.memberId
 * @param {number} params.companyId
 * @param {string} params.firstName
 * @param {string} params.lastName
 * @param {string} params.email
 * @param {string} params.phoneNumber
 * @returns {object}
 */
export function buildGuardianPayload({
  memberId,
  companyId,
  firstName,
  lastName,
  email,
  phoneNumber,
}) {
  return {
    member_id: memberId,
    company_id: companyId,
    first_name: firstName,
    last_name: lastName,
    email,
    phone_number: phoneNumber,
  };
}

/**
 * Build consent request payload.
 *
 * @param {object} params
 * @param {number} params.companyId
 * @param {number} params.memberId
 * @param {number} params.guardianId
 * @param {string} params.policyType
 * @param {string|null} params.policyVersion
 * @returns {object}
 */
export function buildConsentRequestPayload({
  companyId,
  memberId,
  guardianId,
  policyType,
  policyVersion,
}) {
  return {
    company_id: companyId,
    member_id: memberId,
    guardian_id: guardianId,
    policy_type: policyType,
    policy_version: policyVersion,
  };
}

/**
 * Get human-readable consent status copy.
 *
 * @param {string} status
 * @returns {string}
 */
export function getConsentStatusCopy(status) {
  const copyByStatus = {
    missing: "Consent has not been requested yet.",
    pending: "Waiting for guardian response.",
    agreed: "Consent completed.",
    refused: "Guardian refused consent.",
    expired: "Consent link expired. Resend request.",
    stale: "A new policy version requires consent again.",
  };

  return copyByStatus[status] || "Unknown consent status.";
}
