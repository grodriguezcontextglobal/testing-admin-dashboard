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
