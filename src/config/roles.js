// ─── Role type discriminators ─────────────────────────────────────────────────
export const ROLE_TYPES = {
  ROOT_ADMIN: "root_admin",
  ADMIN: "admin",
  SALE_MANAGER: "sale_manager",
  EVENT_MANAGER: "event_manager",
  INVENTORY_MANAGER: "inventory_manager",
  ASSISTANT: "assistant",
};

// ─── Role levels ─────────────────────────────────────────────────────────────
// Unique numeric identifier per role, mirroring the DB enum ordinal.
export const ROLE_LEVELS = {
  root_admin: 0,
  admin: 1,
  sale_manager: 2,
  event_manager: 3,
  inventory_manager: 4,
  assistant: 5,
};

// ─── Legacy numeric map ───────────────────────────────────────────────────────
// Direct 1:1 mapping: numeric role value → roleType string.
// Used by deriveRoleType (login) and resolveRoleType (runtime fallback) to handle
// DB records that have a numeric role but no roleType string yet.
export const LEGACY_ROLE_MAP = {
  0: "root_admin",
  1: "admin",
  2: "sale_manager",
  3: "event_manager",
  4: "inventory_manager",
  5: "assistant",
};

// ─── Role groups (internal — not exported) ───────────────────────────────────
const FULL_ACCESS = ["root_admin", "admin", "sale_manager"];
const EVENT_ACCESS = [...FULL_ACCESS, "event_manager"];
const INVENTORY_ACCESS = [...FULL_ACCESS, "inventory_manager"];
const TRANSACTION_ACCESS = [...EVENT_ACCESS, "assistant"];
const ALL_ROLES = Object.values(ROLE_TYPES);

// ─── Permission matrix ────────────────────────────────────────────────────────
// Key:   "domain:action"
// Value: array of roleType strings allowed to perform that action.
//
// inventory_manager access to inventory/locations can be further scoped to
// specific locations via staff_location_access (SQL) — this matrix controls
// whether the user can access the domain at all; location filtering is applied
// separately in accessControlUtils.filterDataByRoleAndPreference.
export const PERMISSIONS = {
  // Staff
  "staff:create": FULL_ACCESS,
  "staff:read": ALL_ROLES,
  "staff:update": FULL_ACCESS,
  "staff:delete": FULL_ACCESS,
  "staff:assign_role": FULL_ACCESS,
  "staff:assign_devices": FULL_ACCESS,
  "staff:assign_event": FULL_ACCESS,
  "staff:assign_location": FULL_ACCESS,
  "staff:change_role": FULL_ACCESS,
  "staff:reset_password": ALL_ROLES,
  "staff:update_contact": ALL_ROLES,
  "staff:grant_access": FULL_ACCESS,

  // Inventory
  "inventory:create": INVENTORY_ACCESS,
  "inventory:read": INVENTORY_ACCESS,
  "inventory:update": INVENTORY_ACCESS,
  "inventory:delete": INVENTORY_ACCESS,
  "inventory:assign_location": INVENTORY_ACCESS,
  "inventory:manage_location": INVENTORY_ACCESS,

  // Locations
  "location:create": INVENTORY_ACCESS,
  "location:read": INVENTORY_ACCESS,
  "location:update": INVENTORY_ACCESS,
  "location:delete": INVENTORY_ACCESS,

  // Events
  "event:create": EVENT_ACCESS,
  "event:read": EVENT_ACCESS,
  "event:update": EVENT_ACCESS,
  "event:delete": EVENT_ACCESS,

  // Consumers
  "consumer:create": EVENT_ACCESS,
  "consumer:read": EVENT_ACCESS,
  "consumer:update": EVENT_ACCESS,
  "consumer:delete": EVENT_ACCESS,

  // Transactions
  "transaction:create": TRANSACTION_ACCESS,
  "transaction:read": TRANSACTION_ACCESS,
  "transaction:update": TRANSACTION_ACCESS,
  "transaction:delete": [...FULL_ACCESS, "assistant"],

  // Navigation
  "nav:home": ALL_ROLES,
  "nav:inventory": INVENTORY_ACCESS,
  "nav:events": TRANSACTION_ACCESS,
  "nav:consumers": EVENT_ACCESS,
  "nav:staff": [...FULL_ACCESS, "event_manager", "inventory_manager"],
  "nav:posts": ALL_ROLES,
  "nav:profile": ALL_ROLES,

  // Profile settings
  "profile:company_settings": FULL_ACCESS,
  "profile:billing": ["root_admin"],
  "profile:subscription": ["root_admin"],
  "profile:staff_settings": FULL_ACCESS,
};

// ─── Pure helpers ─────────────────────────────────────────────────────────────

const VALID_ROLE_TYPES = new Set(Object.values(ROLE_TYPES));

/**
 * Resolves the effective roleType from a Redux user object.
 * Falls back to LEGACY_ROLE_MAP when roleType is absent or invalid —
 * e.g. a persisted Redux session from before roleType was introduced,
 * or a DB record with roleType "unknown".
 */
export const resolveRoleType = (user) => {
  if (!user) return "assistant";
  if (user.roleType && VALID_ROLE_TYPES.has(user.roleType)) return user.roleType;
  return LEGACY_ROLE_MAP[Number(user.role)] ?? "assistant";
};

/**
 * Returns true if roleType is allowed to perform action.
 * Pure function — usable outside React (scripts, middleware, tests).
 */
export const hasPermission = (action, roleType) => {
  if (!action || !roleType) return false;
  return PERMISSIONS[action]?.includes(roleType) ?? false;
};

// ─── Display labels ───────────────────────────────────────────────────────────
export const ROLE_LABELS = {
  root_admin: "Root Administrator",
  admin: "Administrator",
  sale_manager: "Sale Manager",
  event_manager: "Event Manager",
  inventory_manager: "Inventory Manager",
  assistant: "Assistant",
};

export const getRoleLabel = (roleType) => {
  if (!roleType) return "";
  return ROLE_LABELS[roleType] ?? roleType;
};

/** True for root_admin, admin, sale_manager (levels 0–2 — full CRUD access). */
export const isCoordinatorLevel = (roleType) =>
  (ROLE_LEVELS[roleType] ?? 99) <= 2;

/** True only for assistant (lowest privilege). */
export const isAssistant = (roleType) => roleType === "assistant";

/** True for every role except assistant. Safe-default true for unknown/undefined. */
export const isNotAssistant = (roleType) => roleType !== "assistant";
