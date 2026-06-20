import { useSelector } from "react-redux";
import { hasActionPermission } from "../config/permissionActions";

/**
 * Returns true if the current user's role is allowed to perform the given action.
 *
 * Action keys (e.g. 'staff:create') are resolved through roleCapabilities.js — the
 * single source of truth — via the permissionActions bridge. This keeps the existing
 * key vocabulary while routing every decision through `can()` (super_user-aware,
 * latest policy).
 *
 * @param {string} action - A "resource:action" key (see permissionActions.js)
 * @returns {boolean}
 *
 * @example
 * const canCreate = usePermission('staff:create');
 * <Button style={{ display: canCreate ? 'flex' : 'none' }} />
 */
export const usePermission = (action) => {
  const { user } = useSelector((state) => state.admin);
  return hasActionPermission(user, action);
};
