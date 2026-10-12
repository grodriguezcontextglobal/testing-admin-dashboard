import {
  getRoleScopeDimension,
  hasPermission,
  isCoordinatorLevel,
} from "../../../config/roles";

/**
 * Which inventory-page actions a person gets: Add and Import (create), Update,
 * and the device-handling ones — Check in from events, Delete group, Ship out,
 * Shipment record — that need create, update and delete together.
 *
 * Two layers, in this order:
 * 1. The role, through the permission matrix in roles.js. Location rows never
 *    grant what the role does not have.
 * 2. The location rows in the permission slice, when they restrict. A scoped
 *    role is defined by them, so none assigned means nothing. A company-wide
 *    role (inventory_manager, sale_manager) with no rows has general access —
 *    the same reading checkRolePermission and the page's location filter give
 *    an empty assignment.
 *
 * The gates used to ask for a location flag on anyone below admin, so an
 * inventory manager with no location rows saw none of these actions.
 *
 * @param {{ roleType: string|null, locations?: Array<{can_create: boolean, can_update: boolean, can_delete: boolean}> }} permission
 */
export const inventoryPageActions = ({ roleType, locations = [] }) => {
  if (isCoordinatorLevel(roleType)) {
    return { canCreate: true, canUpdate: true, canManageDevices: true };
  }

  const rows = Array.isArray(locations) ? locations : [];
  const restrictedByRows = getRoleScopeDimension(roleType) !== null || rows.length > 0;

  const allowed = (action, flag) =>
    hasPermission(`inventory:${action}`, roleType) &&
    (!restrictedByRows || rows.some((row) => row[flag]));

  const canCreate = allowed("create", "can_create");
  const canUpdate = allowed("update", "can_update");
  const canManageDevices =
    hasPermission("inventory:create", roleType) &&
    hasPermission("inventory:update", roleType) &&
    hasPermission("inventory:delete", roleType) &&
    (!restrictedByRows ||
      (rows.length > 0 &&
        rows.every((row) => row.can_create && row.can_update && row.can_delete)));

  return { canCreate, canUpdate, canManageDevices };
};
