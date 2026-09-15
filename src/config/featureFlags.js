// ─── Feature flags ────────────────────────────────────────────────────────────
// Minimal, dependency-free flag mechanism (no library) — see
// FRONTEND_scoped_roles_phaseA_plan.md §1 and review doc R8.
//
// Every user-visible piece of the scoped-roles work (Phase A §4 UI scaffold,
// Phase B/C wiring) MUST be gated behind this flag, default OFF. The single
// exception is the flag-INDEPENDENT "recognition layer" (roles.js,
// roleScopeUtils.js, staffByRoleUtils.js) — that part must work correctly
// regardless of this flag so backend-created scoped staff are never rendered
// incorrectly (review R2).

/** Default OFF. Set VITE_APP_FEATURE_SCOPED_ROLES=true in .env.dev to enable. */
export const FEATURE_SCOPED_ROLES =
  import.meta.env.VITE_APP_FEATURE_SCOPED_ROLES === "true";

/**
 * Member device fees (school vertical, Phase 2 B1): capturing a lost/damaged
 * fee on return. Default OFF — flip once the backend persists fee_amount /
 * fee_reason and exposes the fees read (FRONTEND_school_backend_asks.md §B1).
 */
export const FEATURE_MEMBER_FEES =
  import.meta.env.VITE_APP_FEATURE_MEMBER_FEES === "true";

/**
 * Light / dark / system theming. Default OFF while the dark palette is still
 * being worked out (FRONTEND_theme_light_dark_system_plan.md).
 *
 * With the flag off the switch is not rendered AND the resolved theme is
 * forced to light, which matters more than it looks: anyone who tried dark
 * before it was parked has "dark" sitting in their localStorage, and hiding
 * the button alone would leave them stuck in a half-finished theme with no way
 * back. The stored preference is kept, not deleted, so flipping the flag on in
 * .env.dev returns them to where they were.
 *
 * Set VITE_APP_FEATURE_THEME_SWITCH=true in .env.dev to work on it.
 */
export const FEATURE_THEME_SWITCH =
  import.meta.env.VITE_APP_FEATURE_THEME_SWITCH === "true";

/**
 * Server-side pagination for the /inventory table
 * (FRONTEND_inventory_pagination_migration_plan.md).
 *
 * Default OFF, and it has to stay that way until the backend deploys: the three
 * endpoints behind it — inventory-page, inventory-facets, serial-suggest —
 * answer 404 in production today. The flag is what lets the whole migration
 * land on main, which is where this repo pushes, without the page depending on
 * a deploy we do not control.
 *
 * With the flag off the table keeps loading the full inventory from
 * /db_item/warehouse-items and filtering, searching, sorting and paging in
 * memory, exactly as before.
 *
 * Set VITE_APP_FEATURE_INVENTORY_SERVER_PAGINATION=true in .env.dev to work on
 * it.
 */
export const FEATURE_INVENTORY_SERVER_PAGINATION =
  import.meta.env.VITE_APP_FEATURE_INVENTORY_SERVER_PAGINATION === "true";
