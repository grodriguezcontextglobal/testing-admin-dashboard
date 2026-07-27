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
 * Send or resend a guardian consent request.
 *
 * @param {object} payload
 * @returns {Promise<object>}
 */
export async function sendConsentRequest(payload) {
  const response = await devitrakApi.post("/school/consent/request", payload);
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
