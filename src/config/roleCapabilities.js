/**
 * roleCapabilities.js — single source of truth for ROLE-LEVEL access control.
 *
 * This map is reverse-engineered from the gates that exist in the app TODAY, so it
 * is BEHAVIOR-PRESERVING: each capability below reflects what the current code does,
 * not what it arguably should do. The goal is to replace the scattered
 * `Number(role) < 2` / `role > 0` / `permission: [0,1,2]` checks (~40 files) with a
 * single, self-documenting definition, WITHOUT changing behavior in the same pass.
 *
 * Known semantic smells are kept intact and tagged with `⚠️` so they're easy to find
 * and flip deliberately later (see the four ⚠️ markers below).
 *
 * --- Two layers (unchanged) ---
 *  1. ROLE layer (this file): coarse role 0–4 gating of nav / pages / high-level actions.
 *  2. LOCATION layer (unchanged): non-admins also get per-location granular actions at
 *     `employee.preference.managerLocation` (view/assign/create/update/delete/transfer),
 *     read via `useStaffRoleAndLocations()`. This file only encodes the role layer; where
 *     a role's inventory access is "byLocation", that granular layer still applies on top.
 *
 * --- Role-read caveat ---
 *  The role is read three different ways across the app and arrives as `0` OR `"0"`:
 *    - state.admin.user.role                         (navbar, staff page, inventory detail)
 *    - state.permission.role                         (inventory header, device tracking)
 *    - user.companyData.employees[].role             (events filter, consumer notes — authoritative)
 *  `resolveRole()` below normalizes all of these and applies the super_user override.
 *
 * Labels mirror src/components/general/dicRole.jsx.
 */

export const ROLE = Object.freeze({
  ROOT: 0,       // Root administrator
  ADMIN: 1,      // Administrator
  MANAGER: 2,    // Manager
  SUPPORT: 3,    // Support
  ASSISTANT: 4,  // Staff Event Assistant
});

/**
 * Capability values:
 *   - booleans for on/off gates
 *   - inventory.mode: "all" | "byLocation" | "none"
 *       "all"        → unrestricted (role 0)
 *       "byLocation" → allowed, but still filtered by the managerLocation granular layer
 *       "none"       → no inventory access at all (no nav entry)
 *   - events.scope: "all" | "assignedOnly"
 *
 * Each line cites the gate it was derived from (file:line) for auditability.
 */
