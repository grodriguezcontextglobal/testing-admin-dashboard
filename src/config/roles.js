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
  // Scoped roles (Phase A groundwork) — backend "Location/Category Scoped
  // Roles" plan. Strings only: see ROLE_LEVELS below for why no numeric
  // level is assigned yet (R1 — unresolved level-6 collision with
  // event_assistant). Every new-code path keys off these strings.
  INVENTORY_LOCATION_MANAGER: "inventory_location_manager",
  INVENTORY_LOCATION_ASSISTANT: "inventory_location_assistant",
  CATEGORY_MANAGER: "category_manager",
  CATEGORY_ASSISTANT: "category_assistant",
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
  // TODO(R1): the 4 scoped roles (inventory_location_manager,
  // inventory_location_assistant, category_manager, category_assistant)
  // deliberately have NO entry here. Backend's plan assigns them levels 6-9,
  // which collides with event_assistant's level 6 above. Until R1 is
  // resolved with backend (renumber one side, or go string-only forever),
  // do NOT add numeric levels for these roles anywhere in the frontend.
  // Every helper that reads ROLE_LEVELS for one of these roles must keep
  // falling back to its "unknown role" default (see isCoordinatorLevel,
  // canReassign/getRowLockReason in staffByRoleUtils.js).
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
// Scoped roles (Phase A) have no legacy/canonical duality — each is its own
// singleton group, appended to the ROLE_UPGRADE_MAP-derived groups above.
// New roles ARE renameable per company (product decision), same as the 6
// existing concepts.
export const ROLE_LABEL_GROUPS = {
  ...Object.fromEntries(
    Object.entries(ROLE_UPGRADE_MAP).map(([legacy, canonical]) => [
      legacy,
      legacy === canonical ? [legacy] : [legacy, canonical],
    ])
  ),
  inventory_location_manager: ["inventory_location_manager"],
  inventory_location_assistant: ["inventory_location_assistant"],
  category_manager: ["category_manager"],
  category_assistant: ["category_assistant"],
};

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

// ─── Role scope (Phase A groundwork) ─────────────────────────────────────────
// Which "scope dimension" a role concept is restricted to, per the backend's
// Location/Category Scoped Roles plan §3. `null` means the role has no scope
// restriction (the 6 pre-existing role concepts). Keyed by ROLE_LABEL_GROUPS
// concept key — resolve any member roleType string through
// getRoleScopeDimension below.
export const ROLE_SCOPE = {
  root_admin: null,
  admin: null,
  sale_manager: null,
  event_manager: null,
  inventory_manager: null,
  assistant: null,
  inventory_location_manager: "location",
  inventory_location_assistant: "location",
  category_manager: "category",
  category_assistant: "category",
};

/**
 * Returns the scope dimension ("location" | "category" | null) for roleType.
 * Accepts any member string (legacy, canonical, or scoped) via
 * getRoleLabelGroupKey — mirrors useRoleLabel's resolution semantics.
 */
export const getRoleScopeDimension = (roleType) =>
  ROLE_SCOPE[getRoleLabelGroupKey(roleType)] ?? null;

// ─── Role groups ──────────────────────────────────────────────────────────────
// R5: this MUST be an explicit, frozen array — NOT `Object.values(ROLE_TYPES)`.
// ROLE_TYPES now also holds the 4 scoped roles (inventory_location_manager,
// inventory_location_assistant, category_manager, category_assistant); if
// ALL_ROLES were derived from it, every permission row below that uses
// ALL_ROLES (e.g. staff:read) would silently grant access to those 4 roles
// too. Exported (and pinned by a test in roles.test.js) so this can never
// regress silently.
export const ALL_ROLES = Object.freeze([
  "root_admin",
  "admin",
  "sale_manager",
  "event_manager",
  "inventory_manager",
  "assistant",
  "root_administrator",
  "sales_associate",
  "manager_event",
  "manager_inventory",
  "associate_inventory",
  "event_assistant",
]);

