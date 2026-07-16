// ─── Role type discriminators ─────────────────────────────────────────────────
export const ROLE_TYPES = {
  // Legacy strings — kept for backward compat with existing DB records
  ROOT_ADMIN: "root_admin",
  ADMIN: "admin",
  SALE_MANAGER: "sale_manager",
  EVENT_MANAGER: "event_manager",
  INVENTORY_MANAGER: "inventory_manager",
  ASSISTANT: "assistant",
  // F-01: new canonical strings
  ROOT_ADMINISTRATOR: "root_administrator",
  SALES_ASSOCIATE: "sales_associate",
  MANAGER_EVENT: "manager_event",
  MANAGER_INVENTORY: "manager_inventory",
  ASSOCIATE_INVENTORY: "associate_inventory",
  EVENT_ASSISTANT: "event_assistant",
};

// ─── Role levels ─────────────────────────────────────────────────────────────
// Unique numeric identifier per role, mirroring the DB enum ordinal.
export const ROLE_LEVELS = {
  // Legacy strings
  root_admin: 0,
  admin: 1,
  sale_manager: 2,
  event_manager: 3,
  inventory_manager: 4,
  assistant: 5,
  // F-01: new canonical strings (same levels as their legacy counterparts)
  root_administrator: 0,
  sales_associate: 2,
  manager_event: 3,
  manager_inventory: 4,
  associate_inventory: 5,
  event_assistant: 6,
};

// ─── Legacy numeric map ───────────────────────────────────────────────────────
// Direct 1:1 mapping: numeric role value → roleType string.
// Used by deriveRoleType (login) and resolveRoleType (runtime fallback) to handle
// DB records that have a numeric role but no roleType string yet.
// DO NOT change these values — they mirror existing DB records.
export const LEGACY_ROLE_MAP = {
  0: "root_admin",
  1: "admin",
  2: "sale_manager",
  3: "event_manager",
  4: "inventory_manager",
  5: "assistant",
};

// ─── Role upgrade map (F-01) ─────────────────────────────────────────────────
// Maps legacy roleType strings → new canonical strings.
// Used in F-06 migration to upgrade individual staff records.
// Not used by resolveRoleType — old strings remain valid during the transition.
export const ROLE_UPGRADE_MAP = {
  root_admin: "root_administrator",
  admin: "admin",
  sale_manager: "sales_associate",
  event_manager: "manager_event",
  inventory_manager: "manager_inventory",
  assistant: "associate_inventory",
};

// ─── Role label groups (company-level label customization) ──────────────────
// Groups the legacy + canonical roleType strings that represent the same
// conceptual role, keyed by the legacy string. A company customizing role
// labels edits one entry per group instead of needing to know both strings.
// Derived from ROLE_UPGRADE_MAP so the two stay in sync automatically.
export const ROLE_LABEL_GROUPS = Object.fromEntries(
  Object.entries(ROLE_UPGRADE_MAP).map(([legacy, canonical]) => [
    legacy,
    legacy === canonical ? [legacy] : [legacy, canonical],
  ])
);

/**
 * Returns the ROLE_LABEL_GROUPS key (legacy string) that roleType belongs to.
 * Accepts a roleType string or a legacy numeric role value (see getRoleLabel).
 */
export const getRoleLabelGroupKey = (roleType) => {
  const resolved = LEGACY_ROLE_MAP[Number(roleType)] ?? roleType;
  const entry = Object.entries(ROLE_LABEL_GROUPS).find(([, members]) =>
    members.includes(resolved)
  );
  return entry?.[0] ?? resolved;
};

// ─── Role groups (internal — not exported) ───────────────────────────────────
const ALL_ROLES = Object.values(ROLE_TYPES);

// Full administrative access: root_admin + admin only
const ADMIN_FULL = ["root_admin", "admin"];

// Event domain:
//   CRU — assistant can Create/Read/Update but not Delete
//   D   — Delete requires event_manager or higher
const EVENT_CRU = ["root_admin", "admin", "event_manager", "assistant"];
const EVENT_D   = ["root_admin", "admin", "event_manager"];

// sale_manager has Read + Update on events (no Create/Delete)
const EVENT_RU  = ["root_admin", "admin", "sale_manager", "event_manager", "assistant"];

// Inventory domain:
//   CD — Create/Delete: inventory_manager + admins (no sale_manager)
//   RU — Read/Update: also includes sale_manager
const INVENTORY_CD = ["root_admin", "admin", "inventory_manager"];
const INVENTORY_RU = ["root_admin", "admin", "sale_manager", "inventory_manager"];

// Posts: event_manager + inventory_manager
const POSTS_ACCESS = ["root_admin", "admin", "event_manager", "inventory_manager"];

