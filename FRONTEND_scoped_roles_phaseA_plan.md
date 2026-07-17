# Execution Plan — Scoped Roles, Phase A (frontend groundwork, flag OFF)

> **Audience:** autonomous coding agent. Companion docs (READ BOTH FIRST):
> `FRONTEND_scoped_roles_review.md` (risk register — R1..R9 referenced below)
> and the backend's action plan summarized inside it. Follow CLAUDE.md
> strictly: Graphify-first discovery, all npm/vitest/eslint/vite inside Docker
> (`docker compose exec devitrak-client ...`), internal UX components, tests
> first, `graphify update .` after edits, local commit only — **never push**.
> All UI text in English.

## 0. Locked decisions (do not re-litigate)

- Four new roleType strings: `inventory_location_manager`,
  `inventory_location_assistant`, `category_manager`, `category_assistant`.
- **Strings only** — do NOT add ROLE_LEVELS entries for the new roles and do
  NOT send/map numeric levels for them anywhere. R1 (level-6 collision with
  `event_assistant`) is unresolved with backend; every new-code path keys off
  `role_type` strings. Leave one `// TODO(R1)` where the level mapping will go.
- New roles ARE renameable per company (user decision): each gets its own
  single-member group in `ROLE_LABEL_GROUPS`.
- Roles-tab drag-and-drop: new roles are **NOT draggable/droppable in v1**
  (user decision) — their staff render read-only.
- Everything user-visible ships behind a **feature flag, default OFF**. The
  "recognition layer" (§3) is the only part that is flag-independent.

## 1. Feature flag (new, minimal)

- `src/config/featureFlags.js`: export `FEATURE_SCOPED_ROLES =
  import.meta.env.VITE_APP_FEATURE_SCOPED_ROLES === "true"` (single source;
  no library).
- Add `VITE_APP_FEATURE_SCOPED_ROLES=false` with a one-line comment to
  `.env.dev.example`. Do NOT touch `.env.dev` (uncommitted, user-owned).

## 2. `src/config/roles.js` — the delicate part (tests FIRST, see R5)

1. **Freeze `ALL_ROLES` before widening `ROLE_TYPES`.** Today
   `const ALL_ROLES = Object.values(ROLE_TYPES)` — if you add the new strings
   to `ROLE_TYPES` first, every `ALL_ROLES` permission row (e.g.
   `staff:read`) silently grants to the scoped roles. Replace `ALL_ROLES`
   with an explicit frozen array of the CURRENT 12 strings (6 legacy + 6
   canonical) and add a test that pins its exact contents.
2. Add the 4 new strings to `ROLE_TYPES` (so `VALID_ROLE_TYPES` accepts them
   and `resolveRoleType` stops downgrading scoped users to assistant — R2).
3. `ROLE_LABELS`: `"Inventory Location Manager"`, `"Inventory Location
   Assistant"`, `"Category Manager"`, `"Category Assistant"`.
4. `ROLE_SCOPE` (new export): the 10-concept map from the backend plan §3 —
   existing roles → `null`, location roles → `"location"`, category roles →
   `"category"`. Export `getRoleScopeDimension(roleType)` resolving through
   `getRoleLabelGroupKey` semantics (accepts any member string).
5. `ROLE_LABEL_GROUPS`: extend so each new role is its own group
   `[string]` (they have no legacy/canonical duality). Do this WITHOUT
   breaking the existing derivation from `ROLE_UPGRADE_MAP` — e.g. spread the
   derived object and append the four singleton entries. Existing tests pin
   6 groups; update them to pin 10.
6. `PERMISSIONS` — explicit rows per the backend table (§1/§6), scoped roles
   added ONLY here:
   - `inventory_location_manager`: `inventory:create/read/update/delete`,
     location-management actions mirroring what `inventory_manager` has for
     locations (inspect the matrix for the exact `location`-ish keys; if
     locations are governed by `inventory:*` only, note that in the report),
     plus baseline self-service: `nav:home`, `nav:inventory`, `nav:profile`,
     `staff:update_contact`, `staff:reset_password`.
   - `inventory_location_assistant`: same baseline; `inventory:read/update`.
   - `category_manager`: baseline + `inventory:create/read/update/delete`.
     NO location-management actions.
   - `category_assistant`: baseline + `inventory:read/update`.
   - They appear in NO other row (no events, consumers, members, staff
     management, posts, billing). Tests must assert both inclusion AND
     exclusion (e.g. `hasPermission("staff:read", "category_manager") ===
     false`, `hasPermission("nav:events", ...) === false`).
   - Rationale for the baseline: `/inventory*` routes are PermissionGuard-ed
     by `inventory:read`, and navbar/footer items filter by `nav:*` — without
     `nav:home`/`nav:inventory`/`nav:profile` a scoped user sees an empty
     shell (review R6). Flag this baseline in your report as a
     product-reviewable choice.