// Scoped roles (Phase A) — kept as separate named consts (NOT part of
// ALL_ROLES) so each PERMISSIONS row below opts them in explicitly.
const INVENTORY_LOCATION_MANAGER = ROLE_TYPES.INVENTORY_LOCATION_MANAGER;
const INVENTORY_LOCATION_ASSISTANT = ROLE_TYPES.INVENTORY_LOCATION_ASSISTANT;
const CATEGORY_MANAGER = ROLE_TYPES.CATEGORY_MANAGER;
const CATEGORY_ASSISTANT = ROLE_TYPES.CATEGORY_ASSISTANT;

// All 4 scoped roles — used for the shared baseline (nav:home/inventory/
// profile, staff self-service). Every scoped role gets at least this.
const SCOPED_ROLES_ALL = [
  INVENTORY_LOCATION_MANAGER,
  INVENTORY_LOCATION_ASSISTANT,
  CATEGORY_MANAGER,
  CATEGORY_ASSISTANT,
];

// All 4 scoped roles can read/update inventory (managers additionally get
// create/delete below).
const SCOPED_INVENTORY_RU = SCOPED_ROLES_ALL;

// Only the two "manager" scoped roles can create/delete inventory.
const SCOPED_INVENTORY_CD = [INVENTORY_LOCATION_MANAGER, CATEGORY_MANAGER];

// Only inventory_location_manager manages locations — category_manager
// explicitly gets NO location-management actions (backend plan §1/§6).
const SCOPED_LOCATION_MANAGEMENT = [INVENTORY_LOCATION_MANAGER];

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
  "staff:reset_password": [...ALL_ROLES, ...SCOPED_ROLES_ALL],
  "staff:update_contact": [...ALL_ROLES, ...SCOPED_ROLES_ALL],
  "staff:grant_access": ADMIN_FULL,

  // Inventory — sale_manager: R/U only (no Create/Delete). Scoped roles
  // (Phase A): inventory_location_manager + category_manager get full CRUD;
  // inventory_location_assistant + category_assistant get R/U only.
  "inventory:create": [...INVENTORY_CD, ...SCOPED_INVENTORY_CD],
  "inventory:read": [...INVENTORY_RU, ...SCOPED_INVENTORY_RU],
  "inventory:update": [...INVENTORY_RU, ...SCOPED_INVENTORY_RU],
  "inventory:delete": [...INVENTORY_CD, ...SCOPED_INVENTORY_CD],
  "inventory:assign_location": [...INVENTORY_CD, ...SCOPED_LOCATION_MANAGEMENT],
  "inventory:manage_location": [...INVENTORY_CD, ...SCOPED_LOCATION_MANAGEMENT],

  // Locations — inventory_manager + admins only (sale_manager has no location
  // access). Scoped roles: only inventory_location_manager — category_manager
  // deliberately excluded (backend plan §1/§6: no location-management actions).
  "location:create": [...INVENTORY_CD, ...SCOPED_LOCATION_MANAGEMENT],
  "location:read": [...INVENTORY_CD, ...SCOPED_LOCATION_MANAGEMENT],
  "location:update": [...INVENTORY_CD, ...SCOPED_LOCATION_MANAGEMENT],
  "location:delete": [...INVENTORY_CD, ...SCOPED_LOCATION_MANAGEMENT],

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

  // Navigation. Scoped roles get nav:home/nav:inventory/nav:profile only —
  // without this baseline they'd see an empty app shell (review R6) despite
  // having inventory access; they get NO other nav:* entry.
  "nav:home": [...ALL_ROLES, ...SCOPED_ROLES_ALL],
  "nav:inventory": [...INVENTORY_RU, ...SCOPED_ROLES_ALL],
  "nav:events": EVENT_RU,
  "nav:consumers": EVENT_CRU,
  "nav:staff": ADMIN_FULL,
  "nav:posts": POSTS_ACCESS,
  "nav:dynamic_section": EVENT_D,
  "nav:profile": [...ALL_ROLES, ...SCOPED_ROLES_ALL],

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
  // Scoped roles (Phase A groundwork)
  inventory_location_manager: "Inventory Location Manager",
  inventory_location_assistant: "Inventory Location Assistant",
  category_manager: "Category Manager",
  category_assistant: "Category Assistant",
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
