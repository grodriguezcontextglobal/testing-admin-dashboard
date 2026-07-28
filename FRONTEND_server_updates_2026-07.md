# Frontend Integration Guide — Server updates (July 2026)

> **Audience:** the frontend agent. **Goal:** integrate the server changes shipped
> this cycle **without breaking the app**. Everything below is **LIVE on `main`**;
> DB migrations are already applied in production. Read §1 first — it is the only
> item that can break an existing flow if ignored.

All endpoints use the **same authenticated-staff auth you already send** on
`/api/db_*` calls (JWT + token-version headers) and take **`company_id` in the
request body**. New error statuses to handle are summarized in §5.

---

## 1. ⚠️ BREAKING IF UNHANDLED — device assignment can now return `422 CONSENT_REQUIRED`

**Endpoint (unchanged):** `POST /api/db_member/new-member-assigned-device-lease`

This call now has a **new failure mode** alongside the existing one. Both are
HTTP **422** with a machine-readable `code`:

```jsonc
// existing (already in prod): minor with no guardian on file
{ "ok": false, "code": "GUARDIAN_REQUIRED", "msg": "…", "members": [<member_id>, …] }

// NEW: minor without a RECORDED consent, when the company has consent enforcement ON
{ "ok": false, "code": "CONSENT_REQUIRED", "msg": "…", "members": [<member_id>, …] }
```

**What the frontend must do:**
- On a `422` from this endpoint, **branch on `response.code`** (do not treat 422 as a
  generic error).
- `CONSENT_REQUIRED` → show `msg`, and route the user to record consent
  (§3.3 `POST /api/school/consent/record`) for the listed `members`, then retry.
- `GUARDIAN_REQUIRED` → existing behavior (prompt to add guardian name + email).

**Scope of impact:** consent enforcement is **OFF by default per company** (opt-in via
§3.5). So today this only fires for Education companies that turned it on — but the
frontend should handle it now so enabling the flag never breaks the assign flow.

---

## 2. Scoped RBAC roles 8/9 are LIVE — the feature flag can be flipped ON

`category_manager` (level 8) and `category_assistant` (level 9), plus the existing
location-scoped 6/7, are **deployed and enforced** in production. The blocker for
turning on the frontend feature flag is gone.

- Follow the existing contract doc **`FRONTEND_location_category_roles.md`** for
  assigning scope (`PUT /company-staff/scope`) and reading `categories[]` /
  per-assignment `can_*` flags.
- No new work here beyond flipping the flag and honoring that doc.

---

## 3. School namespace `/api/school/*` — NEW (Education companies only)

Every route requires an authenticated staff session **and** the company's
`industry === "Education"`. A non-Education tenant gets:

```jsonc
{ "ok": false, "msg": "Forbidden: this feature is only available to Education companies" } // HTTP 403
```

Send `company_id` in the body. Gate these UI sections on the company industry so
non-Education users never see them.

### 3.1 `POST /api/school/dashboard` — 1:1 program summary
Body: `{ company_id }`
```jsonc
{ "ok": true,
  "summary": { "total_leases": 0, "outstanding": 0, "overdue": 0, "returned": 0,
               "lost": 0, "damaged": 0, "students_with_devices": 0, "total_students": 0 },
  "by_grade": { "5": { "total": 0, "outstanding": 0, "overdue": 0 }, "Unassigned": { … } } }
```

### 3.2 `POST /api/school/roster` — students (opt. by grade/homeroom)
Body: `{ company_id, grade?, homeroom? }`
```jsonc
{ "ok": true, "count": 0,
  "students": [ { "member_id": 0, "first_name": "", "last_name": "", "email": "",
                  "grade": "", "homeroom": "", "minor": 0, "devices_out": 0 } ] }
```

