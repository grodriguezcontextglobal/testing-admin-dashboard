import axios from "axios";
import { getActiveServerSynchronously, switchServer } from "../../api/serverManager";

// Plain axios instance (no auth headers) for the unauthenticated guardian
// consent flow — but still gets the same primary/backup server failover as
// the rest of the app, since a guardian following an email link has no
// admin around to help if the primary server has a blip.
const publicApi = axios.create({
  baseURL: getActiveServerSynchronously(),
});

publicApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const message = error?.message || "";
    const isNetworkish = message.includes("Network Error") || message.includes("timeout");

    if (isNetworkish && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const newBaseURL = await switchServer();
        publicApi.defaults.baseURL = newBaseURL;
        return publicApi(originalRequest);
      } catch {
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export async function retrievePublicConsent(otc) {
  const response = await publicApi.post("/school/consent/public/retrieve", {
    otc,
  });
  return response.data;
}

export async function respondPublicConsent(otc, decision, signerName) {
  const response = await publicApi.post("/school/consent/public/respond", {
    otc,
    decision,
    signer_name: signerName,
  });
  return response.data;
}

/**
 * Fetch the title + a viewable URL for the school's assigned consent
 * document, so the guardian can read it before deciding. Reuses the same
 * document metadata/download endpoints the authenticated Documents module
 * uses (confirmed 2026-08-04 to respond without any auth headers or a real
 * `viewerId`) — see FRONTEND_backend_security_report_company_scoping.md for
 * the follow-up on hardening that server-side.
 *
 * @param {string} documentId - `company.consent_document_id` from retrievePublicConsent
 * @param {string} [viewerId] - passed through to the download endpoint; not
 *   currently validated server-side, so any identifying value works
 * @returns {Promise<{title: string|null, viewUrl: string|null}>}
 */
export async function fetchPublicConsentDocument(documentId, viewerId = "guardian") {
  const [docResponse, downloadResponse] = await Promise.all([
    publicApi.get(`/document/${documentId}`),
    publicApi.get(`/document/download/${documentId}/${viewerId}`),
  ]);
  return {
    title: docResponse.data?.document?.title ?? null,
    viewUrl: downloadResponse.data?.downloadUrl ?? null,
  };
}
