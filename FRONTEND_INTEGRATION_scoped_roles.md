# Frontend Integration Guide — Scoped Roles (server changes)

> **Scope of this doc:** how to **call the endpoints and handle the responses** after the
> backend's scoped-roles changes. Request/response contracts only — no UX rationale (that's in
> `FRONTEND_location_category_roles.md`). Every contract here is **LIVE and verified**.
>
> **Global rules**
> - **Auth:** every endpoint below requires the `x-token` (JWT) header. No exceptions.
> - **Base paths:** MySQL routes live under `/api/db_<name>` (e.g. `/api/db_item`, `/api/db_staff`).
> - **Company scoping:** most bodies carry `company_id`; the server derives identity from the JWT,
>   never trust client-sent role/permissions.

---

## 1. What changed (server side)

- **2 new roles**: `category_manager` (level 8), `category_assistant` (level 9). Category
  equivalents of `inventory_location_manager` (6) / `inventory_location_assistant` (7).
- **Scope is enforced**: roles 6/7 are limited to assigned **locations**, 8/9 to assigned
  **categories**. They only read/write inventory inside that scope.
- **Per-assignment write flags** (`can_create/can_update/can_delete`) are enforced on every
  inventory write, and are **set automatically by role** when you assign a scope.
- **One endpoint changed auth**: `POST /api/db_item/item-out-warehouse` now requires the JWT
  (was open). See §5.

---

## 2. Read the user's scope & permissions

### `POST /api/db_staff/company-staff/permissions`
Body: `{ "company_id": 62, "staff_id": 158 }`
```jsonc
// 200
{
  "ok": true,
  "roleType": "category_manager",
  "role_level": 8,
  "permissions": ["inventory:create", "inventory:read", "inventory:update", "inventory:delete"],
  "locations":  [],                                    // always present, may be []
  "categories": [
    { "category_id": 11, "category_name": "Audio",
      "can_create": true, "can_update": true, "can_delete": false }
  ]
}
```

### `GET /api/db_staff/companies`  (login bootstrap)
```jsonc
// 200
{ "ok": true, "companies": [
  { "company_id": 62, "company_name": "Acme", "roleType": "category_manager", "role_level": 8,
    "locations": [ /* {location_id, location_name, can_*} */ ],
    "categories": [ /* {category_id, category_name, can_*} */ ] }
]}
```

**Handling:** read `locations` / `categories` defensively (`?? []`). `can_*` are booleans.
Use them to decide which **create/update/delete buttons** to show per location/category — a user
can hold `inventory:update` at the role level yet have `can_update:false` on a given scope.

---

## 3. Assign / update the role

### `POST /api/db_staff/company-staff`  (create) · `PATCH /api/db_staff/company-staff/role`  (change role)
Body includes `role_type`. Both now accept `category_manager` / `category_assistant`.
On success the staff member exists but has **no scope yet** — immediately call §4.

---

## 4. Assign the scope  (the core call)

### `PUT /api/db_staff/company-staff/scope`
**Send only the dimension that matches the role.** Location role → `locations`; category role →
`categories`. Sending the wrong one is a 400.

```jsonc
// Category-scoped staff — normal case (bare ids, flags applied by role):
{ "company_id": 62, "staff_id": 158, "categories": [11, 12] }

// Location-scoped staff:
{ "company_id": 62, "staff_id": 158, "locations": [3, 7] }
```
```jsonc
// 200
{
  "ok": true, "dimension": "category", "assigned": 2,
  "locations_set": 0, "categories_set": 2,
  "default_flags": { "can_create": 1, "can_update": 1, "can_delete": 1 },
  "assignments": [
    { "id": 11, "can_create": true, "can_update": true, "can_delete": true },
    { "id": 12, "can_create": true, "can_update": true, "can_delete": true }
  ]
}
```

**Behavior you must rely on:**
- **Full-replace.** The call replaces the entire set for `(company_id, staff_id)`. Always send the
  complete current selection, not a delta.
- **Flags are automatic.** Managers (6/8) get full CRUD; assistants (7/9) get update-only. Sending
  bare ids is all you need — no separate "grant permissions" call. `assignments`/`default_flags`
  in the response let you update local state without re-fetching.
- **⚠️ FAIL-CLOSED.** An empty array clears the scope, and a scoped user with **zero** assignments
  sees **no inventory**. The UI must require **≥1** id before calling this for a scoped role.

**Optional — per-assignment override** (only if you need finer control): replace a bare id with an
object. Omitted flags fall back to the role default; every flag is **clamped to the role** (you can
turn one off, never grant beyond the role — an assistant's `can_delete:true` is ignored).
```jsonc
{ "company_id": 62, "staff_id": 158,
  "categories": [ 11, { "id": 12, "can_create": false, "can_update": true, "can_delete": false } ] }
```

**Error responses to handle:** `400` (missing keys / wrong dimension for role / non-scoped role /
invalid id for company), `404` (staff not active in company). Only offer ids from §6 to avoid the
invalid-id 400.

---

## 5. Inventory write requests — response handling under scope

All inventory writes are `POST /api/db_item/...` with `x-token`. A scoped user acting outside its
scope (or without the needed `can_*` flag) is rejected. **Handle these consistently:**

| Endpoint | Denied-scope behavior |
|----------|----------------------|
| `/new_item`, `/edit-item`, `/delete-item` (and `/:id`) | **403** `{ ok:false, msg:"Not allowed to ..." }` — show as permission error |
| `/bulk-item`, `/bulk-item-alphanumeric` | **403** (single location+category per call → all-or-nothing) |
| `/delete-bulk-items` | Non-permitted items **skipped**; `200` with `skipped_count`. Nothing permitted → `200 { deleted_count: 0 }`. Show "X of Y deleted". |
| `/delete-bulk-items-criteria` | Criteria intersected with scope; out-of-scope → `200 { deleted_count: 0 }` (no-op, not an error) |
| `/item-out-warehouse` | Permitted items updated, others skipped (`skipped_count`); all-denied → **403** |

### 🚨 Breaking change — `POST /api/db_item/item-out-warehouse`
This endpoint (item move-out during **event assignment**) **was unauthenticated and now requires
`x-token` + `inventory:update`.** `sale_manager` / `event_manager` already hold `inventory:update`,
so the event flow keeps working **only if the frontend attaches the JWT to this call**. **Audit the
event-assignment flow now** — if it currently calls this without the token, it will start returning
**401** (missing identity) / **403**.

---

## 6. Categories source (for the multi-select)

### `POST /api/db_company/categories`
Body: `{ "company_id": 62 }`
```jsonc
// 200
{ "ok": true, "result": [
  { "category_id": 11, "category_name": "Audio", "sub_category_name": null, "active": 1, "created_at": "..." }
]}
```
Send **`category_id`** to §4; display **`category_name`**. If a `category_name` repeats across
`sub_category_name` rows, dedupe by `category_name` (scope is by name server-side).

---

## 7. Status codes quick reference

| Code | Meaning | Action |
|-----:|---------|--------|
| 401 | Missing/invalid JWT or missing identity | Ensure `x-token` is sent (esp. `item-out-warehouse`) |
| 403 | Role lacks the permission, or `can_*` flag not set for that scope | Show permission error; don't retry |
| 400 | Bad body / wrong dimension / invalid id for company | Fix the request; validate ids against §6 |
| 404 | Staff not active in company | Re-check `staff_id` / `company_id` |
| 200 + `skipped_count` | Partial success (some rows outside scope) | Report "X of Y processed" |
