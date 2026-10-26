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

**Problem:** a school can now record a fee when closing a lease and collect it by
card on the spot — but **nothing about it is persisted**. The money lands in
Stripe and the charge shows in the activity log; the student's record shows no
debt, no payment, and no history. Nobody can answer "does this family owe
anything?" without opening the Stripe dashboard.

**State of the frontend:** built and live behind `VITE_APP_FEATURE_MEMBER_FEES`.
`Return.jsx` already sends `fee_amount`/`fee_reason` (B1.1) and
`ChargeMemberDeviceFee.jsx` already charges the card and holds the
`payment_intent` it would report back (B1.3). Nothing here needs new UI to start
working — B1.1 and B1.3 light up the moment the server stops dropping the fields.

Three pieces. **B1.1 and B1.3 are the blocking pair** — B1.1 alone records debts
that can never be marked paid.

### B1.1 Persist the fee when closing a lease  ·  effort: S

The frontend already posts this today. `fee_amount`/`fee_reason` are being
dropped; every other key in `update` already persists.

```jsonc
// POST /api/db_member/update-member-assigned-device-lease      (EXISTING route)
// Headers: x-token, s-company-lq: <SQL company id>
{
  "company_id": 62,
  "where": {                        // identifies exactly one lease row
    "company_id": 62,
    "member_id": 158,
    "device_id": 900
  },
  "update": {
    "returned": 1,
    "return_status": "lost",              // "returned" | "damaged" | "lost"
    "condition_note": "Reported lost by student on 6/2",
    "returned_date": "2026-06-02 14:30:00",
    "fee_amount": 250.00,                 // NEW — DECIMAL(10,2), nullable
    "fee_reason": "Device not recovered"   // NEW — VARCHAR, nullable
  }
}
// 200 — the frontend checks `data.ok` and nothing else
{ "ok": true }
```

Rules the frontend relies on:

| Rule | Why |
|---|---|
| Both fields are **optional**; absent means "no fee", and must not overwrite an existing fee with NULL | A plain return sends neither. The same route is also used to update only `expected_return_date` (`EditRowInformation.jsx`) — that call must never clear a fee. |
| `fee_amount` arrives in **dollars** as a JSON number (`250` or `75.5`), never cents | The Stripe layer speaks cents; this layer speaks dollars. Storing cents here would silently 100× every fee. |
| Only ever sent with `return_status` of `damaged` or `lost` | Enforcing that server-side is welcome — a fee on a clean return is a frontend bug we'd rather see rejected. |
| Reject `fee_amount <= 0` (or store NULL) | `0` and "no fee" must not be distinguishable on paper; the frontend already refuses to send `0`. |

### B1.2 Read fees  ·  effort: M

Needed for: an "Outstanding fees" section on the student profile, a school-wide
fees report, and a badge on the member list. **No frontend exists yet** — this is
the one piece of B1 that needs UI after the endpoint lands.

```jsonc
// POST /api/db_member/member-fees                              (NEW)
// Headers: x-token, s-company-lq
{
  "company_id": 62,
  "member_id": 158,          // optional — omit for the whole company
  "status": "outstanding"    // optional — "outstanding" | "paid" | "waived"
}
// 200
{ "ok": true, "rows": [
  {
    "fee_id": 1,
    "member_id": 158,
    "member_first_name": "Blaise",       // so the company-wide report needs no join
    "member_last_name": "Pascal",
    "device_id": 900,
    "serial_number": "SN-1",
    "device_category_name": "Laptop",
    "fee_amount": 250.00,
    "fee_reason": "Device not recovered",
    "status": "outstanding",             // "outstanding" | "paid" | "waived"
    "return_status": "lost",             // what the device was declared as
    "payment_intent": null,              // set once collected (B1.3)
    "paid_amount": null,                 // may differ from fee_amount (partial)
    "paid_at": null,
    "collected_by_staff_id": null,
    "created_at": "2026-06-02 14:30:00"
  }
]}
```

Use `rows` (not `result`) to match `retrieve-members-assigned-devices`, which the
member table already reads as `data.rows`.

Whether this is a real `member_fees` table or a view over the lease rows is your
call. A separate table is probably cleaner: a lease can only carry one fee, and
schools will eventually want a second fee on the same device (lost charger, then
lost laptop). If it stays on the lease row, `fee_id` can be the lease id.

### B1.3 Settle a fee after the card is charged  ·  effort: S

**This is the missing half of B1.1 and the reason the reported bug is only
half-fixed.** The frontend charges the card successfully and then has nowhere to
report it, so the debt stays "outstanding" forever while the family has already
paid — the worst of the three possible states.

```jsonc
// POST /api/db_member/settle-member-fee                        (NEW)
// Headers: x-token, s-company-lq
{
  "company_id": 62,
  "member_id": 158,
  "device_id": 900,               // OR "fee_id": 1 — see note
  "paid_amount": 250.00,          // dollars
  "payment_intent": "pi_3AbCdEfGhIjKlMnO",
  "payment_method": "credit_card",   // "credit_card" | "cash" | "waived"
  "status": "paid"                   // "paid" | "waived"
}
// 200
{ "ok": true, "fee_id": 1 }
```

