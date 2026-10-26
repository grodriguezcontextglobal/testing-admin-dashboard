# Frontend Action Plan — Location/Category Scoped Roles

> **For:** frontend agent/team.
> **Status:** backend is **COMPLETE and enforced** (phases 1–5 + A + C + the write-flag fix,
> branch `feat/category-scoped-roles`, e2e-verified). **Every contract below is ✅ LIVE.**
> Both read (visibility) and write scoping work end-to-end — assigning scope to a manager now
> grants write access automatically (see §0.1 / §5.4).
>
> **Context:** the backend added **category-scoped roles** mirroring the existing
> **location-scoped roles**. A staff member can be constrained to specific inventory
> **categories** (roles 8/9) or **locations** (roles 6/7): they only see and act on inventory
> within that scope, and each assignment carries `can_create/can_update/can_delete` flags that
> are now **enforced** on every inventory write.
>
> **Base URL convention:** Mongo routes hang off `/api/...`, MySQL routes off `/api/db_...`.
> **Auth:** all endpoints below require the `x-token` (JWT) header.

---

## 0. Executive summary

1. **Two new roles**: `category_manager` (level 8) and `category_assistant` (level 9) — the
   category equivalent of `inventory_location_manager` (6) / `inventory_location_assistant` (7).
2. **Scope**: roles 6/7 are limited to assigned **locations**; roles 8/9 to assigned
   **categories**. Full-access roles (root_admin, admin, inventory_manager) ignore scope.
3. **FAIL-CLOSED (critical UX rule)**: a scoped role with **zero** assignments sees **NO**
   inventory server-side. The assignment UI **must force ≥1** selection before save.
4. **Enforced writes**: a scoped role can only create/update/delete inventory within its scope
   **and** only where the matching `can_<action>` flag is set. Otherwise the server returns
   **403** (single writes) or silently **skips** the row (bulk — see §5.6).
5. **Reads** (`getStaffPermissions`, `getStaffCompanies`) already return a `categories[]` array
   (with flags) alongside `locations[]`. **✅ LIVE.**
6. **Scope-assignment endpoint** is live: `PUT /api/db_staff/company-staff/scope` (§5.4).
7. **Breaking**: `POST /api/db_item/item-out-warehouse` now requires `x-token` + `inventory:update`
   (was open). The event flow must send the token (§5.6).

### 0.1 ✅ RESOLVED — scope assignment now grants write flags automatically

`PUT /company-staff/scope` (§5.4) now sets the `can_create/can_update/can_delete` flags when it
creates assignments, so **just assigning a scope is enough** — no separate "grant write" step:

- **Managers** (`inventory_location_manager` 6, `category_manager` 8) → flags default to full
  **create + update + delete** within each assigned location/category.
- **Assistants** (`inventory_location_assistant` 7, `category_assistant` 9) → **update only**
  (read is implicit). They never get create/delete.

**Simplest integration:** send plain id arrays (§5.4). The right flags are applied by role — the
UI does not need to send flags at all.

**Optional (advanced):** to fine-tune a single assignment (e.g. a manager who is read-only on one
category), send objects with per-assignment flags. Overrides are **clamped to the role** — you can
turn a flag *off*, but you can never grant a capability the role lacks (an assistant can never get
create/delete). See §5.4.

---

## 1. The full role model (source of truth)

| Level | role_type | Label | Scope dimension | Inventory permissions | Needs scope UI |
|------:|-----------|-------|-----------------|-----------------------|:--------------:|
| 0 | `root_admin` | Root Administrator | none (full) | CRUD (+ everything) | no |
| 1 | `admin` | Administrator | none (full) | CRUD (+ everything) | no |
| 2 | `sale_manager` | Sale Manager | none | inventory C/R/U (+ sales) | no |
| 3 | `event_manager` | Event Manager | none | inventory R/U (+ event/consumer/txn) | no |
| 4 | `inventory_manager` | Inventory Manager | none (full inventory) | inventory CRUD | no |
| 5 | `assistant` | Assistant | none | (unchanged) | no |
| 6 | `inventory_location_manager` | Inventory Location Manager | **location** | inventory CRUD + location CRUD | **yes → locations** |
| 7 | `inventory_location_assistant` | Inventory Location Assistant | **location** | inventory R/U + location R/U | **yes → locations** |
| **8** | **`category_manager`** | **Category Manager** | **category** | **inventory CRUD** | **yes → categories** |
| **9** | **`category_assistant`** | **Category Assistant** | **category** | **inventory R/U** | **yes → categories** |