### 3.3 Consent / AUP
- `POST /api/school/consent/record` — Body: `{ company_id, member_id, signer_name,
  policy_type?="AUP", policy_version?="1", guardian_id?, signer_email?, method?="e-signature" }`
  → `201 { ok:true, consent_id }`. A duplicate (same member+policy+version) returns
  `200 { ok:true, msg:"consent already recorded…" }` (safe to retry).
- `POST /api/school/consent` — Body: `{ company_id, member_id }` → `{ ok:true, count,
  consents:[{ id, guardian_id, policy_type, policy_version, signer_name, signer_email,
  method, consented_at }] }`.
- `POST /api/school/consent/status` — Body: `{ company_id, policy_type?="AUP",
  policy_version? }` → **compliance view**:
  `{ ok:true, policy_type, total, consented, missing_count,
     missing:[{ member_id, first_name, last_name, grade }] }`.

### 3.4 Guardians (normalized — a student can have several)
- `POST /api/school/guardians` — Body: `{ company_id, member_id }` →
  `{ ok:true, count, guardians:[{ id, first_name, last_name, email, phone_number,
  relationship, is_primary, source }] }`. `source` is `"embedded"` (the primary
  guardian stored on the member) or `"normalized"`.
- `POST /api/school/guardians/add` — Body: `{ company_id, member_id, first_name?,
  last_name?, email?, phone_number?, relationship?, is_primary? }` → `201 { ok:true,
  guardian_id }`. `400` if no name/email; `404` if the member isn't in the company.

### 3.5 School settings (consent-enforcement toggle)
- `POST /api/school/settings` — Body: `{ company_id }` →
  `{ ok:true, settings:{ enforce_member_consent: false } }`.
- `POST /api/school/settings/consent-enforcement` — Body: `{ company_id, enforce }`
  (`enforce` boolean) → `{ ok:true, settings:{ enforce_member_consent: true|false } }`.
  ⚠️ Turning this ON makes §1 `CONSENT_REQUIRED` active for the company — only enable
  after existing minors have consents recorded.

---

## 4. `POST /api/db_lease/status` — unified device-lease status (NEW, optional)

One place to read every device lease (staff + consumer + member) with overdue
classification — useful for dashboards. Auth: `inventory:read`.

Body: `{ company_id, lessee_type?("staff"|"consumer"|"member"), only_overdue?(bool) }`
```jsonc
{ "ok": true,
  "summary": { "total": 0, "outstanding": 0, "overdue": 0, "returned": 0,
               "lost": 0, "damaged": 0, "by_type": { "staff": 0, "consumer": 0, "member": 0 } },
  "leases": [ { "lessee_type": "member", "lease_key": "member-…", "lessee_id": 0,
                "device_id": 0, "expected_return_date": "…", "outstanding": 1,
                "overdue": true, "status": "overdue", "return_status": null, … } ] }
```
`status` ∈ `overdue | outstanding | returned | lost | damaged`. `summary` is always the
full (company/type) set; `leases` is narrowed when `only_overdue:true`.

---

## 5. Error statuses to handle (all as `{ ok:false, msg, … }`)

| Status | When | Frontend action |
|--------|------|-----------------|
| `400` | missing/invalid `company_id`/args | show `msg`; fix the request |
| `401` | not authenticated | re-auth |
| `403` | industry gate (non-Education on `/api/school`) **or** missing permission | hide/disable the feature; don't retry blindly |
| `404` | member/company not found | show `msg` |
| `422` | `code:"GUARDIAN_REQUIRED"` or `code:"CONSENT_REQUIRED"` on device assignment | branch on `code` (see §1) |

---

## 6. What does NOT change (no frontend action)

- **Overdue reminder emails** are sent **server-side** on a daily schedule — no frontend
  contract. (You can surface overdue via §4 if desired.)
- **Service split** (Node / Go worker / email worker as separate processes) and the
  **PII access audit** are internal. **Same API host, port, and surface** (IIS →
  `db.devitrak.net`). Nothing to change.
