# Backend: everything the dashboard is waiting on from the server (2026-10-15)

For the backend agent. **One document with everything pending**, in priority
order. Each item points to the document that holds the detail, which remains
the source; this one only carries what you need to start and to know when an
item is done.

**Overall priority (Fredrik, 2026-09-25):** FedRAMP comes first.

**How to read it.** "Raised" is the date it was asked for. "Done when" is the
condition the dashboard checks to close it on our side. When you finish an
item, reply in a `BACKEND_*_REPLY` with the item number, the branch and
whether it is deployed: several client changes only switch on once it is.

*Updated 2026-10-16. Translated to English; items 4, 12 and 13 brought up to
date with what changed on 2026-10-15.*

---

## P0 — Broken in production, or about to break

### 1. Deploy `release/observabilidad` — and tell us the exact day
**Raised:** 2026-10-13 · `FRONTEND_invitation_signed_link_2026-10-13.md`,
`FRONTEND_password_reset_mfa_2026-10-13.md`

The dashboard is **already on `main`** with the new contract:
- accepting an invitation with a signed `invitationToken` (`8054a452`);
- password reset with a signed link and MFA (`a9e3c00a`);
- password change through `POST /api/admin/verify-password`, with no hash in
  the client (`c1a4a454`);
- `companiesAssigned` written by the server (`1a86f327`);
- `x-mfa-setup-token` allowed by CORS;
- signed event invitations through `/school/event-invitations/send`
  (`ddf206a5`, item 4).

**They have to go out together.** We are holding the IIS release until you
deploy. We need **the date** so we can publish the dashboard the same day, and
pending invitations must be re-sent (the old ones carry no token).

**Done when:** the branch is in production and you give us the deploy time.
Also send the regenerated contract (`src/docs/api-payloads.json`) with
`verify-password`, so we can drop it from our audit exceptions.

### 2. Refunds: none has worked since 2026-03-18
**Raised:** 2026-10-02 · confirmed in `BACKEND_answers_to_dashboard_2026-10-06.md`

The validator accepts `payment_intent` and the controllers read
`paymentIntent`. The fix is written (it accepts all three names); **it still
has to be deployed**. Affects `POST /stripe/refund` and
`POST /stripe/partial-refund`.

**Done when:** deployed. Please also confirm the codes these routes will
return once they require a session and `transaction:update`: **403** without
permission and **404** when the payment belongs to another company, with a
readable `message`. The dashboard already shows a specific message for both
(`bcd74b06`).

### 3. Login still issues a token to accounts with MFA off
**Raised:** 2026-09-21 · `FRONTEND_force_logout_token_2026-09-21.md`

The client forces enrolment, but a direct `POST /api/admin/login` skips the
gate. For FedRAMP (IA-2) the rule has to live on the server.

**Done when:** logging in to an account without MFA returns only the
enrolment token, not a full session token. Tell us the shape of that response.

The same document also asks for a **single-use token in the force-logout
link** (§"What we are asking for", points 1 and 2). Point 3 was done on
2026-09-23; please confirm whether 1 and 2 are done.

### 4. Signed event invitations — open questions
**Raised:** 2026-10-14 · `FRONTEND_attendance_invitation_link_2026-10-14.md`
(your design), `FRONTEND_attendance_invitation_link_review_2026-10-14.md`
(our review), `FRONTEND_event_invitation_send_2026-10-15.md` (your send
contract)

**Client side is finished and on `main`:** the landing page uses
`x-link-token` (`a5959069`); `handleSend` calls
`POST /school/event-invitations/send` following your option A (`ddf206a5`);
and the landing page accepts a signed link even when a display value is
missing from the URL (`4c6202b4`). It ships with the release in item 1.

**Blocking (§1 of our review):** under `enforce`, how do you tell the
session-less dashboard apart from the consumer app on `POST /auth/user-query`,
`POST /auth/new`, `PATCH /auth/:id` and `POST /db_consumer/new_consumer`? If it
is by `Origin` or any other header the client sends, it is not a control.

**Before `enforce`** (§2–§6 of our review):
- expiry tied to the event instead of a fixed 5 days;
- `opened` must not spend the token;
- `GET /school/event-invitations/preview`, so the page stops reading data from
  the URL;
- `/confirm` and `/response` decide from `x-link-token` alone, even when an
  `x-token` arrives too;
- `member:notify` instead of `member:create` on `/send`;
- a used token with the person still on the event → `200 { outcome: "already" }`.

