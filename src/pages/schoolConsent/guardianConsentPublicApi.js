import axios from "axios";

const publicApi = axios.create({
  baseURL: import.meta.env.VITE_APP_DEVITRACK_API,
});

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
