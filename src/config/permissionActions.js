/**
 * permissionActions.js — compatibility bridge for the "resource:action" permission
 * vocabulary (originally in roles.js, consumed by usePermission + route guards).
 *
 * roleCapabilities.js is the SINGLE source of truth. This module maps the action-key
 * vocabulary onto it, so the keys (which may mirror the backend's permission strings)
 * keep working while all access decisions resolve through `can()` — including the
 * super_user override and the latest policy (Admin = all-locations, company info Owner-only).
 */
import { can } from "./roleCapabilities";

// "resource:action" key  ->  roleCapabilities dot-path
export const ACTION_TO_CAPABILITY = Object.freeze({
  // Staff
  "staff:create": "staff.add",
  "staff:delete": "staff.delete",
  "staff:assign_role": "staff.changeRole",
  "staff:assign_devices": "staff.assignDevices",
  "staff:assign_event": "staff.assignToEvent",
  "staff:assign_location": "staff.assignLocationPermission",
  "staff:update_contact": "staff.updateContactInfo",
  "staff:change_role": "staff.changeRole",
  "staff:reset_password": "staff.sendPasswordReset",
  "staff:grant_access": "staff.grantRevokeAccess",

  // Inventory
  "inventory:view": "nav.inventory",
  "inventory:create": "nav.inventory", // route-level reachability; the create button itself is gated in-page by mode/location perms
  "inventory:update": "inventory.editItem",
  "inventory:delete": "inventory.deleteItem",
  "inventory:assign_location": "inventory.editStructure",
  "inventory:manage_location": "inventory.editStructure", // create/rename locations (Owner+Admin); deleting a location uses inventory.deleteLocation (Owner-only)

  // Navigation pages
  "nav:home": "nav.home",
  "nav:inventory": "nav.inventory",
  "nav:events": "nav.events",
  "nav:consumers": "nav.consumers",
  "nav:posts": "nav.posts",
  "nav:staff": "nav.staff",
  "nav:profile": "nav.profile",

  // Profile / settings tabs
  "profile:company_settings": "profile.companyInfo", // Owner-only (intentional)
  "profile:billing": "profile.stripeAccount",
  "profile:subscription": "profile.stripeAccount",
  "profile:staff_settings": "profile.suppliers",
});

/**
 * Boolean permission check by action key, resolved through roleCapabilities.
 * Accepts a user object (preferred — resolves super_user) or a raw role id.
 * Unknown keys return false (deny by default).
 */
export const hasActionPermission = (userOrRole, action) => {
  const path = ACTION_TO_CAPABILITY[action];
  if (!path) return false;
  return can(userOrRole, path) === true;
};
