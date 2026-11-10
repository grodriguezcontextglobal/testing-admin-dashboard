import { preSessionHeaders } from "../../../api/sessionCredential";

/**
 * Body and axios config for POST /admin/logout when the session is not
 * stored yet (the company picker, multipleCompanies/Modal.jsx).
 *
 * The server verifies the session and will stop accepting a logout that names
 * only a uid (FRONTEND_fedramp_a2_lote2_2026-10-27.md, AC-3). `answer` is the
 * sign-in answer: its token for x-token, or its CSRF token with the cookie
 * session (src/api/sessionCredential.js).
 */
export const signOutRequest = ({ uid, answer, cookieSession }) => {
  const headers = preSessionHeaders(answer, { cookieSession });
  return {
    body: { uid },
    config: Object.keys(headers).length ? { headers } : {},
  };
};
