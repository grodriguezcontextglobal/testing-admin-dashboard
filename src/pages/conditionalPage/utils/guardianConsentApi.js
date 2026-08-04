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
