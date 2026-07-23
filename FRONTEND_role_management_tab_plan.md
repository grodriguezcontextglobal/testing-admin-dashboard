# Execution Plan — "Roles" management tab (rename + scope descriptions + drag-and-drop staff assignment)

> **Audience:** this plan is written for an autonomous coding agent (Opus) executing
> in this repository. Follow CLAUDE.md strictly: Graphify-first discovery, all
> npm/vitest commands inside the Docker container (`docker compose exec
> devitrak-client ...`), internal UX components over raw antd/MUI, tests first,
> `graphify update .` after edits. All user-facing UI text MUST be in English.

---

## 1. Context — what already exists (verified, do not rebuild)

The per-company role-label customization feature is already implemented and on
`main` (commit `da4a691e`). Read these files before writing any code:

| File | What it provides |
|---|---|
| `src/config/roles.js` | Single source of truth for permissions. Key exports: `PERMISSIONS` (matrix `"domain:action"` → array of allowed roleType strings), `ROLE_LABEL_GROUPS` (6 role concepts, keyed by legacy string, each mapping to `[legacy, canonical]` roleType strings), `getRoleLabelGroupKey(roleType)` (accepts string or numeric 0-5), `getRoleLabel(roleType)` (default labels, accepts numeric), `ROLE_LEVELS`, `resolveRoleType(user)`, `hasPermission(action, roleType)`. |
| `src/hooks/useRoleLabel.js` | `useRoleLabel()` hook → stable `roleLabel(roleType)` function: company override from `state.admin.user.companyData.roleLabels[groupKey]`, falling back to the default label. |
| `src/pages/Profile/company_info/components/RoleLabelsForm.jsx` | The current label-editing form (6 inputs, one per role concept). **This plan MOVES it into the new tab** (see Task 3). Its mutation pattern (PATCH + local Redux update via `onLogin`, no forced logout) must be preserved. |
| `src/pages/staff/detail/components/equipment_components/UpdateRoleInCompany.jsx` | The existing single-staff role-change flow. Its `updateRole` mutation is the **canonical 3-call sequence** for reassigning a role (see §4). The drag-and-drop reassignment MUST reuse this exact sequence — do not invent a new API contract. |
| `src/pages/Profile/MainProfileSettings.jsx` | The Profile shell with the `tabOptions` array (pill NavLinks) and `<Outlet />`. New tab plugs in here. Note: it gates tabs with `hasPermission(option.permission, user.roleType)` (raw `user.roleType`, not `resolveRoleType`) — follow the existing convention in this file. |
| `src/routes/authorized/AuthRoutes.jsx` | `/profile` route with lazy-loaded children (`my_details`, `company-info`, `system-jobs`, …). New child route goes here, lazy-loaded like its siblings. |
| `src/pages/events/newEventProcess/documents/Form.jsx` | The only existing `@dnd-kit/core` usage in the app — reference implementation for DnD wiring. `@dnd-kit/core@^6.3.1` is already in `dependencies`; do NOT add other DnD libraries. |

**Data model:** `companyData.roleLabels` is a plain object on the company's
NoSQL document, e.g. `{ root_admin: "President" }`, persisted through the
existing flexible endpoint `PATCH /company/update-company/:id` (same precedent
as the `companyData.structure` key used for inventory label renames).
`companyData.employees[]` entries carry `role` (numeric string `"0"`-`"5"`),
`roleType` (string), `user` (email), `firstName`, `lastName`, `status`,
`active`, `super_user`, `userId`.

## 2. Hard invariants — violating any of these fails the task

1. **Renaming a label must never change permissions.** The permission layer
   (`PERMISSIONS`, `hasPermission`, `resolveRoleType`, `PermissionGuard`,
   numeric gates) reads roleType/role values, never display labels. Do not
   touch `PERMISSIONS` or any permission check.
2. **Default labels stay exactly as they are.** A company with no
   `roleLabels` key sees today's labels everywhere. Customization is opt-in.