Notes:
- **Accept `device_id` + `member_id` as the key, not only `fee_id`.** The charge
  modal can be opened standalone ("Charge device fee" in the header) with no
  lease row in hand — it knows the student and the serial, not a fee id. If you
  require `fee_id`, B1.2 has to ship first and the frontend needs a lookup step.
- Idempotency: key on `payment_intent`. A retry after a network timeout must not
  double-settle, and Stripe already guarantees the intent id is unique.
- Also accept a fee that was never recorded via B1.1 (staff can charge a fee for
  a device closed before fees existed) — create the row in that case rather than
  404.
- `collected_by_staff_id` from the JWT, not the body.

**Ordering that unblocks the most with the least work:** B1.1 + B1.3 together
(both are field/route work on data the frontend already sends), then B1.2 with
its UI.

---

## B3 — Email templates for a lost/damaged device and a paid fee  ·  effort: S

**Problem (found in manual testing, 2026-08-12):** declaring a device **lost**
mailed the guardian the **successful-return** template — "the device was returned
successfully" — for a laptop that was never coming back. All three outcomes
(returned / damaged / lost) posted the same payload to the same endpoint, so the
server had nothing to branch on. This is worse than an ugly email: it stands as
written confirmation of a return that did not happen.

**Frontend is already sending the new shape.** `buildReturnNotification`
(`leaseReturnUtils.js`) now routes by outcome. `returned` is byte-identical to
what shipped, so the live template is untouched.

### B3.1 Incident notification (lost / damaged)  ·  effort: S

**The frontend is already posting this exact body**, produced by
`buildReturnNotification` in `leaseReturnUtils.js` and sent from `Return.jsx`.
Nothing on our side changes when it lands — it stops warning and starts arriving.

```jsonc
// POST /api/nodemailer/member-device-incident-notification      (NEW)
// Headers: x-token
{
  "member": {
    "firstName": "Blaise",           // the STUDENT's name
    "lastName": "Pascal",
    "email": "parent@home.com"       // already resolved: guardian if minor
  },
  "devices": [
    { "device": { "serialNumber": "SN-1", "deviceType": "Laptop" } }
  ],
  "outcome": "lost",                                    // "lost" | "damaged"
  "outcomeLabel": "Declared lost — device not recovered",
  "conditionNote": "Reported lost by student on 6/2",   // string | null
  "feeAmount": 250.00                                   // number | null
}
// 200 — the frontend checks `data.ok` only
{ "ok": true }
```

Field contract:

| Field | Notes for the template |
|---|---|
| `member.email` | **Already the right recipient — do not re-resolve it.** For a minor this is the guardian on file; the frontend refuses to send at all when a minor has no guardian, so this address is never a student under 18. |
| `member.firstName/lastName` | The **student's** name, deliberately, even when mailing the guardian — the guardian needs to know which child this is about. Don't greet the recipient by these. |
| `outcome` | Branch the template on this. `lost` = the device is gone. `damaged` = it came back broken. |
| `outcomeLabel` | Pre-rendered English phrase, identical to the wording on the printed declaration. Use it verbatim so paper and email cannot disagree. |
| `conditionNote` | Staff's free text. `null` when empty — omit the section, don't print "null". |
| `feeAmount` | Dollars, or `null`. **`null` must produce an email that says nothing about money** — the school often hasn't decided the amount yet, and a "$0.00 due" line reads as "you owe nothing". |
| `devices` | Always exactly one element today (one lease row per declaration). Array-shaped to match the sibling return endpoint. |

The template must **never** say the device was returned. That is the whole point:
`/nodemailer/member-lease-return-device-notification` was being used for all three
outcomes, so the guardian of a lost laptop received written confirmation of a
return that never happened.

Suggested subject lines: `lost` → "Device reported lost — <student name>";
`damaged` → "Device returned damaged — <student name>".