> Rows 8-9 are new. Category roles have **inventory permissions only** — no location, event,
> consumer, staff, etc. Gate the UI accordingly (§6).

---

## 2. Work checklist (frontend)

- [ ] **Roles config** (`src/config/roles.js`): add `category_manager` / `category_assistant`,
      each tagged with its scope dimension. (§3)
- [ ] **Scope-assignment UI**: based on the selected role's scope dimension, render a Locations
      multi-select, a Categories multi-select, or nothing. (§4)
- [ ] **Fail-closed guard**: block save when a scoped role has an empty selection. (§4)
- [ ] **Category source**: fetch company categories for the multi-select. (§5.5)
- [ ] **Consume `categories`** from `getStaffPermissions` / `getStaffCompanies`. (§5.1–5.2)
- [ ] **Wire the scope-save call** to `PUT /company-staff/scope`. (§5.4)
- [ ] **Write-side error handling**: 403 + `skipped_count` semantics on inventory writes. (§5.6)
- [ ] **Send `x-token` on `item-out-warehouse`** in the event-assignment flow. (§5.6)
- [ ] **Permission-gated UI**: hide non-inventory sections for category roles; drive write buttons
      off the per-assignment `can_*` flags. (§6)
- [ ] **(Optional)** per-assignment flag overrides UI — only if you need finer control than the
      role defaults. (§5.4)

---

## 3. Role picker — add the two roles

```js
// src/config/roles.js  (illustrative shape — adapt to the existing structure)
export const ROLE_SCOPE = {
  root_admin: null, admin: null, sale_manager: null,
  event_manager: null, inventory_manager: null, assistant: null,
  inventory_location_manager: 'location',
  inventory_location_assistant: 'location',
  category_manager: 'category',      // NEW
  category_assistant: 'category',    // NEW
};
```

The role dropdown should list all 10 role_types with their labels from §1. Creating/updating
staff with the new roles is **✅ LIVE** — `addCompanyStaff` / `updateCompanyStaffRole` now accept
`category_manager` / `category_assistant` (§5.3).

---

## 4. Scope-assignment UI (the core new feature)

**Behavior driven by the selected role's scope dimension** (`ROLE_SCOPE[role_type]`):

- `'location'` → render the **Locations** multi-select (values = `location_id`).
- `'category'` → render the **Categories** multi-select (values = `category_id`).
- `null` → render **no** scope selector.

**Fail-closed guard (mandatory):** when the dimension is not `null`, require **≥1** selection.
Block save with copy like *"Assign at least one {location|category} — a scoped user with no
assignments cannot see any inventory."*

**On save:** send the complete current selection (full-replace, §5.4). The endpoint **replaces**
all assignments for that `(company_id, staff_id)`; an empty array clears the dimension (which the
guard must prevent for scoped roles). Send **only the dimension that matches the role** — sending
the wrong one is a 400 (§5.4).

**Data sources:**
- Locations → reuse the existing company-locations fetch already used elsewhere.
- Categories → `POST /api/db_company/categories` (§5.5).

---

## 5. Contracts (exact shapes — all ✅ LIVE)

### 5.1 `getStaffPermissions`
`POST /api/db_staff/company-staff/permissions` · headers `x-token` · body `{ company_id, staff_id }`

