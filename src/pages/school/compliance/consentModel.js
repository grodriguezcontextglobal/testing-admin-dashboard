/**
 * FERPA/COPPA guardian-consent domain model (client-side).
 *
 * For the sales demo the consent gate is STAGED entirely on the client — this
 * module derives consent state from the member record plus a locally recorded
 * consent (see stagedConsentStore.js). It intentionally mirrors the server
 * contract (POST /api/school/consent/record, GET /api/school/consent and the
 * CONSENT_REQUIRED / UNDER_13_CONSENT_REQUIRED assignment errors) so that
 * swapping the staged store for the real backend later is a drop-in change to
 * the store — not to this logic.
 */

export const DEFAULT_POLICY_TYPE = "AUP";
export const DEFAULT_POLICY_VERSION = "1";
export const DEFAULT_CONSENT_METHOD = "e-signature";

// New Education companies default to enforcement ON (per backend contract).
export const DEFAULT_ENFORCEMENT = {
  enforce_member_consent: true,
  enforce_under_13_consent: true,
  required_consent_policy_version: DEFAULT_POLICY_VERSION,
};

export const CONSENT_STATUS = {
  NOT_REQUIRED: "NOT_REQUIRED", // adult, or enforcement disabled
  NO_GUARDIAN: "NO_GUARDIAN", // minor/under-13 with no guardian on file
  GUARDIAN_NO_CONSENT: "GUARDIAN_NO_CONSENT", // guardian present, consent missing
  CONSENT_OUTDATED: "CONSENT_OUTDATED", // consent recorded for an older policy version
  CONSENT_VALID: "CONSENT_VALID",
};

// Mirrors the domain-specific errors the assignment endpoint may return.
export const BLOCK_REASON = {
  CONSENT_REQUIRED: "CONSENT_REQUIRED",
  UNDER_13_CONSENT_REQUIRED: "UNDER_13_CONSENT_REQUIRED",
};

/** Whole years between a date_of_birth and now; null if unparseable/absent. */
export const ageFromDOB = (dob) => {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const monthDelta = now.getMonth() - d.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < d.getDate())) {
    age -= 1;
  }
  return age;
};

/**
 * Derive the age category. Prefer the server-authoritative date_of_birth;
 * fall back to the legacy `minor` flag only when DOB is absent (older records
 * or staged data without a birth date). under-13 can only be asserted from a
 * real DOB — the flag alone never implies it.
 */
export const deriveAgeCategory = (member = {}) => {
  const age = ageFromDOB(member.date_of_birth);
  if (age != null) {
    return { ageYears: age, isUnder13: age < 13, isMinor: age < 18, source: "dob" };
  }
  return {
    ageYears: null,
    isUnder13: false,
    isMinor: Number(member.minor) === 1,
    source: "flag",
  };
};

/** A complete guardian requires at least a first name and an email on file. */
export const hasGuardian = (member = {}) =>
  Boolean(
    member.parent_guardian_first_name?.trim?.() &&
      member.parent_guardian_email?.trim?.()
  );

/**
 * Resolve the consent status for a member given the recorded consent (or null)
 * and the active enforcement settings.
 */
export const getConsentStatus = (
  member = {},
  consentRecord = null,
  enforcement = DEFAULT_ENFORCEMENT
) => {
  const { isMinor, isUnder13 } = deriveAgeCategory(member);
  const consentRelevant = isMinor || isUnder13; // adults never need guardian consent
  if (!consentRelevant) return CONSENT_STATUS.NOT_REQUIRED;
  if (!hasGuardian(member)) return CONSENT_STATUS.NO_GUARDIAN;
  if (!consentRecord) return CONSENT_STATUS.GUARDIAN_NO_CONSENT;
  const requiredVersion = String(
    enforcement?.required_consent_policy_version ?? DEFAULT_POLICY_VERSION
  );
  if (String(consentRecord.policy_version) !== requiredVersion) {
    return CONSENT_STATUS.CONSENT_OUTDATED;
  }
  return CONSENT_STATUS.CONSENT_VALID;
};

/**
 * Decide whether device assignment is blocked, and why. Returns
 * { blocked, reason, status }. `reason` maps to the backend's domain errors so
 * callers can render the same messaging whether the block is staged or real.
 */
export const evaluateAssignmentGate = (
  member = {},
  consentRecord = null,
  enforcement = DEFAULT_ENFORCEMENT
) => {
  const { isMinor, isUnder13 } = deriveAgeCategory(member);
  const status = getConsentStatus(member, consentRecord, enforcement);

  const satisfied =
    status === CONSENT_STATUS.CONSENT_VALID ||
    status === CONSENT_STATUS.NOT_REQUIRED;
  if (satisfied) return { blocked: false, reason: null, status };

  const enforceGeneral = enforcement?.enforce_member_consent !== false;
  const enforceUnder13 = enforcement?.enforce_under_13_consent !== false;

  if (isUnder13 && enforceUnder13) {
    return { blocked: true, reason: BLOCK_REASON.UNDER_13_CONSENT_REQUIRED, status };
  }
  if (isMinor && enforceGeneral) {
    return { blocked: true, reason: BLOCK_REASON.CONSENT_REQUIRED, status };
  }
  // Minor/under-13 but the relevant enforcement toggle is off.
  return { blocked: false, reason: null, status };
};
