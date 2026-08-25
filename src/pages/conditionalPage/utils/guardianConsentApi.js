import { devitrakApi } from "../../../api/devitrakApi";

/**
 * Fetch current consent status for a student member.
 *
 * @param {number} companyId
 * @param {number} memberId
 * @returns {Promise<object>}
 */
export async function fetchStudentConsent(companyId, memberId) {
  const response = await devitrakApi.post("/school/consent", {
    company_id: companyId,
    member_id: memberId,
  });
  return response.data;
}

/**
 * District-wide consent posture in a single request.
 *
 * Returns a `statuses` map keyed by member_id plus the aggregate counts.
 * Prefer this over calling fetchStudentConsent per student: the readiness
 * dashboard covers ~961 minors on the demo district, and one request per
 * student is enough to trip a production rate limiter.
 *
 * @param {number} companyId
 * @param {{ policyType?: string, policyVersion?: string|null }} [options]
 * @returns {Promise<object>}
 */
export async function fetchConsentStatusSummary(
  companyId,
  { policyType = "AUP", policyVersion } = {}
) {
  const response = await devitrakApi.post("/school/consent/status", {
    company_id: companyId,
    policy_type: policyType,
    ...(policyVersion ? { policy_version: policyVersion } : {}),
  });
  return response.data;
}

/**
 * Every consent record for the company, in any state, one page at a time.
 *
 * Added 2026-08-25. This is the only endpoint that answers the register
 * question: `/school/consent` needs a member_id, and `/school/consent/status`
 * only reports signed or not signed.
 *
 * A student can hold several rows — one per policy version and per resend — so
 * this is a list of consents, not a list of students. The one-time code is
 * never returned, in any form.
 *
 * Auth is the same as the rest of the namespace (x-token + checkTokenVersion +
 * Education industry + member:read), and the read is written to the PII audit,
 * so do not poll it.
 *
 * @param {object} payload - build it with buildConsentListPayload
 * @returns {Promise<{ok: boolean, page: number, page_size: number, total: number,
 *   total_pages: number, count: number, consents: object[]}>}
 */
export async function fetchCompanyConsents(payload) {
  const response = await devitrakApi.post("/school/consent/list", payload);
  return response.data;
}

/**
 * Store a guardian record.
 *
 * @param {object} guardianPayload
 * @returns {Promise<object>}
 */
export async function saveGuardian(guardianPayload) {
  const response = await devitrakApi.post("/school/guardians/add", guardianPayload);
  return response.data;
}

/**
 * Send an initial guardian consent request (starts the OTC flow).
 *
 * @param {object} payload
 * @returns {Promise<object>}
 */
export async function sendConsentRequest(payload) {
  const response = await devitrakApi.post("/school/consent/request", payload);
  return response.data;
}

/**
 * Regenerate the OTC and re-send the consent email for an existing,
 * still-pending request. 404 if no request exists yet (call
 * sendConsentRequest first); 409 if already agreed/refused; 422 if no
 * guardian email is on file.
 *
 * @param {object} payload
 * @returns {Promise<object>}
 */
export async function resendConsentRequest(payload) {
  const response = await devitrakApi.post("/school/consent/resend", payload);
  return response.data;
}

/**
 * List every guardian linked to a student (normalized + embedded primary).
 *
 * @param {number} companyId
 * @param {number} memberId
 * @returns {Promise<object>}
 */
export async function listGuardians(companyId, memberId) {
  const response = await devitrakApi.post("/school/guardians", {
    company_id: companyId,
    member_id: memberId,
  });
  return response.data;
}

/**
 * Search guardians by email within a company.
 * @param {object} payload - { company_id, email }
 * @returns {Promise<object>}
 */
export async function searchGuardians(payload) {
  const response = await devitrakApi.post("/school/guardians/search", payload);
  return response.data;
}