3. **Role reassignment must reuse the existing mutation sequence** from
   `UpdateRoleInCompany.jsx` (§4) — same endpoints, same payload shapes.
4. **All UI text in English** (project rule, persists even if the user
   converses in Spanish).
5. Unit tests live in the documented scope: `src/config/**`, `src/hooks/**`,
   `src/store/**`, `src/pages/**/utils/**`. Put testable logic in
   `src/pages/Profile/roles_management/utils/` so it is coverable; keep
   components thin.

## 3. Tasks

### Task 1 — New "Roles" tab skeleton

1. Create `src/pages/Profile/roles_management/RolesManagementMainPage.jsx`
   (lazy-loadable default export).
2. `src/routes/authorized/AuthRoutes.jsx`: add
   `const RolesManagementMainPage = lazy(() => import("../../pages/Profile/roles_management/RolesManagementMainPage"));`
   and a child route `<Route path="roles" element={<RolesManagementMainPage />} />`
   inside the existing `/profile` route block (next to `company-info`).
3. `src/pages/Profile/MainProfileSettings.jsx`: add to `tabOptions`, after
   "Company info":
   `{ label: "Roles", route: "roles", permission: "staff:assign_role" }`.
   `staff:assign_role` is already in `PERMISSIONS` as ADMIN_FULL
   (`root_admin`, `admin`) — the correct gate, since this tab both renames
   labels and reassigns staff roles. Do NOT invent a new permission key.
4. Page layout: use `SectionHeader` (`src/components/documents/new_form_components/SectionHeader.jsx`)
   for the title block, matching Company Info's look. Title: "Roles".
   Subtitle: "Rename roles for your company and manage which staff members
   hold each role. Permissions are fixed per role — renaming never changes
   what a role can do."

### Task 2 — Role scope descriptions (derived, not hardcoded)

The client must understand exactly what each role can do before renaming or
assigning it. Derive this from `PERMISSIONS` at runtime so it can never drift
from the real matrix.

1. Create `src/pages/Profile/roles_management/utils/roleScopeUtils.js`:
   - `getRoleScope(groupKey)` → for the given role concept (a
     `ROLE_LABEL_GROUPS` key), scan `PERMISSIONS` and return
     `{ domain: { allowed: [action…], denied: [action…] } }`. A role concept
     "has" an action if **any** of its member roleType strings is in the
     action's array. Group by the `domain` prefix of each `"domain:action"`
     key (staff, event, inventory, transaction, member, nav, profile, …).
   - `ROLE_SUMMARIES` — a short one-sentence human summary per concept
     (this part is hand-written; keep it accurate to the matrix):
     - `root_admin`: "Full access to everything, including company settings, billing, and role assignment."
     - `admin`: "Full administrative access: staff, events, inventory, consumers, and company settings."
     - `sale_manager`: "Read/update access to events and inventory; no create/delete, no staff management."
     - `event_manager`: "Creates and manages events and their inventory assignments; no global inventory or staff management."
     - `inventory_manager`: "Creates and manages inventory; read access to events; no staff management."
     - `assistant`: "Day-of-event operations: consumer check-in/out and device assignment; most limited role."
     Verify each sentence against the real matrix while implementing; adjust
     wording if the matrix disagrees — the matrix wins.
2. **Test first** (`roleScopeUtils.test.js`, same folder): assert e.g.
   `getRoleScope("assistant").staff.allowed` does not include `staff:create`;
   `getRoleScope("root_admin")` has every domain fully allowed;
   `getRoleScope("sale_manager").inventory.allowed` includes `inventory:read`
   but not `inventory:create`; every `ROLE_LABEL_GROUPS` key returns a
   non-empty scope and has a `ROLE_SUMMARIES` entry.