```jsonc
// Response 200:
{
  "ok": true,
  "roleType": "category_manager",
  "role_level": 8,
  "permissions": ["inventory:create", "inventory:read", "inventory:update", "inventory:delete"],
  "locations": [
    { "location_id": 3, "location_name": "Main Warehouse", "can_create": true, "can_update": true, "can_delete": false }
  ],
  "categories": [
    { "category_id": 11, "category_name": "Audio", "can_create": false, "can_update": false, "can_delete": false }
  ]
}
```
> `locations` and `categories` are always present (may be empty). Note `location_name` (not
> `location`). Flags are booleans, set by role at assignment time (§0.1): a manager's assignments
> come back with all flags `true`, an assistant's with `can_update` only.

### 5.2 `getStaffCompanies`
`GET /api/db_staff/companies` · headers `x-token`. Login bootstrap. Each company carries
`{ company_id, company_name, roleType, role_level, locations: [...], categories: [...] }` — same
object shapes as §5.1.

### 5.3 `addCompanyStaff` / `updateCompanyStaffRole`
`POST /api/db_staff/company-staff` · `PATCH /api/db_staff/company-staff/role` · body includes
`role_type`. Now accept `category_manager` / `category_assistant` (validation range extended). ✅

### 5.4 Scope-assignment endpoint — `setCompanyStaffScope`
`PUT /api/db_staff/company-staff/scope` · headers `x-token` · full-replace, transactional,
multi-tenant guarded. **Dimension is dictated by the staff member's role — send only the matching
array.**

```jsonc
// Request — LOCATION-scoped staff (role 6/7):
{ "company_id": 62, "staff_id": 158, "locations": [3, 7] }      // location_ids
// Request — CATEGORY-scoped staff (role 8/9):
{ "company_id": 62, "staff_id": 158, "categories": [11, 12] }   // category_ids

// Response 200:
{
  "ok": true, "dimension": "category", "assigned": 2, "locations_set": 0, "categories_set": 2,
  "default_flags": { "can_create": 1, "can_update": 1, "can_delete": 1 },  // by role (§0.1)
  "assignments": [
    { "id": 11, "can_create": true, "can_update": true, "can_delete": true },
    { "id": 12, "can_create": true, "can_update": true, "can_delete": true }
  ]
}
```

**Write flags — the normal case is: send plain ids and let the backend apply role defaults**
(§0.1). `default_flags` in the response tells you what was applied; `assignments` echoes the
per-id result so you can update UI state without a re-fetch.

**Advanced — per-assignment overrides.** Instead of a bare id, send an object; omitted flags fall
back to the role default, and any flag is clamped to the role's max:

```jsonc
// A category_manager who is read-only on category 12 but full on 11:
{
  "company_id": 62, "staff_id": 158,
  "categories": [
    11,                                                              // bare id → role default (CRUD)
    { "id": 12, "can_create": false, "can_update": true, "can_delete": false }
  ]
}
// (An assistant sending can_delete:true is ignored — clamped to 0.)
```

**Error responses (handle these):**
- `400 "company_id and staff_id are required"` — missing keys.
- `400 "Provide a locations or categories array"` — neither array sent.
- `400 "This role is location-scoped; send \`locations\`, not \`categories\`"` (and the mirror) —
  you sent the wrong dimension for the role.
- `400 "Scope can only be assigned to location- or category-scoped roles"` — target isn't 6/7/8/9.
- `400 "Invalid {location|category} id(s) for this company: ..."` — an id doesn't belong to the
  company. Only offer ids from §5.5 / the locations fetch to avoid this.
- `404 "Active staff record not found for this company"`.

> Ids are de-duped and validated against the company before any write. `can_*` flags are set by
> role (or by clamped override) at assignment time — see §0.1 and the flag notes above.

### 5.5 Company categories list
`POST /api/db_company/categories` · headers `x-token` · body `{ company_id }`

