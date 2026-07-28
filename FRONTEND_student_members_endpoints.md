# Frontend Manual — Student / Member Endpoints (2026-07-28)

> **Audience:** the frontend agent. **Scope:** every endpoint that reads or
> writes student/guardian/consent/device-lease data (`/api/school/*` +
> the school-track parts of `/api/db_member/*`). **Everything here is LIVE on
> `main`**; all DB migrations are already applied in production.
>
> This supersedes/extends `FRONTEND_server_updates_2026-07.md` for this domain
> — that doc is still valid for §1 (device-assign 422 codes), §2 (RBAC roles),
> and §4 (`/api/db_lease/status`), which are **not** repeated in full below.

## 0. What's actually NEW since the last handoff (2026-07-22)

If you already integrated the 2026-07-22 doc, these are the endpoints/changes
you have **not** seen yet:

| Endpoint | What's new |
|---|---|
| `POST /api/school/guardians/add` | now accepts `guardian_id` to **reuse** an existing guardian instead of always creating one |
| `POST /api/school/guardians/search` | brand new — search guardians by `member_id`/`email`/`guardian_id` |
| `POST /api/school/consent/request` | brand new — staff-initiated **OTC** consent flow (emails the guardian a link) |
| `POST /api/school/consent/resend` | brand new — regenerate the OTC / resend the email for a pending request |
| `POST /api/school/consent/public/retrieve` | brand new — **unauthenticated**, guardian-facing (used by the link in the email) |
| `POST /api/school/consent/public/respond` | brand new — **unauthenticated**, guardian-facing |
| `POST /api/school/student/export` | brand new — FERPA data-subject export |
| `POST /api/school/student/erase` | brand new — FERPA/COPPA anonymize-or-delete |
| `POST /api/school/student/access-log` | brand new — per-student access/disclosure history |
| `POST /api/db_member/overdue-leases` | not previously documented — overdue-lease query used for reminder dashboards |
| `POST /api/db_member/bulk-return` | not previously documented — end-of-term bulk device return |
| `POST /api/db_member/my-devices` | not previously documented — **unauthenticated** family-portal lookup |

Everything else below (dashboard, roster, guardians list, consent record/list/status,
settings) was already covered in the July 22 doc and is included here again for
completeness, unchanged.

---

## 1. Auth conventions

- `/api/school/*` — staff JWT (`x-token` + token-version headers, same as any
  `/api/db_*` call) **and** the company's `industry` must be `"Education"`.
  Non-Education tenants get `403`. All routes also require the `member:read`
  (read endpoints) or `member:create`/`member:update` (write endpoints)
  permission on the staff's role.
- `/api/db_member/*` (except `my-devices`) — staff JWT + `member:<action>`
  permission, same pattern as any other `/api/db_*` route.
- **Public/unauthenticated** (no JWT, do not send staff headers):
  `POST /api/school/consent/public/retrieve`, `POST /api/school/consent/public/respond`,
  `POST /api/db_member/my-devices`. These are meant to be called directly by a
  guardian/student from an email link or a public "my devices" page.

---

## 2. `/api/school/*` — students, guardians, consent

### 2.1 `POST /api/school/dashboard`
Body: `{ company_id }` → program summary + per-grade breakdown. (Unchanged since 07-22.)

### 2.2 `POST /api/school/roster`
Body: `{ company_id, grade?, homeroom? }` → student list with `devices_out`. (Unchanged.)

### 2.3 Guardians

- **`POST /api/school/guardians`** — Body: `{ company_id, member_id }` → all
  guardians for a student (normalized + embedded primary), `source` tags each
  as `"embedded"` or `"normalized"`.
- **`POST /api/school/guardians/add`** ⚠️ **payload changed** — Body:
  `{ company_id, member_id, guardian_id?, first_name?, last_name?, email?, phone_number?, relationship?, is_primary? }`.
  - Pass `guardian_id` to **link an existing guardian** to this student (e.g.
    a sibling shares a parent) — `404` if that guardian isn't in this company.
  - Omit `guardian_id` and pass at least one of `first_name`/`last_name`/`email`
    to **create a new guardian**.
  - `400` if neither `guardian_id` nor any name/email field is present.
  - Idempotent: relinking the same student+guardian returns
    `200 { ok:true, existing_link:true, linked:false }` instead of erroring.
  - Success: `201 { ok:true, guardian_id, linked:true, existing_link:false, created_guardian:bool }`.
