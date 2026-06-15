import { useSelector } from "react-redux";
import { PERMISSIONS } from "../config/roles";

/**
 * Returns true if the current user's role is allowed to perform the given action.
 *
 * @param {string} action - A key from PERMISSIONS (e.g. 'staff:create')
 * @returns {boolean}
 *
 * @example
 * const canCreate = usePermission('staff:create');
 * <Button style={{ display: canCreate ? 'flex' : 'none' }} />
 */
export const usePermission = (action) => {
  const { user } = useSelector((state) => state.admin);
  const allowedRoles = PERMISSIONS[action];
  if (!allowedRoles) return false;
  return allowedRoles.includes(Number(user.role));
};