// ─── Permission matrix ────────────────────────────────────────────────────────
// Key:   "domain:action"
// Value: array of roleType strings allowed to perform that action.
export const PERMISSIONS = {
  // Staff — CRUD only for root_admin + admin
  "staff:create": ADMIN_FULL,
  "staff:read": ALL_ROLES,
  "staff:update": ADMIN_FULL,
  "staff:delete": ADMIN_FULL,
  "staff:assign_role": ADMIN_FULL,
  "staff:assign_devices": ADMIN_FULL,
  "staff:assign_event": ADMIN_FULL,
  "staff:assign_location": ADMIN_FULL,
  "staff:change_role": ADMIN_FULL,
  "staff:reset_password": ALL_ROLES,
  "staff:update_contact": ALL_ROLES,
  "staff:grant_access": ADMIN_FULL,

  // Inventory — sale_manager: R/U only (no Create/Delete)
  "inventory:create": INVENTORY_CD,
  "inventory:read": INVENTORY_RU,
  "inventory:update": INVENTORY_RU,
  "inventory:delete": INVENTORY_CD,
  "inventory:assign_location": INVENTORY_CD,
  "inventory:manage_location": INVENTORY_CD,

  // Locations — inventory_manager + admins only (sale_manager has no location access)
  "location:create": INVENTORY_CD,
  "location:read": INVENTORY_CD,
  "location:update": INVENTORY_CD,
  "location:delete": INVENTORY_CD,

  // Events — sale_manager: R/U only; assistant: C/R/U (no Delete)
  "event:create": EVENT_CRU,
  "event:read": EVENT_RU,
  "event:update": EVENT_RU,
  "event:delete": EVENT_D,
  "event:notify_push": EVENT_CRU,

  // Consumers — event_manager: CRUD; assistant: C/R/U (no Delete)
  "consumer:create": EVENT_CRU,
  "consumer:read": EVENT_CRU,
  "consumer:update": EVENT_CRU,
  "consumer:delete": EVENT_D,

  // Transactions — event_manager: CRUD; assistant: C/R/U (no Delete)
  "transaction:create": EVENT_CRU,
  "transaction:read": EVENT_CRU,
  "transaction:update": EVENT_CRU,
  "transaction:delete": EVENT_D,

  // Posts — event_manager + inventory_manager: CRUD
  "post:create": POSTS_ACCESS,
  "post:read": POSTS_ACCESS,
  "post:update": POSTS_ACCESS,
  "post:delete": POSTS_ACCESS,

  // Navigation
  "nav:home": ALL_ROLES,
  "nav:inventory": INVENTORY_RU,
  "nav:events": EVENT_RU,
  "nav:consumers": EVENT_CRU,
  "nav:staff": ADMIN_FULL,
  "nav:posts": POSTS_ACCESS,
  "nav:dynamic_section": EVENT_D,
  "nav:profile": ALL_ROLES,

  // Profile settings
  "profile:company_settings": ADMIN_FULL,
  "profile:billing": ["root_admin"],
  "profile:subscription": ["root_admin"],
  "profile:staff_settings": ADMIN_FULL,

  // ── F-02: Members domain ─────────────────────────────────────────────────
  // Same CRU/D shape as events/consumers: root_admin, admin, event_manager and
  // assistant can Create/Read/Update; Delete is reserved for EVENT_D (no assistant).
  // assign_devices + notify back the member options bar (assign devices,
  // update member info, send email reminder) — visible to the CRU roles.
  "member:create": EVENT_CRU,
  "member:read": EVENT_CRU,
  "member:update": EVENT_CRU,
  "member:delete": EVENT_D,
  "member:assign_devices": EVENT_CRU,
  "member:notify": EVENT_CRU,
  "nav:members": EVENT_CRU,

  // ── F-01: new permission keys — no roles assigned yet ───────────────────────

  // Events — quickGlance scope (F-04 will assign event_assistant)
  "event:quickGlance_read": [],
  "event:quickGlance_update": [],

  // Transactions — Stripe scope (F-04 will assign event_assistant)
  "transaction:stripe_create": [],
  "transaction:stripe_read": [],
  "transaction:stripe_update": [],
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
  // Legacy strings
  root_admin: "Root Administrator",
  admin: "Administrator",
  sale_manager: "Sale Manager",
  event_manager: "Event Manager",
  inventory_manager: "Inventory Manager",
  assistant: "Assistant",
  // F-01: new canonical strings
  root_administrator: "Root Administrator",
  sales_associate: "Sales Associate",
  manager_event: "Event Manager",
  manager_inventory: "Inventory Manager",
  associate_inventory: "Inventory Associate",
  event_assistant: "Event Assistant",
};

// Accepts a roleType string (legacy or canonical) OR a legacy numeric role
// value (0-5, number or numeric string) — mirrors the numeric-key support
// the old src/components/general/dicRole.jsx dictionary used to provide.
export const getRoleLabel = (roleType) => {
  if (roleType === undefined || roleType === null || roleType === "") return "";
  const resolved = LEGACY_ROLE_MAP[Number(roleType)] ?? roleType;
  return ROLE_LABELS[resolved] ?? resolved;
};

/** True for root_admin and admin (levels 0–1) — full administrative access. */
export const isCoordinatorLevel = (roleType) =>
  (ROLE_LEVELS[roleType] ?? 99) <= 1;

/** True only for assistant (lowest privilege). */
export const isAssistant = (roleType) => roleType === "assistant";

/** True for every role except assistant. Safe-default true for unknown/undefined. */
export const isNotAssistant = (roleType) => roleType !== "assistant";