export const ROLE_CAPABILITIES = Object.freeze({
  // ──────────────────────────────────────────────── 0 · Root administrator
  [ROLE.ROOT]: {
    label: "Root administrator",
    isAccountOwner: true, // only role 0 reaches Company info / Stripe settings
    nav: { home: true, inventory: true, events: true, consumers: true, posts: true, staff: true, profile: true },
    profile: {
      details: true, password: true, mfa: true, policies: true, // [0,1,2,3,4]
      notifications: true,  // MainProfileSettings.jsx:73 [0,1]
      companyInfo: true,    // MainProfileSettings.jsx:83 [0]
      stripeAccount: true,  // MainProfileSettings.jsx:88 [0]
      documents: true,      // MainProfileSettings.jsx:93 [0,1]
      suppliers: true,      // MainProfileSettings.jsx:98 [0,1]
    },
    staff: {
      add: true, delete: true,            // staff/MainPage.jsx:66,91  (role < 2)
      changeRole: true,                   // StaffDetail.jsx:164 [0,1]
      assignDevices: true,                // StaffDetail.jsx:81  [0,1]
      assignToEvent: true,                // StaffDetail.jsx:101 [0,1]
      assignLocationPermission: true,     // StaffDetail.jsx:122 [0,1]
      grantRevokeAccess: true,            // StaffDetail.jsx:206 [0,1,2]
      updateContactInfo: true,            // StaffDetail.jsx:143 [0,1,2,3,4]
      sendPasswordReset: true,            // StaffDetail.jsx:185 [0,1,2,3,4]
      viewDetail: true,                   // StaffTable.jsx:220 (role < 4)
      viewSignedContracts: true,          // ListEquipment.jsx:79,202 [0,1]
      viewActiveStatus: true,             // HeaderStaffDetal.jsx:113 [0,1]
    },
    inventory: {
      mode: "all",
      deleteItem: true,    // inventory/details/MainPage.jsx:100 (role < 2)
      editItem: true,      // inventory/details/MainPage.jsx:103 (role < 2)
      editStructure: true, // RenderingFilters.jsx:735.. & TreeNode.jsx:329 (disabled when role > 0)
    },
    events: {
      scope: "all",                 // events/MainPage.jsx:108 (role < 1 sees all)
      editResources: true,          // MainPageQuickGlance.jsx:641 etc. (hidden when role === 4)
      createPermanentDevices: true, // FormDeviceTrackingMethod.jsx:31 (role 0 → Permanent+Rent)
    },
    consumers: { deleteNotes: true }, // NotesCard.jsx:97 (role < 1)
  },

  // ──────────────────────────────────────────────── 1 · Administrator
  [ROLE.ADMIN]: {
    label: "Administrator",
    isAccountOwner: false,
    nav: { home: true, inventory: true, events: true, consumers: true, posts: true, staff: true, profile: true },
    profile: {
      details: true, password: true, mfa: true, policies: true,
      notifications: true,
      companyInfo: false,   // ⚠️ #1 — "Administrator" cannot see Company info (role 0 only)
      stripeAccount: false, // ⚠️ #1 — ...nor Stripe/billing. Consider renaming 0/1 to Owner/Admin.
      documents: true,
      suppliers: true,
    },
    staff: {
      add: true, delete: true, changeRole: true,
      assignDevices: true, assignToEvent: true, assignLocationPermission: true,
      grantRevokeAccess: true, updateContactInfo: true, sendPasswordReset: true,
      viewDetail: true, viewSignedContracts: true, viewActiveStatus: true,
    },
    inventory: {
      mode: "byLocation", // ⚠️ #2 — an Administrator needs explicit managerLocation grants
                          //         to create/update inventory (HeaderInventaryComponent.jsx:33-34)
      deleteItem: true,   // but item delete/edit on the detail page IS allowed (role < 2)
      editItem: true,
      editStructure: false, // locations/categories/brands/groups editable by role 0 only
    },
    events: {
      scope: "assignedOnly", // ⚠️ #3 — even an Administrator only sees events they're assigned to
      editResources: true,
      createPermanentDevices: false, // Rent only
    },
    consumers: { deleteNotes: false },
  },

  // ──────────────────────────────────────────────── 2 · Manager
  [ROLE.MANAGER]: {
    label: "Manager",
    isAccountOwner: false,
    nav: { home: true, inventory: true, events: true, consumers: false, posts: true, staff: true, profile: true },
    profile: {
      details: true, password: true, mfa: true, policies: true,
      notifications: false, companyInfo: false, stripeAccount: false, documents: false, suppliers: false,
    },
    staff: {
      add: false, delete: false, changeRole: false,
      assignDevices: false, assignToEvent: false, assignLocationPermission: false,
      grantRevokeAccess: true,   // can toggle a member's access on/off (role <= 2)...
      updateContactInfo: true,
      sendPasswordReset: true,
      viewDetail: true,          // can open staff detail (role < 4), but most actions above are off
      viewSignedContracts: false,
      viewActiveStatus: false,
    },
    inventory: {
      mode: "byLocation",
      deleteItem: false, // ...but cannot delete or edit items (role < 2 excludes Manager)
      editItem: false,
      editStructure: false,
    },
    events: {
      scope: "assignedOnly",
      editResources: true,
      createPermanentDevices: false,
    },
    consumers: { deleteNotes: false },
  },

  // ──────────────────────────────────────────────── 3 · Support
  [ROLE.SUPPORT]: {
    label: "Support",
    isAccountOwner: false,
    nav: {
      home: true, inventory: false, events: true,
      consumers: false, // ⚠️ #4 — "Support" cannot see Consumers (likely wrong if this is customer support)
      posts: true, staff: true, profile: true,
    },
    profile: {
      details: true, password: true, mfa: true, policies: true,
      notifications: false, companyInfo: false, stripeAccount: false, documents: false, suppliers: false,
    },
    staff: {
      add: false, delete: false, changeRole: false,
      assignDevices: false, assignToEvent: false, assignLocationPermission: false,
      grantRevokeAccess: false,
      updateContactInfo: true,
      sendPasswordReset: true,
      viewDetail: true, // role < 4 can open staff detail (view only)
      viewSignedContracts: false,
      viewActiveStatus: false,
    },
    inventory: { mode: "none", deleteItem: false, editItem: false, editStructure: false },
    events: { scope: "assignedOnly", editResources: true, createPermanentDevices: false },
    consumers: { deleteNotes: false },
  },

  // ──────────────────────────────────────────────── 4 · Staff Event Assistant
  [ROLE.ASSISTANT]: {
    label: "Staff Event Assistant",
    isAccountOwner: false,
    nav: {
      home: false, inventory: false, events: true,
      consumers: false, posts: false, staff: false, profile: true,
    }, // redirected to /events on login (NavigationBarMain.jsx:321)
    profile: {
      details: true, password: true, mfa: true, policies: true,
      notifications: false, companyInfo: false, stripeAccount: false, documents: false, suppliers: false,
    },
    staff: {
      add: false, delete: false, changeRole: false,
      assignDevices: false, assignToEvent: false, assignLocationPermission: false,
      grantRevokeAccess: false,
      updateContactInfo: true,  // tab gate is [0,1,2,3,4]; nav.staff:false still blocks reachability
      sendPasswordReset: true,
      viewDetail: false,        // StaffTable.jsx:220 — role < 4 excludes Assistant
      viewSignedContracts: false,
      viewActiveStatus: false,
    },
    inventory: { mode: "none", deleteItem: false, editItem: false, editStructure: false },
    events: {
      scope: "assignedOnly",
      editResources: false,          // event edit buttons hidden for role 4
      createPermanentDevices: false,
    },
    consumers: { deleteNotes: false },
  },
});