- **`POST /api/school/guardians/search`** (NEW) — Body:
  `{ company_id, member_id?, email?, guardian_id? }` (at least one of the three
  required, `400` otherwise) → `{ ok:true, count, guardians:[{ id, first_name,
  last_name, email, phone_number, students:[{ member_id, first_name, last_name,
  relationship, is_primary }] }] }`. A guardian shared by multiple students
  appears once with all of them listed in `students`.

### 2.4 Consent / AUP — recording, requesting, and the public OTC flow

Two ways to record consent: **direct** (staff has an in-person signature) or
**OTC** (email the guardian a link, they respond themselves).

- **`POST /api/school/consent/record`** (direct) — Body: `{ company_id,
  member_id, signer_name, policy_type?="AUP", policy_version?="1", guardian_id?,
  signer_email?, method?="e-signature" }` → `201 { ok:true, consent_id }`.
  Duplicate (same member+policy+version) → `200 { ok:true, msg:"consent already recorded…" }`.

- **`POST /api/school/consent/request`** (NEW, starts the OTC flow) — Body:
  `{ company_id, member_id, guardian_id?, policy_type?="AUP", policy_version?="1" }`.
  Resolves a guardian email (explicit `guardian_id` → linked guardian → embedded
  `parent_guardian_email`, in that order); `422` if none found — add a guardian
  first (§2.3). On success: generates a one-time code, emails the guardian a
  link, and returns `201 { ok:true, consent_id, status:"pending", expires_at, guardian_email }`.

- **`POST /api/school/consent/resend`** (NEW) — Body: `{ company_id, member_id,
  policy_type?="AUP", policy_version?="1" }`. Regenerates the OTC (invalidating
  the previous email link) and re-sends. Responses: `404` if no request exists
  for that student/policy (call `/consent/request` first) · `409` if the
  request was already `agreed`/`refused` (nothing to resend) · `422` if the
  request has no guardian email on file · `200 { ok:true, consent_id, status:"pending", expires_at, guardian_email }` on success.

- **`POST /api/school/consent/public/retrieve`** (NEW, **public, no auth**) —
  Body: `{ otc }`. This is what the "Review Consent" link in the email should
  call to render the consent page. Returns `{ ok:true, consent:{ id, status,
  policy_type, policy_version, signer_name, requested_at, expires_at,
  consented_at, refused_at, responded_at, mutable }, company:{ id, name,
  industry }, guardian:{ id, first_name, last_name, full_name, email,
  phone_number }, student:{ id, first_name, last_name, full_name, email, grade,
  homeroom, date_of_birth } }`. `404` for an unknown/wrong `otc`; `410
  { code:"CONSENT_LINK_EXPIRED" }` once the link has expired (default 7 days
  from the request). `mutable:false` means the guardian already responded —
  show the recorded decision as read-only instead of the response form.

- **`POST /api/school/consent/public/respond`** (NEW, **public, no auth**) —
  Body: `{ otc, decision:"agreed"|"refused", signer_name }`. `400` for a bad
  `decision` or missing `signer_name`; `404`/`410` same as retrieve; if already
  responded, returns `200 { ok:true, msg:"Consent already <status>." }`
  (safe to resubmit, no double-write). Success: `200 { ok:true, status,
  consent_id }`.

- **`POST /api/school/consent`** — Body: `{ company_id, member_id }` → a
  student's consent history (`{ ok:true, count, consents:[…] }`, each row now
  also carries `status`, `otc_expires_at`, `requested_at`, `responded_at`, `refused_at`).

- **`POST /api/school/consent/status`** — Body: `{ company_id, policy_type?="AUP",
  policy_version? }` → compliance view (`{ ok:true, total, consented,
  missing_count, missing:[…] }`). Only counts `status='agreed'` rows as
  compliant — a `pending` OTC request does **not** count yet.

### 2.5 Settings — consent enforcement toggle
`POST /api/school/settings` (read) and `POST /api/school/settings/consent-enforcement`
(write, `{ company_id, enforce:bool }`). Unchanged since 07-22 — see that doc
for the `422 CONSENT_REQUIRED` interaction with device assignment.

