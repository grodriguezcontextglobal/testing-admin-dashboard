import { PERMISSIONS, ROLE_LABEL_GROUPS } from "../../../../config/roles";

/**
 * Role scope descriptions derived at RUNTIME from the PERMISSIONS matrix so the
 * "what can this role do" copy shown in the Roles tab can never drift from the
 * real permission source of truth (src/config/roles.js). Nothing here changes
 * permissions — it only reads and describes them.
 */

// ─── Human-readable domain names ──────────────────────────────────────────────
export const DOMAIN_LABELS = {
  staff: "Staff",
  inventory: "Inventory",
  location: "Locations",
  event: "Events",
  consumer: "Consumers",
  transaction: "Transactions",
  post: "Posts",
  member: "Members",
  nav: "Navigation",
  profile: "Company & profile settings",
};

// ─── Human-readable action labels ─────────────────────────────────────────────
// Explicit map keeps the copy accurate and testable. Anything not listed falls
// back to getReadableActionLabel's generator so the UI never renders a raw key.
export const ACTION_LABELS = {
  // Staff
  "staff:create": "Create staff",
  "staff:read": "View staff",
  "staff:update": "Update staff",
  "staff:delete": "Delete staff",
  "staff:assign_role": "Assign staff roles",
  "staff:assign_devices": "Assign devices to staff",
  "staff:assign_event": "Assign staff to events",
  "staff:assign_location": "Assign staff to locations",
  "staff:change_role": "Change staff roles",
  "staff:reset_password": "Reset staff passwords",
  "staff:update_contact": "Update staff contact info",
  "staff:grant_access": "Grant staff access",
  // Inventory
  "inventory:create": "Create inventory",
  "inventory:read": "View inventory",
  "inventory:update": "Update inventory",
  "inventory:delete": "Delete inventory",
  "inventory:assign_location": "Assign inventory to locations",
  "inventory:manage_location": "Manage inventory locations",
  // Locations
  "location:create": "Create locations",
  "location:read": "View locations",
  "location:update": "Update locations",
  "location:delete": "Delete locations",
  // Events
  "event:create": "Create events",
  "event:read": "View events",
  "event:update": "Update events",
  "event:delete": "Delete events",
  "event:notify_push": "Send event push notifications",
  "event:quickGlance_read": "View event quick glance",
  "event:quickGlance_update": "Update event quick glance",
  // Consumers
  "consumer:create": "Create consumers",
  "consumer:read": "View consumers",
  "consumer:update": "Update consumers",
  "consumer:delete": "Delete consumers",
  // Transactions
  "transaction:create": "Create transactions",
  "transaction:read": "View transactions",
  "transaction:update": "Update transactions",
  "transaction:delete": "Delete transactions",
  "transaction:stripe_create": "Create Stripe transactions",
  "transaction:stripe_read": "View Stripe transactions",
  "transaction:stripe_update": "Update Stripe transactions",
  // Posts
  "post:create": "Create posts",
  "post:read": "View posts",
  "post:update": "Update posts",
  "post:delete": "Delete posts",
  // Members
  "member:create": "Create members",
  "member:read": "View members",
  "member:update": "Update members",
  "member:delete": "Delete members",
  "member:assign_devices": "Assign devices to members",
  "member:notify": "Send member reminders",
  // Navigation
  "nav:home": "Access Home",
  "nav:inventory": "Access Inventory",
  "nav:events": "Access Events",
  "nav:consumers": "Access Consumers",
  "nav:staff": "Access Staff",
  "nav:posts": "Access Posts",
  "nav:dynamic_section": "Access dynamic sections",
  "nav:profile": "Access Profile",
  "nav:members": "Access Members",
  // Profile / company settings
  "profile:company_settings": "Manage company settings",
  "profile:billing": "Manage billing",
  "profile:subscription": "Manage subscription",
  "profile:staff_settings": "Manage staff settings",
};

const VERB_LABELS = {
  create: "Create",
  read: "View",
  update: "Update",
  delete: "Delete",
};

/**
 * Returns a human-readable label for a "domain:action" permission key.
 * Uses ACTION_LABELS when available, otherwise generates a "Verb domain" style
 * label so the UI never shows a raw key.
 */
export const getReadableActionLabel = (actionKey) => {
  if (ACTION_LABELS[actionKey]) return ACTION_LABELS[actionKey];
  const [domain, action = ""] = actionKey.split(":");
  const domainLabel = (DOMAIN_LABELS[domain] ?? domain).toLowerCase();
  const verb = VERB_LABELS[action];
  if (verb) return `${verb} ${domainLabel}`;
  const readableAction = action.replace(/_/g, " ");
  return `${readableAction} ${domainLabel}`.trim() || actionKey;
};

/**
 * For a role concept (a ROLE_LABEL_GROUPS key), scans PERMISSIONS and returns
 * { [domain]: { allowed: [actionKey…], denied: [actionKey…] } }.
 *
 * A role concept "has" an action if ANY of its member roleType strings (legacy
 * + canonical) is in that action's allowed array.
 */
export const getRoleScope = (groupKey) => {
  const members = ROLE_LABEL_GROUPS[groupKey] ?? [groupKey];
  const scope = {};
  for (const [actionKey, allowedRoles] of Object.entries(PERMISSIONS)) {
    const [domain] = actionKey.split(":");
    if (!scope[domain]) scope[domain] = { allowed: [], denied: [] };
    const hasAction = members.some((roleType) => allowedRoles.includes(roleType));
    if (hasAction) scope[domain].allowed.push(actionKey);
    else scope[domain].denied.push(actionKey);
  }
  return scope;
};

// ─── One-sentence human summaries per role concept ────────────────────────────
// Hand-written but verified against PERMISSIONS: the matrix is authoritative.
export const ROLE_SUMMARIES = {
  root_admin:
    "Full access to everything, including company settings, billing, and role assignment.",
  admin:
    "Full administrative access: staff, events, inventory, consumers, and company settings.",
  sale_manager:
    "Read/update access to events and inventory; no create/delete, no staff management.",
  event_manager:
    "Creates and manages events, consumers, transactions, and members; no global inventory or staff management.",
  inventory_manager:
    "Creates and manages inventory and storage locations; no event or staff management.",
  assistant:
    "Day-of-event operations: consumer check-in/out and device assignment; most limited role.",
  // Scoped roles (Phase A groundwork) — see FRONTEND_scoped_roles_phaseA_plan.md.
  inventory_location_manager:
    "Full inventory and location management, limited to their assigned locations.",
  inventory_location_assistant:
    "Views and updates inventory, limited to their assigned locations.",
  category_manager:
    "Full inventory management, limited to their assigned categories.",
  category_assistant:
    "Views and updates inventory, limited to their assigned categories.",
};
