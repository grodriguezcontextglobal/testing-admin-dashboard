export const ROLES = {
  ROOT_ADMIN: 0,
  ADMIN: 1,
  MANAGER: 2,
  SUPPORT: 3,
  EVENT_STAFF: 4,
};

// Maps each action key to the role numbers allowed to perform it.
// Source of truth for all role-based access checks across the app.
export const PERMISSIONS = {
  // Staff management
  "staff:create": [0, 1],
  "staff:delete": [0, 1],
  "staff:assign_role": [0, 1],
  "staff:assign_devices": [0, 1],
  "staff:assign_event": [0, 1],
  "staff:assign_location": [0, 1],
  "staff:update_contact": [0, 1, 2, 3, 4],
  "staff:change_role": [0, 1],
  "staff:reset_password": [0, 1, 2, 3, 4],
  "staff:grant_access": [0, 1, 2],

  // Inventory
  "inventory:view": [0, 1, 2],
  "inventory:create": [0],
  "inventory:update": [0],
  "inventory:delete": [0],
  "inventory:assign_location": [0],
  "inventory:manage_location": [0],

  // Navigation pages
  "nav:home": [0, 1, 2, 3],
  "nav:inventory": [0, 1, 2],
  "nav:events": [0, 1, 2, 3, 4],
  "nav:consumers": [0, 1],
  "nav:posts": [0, 1, 2, 3],
  "nav:staff": [0, 1, 2, 3],
  "nav:profile": [0, 1, 2, 3, 4],

  // Profile settings tabs
  "profile:company_settings": [0, 1],
  "profile:billing": [0],
  "profile:subscription": [0],
  "profile:staff_settings": [0, 1],
};
