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