## 3. Recognition layer (flag-INDEPENDENT — protects against R2)

1. `roleScopeUtils.js` (Roles tab): add `ROLE_SUMMARIES` entries for the 4
   new concepts (one sentence each, mention the scope: "…limited to their
   assigned locations/categories"). `getRoleScope` already derives from
   `PERMISSIONS`, so it works once §2.6 lands — extend its tests.
2. `staffByRoleUtils.js`: `groupEmployeesByRoleConcept` must bucket the new
   strings under their own group keys (not `"unknown"`). `canReassign` /
   `getRowLockReason`: staff holding a scoped role are **locked** with reason
   "Scoped roles are managed from the staff profile", and scoped-role columns
   are never valid drop targets (v1 decision). Tests first.
3. `RolesManagementMainPage` / `RoleColumn`: render the 4 new role cards +
   columns ONLY when `FEATURE_SCOPED_ROLES` is on **or** at least one
   employee already holds that role (so backend-created scoped staff are
   never invisible). Labels editable like the others (renameable decision).

## 4. Scope-assignment UI scaffold (flag-gated, NOT wired to save)

1. `useCompanyCategories` hook (`src/hooks/`): react-query on the LIVE
   `POST /db_company/categories { company_id }`; expose deduped options via a
   tested util `dedupeCategories(result)` (unique by `category_name`,
   preserve first `category_id`) in
   `src/pages/staff/detail/components/equipment_components/utils/scopeUtils.js`
   (or the nearest existing `utils/` folder in that flow — testable location).
2. `ScopeAssignmentSelect` component (same feature folder): props
   `{ roleType, value, onChange }`; renders a Locations multi-select
   (options from the existing company-locations source used by
   `AssignLocation`/`AssignLocationManager` — reuse their query), a
   Categories multi-select (from the hook), or nothing, per
   `getRoleScopeDimension(roleType)`. Use the internal UX multi-select
   (`src/components/UX/dropdown/MultiSelectComponent.jsx`) if its API fits;
   otherwise antd `Select mode="multiple"` with a note.
3. **Fail-closed guard util** (tested): `validateScopeSelection(roleType,
   selection)` → `{ valid, message }`; message per backend plan: "Assign at
   least one {location|category} — a scoped user with no assignments cannot
   see any inventory."
4. `UpdateRoleInCompany.jsx`: when flag ON, append the 4 new roles to the
   picker as STRING-valued options (existing six stay numeric), render
   `ScopeAssignmentSelect` when a scoped role is chosen, and block save via
   the guard. The actual save for scoped roles: **disabled with a tooltip**
   "Pending backend availability" + `// TODO(Phase B §5.3/§5.4)` — backend
   rejects the new role_types today and the scope endpoint doesn't exist.
   Flag OFF ⇒ this file behaves byte-for-byte as today (verify by running its
   flows mentally and via the suite).

## 5. Verification & closeout

1. New/updated tests green; FULL `npm run test:unit` green (baseline **684**
   — do not regress; your additions raise it).
2. `npx vite build` inside the container, run ALONE (chained full-suite +
   build has been OOM-killed before, exit 137).
3. Targeted eslint on touched files: zero NEW problems.
4. `graphify update .`
5. Report must include: exact PERMISSIONS rows granted to each new role (for
   product review), any `ALL_ROLES` usages you had to freeze/adjust, and the
   TODO(R1)/TODO(Phase B) locations.
6. Single local commit `feat(roles): scoped-roles groundwork behind feature
   flag (phase A)` + trailer `Co-Authored-By: Claude <noreply@anthropic.com>`.
   **No push.** Also stage this plan file and
   any updated companion docs.

## 6. Out of scope (Phase B/C — do not build)

- Wiring role/scope SAVE calls (backend Phase 3: §5.3 role_type validation,
  §5.4 scope endpoint).
- Consuming `categories` from `getStaffPermissions`/`getStaffCompanies`.
- Numeric levels for the new roles (R1 open).
- Drag-and-drop for scoped roles in the Roles board.
- Reconciling the legacy `preference.managerLocation` location system (R3 —
  awaiting backend answer).
- Flipping the flag on.
