import { createTransform } from "redux-persist";

/**
 * redux-persist writes the store to localStorage, where it outlives the tab.
 * Passwords must not be in it (FRONTEND_crypto_inventory_2026-10-15.md §3):
 *
 * - `admin.user.password`: the company sign-up keeps the typed password there
 *   between Registration and RegisterCompany, which posts it to
 *   /registration/new. An abandoned sign-up left it on disk in plain text.
 * - `admin.user.data.password`: `data` is the server's admin record, which can
 *   carry the bcrypt hash until the backend stops sending it.
 *
 * Only the copy written to storage loses them; the in-memory store keeps the
 * sign-up's password for as long as the tab is open. After a reload it is
 * gone, and RegisterCompany sends the person back to step one
 * (signupNeedsPasswordAgain).
 */
const withoutPassword = (record) => {
  if (!record || typeof record !== "object" || Array.isArray(record)) return record;
  // eslint-disable-next-line no-unused-vars
  const { password, ...rest } = record;
  return rest;
};

const stripAdminPasswords = (admin) => {
  if (!admin?.user || typeof admin.user !== "object" || Array.isArray(admin.user)) return admin;
  const user = withoutPassword(admin.user);
  if (user.data) user.data = withoutPassword(user.data);
  return { ...admin, user };
};

export const stripPasswordsTransform = createTransform(
  (inbound) => stripAdminPasswords(inbound),
  (outbound) => outbound,
  { whitelist: ["admin"] }
);