**Is `/send` idempotent** for the same member and event? If a 500-member batch
times out after sending part of it, the client marks the whole batch as
failed and a retry emails some people twice. We need to know whether a repeat
is safe, or get an idempotency id.

**Minors without an email of their own.** Consumers are looked up and created
by email, so a minor registered with only a guardian email could not join an
event. The dashboard solved it on its side (`ad05c2a1`, `consumerEmailFor`):
the member's own email if there is one; otherwise, for a minor, **the
guardian's address tagged with `+m<member_id>`** (`maria+m1234@gmail.com`). It
is unique per child (two siblings do not merge into one consumer) and reaches
the guardian's inbox. **With the signed link the server decides**, reading the
member from `members_info`: `/confirm` must use the same rule to look up and
create the consumer, or the same child ends up with two consumers depending on
the way in. The invitation itself still goes to the guardian's plain address.

**First end-to-end test, 2026-10-15:** the link built by `/send` reached the
page without one of `memberEmail`, `eventId`, `eventName`, `company` or
`companyId`, and the page rejected it ("invalid or incomplete"). Fixed on the
dashboard (`4c6202b4`): with a `token` those values are no longer required.
But your note says the link carries "the same parameters as before, plus
`token`", so **please confirm which parameters `/send` puts in the link**. If
`memberEmail` is empty for a minor without an email, send it following the
`consumerEmailFor` rule; with `eventName`, `company` and the member's name the
page reads in full.

**Done when:** `/send`, `/confirm` and `/response` are deployed, the blocking
question is answered, and the minor-email rule and the link parameters are
confirmed.

---

## P1 — FedRAMP

### 5. The 384 routes without `validateJWT`
**Raised:** 2026-10-14 · `FRONTEND_unauthenticated_routes_2026-10-14.md`

Of 484 routes, 384 have no `validateJWT` at route level (contract of 08-24).
**First rule out** any router mounting it with `router.use`, which the
extractor would not see. Then, by group:

| Group | Routes | Action |
|---|---|---|
| **B** | 154 | The dashboard only calls them with a session. `validateJWT` + `checkTokenVersion`: **breaks nothing on our side**. The biggest gain for the least risk |
| **C** | 36 | They have `canRead`/`canManage`… but no `validateJWT`. Confirm those require a token. **29 are school routes with minors' data: priority** |
| **E** | 4 | Refund, partial refund, capture and cancel. Already announced; confirm the deploy (item 2) |
| **A** | 44 | Called by a public page. Review one by one (§3 of the document) |
| **D** | 35 | `optionalJWT`, 33 of them Stripe. Decide which are really public |
| **F** | 111 | The dashboard does not call them. Close or retire them after checking other clients |

The worst, by domain, is in §2: `nodemailer/*` lets anyone send email under
our brand to any address, and `receiver/*`, `db_item`, `db_event` and
`transaction/*` write without a session.

**Done when:** you send the regenerated contract and the list of routes that
now require a session.

### 6. Retire the numeric role (F1.1, phase 2)
**Raised:** 2026-10-14 · `FRONTEND_numeric_role_backend_ask_2026-10-14.md`

The dashboard no longer decides anything from the number (phase 1,
`4c8ffa5c`). Before we stop writing and sending it, five questions:
1. Does the server decide scope from the `role` in the body?
2. What does `authorizeMongoPermission` read?
3. Are there records without `roleType`? (A `role: ""` with no `roleType` was
   read as root admin on the client: does the same happen on the server?)
4. R1: the level clash between the scoped roles and `event_assistant`.
5. What the server writes today into `role` and `role_level`.

**Done when:** all five are answered.

### 7. Which tenant header the server reads (F1.2)
**Raised:** 2026-09-28 · `fedRAMP/FRONTEND_action_plan_2026-09-28.md`

We send `x-company-id` (Mongo routes) and `s-company-lq` (SQL routes) from
`buildRouteScopedHeaders`. The readiness report says the server does not use
them to isolate companies. Which one does each route read, and is it checked
against the JWT?

**Done when:** answered. It may need no code.

---

## P2 — Contracts already agreed, waiting for a deploy or an answer

### 8. Editing documents, and refusing expired ones (2b.8)
**Raised:** 2026-10-01 · `FRONTEND_documents_backend_ask.md`

`PUT /api/document/:id` matches what `EditDocument.jsx` sends
(`BACKEND_answers_to_dashboard_2026-10-06.md`).
- ~~**Deploy it**~~ — **done**, confirmed 2026-10-15.
- The server **refusing to assign an expired document** (§2). **No longer
  blocking:** the dashboard checks the date and disables assignment on every
  screen. It remains as a defence against callers that bypass the dashboard;
  low priority.

