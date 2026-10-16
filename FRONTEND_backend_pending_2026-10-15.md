# Backend: what the dashboard is still waiting on from the server

For the backend agent. First written 2026-10-15; **re-checked 2026-10-16
against the server code** on `release/observabilidad` (`3f5192e`), read-only.
Most of the October list is already written there. This document now lists
what is done (so nobody chases it again) and the few things still open.

**FedRAMP is on hold since 2026-10-16.** Items 3.2–3.4 below stay listed but are not being pursued until it resumes.

**How to reply.** Answer in a `BACKEND_*_REPLY` with the item number, the
commit and whether it is deployed: several client changes only switch on with
your deploy.

---

## 1. The one thing that blocks everything: deploy, and tell us the date

`release/observabilidad` is 88 commits ahead of `main`. The dashboard's `main`
already depends on it (signed staff invitations `8054a452`, signed password
reset `a9e3c00a`, `verify-password` `c1a4a454`, signed event invitations
`ddf206a5`). **We need to know what is in production today and the date of the
next deploy**, so the IIS release goes out the same day. MFA being enforced at
login suggests production already runs part of this branch; please confirm
which commit.

---

## 2. Done in `release/observabilidad` — verified in your code

| What we asked | Commit(s) | Client follow-up |
|---|---|---|
| MFA mandatory: no session token without MFA | `29691d7`, `b086e43` | None; the dashboard handles `mfaSetupRequired` since `85c55f61` |
| Force-logout from the login screen without a token | `961346e`, `a7aec1d` | None. You chose email-only instead of a single-use link token; the dashboard already sends a token if one ever arrives |
| Refunds: payload fix, and session + permission on refund/capture/release | `fab23ed`, `7518f98` | None; 403/404 messages are in (`bcd74b06`) |
| `verify-password` route, password hash out of every response | `5d87d1c` | Drop it from our contract-audit exceptions once the contract is regenerated |
| Signed password-reset link, MFA from the reset | `6b43863` | None |
| Signed staff invitation, `companiesAssigned` on the server, MFA header in CORS | `897438c` | None |
| Signed event invitations `/send`, `/confirm`, `/response`; gate on the 4 generic routes | `296638b` | Done (`ddf206a5`, `4c6202b4`); consent invitation and "Add directly" tested end to end on 2026-10-15 |
| Minor with no email of their own: `+m<member_id>` rule in `/send` and `/confirm` | `b34f3eb` | Done (`ad05c2a1`) |
| Link parameters from `/send` (all display values plus `token`) | `296638b`, `b34f3eb` | Done |
| Editing a document with `PUT /document/:id` | `88388f5` | Done |
| Deleting a Draft event reads `:id` from the URL, scoped to its company | `583dc01` | Done (`sqlDeleteOutcome`) |
| `event_staff`: no more fake 408s | `92eceb7` | **Ours:** drop the 408 tolerance after the deploy |
| Overdue reminders: spaced cadence, stop/resume per device | `9d61857` | Done; Stop switches on with the deploy |
| One reminder email per recipient per day with all their devices | `46f1998` | None |
| Audit: every write recorded with its author | `6cccc60`, `271fc70` | **Ours:** remove the client's 17 `registerStaffActivity` calls after the deploy |
| Audit: readable summary and who/what/how/where breakdown | `4c5c4aa`, `4e89c28` | **Ours:** render the server's `summary`, keeping ours as fallback |
| Audit: cache clears left out of the report | `dbcd4f5` | **Ours:** drop our client-side cache filter after the deploy |
| Audit: `event_id` and `serial_number` filters on the activity log | `controller/staffActivityLog.js:195-196` | Event filter available to use |
| Devitrak logo and wordmark in emails (broken images), branded wrapper | `550905c`, `90bf3c3`, `56a3079`, `d4d1648` | None |
| Member import: email optional for minors; 202 carries skipped rows | `c36430f`, `6a6e996` | Done |
| Public document routes through `optionalJWT`; folders with authz | `26c8493`, `296638b` | None |
| Session required on transaction routes the consumer app does not use | `d4fbe2d`, `5a0c25c` | None |

---

## 3. Still open

### 3.1 Signed event invitations — two follow-ups
- **The four generic routes are told apart by origin** (`STAFF_ORIGINS` in
  `helpers/consumerUserFilter.js`). Our review (§1 of
  `FRONTEND_attendance_invitation_link_review_2026-10-14.md`) flagged that an
  `Origin` header is set by the caller, so it is not a control against a
  scripted request. Please confirm this is accepted as a known limit, or what
  else backs it.
- **Is `/send` idempotent** for the same member and event? A 500-member batch
  that times out after sending part is marked failed on the client, and a
  retry emails some people twice. No commit addresses it.
- Not seen in the code: expiry tied to the event instead of 5 days, a
  `/preview` endpoint, and `member:notify` instead of `member:create` on
  `/send` (§2–§6 of our review). Fine to decline; tell us which.

### 3.2 Routes without `validateJWT` (FedRAMP AC-3, IA-2) — on hold
`FRONTEND_unauthenticated_routes_2026-10-14.md`. Phases 1, 4.1 and 4.3,
transactions, locations and documents are done. Still to do: group B (154
routes the dashboard only calls with a session; no risk to us), the 29 school
routes in group C (minors' data), group D (`optionalJWT` Stripe routes) and
group F (routes the dashboard does not call). **Done when:** a regenerated
contract and the list of routes that now require a session.

### 3.3 Retire the numeric role (F1.1, phase 2) — on hold
`FRONTEND_numeric_role_backend_ask_2026-10-14.md` — five questions, no answer
or commit yet.

### 3.4 Which tenant header the server reads (F1.2) — on hold
We send `x-company-id` (Mongo routes) and `s-company-lq` (SQL routes). Which
does each route read, and is it checked against the JWT? No answer yet.

### 3.5 Location-scope backfill, Mongo to SQL (R3)
Someone whose scope was assigned only in Mongo has no SQL rows, so the server
cannot apply it. No commit found.

### 3.6 Refusing to assign an expired document (low priority)
The dashboard already blocks it on every screen; this only covers callers that
bypass the dashboard.

### 3.7 Notification preferences (waiting on a product decision)
None of the six preferences controls a real email. Whether they belong to the
staff member or the company is Fredrik's call; after that, a contract for
where they live and every `nodemailer/*` checking them.
