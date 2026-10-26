# Backend Report — Company-Scoping Authorization Gap

> **For:** backend team.
> **From:** frontend, found while preparing the Education-vertical pilot test
> plan (`SCHOOL_pilot_365_test_scenarios.md`, §S-01.3/L8).
> **Date:** 2026-08-04
> **Severity:** 🔴 **Critical, pending your confirmation** — potential
> cross-tenant data disclosure (broken object-level authorization / IDOR by
> tenant).
> **Environment tested:** `https://db.devitrak.net/api`. Please confirm
> whether this environment is shared staging or reachable production, and
> whether the same backend code path serves both.
> **Status:** two rounds of read-only + fully-reverted testing, done with an
> account and companies the tester (frontend engineer) already owned and
> administers. **No third-party data was read or touched at any point.**

---

## 1. What we found

`POST /api/db_member/consulting-member` (and, we suspect, other
`/api/db_member/*` and possibly other `/api/db_*` routes sharing the same
authorization pattern) determines **which company's data to return using
only the `company_id` field in the request body** — it does not appear to
cross-check that value against the requesting staff's actual company
memberships, using any of the identity/session headers the frontend sends on
every request (`x-token`, `sqlStaffId`, `s-token-lq`, `s-company-lq`,
`x-company-id`).

If this is accurate, **any authenticated staff member, at any company, could
read another company's full student/member roster** by sending that
company's `company_id` in the request body — no membership in that company
required beyond having *some* valid session token.

Given the data model here is student records (names, emails, phone numbers,
addresses, guardian info, dates of birth for minors), this is a FERPA/COPPA
exposure risk on top of being a straightforward tenant-isolation bug.

---

## 2. How we found it (reproducible)

We used an internal test account (frontend engineer's own login) that
legitimately administers 7 companies, including two disposable
test/dev companies with no real student data: company SQL id `133`
(`industry: "Education"`) and `129`. **We never queried, read, or targeted
any company outside this account's own 7 memberships.**

### Round 1 — baseline headers

1. Created one obviously-labeled, disposable test record in company `133`
   via `POST /api/db_member/new-member` (`first_name:
   "ISOLATION-TEST-DO-NOT-USE"`, resulting `member_id: 637`).
2. Confirmed it's visible via `POST /api/db_member/consulting-member` with
   body `{"company_id": 133}` and header `s-company-lq: 133` (matched) —
   returned the test record, as expected.
3. Repeated the same call with body `{"company_id": 133}` unchanged, but
   header `s-company-lq: 129` (a **different** company this account also
   administers) — **still returned the company-133 test record.**
4. Deleted the test record immediately via `POST
   /api/db_member/delete-member-info`, confirmed `affectedRows: 1`, and
   re-confirmed company 133 was back to `members: []`.

### Round 2 — ruling out "an auth header was simply missing"

To rule out the possibility that some validation exists but only triggers
when a specific header is present (and that our round-1 request happened to
omit it), we repeated the exact same experiment with a **new** disposable
record (`member_id: 638`) and this time sent the **full header set** the
frontend ever sends across any request type: `x-token`, `admin-token`
(same JWT, sent under both header names), `sqlStaffId`, `s-token-lq`,
`s-company-lq`, and `x-company-id` (the Mongo company id) — all consistently
set to represent "company 129", while the body still asked for
`company_id: 133`.

**Result: identical.** The company-133 record was returned again, with every
identity header present and internally consistent for "company 129".
Deleted immediately after (`affectedRows: 1`, re-verified empty).

### Request/response shape (tokens redacted — describe, don't paste, if you file this as a ticket)

```
POST /api/db_member/consulting-member
Headers:
  x-token: <valid JWT for staff sqlStaffId=144>
  sqlStaffId: 144
  s-token-lq: 144
  s-company-lq: 129        <-- claims company 129
  x-company-id: <company 133's Mongo ObjectId>   (round 2 only)
Body:
  { "company_id": 133 }    <-- asks for company 133's members

Response: 200 { "ok": true, "members": [ <company 133's record> ] }
```

Expected (if scoping is enforced): either a 403/empty result, or the
response should reflect whichever company is actually authorized for this
combination of headers/token — not silently honor an arbitrary
client-supplied `company_id`.

---

## 3. What this does **not** prove — please read before dismissing or confirming

The test account has a **legitimate** role in both company 133 and company
129. So this experiment cannot, by itself, distinguish between:

- **(a)** "the endpoint correctly checked that `sqlStaffId=144` has a role in
  company 133, and answered because that check passed" — in which case the
  bug is *only* that the `s-company-lq`/`x-company-id` headers are ignored
  in favor of a body-driven per-company lookup, which is a smaller,
  data-integrity-flavored issue (session-vs-request desync) rather than a
  cross-tenant leak; or
- **(b)** "the endpoint performs no company-membership check at all for this
  route, and simply queries whatever `company_id` is in the body" — the
  critical, cross-tenant version.

Distinguishing (a) from (b) with certainty from the outside would require
sending a `company_id` this test account is **not** authorized for, which
would mean reading a real third party's data without their consent. We
deliberately did not do that. **This is the one thing we need you to check
from your side** — you can do it safely by reading your own authorization
code/middleware for this route, or by running the equivalent query against
two accounts you control internally.

---

## 4. What we're asking

1. **Confirm or refute (a) vs (b) above** for `POST
   /api/db_member/consulting-member` specifically — does this handler (or
   shared middleware in front of it) look up `sqlStaffId`'s actual companies
   and compare against the `company_id` in the request, before running the
   query?
2. **Audit the same question across the rest of `/api/db_member/*`** (create,
   update, delete, lease/assignment, return, guardian, consent endpoints —
   anywhere a `company_id` is accepted from the client) and, time permitting,
   the broader `/api/db_*` surface, since they appear to share the same
   session-header convention (`s-company-lq` scoping, per the frontend's own
   `sessionHeaders.js`).
3. If the answer is (b) for any of these: please treat as P0. The fix
   pattern we'd expect is a shared middleware/guard that resolves the
   caller's authorized `company_id`(s) from `sqlStaffId`/the token server-side
   (never trusting the client-supplied value as the *source* of authorization)
   and either overrides the body value or 403s on mismatch.
4. Let us know which environments this affects (this staging/shared server,
   and whether production runs the same code path) so we can assess blast
   radius and whether any customer notification is warranted.
5. A rough timeline, given severity — we're holding the Education-vertical
   365-student pilot (`SCHOOL_pilot_365_test_scenarios.md`) pending your
   answer; it's listed there as a precondition above every other pilot
   exit criterion.

---

## 5. Secondary, lower-priority item found in the same session

Unrelated severity tier, flagging here since backend coordination is also
needed: the frontend's `PERMISSIONS` matrix (`src/config/roles.js`) grants
the entire `member:*` domain (create/read/update/delete/assign_devices
/notify) and `nav:members` **only** to legacy `roleType` strings
(`root_admin`, `admin`, `event_manager`, `assistant`) — none of the 6
canonical F-01 strings (`root_administrator`, `sales_associate`,
`manager_event`, `manager_inventory`, `associate_inventory`,
`event_assistant`) or the 4 scoped roles currently have access to the
Students module at all. Confirmed via a parameterized test
(`src/config/roles.test.js`, 70 new assertions, all passing — i.e. all 10
of those role strings are confirmed to have zero access today).

We checked this against 7 real companies this account administers (one
`industry: "Education"` with 4 active staff) — **every real roleType we
could observe is still legacy**, so this is not active today. It becomes a
blocker the moment your F-06 roleType migration (mentioned in
`FRONTEND_school_vertical_plan.md`) starts assigning canonical strings to
staff who need Students access. **Ask:** let us know when F-06 is planned so
we can update `roles.js`'s `PERMISSIONS` matrix (add the canonical +
relevant scoped roles to the member-domain arrays) ahead of it, not after.

