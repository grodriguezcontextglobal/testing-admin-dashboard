# Review — Location/Category Scoped Roles (backend plan vs. current frontend)

> Review of the backend team's "Frontend Action Plan — Location/Category Scoped
> Roles" against the frontend as of `main@56c3824b` (+ in-flight member-event
> registration work). Output: risk register + phased action plan. This is a
> REVIEW document — implementation is queued as its own task and must not start
> until the R1/R2 blockers below are resolved with backend.

---

## 1. Verified frontend facts the backend plan doesn't know about

| Fact | Where | Why it matters |
|---|---|---|
| `ROLE_LEVELS` already assigns **level 6 to `event_assistant`** (F-01 canonical string) | `src/config/roles.js:35` | Backend's table assigns level 6 to `inventory_location_manager` → **numeric collision** |
| Frontend has **no** `inventory_location_manager` / `inventory_location_assistant` strings anywhere | grep of `src/` | Backend calls roles 6/7 "existing" — they exist server-side only; frontend must add FOUR roles, not two |
| `resolveRoleType` falls back to `"assistant"` for any roleType outside `VALID_ROLE_TYPES`, and `LEGACY_ROLE_MAP` only covers 0-5 | `src/config/roles.js:213-224` | A user with a new role logging into today's frontend is silently treated as **assistant** (wrong nav, wrong gates) |
| A **parallel location-scope system already exists**: Mongo `employee.preference.managerLocation[]` + `preference.inventory_location[]`, parsed by `useStaffRoleAndLocations()`, with granular per-location action flags, plus the `AssignLocation` / `AssignLocationManager` staff-detail flows | `src/utils/checkStaffRoleAndLocations.jsx`, `src/pages/staff/detail/.../AssignLocation*.jsx` | The backend's SQL `locations[]` scope is a SECOND source of location truth. Divergence is guaranteed unless ownership is decided |
| Local `PERMISSIONS` matrix in `roles.js` is the documented single source of truth for UI gating (`hasPermission`, `PermissionGuard`) | CLAUDE.md + `src/config/roles.js` | Backend plan §6 says to drive visibility from the server's `permissions[]` array — that's a second source of permission truth |
| The just-shipped **Roles tab** (`src/pages/Profile/roles_management/`) assumes exactly **6 role concepts**: `ROLE_LABEL_GROUPS` is derived from `ROLE_UPGRADE_MAP`; the drag-and-drop board builds one column per group; `roleScopeUtils` derives scope text from `PERMISSIONS`; unknown roleTypes land in an `"unknown"` bucket | commit `7a526b77` | New roles need: label-group entries (are they renameable per company?), board columns, `canReassign` hierarchy rules, `PERMISSIONS` entries so scope descriptions aren't empty |
| Role pickers hardcode levels 0-5: `UpdateRoleInCompany.jsx` builds options from `[0,1,2,3,4,5]`; `NewStaffMember` flow similar | `src/pages/staff/detail/.../UpdateRoleInCompany.jsx` | Both need the new entries — flag-gated |
| Route access is already fail-closed client-side: `/inventory*` requires `inventory:read` via `PermissionGuard`; footer/navbar/cmdk filter by permission | `src/routes/authorized/AuthRoutes.jsx` | If the 4 new roles aren't added to the local `PERMISSIONS` inventory arrays, scoped users can't reach `/inventory` at all (redirected home) even when the server would allow them |
| No feature-flag infrastructure exists (env vars are all API keys/URLs) | `src/config/ConfigEnvExport.jsx` | The plan's "build behind a flag" needs a minimal flag mechanism first |
| Per-company **role renaming** shipped this week (`companyData.roleLabels`, keyed by `ROLE_LABEL_GROUPS`) | commit `da4a691e` | Decide whether the 4 new roles are renameable too (recommended: yes, one group each) |

## 2. Risk register (ranked)

