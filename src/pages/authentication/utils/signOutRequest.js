/**
 * Body and axios config for POST /admin/logout when the session token is not
 * stored yet (the company picker, multipleCompanies/Modal.jsx).
 *
 * The server verifies x-token and will stop accepting a logout that names
 * only a uid (FRONTEND_fedramp_a2_lote2_2026-10-27.md, AC-3).
 */
export const signOutRequest = ({ uid, token }) => ({
  body: { uid },
  config: token ? { headers: { "x-token": token } } : {},
});