3. UI: each role gets a card (one per concept, 6 total) showing: current
   display label (via `useRoleLabel()`), default name as muted secondary text
   when a custom label is set (e.g. "President — default: Root
   Administrator"), the summary sentence, and an expandable "What this role
   can do" detail (antd `Collapse` is acceptable if no internal UX equivalent
   exists — check `src/components/UX/` first) listing allowed capabilities
   grouped by domain with readable names ("Create events", "Delete
   inventory", …). Map action keys to readable verbs in `roleScopeUtils.js`
   (also unit-tested).

### Task 3 — Move label editing into the tab

1. Move the editable-label UI from
   `src/pages/Profile/company_info/components/RoleLabelsForm.jsx` into the
   new tab — each role card from Task 2 hosts its own label `Input`
   (`src/components/UX/inputs/Input.jsx`), with a single "Save labels" action
   for the page (keep the one-mutation-for-all-labels shape the current form
   uses: build the full `roleLabels` object and PATCH once).
2. Preserve exactly: PATCH `/company/update-company/${user.companyData.id}`
   with `{ roleLabels }`; on success dispatch
   `onLogin({ ...user, companyData: { ...user.companyData, roleLabels } })`
   (no logout); empty/whitespace input falls back to default (the hook
   already handles `""`).
3. Remove `<RoleLabelsForm />` from
   `src/pages/Profile/company_info/components/Body.jsx` and delete the old
   file once its logic lives in the new tab.

### Task 4 — Staff-per-role board with drag-and-drop

1. Create `src/pages/Profile/roles_management/utils/staffByRoleUtils.js`:
   - `groupEmployeesByRoleConcept(employees)` → `{ [groupKey]: employee[] }`
     using `getRoleLabelGroupKey(emp.roleType ?? emp.role)`. Employees whose
     role resolves outside the 6 concepts go into an `"unknown"` bucket
     (render it only if non-empty).
   - `canReassign({ actorUser, targetEmployee, toGroupKey })` → boolean +
     reason string. Rules (mirror `UpdateRoleInCompany.jsx`'s
     `optionsBasedOnCurrentRolePermission` and extend for the board):
     - Actor level 0 (`root_admin`) can assign any role to anyone…
     - …except: nobody can change their **own** role from this board, and
       nobody can change the **company owner's** role (match
       `companyData.owner.email` against the employee's `user` email).
     - An actor with level > 0 can only move employees whose current level is
       **greater than** the actor's level, and only **to** roles whose level
       is greater than the actor's level.
     - Employees with `status: "Pending"` (or missing `userId`) cannot be
       moved — their invite hasn't been accepted.
   - **Test first** (`staffByRoleUtils.test.js`): cover every rule above,
     including numeric-string roles (`role: "5"`, `roleType` absent),
     the owner guard, self-guard, and the pending guard.
2. Board UI in the tab, below the role cards (or integrated: each role card's
   body lists its staff — preferred, one column per role concept on desktop,
   stacked on mobile; the shell layout must not scroll horizontally):
   - Each staff entry: name, email, avatar-less compact row (follow the row
     styling of `src/pages/staff/MainAdminSettingPage.jsx` cells).
   - DnD with `@dnd-kit/core` (`DndContext`, `useDraggable`, `useDroppable`) —
     copy the wiring style from `src/pages/events/newEventProcess/documents/Form.jsx`.
     Non-movable entries (per `canReassign`) render without drag handles and
     with a tooltip stating the reason.
3. **Drop → confirmation → mutation.** On drop onto a different role column,
   open a `ModalUX` (`src/components/UX/modal/ModalUX.jsx`) confirmation
   showing: staff name, current role label → target role label (via
   `useRoleLabel()`), and the target role's summary sentence from Task 2
   ("This person will be able to: …"). Confirm button = `BlueButtonComponent`,
   cancel = `GrayButtonComponent`. Only on confirm run the mutation.
4. **The mutation — copy the sequence from `UpdateRoleInCompany.jsx`
   verbatim, adapted for the dragged employee** (read that file first; as of
   `da4a691e` it does, in order):
   1. `POST /db_staff/consulting-member` (fetch the SQL staff record for the
      employee's email),
   2. `PATCH /db_staff/company-staff` (update the SQL-side role),
   3. `PATCH /company/update-company/${companyData.id}` with the updated
      `employees` array (the moved employee gets `role: String(newLevel)` and
      `roleType` = the **legacy** group key string, matching what
      `UpdateRoleInCompany` writes).
   On success: dispatch the same Redux updates that file dispatches (it
   refreshes `admin.user.companyData.employees` via `onLogin` — replicate),
   invalidate the `["employeesPerCompanyList"]` react-query key, and show an
   antd `notification.success`. On failure: `message.error`, revert the board
   to Redux state (the board must always render FROM
   `companyData.employees`, never from local optimistic state — a failed
   mutation then self-corrects on rerender).
5. After moving a staff member, their row appears in the new column because
   Redux changed — verify no stale copy remains in the old column.

### Task 5 — Docker/Windows file-watch fix (approved as "acción 3")

In `vite.config.js`, inside the returned config object add:

```js
server: {
  watch: {
    // Docker Desktop on Windows does not reliably propagate host file events
    // into the container; without polling Vite serves stale modules after
    // git operations (see 2026-07-16 incident: stale roles.js export crash).
    usePolling: true,
    interval: 300,
  },
},
```

Keep the existing `--port=5522` from the npm script (do not duplicate port
config). Verify hot reload still works after `docker compose restart
devitrak-client` by touching a file and watching the container log.

### Task 6 — Verification & closeout (all inside Docker)

1. `docker compose exec devitrak-client npx vitest run src/pages/Profile/roles_management/utils/ src/config/roles.test.js src/hooks/useRoleLabel.test.js` — all green.
2. `docker compose exec devitrak-client npm run test:unit` — full suite green
   (baseline before this plan: 631 passing; your new tests raise that).
3. `docker compose exec devitrak-client sh -c "cd /app && npx vite build"` —
   must end in `✓ built`. (Reminder: the container is case-sensitive; import
   paths must match file casing exactly, e.g. `components/UX/…` not
   `components/ux/…`.)
4. Targeted lint on every file you created/modified:
   `docker compose exec devitrak-client npx eslint <files>` — zero NEW
   errors/warnings (the repo has pre-existing lint debt; do not fix unrelated
   files, do not add to it).
5. Manual smoke (dev server at `http://localhost:5522`): tab visible for
   root_admin/admin only; renaming a label updates the staff table chip
   (`/staff`) and the KPI donut without relogin; drag a movable staff member,
   confirm, verify the chip on `/staff` reflects the new role; verify a
   non-movable row (owner, self, pending) shows no drag handle.
6. `graphify update .`
7. Commit message prefix: `feat(roles): dedicated role management tab …`
   (Conventional Commits, as the log does). Do NOT push without the user's OK.

## 4. Reference — canonical role-reassignment sequence (from UpdateRoleInCompany.jsx)

```text
updateRole({ role_level: Number(newRole), roleType, employees })
  1. POST  /db_staff/consulting-member        { ...identify staff by email }
  2. PATCH /db_staff/company-staff            { ...SQL-side role update }
  3. PATCH /company/update-company/:companyId { employees: <updated array> }
  then: Redux onLogin(...) refresh + onAddStaffProfile where applicable
```

Read the file for exact payload fields before implementing — payload shapes
in this table are indicative; the file is authoritative.

## 5. Out of scope — do not do

- No changes to `PERMISSIONS`, `PermissionGuard`, or any permission gate
  (the separate queued task "gate footer Staff link" is NOT part of this plan).
- No backend changes; `PATCH /company/update-company/:id` persists arbitrary
  keys (precedent: `structure`, `roleLabels`).
- Do not delete `src/config/roleCapabilities.js` (known orphaned dead code,
  flagged separately).
- Do not add new npm dependencies (`@dnd-kit/core` is already present).
- Do not push to remote without explicit user approval.