```jsonc
{ "ok": true, "result": [
  { "category_id": 11, "category_name": "Audio", "sub_category_name": null, "active": 1, "created_at": "..." }
]}
```
> Scope is by **`category_name`** server-side, but the assignment endpoint takes **`category_id`**.
> Send `category_id` in §5.4; show `category_name` in the UI. If a `category_name` appears with
> multiple `sub_category_name` rows, present it once (dedupe by `category_name`).

### 5.6 Inventory write behavior under scope (error/partial-success handling)
- **Single writes** — `POST /new_item`, `POST /edit-item`, `POST /delete-item` (and `POST /:id`):
  a scoped role acting outside its scope, or without the matching `can_*` flag, gets
  **`403 { ok:false, msg:"Not allowed to ..." }`**. Surface as a permission error.
- **Bulk create** — `POST /bulk-item`, `POST /bulk-item-alphanumeric`: same 403 (single
  location+category per request → all-or-nothing).
- **Bulk delete** — `POST /delete-bulk-items`: items outside scope are **silently skipped**; the
  response adds `skipped_count` when any were skipped. If *nothing* is permitted →
  `200 { deleted_count: 0 }`. Show "X of Y deleted" when `skipped_count > 0`.
- **Criteria delete** — `POST /delete-bulk-items-criteria`: the criteria are intersected with
  scope; a category/location outside scope returns `200 { deleted_count: 0 }` (no-op, not error).
- **Move-out (event assignment)** — `POST /api/db_item/item-out-warehouse`: **now requires
  `x-token` + `inventory:update`** (was unauthenticated). `sale_manager`/`event_manager` already
  hold `inventory:update`, so the event flow keeps working **only if the frontend sends the
  token here** — verify it does, or the call 401s/403s. Scoped roles: permitted items updated,
  others skipped (`skipped_count`); all-denied → 403.

---

## 6. Permission-gated UI

Drive feature visibility from `permissions[]` (§5.1):
- `category_manager` → `inventory:{create,read,update,delete}` only.
- `category_assistant` → `inventory:{read,update}` only.

For a category-scoped user: **show inventory** features (respecting create/update/delete
availability from the flags), and **hide** location management, events, consumers, staff, billing,
etc. — they have no permissions there.

> Drive create/update/delete **buttons** off the per-assignment flags in §5.1 (not just
> `permissions[]`): a scoped user may hold `inventory:update` at the role level but have
> `can_update:false` on a specific location/category. With the §0.1 fix a manager's assignments
> default to full flags, so buttons light up as soon as scope is assigned.

---

## 7. Sequencing

**Backend: DONE** — schema, helpers, management API, read contracts, and write enforcement are all
live on `feat/category-scoped-roles` (e2e-verified). Deploy still pending: branch not merged;
production audit of fail-closed roles; Windows `worker.exe` rebuild.

**Frontend: buildable NOW, no blockers** — role config, scope UI + fail-closed guard, category
fetch, consuming `categories`, wiring `PUT /scope`, write-error handling, and permission-gating.
Read **and** write scoping are both fully supported by the backend.

**Recommendation:** wire against the live contracts now. Keep the whole feature behind a feature
flag only until the branch is **deployed** (it's verified but not yet merged/released — see the
deploy notes above). No partial/read-only interim state is needed.

---

## 8. Previously-open questions — RESOLVED

1. **Granular flags:** **Enforced + settable.** `can_create/can_update/can_delete` per assignment
   gate writes within scope (Phase C), and `PUT /scope` now sets them by role automatically, with
   optional per-assignment overrides (§0.1, §5.4). No separate grant step.
2. **Scope endpoint shape:** confirmed — `PUT /api/db_staff/company-staff/scope`, id-list,
   full-replace, **dimension dictated by role** (§5.4). Not objects-with-flags.
3. **Category granularity:** scope is by `category_name`; assignment takes `category_id`. Offer
   `category_name` only (dedupe), not `sub_category_name`.
4. **Mixed scope:** confirmed — a role is either location- **or** category-scoped, never both. The
   endpoint rejects the mismatched dimension (§5.4). Never show both selectors at once.