**Until this exists:** the frontend catches the failure and warns the staff member
by name of the address that was NOT reached ("Device saved, but the loss notice
could not be sent to parent@home.com. Contact them directly."). Everything else
still completes: inventory write, lease close, printed declaration, fee
collection. So this is not blocking the flow — it is blocking the family being
told.

### B3.2 Fee-paid confirmation  ·  effort: S

The charge flow prints a receipt locally (works today, no server involved) but the
payer gets **no email**. The `consumers` track has
`/nodemailer/lost-device-fee-notification`, but its payload is event-shaped
(`event` name, `link` into the event auth route) and none of that exists for a
school member, so it can't be reused.

```jsonc
// POST /api/nodemailer/member-device-fee-receipt-notification   (NEW)
// Headers: x-token
{
  "member": {
    "firstName": "Blaise",
    "lastName": "Pascal",
    "email": "parent@home.com"      // the address that was actually charged
  },
  "billedGuardian": true,           // true = a guardian paid for a minor
  "lines": [
    { "serialNumber": "SN-1", "reason": "Lost — not recovered", "amount": 250.00 }
  ],
  "total": 250.00,                  // dollars; equals the sum of `lines`
  "paymentIntent": "pi_3AbCdEfGhIjKlMnO",
  "company": "Bridges Academy",
  "date": "2026-08-12T20:15:00Z"    // ISO, when the charge succeeded
}
// 200 { "ok": true }
```

- This is a **receipt**, not a request for payment — the money is already
  captured. Wording must not read like an invoice.
- `paymentIntent` should appear in the body as the reference the family quotes if
  they dispute it; it is the same id printed on the paper receipt.
- Amounts are dollars, matching the printed receipt (the Stripe API's cents never
  leave the charge component).
- When `billedGuardian` is true the recipient is not the person named in
  `member` — a line like "paid on behalf of <student>" is the useful phrasing.

**Frontend work once this lands:** one `devitrakApi.post` inside
`onChargeSucceeded` in `ChargeMemberDeviceFee.jsx`. Every field above is already
in scope there.

---

## B2 — Activity / audit log  ·  MOSTLY DONE, two narrow asks left

**This ask is largely obsolete — updated 2026-08-13.** The audit log shipped:
`POST /api/admin/activity-logs` (write) and `GET /api/admin/activity-logs`
(report, gated on `staff:read`) are live, and the frontend uses both
(`src/api/activityLog.js`, contract in `FRONTEND_staff_activity_log.md`). The
original request below — build an audit trail — is **satisfied**. What remains:

### B2.1 Auto-log the `/db_member/*` and `/school/*` routes  ·  effort: S

`admin.js` / `event.js` / `inventory.js` log their mutations server-side. The
student routes do **not**, so the frontend calls `registerStaffActivity` by hand
after each one — from `Return.jsx`, `AssignmentDevicesToMember.jsx`,
`ChargeMemberDeviceFee.jsx`, `StudentConsentPanel.jsx`, `StudentInfoSection.jsx`,
`GuardianInfoSection.jsx`, `DeleteMember.jsx`, `AdvanceGrades.jsx`,
`MultipleFromXLSX.jsx`, `OverdueDevicesTable.jsx`.

That works, but it is **bypassable and lossy**: the call is fire-and-forget by
design (an audit write must never fail a real action), it does not run at all if
the tab closes first, and anything hitting these routes outside our UI is
invisible. For a trail whose subjects are minors, "the client promised to tell us"
is the wrong architecture.

Ask: log server-side inside these routes and we delete the manual calls —
`new-member-assigned-device-lease`, `update-member-assigned-device-lease`,
`bulk-return`, member create/update/delete, guardian update, consent
record/revoke, grade advance, XLSX import.

If you do this, say so explicitly so we remove ours in the same release —
otherwise every action gets logged twice.

### B2.2 Fee verbs in the action vocabulary  ·  effort: XS

`action` and `target_model` are free text today, so the fee charge logs as
`{ action: "CREATE", target_model: "Fee" }` — chosen because there is no charge
verb and we did not want to invent one that the report UI's filter would not
recognise. If the server keeps a canonical list (or the report's filter dropdown
is built from one), add:

- actions: `CHARGE`, `REFUND`, `WAIVE`
- target models: `Fee`, `Lease`, `Member`, `Consent`

Purely cosmetic — nothing is dropped today — but "CREATE a Fee" reads wrong in an
audit export a school hands to a district.

### Still open from the original contract doc (not school-specific)
- `LOGOUT` is not logged (only `FORCE_LOGOUT`), so a session's end time cannot be
  read from the log.
- No server-side filter by the actor's **role**; the frontend filters client-side
  after fetching, which cannot page correctly.

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
- **B1.1:** zero frontend change — `Return.jsx` already sends
  `fee_amount`/`fee_reason`; they simply start persisting.
- **B1.3:** one `devitrakApi.post` after a successful charge in
  `ChargeMemberDeviceFee.jsx`. Everything it needs (member, device, amount,
  payment intent) is already in scope there.
- **B1.2:** the only piece needing real UI — an "Outstanding fees" section on the
  student profile plus a company-wide fees report.
- **B2.1:** we delete ~10 manual `registerStaffActivity` calls once the routes
  log themselves. Must be coordinated in one release or entries double up.
- **B3.1:** zero frontend change — the outcome-aware payload is already being sent
  to `member-device-incident-notification`; it starts arriving instead of warning.
- **B3.2:** one `devitrakApi.post` in `onChargeSucceeded`.

## Priority, if you only pick two
**B1.1 + B1.3.** They are field-and-route work on data the frontend already
sends, and together they close the hole where a family pays and the student's
record still shows the debt as outstanding. B3.1 is next — it is the only item
where the current behaviour is *silence toward a parent* rather than a missing
screen.