| # | Sev | Risk | Mitigation |
|---|---|---|---|
| R1 | 🔴 **Blocker** | **Level-number collision**: backend assigns levels 6-9 to the scoped roles; frontend already uses level 6 for `event_assistant` (F-01 canonical). If numeric levels cross the wire (they do: `role_level` in `getStaffPermissions`, `role: "N"` on employee records, `role_level` in the update-role mutation), the same number means two different roles on each side. | **Resolve with backend before any code.** Options: (a) backend renumbers to 10-13; (b) frontend F-01 plan retires/renumbers `event_assistant` (it's not yet assigned anywhere — F-04 pending); (c) both sides agree numeric levels are backend-owned and the frontend keys everything off `role_type` strings only. Option (c) is most robust but touches the most call sites. |
| R2 | 🔴 High | **Deployment-order downgrade**: once backend Phase 3 ships, staff can exist with the new roleTypes. Today's frontend renders them as **assistant** (fallback), showing nav/actions that don't match their real permissions; server enforcement (Phase 4) may not be live yet, so they could even act outside their scope. | Ship the frontend role-recognition layer (roles.js entries + labels + PERMISSIONS rows) **before or with** backend Phase 3, even if the assignment UI stays flagged off. Recognition ≠ feature launch. |
| R3 | 🔴 High | **Two location-permission systems**: existing Mongo `preference.managerLocation` (with per-location action flags, already enforced in UI via `useStaffRoleAndLocations` + `permissionUtils`) vs. new SQL `locations[]` scope. An `inventory_location_manager` could have contradictory scopes in the two stores. | Ask backend which is authoritative for roles 6/7 and what migrates. Frontend decision needed: does the new scope-assignment UI replace `AssignLocation`/`AssignLocationManager` for scoped roles, or coexist? Do NOT build a third path. |
| R4 | 🟠 Medium | **Two permission-truth sources**: local `PERMISSIONS` matrix (UI gating) vs. server `permissions[]` (enforcement). Drift → UI shows what server denies, or hides what server allows. | Keep the local matrix as the only UI-gating source (architecture rule), add the 4 roles to it mirroring §1 of the backend plan exactly, and add a unit test asserting the local rows for the 4 new roles equal the documented server sets. Treat server `permissions[]` as enforcement-only; log (not gate) on mismatch during rollout. |
| R5 | 🟠 Medium | **Roles tab regressions**: adding 4 roles to `ROLE_TYPES` auto-flows into `ALL_ROLES` (= `Object.values(ROLE_TYPES)`), which is used by matrix rows like `staff:read: ALL_ROLES` — the new roles would silently gain every ALL_ROLES action (they should have **inventory only** per backend §6). The Roles tab board/labels/reassignment also need explicit extension. | Do NOT add the new strings to `ROLE_TYPES` blindly. Either add them to a separate export consumed where appropriate, or audit every `ALL_ROLES` usage and replace with an explicit list where the new roles must be excluded. Add tests first for the expected permission rows of the 4 roles. |
| R6 | 🟠 Medium | **Fail-closed on both layers**: backend's rule (zero scope = zero inventory) + frontend's `PermissionGuard`. A misconfigured user gets a confusing empty app. | Implement the plan's mandatory ≥1-selection guard; ALSO add an in-app empty state for scoped users with no assignments ("Your account has no assigned {locations/categories} — contact your administrator") instead of a silently empty inventory. |
| R7 | 🟡 Low | `can_create/can_update/can_delete` flags exist in the read contract but are unenforced (backend open question §8.1); building UI on them now risks rework. | Ignore the flags in v1 (as backend suggests); render scope as visibility only. Revisit when backend answers §8.1. |
| R8 | 🟡 Low | No flag infra; also `.env.dev` is uncommitted so a `VITE_APP_` flag needs `.env.dev.example` + deploy-machine env coordination. | Add `src/config/featureFlags.js` reading `VITE_APP_FEATURE_SCOPED_ROLES === "true"`, default **off**; document in `.env.dev.example`. |
| R9 | 🟡 Low | Category multi-select dedupe by `category_name` (backend §5.5) and stale category lists. | Dedupe in a tested util; react-query with sane staleTime. |

## 3. Questions to send BEFORE implementation

**To backend** (their §8 plus ours):
1. R1 level collision: can scoped roles renumber to 10-13, or is 6-9 frozen? (Frontend F-01 reserved 6 for `event_assistant`.)
2. R3: for roles 6/7, which location store is authoritative — SQL scope or Mongo `preference.managerLocation`? Is there a migration? Should the old AssignLocation flows be retired for scoped roles?
3. Their §8.1-8.4 as written (flags enforcement, endpoint shape confirm, category granularity, never-both-selectors).

**Product decision (user):**
4. Are the 4 new roles renameable per company like the existing 6 (Roles tab)? Recommended: yes.
5. Should the new roles appear in the Roles tab drag-and-drop board (with scope-assignment step on drop), or is scope assignment only in the staff-detail flow for v1? Recommended v1: staff-detail only; board integration as follow-up.

## 4. Phased action plan

### Phase A — buildable now, flag OFF (no backend dependency)
1. `src/config/featureFlags.js` + `.env.dev.example` entry (`VITE_APP_FEATURE_SCOPED_ROLES`).
2. `roles.js` (tests first): add the 4 roleType strings + labels + `ROLE_SCOPE` map (`location`/`category`/`null` per §3 of backend plan) + explicit `PERMISSIONS` rows (inventory-only per their §1/§6 — WITHOUT letting them into `ALL_ROLES`-derived rows; see R5). Levels: **left pending until R1 is answered** — key all new code off roleType strings.
3. `ScopeAssignmentSelect` component (renders locations/categories multi-select by `ROLE_SCOPE[roleType]`, fail-closed ≥1 guard) + `useCompanyCategories` hook on the LIVE `POST /db_company/categories` (dedupe by `category_name`, tested util).
4. Recognition layer: `resolveRoleType`/labels/Roles-tab `staffByRoleUtils` handle the new strings gracefully (no more assistant-downgrade) — this part ships flag-independent (R2).
5. Empty-scope in-app message (R6).

### Phase B — wire-up, flag still OFF (needs backend Phase 3 deployed)
6. Role pickers (`UpdateRoleInCompany`, new-staff flow) list the new roles when flag on; role save includes scope via the confirmed §5.4 endpoint (full-replace).
7. Consume `categories` defensively (`?? []`) in `getStaffPermissions`/`getStaffCompanies` consumers.
8. Contract test comparing local PERMISSIONS rows vs. documented server sets (R4).

### Phase C — launch (needs backend Phase 4 = enforcement live, confirmed)
9. Flip the flag on; verify a scoped user end-to-end (sees only assigned scope).
10. Reconcile/retire duplicate location-assignment flows per the R3 answer.
11. Roles-tab board integration for the new roles (if approved in Q5).

**Estimated blast radius:** `src/config/roles.js` (+tests), `src/hooks/`, 2 staff-detail flows, Roles tab utils, PermissionGuard arrays, 1 new component + 1 new hook. No route restructuring.