---

## 6. Safety notes on how this was tested

- All test data was created in and deleted from companies the tester already
  legitimately owns/administers; nothing outside those was queried.
- Both test records were named unambiguously
  (`ISOLATION-TEST-DO-NOT-USE`/`ISOLATION-TEST-ROUND2`) and removed
  immediately after each round via the same `delete-member-info` endpoint,
  with deletion confirmed by a follow-up read returning an empty list.
- No write/mutating call was made against any endpoint other than the
  member create/delete pair used to set up and tear down the test fixture.
- The JWT used for testing is a real, time-limited session token; it is not
  included in this document. If you need to correlate these requests in
  your logs, the `sqlStaffId` is `144` and the timestamps are 2026-08-04
  (see your access logs for `db_member/consulting-member`,
  `db_member/new-member`, and `db_member/delete-member-info` around that
  date for the exact request times).

---

## 7. Finding #3 (new, same shape as #1) — `/document/*` also has no
    apparent authorization check

Found later the same day (2026-08-04), against `http://localhost:34001/api`
— your local dev backend, **not** the environment in §1–6 (flag if these are
different codebases/branches; if they share code, treat this as the same
root cause as Finding #1).

**What we found:** `GET /document/:id` and `GET /document/download/:id/:userId`
both responded successfully with:
- **no `x-token` or any auth header at all**, and
- an **arbitrary/dummy `:userId`** (`000000000000000000000000` — not a real
  user id) — full document metadata and a valid, signed S3 download URL
  came back regardless.

```
GET /api/document/6a721382fc36a5e066a42000                          → 200, full metadata
GET /api/document/download/6a721382fc36a5e066a42000/000000000000000000000000 → 200, valid signed S3 URL
```

Both calls made with zero headers of any kind.

**Why this matters:** we were told to treat these endpoints as
company-authenticated (that assumption is baked into
`FRONTEND_school_consent_document_assignment_plan.md`'s original security
section, written before this was tested). It's wrong. In practice today,
**any document uploaded by any company — staff onboarding contracts,
consumer waivers, school consent PDFs, anything in the Documents module —
is fetchable by anyone who has or can guess a document's 24-hex-char Mongo
id.** No session, no company membership, no `userId` validation.

We ended up *relying on* this gap to ship a real feature the same day
(showing the assigned consent PDF to an unauthenticated guardian —
`GuardianConsentResponsePage.jsx`, see
`FRONTEND_school_consent_document_assignment_plan.md` §"Step E") — it works
today only because the endpoint doesn't check anything. That's an
acceptable stopgap for a low-sensitivity, deliberately-public document (the
guardian consent PDF), but it means the *same* unguarded endpoint currently
exposes every other company's private documents too.

**Ask:** same as Finding #1 — confirm whether any authorization check exists
for this route (server-side, not inferable from our testing) and treat as
P0 if not. If/when you add real scoping, please keep a **separate,
explicitly-public** path (or an otc-scoped variant) for the guardian consent
document specifically, since that one path needs to stay reachable without
a session by design — don't lock down `/document/*` in a way that breaks
`GuardianConsentResponsePage.jsx`'s legitimate unauthenticated use case.