### 2.6 FERPA/COPPA data-subject rights (all NEW)

- **`POST /api/school/student/export`** — Body: `{ company_id, member_id }` →
  `{ ok:true, student, guardians, leases, consents, access_log }` (everything
  the system holds on that student — for a parent's data-access request).
  `404` if the member isn't in the company.
- **`POST /api/school/student/erase`** — Body: `{ company_id, member_id,
  mode?="anonymize" }`. `mode` must be `"anonymize"` (default — strips PII,
  keeps lease/asset history, preserves guardians shared with other students)
  or `"delete"` (hard-deletes the student/guardian-link/consent rows; leases
  are always preserved for asset history). Returns `200 { ok:true, mode,
  member_id, receipt:{ …counts… } }`. **This is destructive for `mode:"delete"`
  — surface a confirmation step in the UI before calling it.**
- **`POST /api/school/student/access-log`** — Body: `{ company_id, member_id,
  type?:"access"|"disclosure" }` → `{ ok:true, member_id, access_log, count }`.
  Omit `type` for everything; `"disclosure"` filters to export/erase-style
  events only.

---

## 3. `/api/db_member/*` — school-track device leases

Not gated by industry (works for any company using the member/lease model),
but functionally this is the "students receiving devices" surface.

- **`POST /api/db_member/overdue-leases`** — Body: `{ company_id, grade? }` →
  `{ ok:true, count, rows:[{ member_id, device_id, days_overdue, first_name,
  last_name, email, grade, homeroom, minor, parent_guardian_email,
  device_serial_number, device_category_name, … }] }`. Feeds an overdue
  dashboard; same data source that drives the daily reminder-email scheduler.

- **`POST /api/db_member/bulk-return`** — Body: `{ company_id, member_ids?,
  grade?, return_status?="returned"|"lost"|"damaged", condition_note? }`. Scope
  is `member_ids` > `grade` > "all outstanding for the company" (first one
  present wins). Marks matching outstanding leases returned and — unless
  `return_status:"lost"` — puts the physical devices back in warehouse stock.
  `200 { ok:true, returned, devicesRestocked, return_status }`, or
  `{ ok:true, returned:0, msg:"No outstanding leases in scope." }` if nothing matched.

- **`POST /api/db_member/my-devices`** (**public, no auth**) — Body:
  `{ email, external_id }`. Knowledge-based verification: `external_id` is the
  student ID; `email` must match the **guardian's** email on file if the
  student is a minor, or the **student's own** email if not. `404` with a
  generic message on any mismatch (does not reveal whether the ID exists).
  Success: `{ ok:true, member:{ first_name, last_name, grade, homeroom, minor,
  responsible_party, viewer:"representative"|"student" }, leases:[…] }` (device
  leases only — no address/phone data exposed on this public route).

---

## 4. Error statuses (this domain)

| Status | When | Frontend action |
|---|---|---|
| `400` | missing/invalid required field | show `msg`; fix the request |
| `403` | non-Education company on `/api/school/*`, or missing permission | hide the feature |
| `404` | member/guardian/consent not found, or invalid `otc` | show `msg` |
| `409` | consent already `agreed`/`refused`, resend not applicable | show current `status`, don't retry |
| `410` | `code:"CONSENT_LINK_EXPIRED"` on the public consent endpoints | prompt staff to call `/consent/resend` |
| `422` | no guardian email on file (`/consent/request`, `/resend`) | route to add-guardian (§2.3) first |
| `422` | `code:"CONSENT_REQUIRED"`/`"GUARDIAN_REQUIRED"` on device assignment | see `FRONTEND_server_updates_2026-07.md` §1 |

---

## 5. Not covered here

- `POST /api/db_lease/status` (cross-type lease dashboard) and the RBAC
  scoped-roles contract — see `FRONTEND_server_updates_2026-07.md` §2 and §4.
- Core member CRUD (`new-member`, `update-member-info`, `delete-member-info`,
  `bulk-members`, `consulting-member`, `retrieve-members-assigned-devices`,
  the single-row lease update/delete endpoints) is unchanged — not repeated here.
