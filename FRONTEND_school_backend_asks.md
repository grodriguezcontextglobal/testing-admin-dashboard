# Backend Asks — unblock the School-Vertical Phase 2

> **For:** backend team. **From:** frontend.
> **Why:** the frontend work for these items is ready to build but is blocked on
> backend contracts. Each ask below lists the exact endpoint/shape the frontend
> needs. Ordered by effort (cheapest first).
>
> **Conventions:** MySQL routes under `/api/db_*`; Mongo routes under `/api/*`;
> all require the `x-token` JWT; SQL bodies carry the **SQL integer**
> `company_id` (`sqlInfo.company_id`), Mongo routes use the Mongo `companyData.id`.

---

## A3.1 — Persist `roleLabels` on the company document  ·  effort: XS (field whitelist)

**Problem:** renaming a role per company (e.g. Inventory Manager → "Warehouse
Manager") works during the session but **reverts to default on the next login**.
The frontend already `PATCH`es `roleLabels` and re-reads it at login; it's
being dropped on persist.

**Ask:** `PATCH /api/company/update-company/:id` must **persist** an arbitrary
`roleLabels` object and return it on company reads.

```jsonc
// Request (already sent by the UI today):
{ "roleLabels": { "root_admin": "President", "inventory_manager": "Warehouse Manager" } }

// Required: the field survives and is returned by BOTH company reads used at login:
//   POST /api/company/search-company        -> company[].roleLabels
//   POST /api/db_company/consulting-company  -> (if it surfaces company doc fields)
```
`roleLabels` is a free-form `{ [roleConceptKey]: string }` map (keys are the 6
role concepts). Precedent: `companyData.structure` already persists this way —
`roleLabels` just needs the same treatment (schema/allowlist entry).

---

## A3.2 — Staff upsert by email (stop duplicate SQL rows)  ·  effort: S

**Problem:** the SQL `staff` table holds **duplicate rows for one email** (seen:
9 rows for a single tester email, `staff_id` 183…193). This makes `staff_id`
resolution ambiguous and caused a scoped-role login to fall back to the wrong
role. The frontend already picks deterministically (newest `created_at`), but
the duplicates should not exist.

**Ask:**
1. Staff creation **upserts by `(email, company)`** instead of inserting a new
   row each time.
2. Dedupe existing rows (collapse to one canonical `staff_id` per email, keeping
   the one referenced by `company_staff`).
3. Ideally `POST /api/db_staff/consulting-member { email }` returns a **single**
   canonical record (or add a company-scoped lookup returning the `staff_id`
   linked to that company's `company_staff`).

---

## B1 — Fees for lost / damaged member devices  ·  effort: M

**Problem:** the student return flow (`Return.jsx`) records outcome
(returned / damaged / lost) + condition note but **charges no fee**. The only
fee logic (`ChargeLostFee`) lives in the `consumers` track, which the Education
profile hides. Schools need to bill the responsible party (guardian for minors)
for lost/damaged devices.

**Ask — two pieces:**

### B1.1 Attach a fee when closing a lease
Extend the existing lease-close call (or add a sibling) to accept a fee:
```jsonc
// POST /api/db_member/update-member-assigned-device-lease   (existing)
{
  "company_id": 62,
  "where": { "company_id": 62, "member_id": 158, "device_id": 900 },
  "update": {
    "returned": 1, "return_status": "lost", "condition_note": "...",
    "returned_date": "2026-06-02",
    "fee_amount": 250.00,          // NEW — nullable
    "fee_reason": "Device not recovered"   // NEW — nullable
  }
}
```

### B1.2 Read outstanding fees (for member detail + fees report)
```jsonc
// POST /api/db_member/member-fees
{ "company_id": 62, "member_id": 158 }   // member_id optional → all members
// 200
{ "ok": true, "result": [
  { "fee_id": 1, "member_id": 158, "device_id": 900, "serial_number": "SN-1",
    "fee_amount": 250.00, "fee_reason": "lost", "status": "outstanding",
    "created_at": "2026-06-02" }
]}
```
Optional: `PATCH /api/db_member/member-fee { fee_id, status: "paid"|"waived" }`.

---

## B2 — Activity / audit log  ·  effort: M

**Problem:** `staffActivitySlice` is a placeholder; there is **no audit trail**
of who assigned/returned a device or edited a student record — a near-requirement
when the subjects are minors.

**Ask (preferred: server-side automatic logging):** on the mutating endpoints
already in use (assign lease, return lease, member create/update, role change),
write an activity row server-side, and expose a read feed:

```jsonc
// POST /api/db_activity/feed
{ "company_id": 62, "entity_type": "member", "entity_id": 158, "limit": 50, "offset": 0 }
// (entity_type/entity_id optional → company-wide feed)
// 200
{ "ok": true, "result": [
  { "id": 10, "actor_staff_id": 12, "actor_name": "Ana Ruiz",
    "action": "device_assigned", "entity_type": "member", "entity_id": 158,
    "metadata": { "device_id": 900, "serial_number": "SN-1" },
    "at": "2026-06-01T14:03:00Z" }
]}
```
Actions to cover: `device_assigned`, `device_returned` (+ outcome),
`member_created`, `member_updated`, `role_changed`, `scope_changed`. Server-side
logging is preferred over a client `POST /log` so the trail can't be bypassed.

---

## Already covered (no ask)
- **Year-end bulk return** — `POST /api/db_member/bulk-return` +
  `POST /api/db_member/overdue-leases` already power `OverdueDevicesTable`
  (grade filter, guardian reminders, end-of-term bulk return). ✅
- **Scoped-role endpoints** — categories/locations/scope/role/permissions
  confirmed live in prod (see `FRONTEND_INTEGRATION_scoped_roles.md`). ✅

---

## Frontend readiness once each lands
- **A3.1:** zero frontend change — the read/write path already exists; it just
  starts persisting.
- **A3.2:** frontend already resolves deterministically; dedup removes the risk.
- **B1:** wire a fee input into `Return.jsx` (damaged/lost) and a fees section in
  member detail + the fees report.
- **B2:** replace the `staffActivitySlice` stub with a feed reader; render an
  activity tab in member/staff detail.
