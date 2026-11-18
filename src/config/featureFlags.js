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

/**
 * Session in an HttpOnly cookie instead of localStorage (GovRAMP #12, SC-23;
 * src/api/sessionCredential.js). Default OFF: turn it on once the server's
 * cookie phase 1 is deployed, first in staging.
 */
export const COOKIE_SESSION = import.meta.env.VITE_APP_COOKIE_SESSION === "true";

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

/**
 * Signed event invitations from the Members page ("Ask for guardian consent",
 * POST /school/event-invitations/send).
 *
 * A kill switch, so default ON: only the exact string "false" turns it off.
 * Added 2026-10-21 because production answered `sent: 1` while no email
 * arrived. With it off, "Add directly" is the only way to register members to
 * an event, and the Members page button shows only to roles that may use it.
 */
export const FEATURE_EVENT_INVITATIONS =
  import.meta.env.VITE_APP_FEATURE_EVENT_INVITATIONS !== "false";

/**
 * Subscription plans in Profile (Free / Pro / Enterprise, set 2026-11-06).
 *
 * Default OFF until the backend ships the plan record and Stripe checkout
 * (server-testing/reports/FRONTEND_subscription_plans_update_2026-11-06.md):
 * GET /company/subscription and POST /company/subscription/checkout answer 404
 * today, so the page could show plans but not take a payment.
 *
 * Set VITE_APP_FEATURE_SUBSCRIPTION_PLANS=true in .env.dev to work on it.
 */
export const FEATURE_SUBSCRIPTION_PLANS =
  import.meta.env.VITE_APP_FEATURE_SUBSCRIPTION_PLANS === "true";

/**
 * Devitrak Admin Console at /platform: Devitrak's own people looking across
 * every client company (reports/FRONTEND_admin_console_plan_2026-11-11.md).
 *
 * Default OFF until the backend ships the access check, the audit log and the
 * /api/platform/* routes (plan, milestone M1). Even with the flag on, only a
 * user the server marked `platformAccess: true` gets in (roles.js,
 * hasPlatformAccess).
 *
 * Set VITE_APP_FEATURE_PLATFORM_CONSOLE=true in .env.dev to work on it.
 */
export const FEATURE_PLATFORM_CONSOLE =
  import.meta.env.VITE_APP_FEATURE_PLATFORM_CONSOLE === "true";

/**
 * Admin Console demo mode, which used to be one flag doing two different jobs:
 * choosing the sample-data source, and opening the console without the
 * server's platformAccess. The second is a gate bypass, and it is the only
 * reason the whole thing had to be pinned to the dev server. Split so the
 * sample data can ship to a real URL while the gate still decides who sees it.
 *
 * Both read the same variable, VITE_APP_PLATFORM_CONSOLE_MOCK, because they
 * describe one intention — "this is the prototype" — with two different
 * blast radii.
 */

/**
 * The data source: /api/platform/* is answered from invented sample data
 * (src/pages/platform/utils/mock/) instead of the network.
 *
 * Deliberately allowed in a build, so the prototype can be reviewed on a real
 * URL before the backend's data endpoints exist. It is safe there because it
 * no longer opens anything: a deployed build with this on still admits only a
 * user the server marked platformAccess. PlatformLayout shows a permanent
 * "Sample data" notice whenever it is on — invented numbers on a production
 * URL need to announce themselves.
 */
export const PLATFORM_CONSOLE_SAMPLE_DATA =
  import.meta.env.VITE_APP_PLATFORM_CONSOLE_MOCK === "true";

/**
 * The gate bypass: opens the console without the server's platformAccess, so
 * the prototype can be worked on without an operator account.
 *
 * Dev server only, and it must stay that way: `import.meta.env.DEV` is false
 * in every `vite build`, so a release can never ship a way into the console
 * that skips the server's answer, whatever the env var says. This is the half
 * that would have let any signed-in client user reach /platform.
 */
export const PLATFORM_CONSOLE_DEV_BYPASS =
  import.meta.env.DEV === true && PLATFORM_CONSOLE_SAMPLE_DATA;