/**
 * Least-privilege fallback for unknown/missing roles.
 * NOTE: this intentionally DIFFERS from the legacy `useStaffRoleAndLocations` default of
 * "2" (Manager). Defaulting an unidentifiable user to the most restrictive role is the one
 * deliberate hardening in this file; flip to ROLE.MANAGER if you need bug-for-bug parity.
 */
const DEFAULT_ROLE = ROLE.ASSISTANT;

/** Coerce a role from any source ("0" | 0 | undefined) to a valid numeric role id. */
export const normalizeRole = (role) => {
  const n = Number(role);
  return Number.isInteger(n) && ROLE_CAPABILITIES[n] ? n : DEFAULT_ROLE;
};

/** The employee record for the logged-in user (authoritative source of role + super_user). */
export const getEmployeeRecord = (user) =>
  user?.companyData?.employees?.find((e) => e.user === user?.email) ?? null;

export const isSuperUser = (user) => getEmployeeRecord(user)?.super_user === true;

/**
 * Resolve the effective role for a user object, applying the super_user override
 * (super_user === true is treated as Root, mirroring useStaffRoleAndLocations.jsx:54).
 */
export const resolveRole = (user) => {
  if (isSuperUser(user)) return ROLE.ROOT;
  const employee = getEmployeeRecord(user);
  return normalizeRole(employee?.role ?? user?.role);
};

export const isAdmin = (user) => resolveRole(user) === ROLE.ROOT;

/** The full capability object for a role id (accepts "0" | 0). */
export const capabilitiesFor = (role) => ROLE_CAPABILITIES[normalizeRole(role)];

/**
 * Primary lookup. Pass a user object (preferred — resolves super_user) OR a raw role id,
 * plus a dot-path capability key. Returns the capability value:
 *   - boolean for on/off gates
 *   - string for valued gates ("all" | "byLocation" | "none", "all" | "assignedOnly")
 *
 *   can(user, "staff.add")            // false for a Manager
 *   can(user, "inventory.mode")       // "byLocation"
 *   can(user, "consumers.deleteNotes")
 *   can(2, "nav.consumers")           // false (raw role id, no super_user resolution)
 */
export const can = (userOrRole, capabilityPath) => {
  const role =
    userOrRole !== null && typeof userOrRole === "object"
      ? resolveRole(userOrRole)
      : normalizeRole(userOrRole);
  const caps = capabilitiesFor(role);
  return capabilityPath
    .split(".")
    .reduce((acc, key) => (acc == null ? acc : acc[key]), caps);
};

/** Convenience for the common "which roles pass this gate" question (e.g. for nav arrays). */
export const rolesWith = (capabilityPath) =>
  Object.keys(ROLE_CAPABILITIES)
    .map(Number)
    .filter((role) => can(role, capabilityPath) === true);