### 9. Deleting a Draft event deletes nothing in SQL
**Raised:** 2026-10-02

`DELETE /db_event/:id` read the id from `body.email`. The client no longer
sends the body and treats **404** as "there was no row" and **409** as "it
still has inventory or staff". **Done when:** deployed, reading `:id` from the
URL.

### 10. `event_staff`: a duplicate as 409
**Raised:** 2026-10-01

With the new server a duplicate is 409 and anything else is 500. While the old
one is still around, the client also treats 408 as "already linked". **Tell us
when you deploy:** we will drop the 408, or a real timeout would count as a
linked staff member.

### 11. Stopping and resuming overdue reminders
**Raised:** 2026-10-07 · `FRONTEND_overdue_reminders_2026-10-07.md`, backend
`9d61857`

Client done: the Stop button only switches on when the row carries
`reminders_stopped_at`. **Done when:** `9d61857` is deployed.

### 12. Recording guardian responses (2b.9, meeting request #17)
**Raised:** 2026-10-08 · `FRONTEND_event_invitation_responses_2026-10-08.md`

`POST /api/school/event-invitations/response` and `/confirm`: written in
`release/observabilidad` according to your 2026-10-15 note, not deployed.
Until then the client ignores the 404, so a guardian is never blocked, but
nothing is recorded. **Done when:** deployed together with item 4; the
end-to-end check is §6 of `FRONTEND_event_invitation_send_2026-10-15.md`.

### 13. Activity log: what the middleware still lacks
**Raised:** 2026-10-05 · `FRONTEND_activity_log_backend_ask_2026-10-05.md`

The middleware has been live since 10-05 (thank you). Still missing:
- **Q4:** an **event** filter on `GET /api/admin/activity-logs` (we already
  use the `serial_number` one for the device audit trail);
- **Q5:** leave cache clears out at the source. Today we drop them on the
  client, so pages arrive with fewer rows than their size;
- deploy `summary`/`display` (`feat/audit-readable-summary`, `dbcd4f5`);
- **Q6:** tell us which controllers the middleware covers. The client's **17
  calls** to `registerStaffActivity` (in 15 files) **duplicate** entries today,
  and we will remove them once coverage is confirmed. Our checklist of the 17,
  with the server route behind each, is
  `FRONTEND_staff_activity_dedupe_check_2026-10-15.md`.

### 14. Location-scope backfill, Mongo to SQL (R3)
**Raised:** 2026-07 (reviewed 2026-10-05)

The client already reads SQL first and falls back to Mongo. Someone whose
scope was assigned only in Mongo has no SQL rows, so the server cannot apply
it. **Done when:** the backfill has run.

### 15. Email: broken images and wrapper
**Raised:** 2026-10-01 and 2026-10-07 · `FRONTEND_email_wrapper_ask.md`,
`FRONTEND_email_branding_devitrak_assets_2026-10-07.md`

- **The Devitrak logo and wordmark show as broken images** in the branding
  preview, which uses the same templates as a real send. Probably in real
  emails too.
- ~~The wrapper (2b.4): company logo at the top, "Powered by Devitrak" footer
  and white logo on dark backgrounds.~~ **Done** (confirmed 2026-10-15). If the
  same change also fixed the broken images above, tell us and we will close
  it.

The dashboard has nothing to change for either.

---

## P3 — Waiting on a decision before it becomes work

Not to start yet, but the server will carry them out:

| # | Topic | Raised | What is left to decide |
|---|---|---|---|
| 16 | `GET /api/document/:id` is public for **any** document | 2026-10-06 | We owe you the answer. Our proposal: public only for documents marked School consent |
| 17 | Overdue reminder sent daily with no end | 2026-10-05 | Product (Fredrik): space it out (days 1, 3, 7, then weekly) or cap it |
| 18 | Notification preferences that control no email | 2026-10-05 | Product: whether they belong to the staff member or the company. Then a contract for where they are stored, and every `nodemailer/*` checking them |

---

## Where to start

1. **Today:** the deploy date for `release/observabilidad` (1) and the refund
   fix (2).
2. **FedRAMP with no risk to us:** `validateJWT` on the 154 group-B routes and
   checking the 29 school routes in group C (5).
3. **Answers that unblock client work:** the blocking question, `/send`
   idempotency, the minor-email rule and the link parameters (4); the five
   numeric-role questions (6); the tenant header (7).
4. **The rest:** deploy what is already written (8–13) and tell us each time,
   because several client changes switch on with your deploy.
