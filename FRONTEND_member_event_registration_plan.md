# Execution Plan — Register members to events with email attendance confirmation

> **Audience:** autonomous coding agent executing in this repo. Follow CLAUDE.md
> strictly: Graphify-first discovery, all npm/vitest/eslint/vite commands inside
> the Docker container (`docker compose exec devitrak-client ...`), internal UX
> components over raw antd/MUI, tests first (scope: `src/pages/**/utils/**`,
> `src/hooks/**`, `src/config/**`, `src/store/**`), `graphify update .` after
> edits, commit locally with Conventional Commits — **never push**.
> All user-facing UI text and email copy in English.

---

## 1. Feature definition (user-confirmed scope)

From the Members page, an admin selects an event, selects existing members
from the database, and registers them. Each selected member receives an
**attendance-confirmation email**:

- If the member is a **minor** (`minor: true`), the email goes to their
  **representative** (`parent_guardian_email` — already mandatory for minors
  per `singleMemberUtils.js` validation).
- Otherwise it goes to the member's own `email`.

The email contains a **confirmation link**. Only when the recipient confirms
does the member get registered as an **event attendee** — via the consumers
collection (user's explicit persistence decision): check whether the member
already exists as a consumer; if not, create the consumer; either way, add
the event to their record (`eventSelected` / `provider` / `company_providers`
/ `event_providers`). After confirmation the member appears in the event's
attendee list like any consumer.

## 2. Verified codebase facts (do not rediscover — but DO read these files)

| Fact | Where verified |
|---|---|
| Member records carry `email`, `minor`, `parent_guardian_email` (+ guardian name/phone), guardian email REQUIRED for minors | `src/pages/conditionalPage/utils/singleMemberUtils.js` (initial form + `validateMemberForm`) |
| Members live SQL-side via `POST /db_member/consulting-member` (list), plus `new-member`, `update-member-info`, etc. | grep of `src/pages/conditionalPage/**` |
| Consumer create-or-update pattern (THE persistence mechanism to reuse) | `src/pages/consumers/utils/CreateNewUser.jsx` L~170-260: find consumer via `POST /auth/user-query`; if new → `POST /auth/new` + `POST /db_consumer/new_consumer` with `eventSelected: [event]`, `provider: [companyName]`, `company_providers: [companyId]`, `event_providers: [eventId]`; if existing → skip if `event_providers` already contains the event id, else `PATCH` merging all four arrays with `new Set` dedupe |
| Event picker precedent (active events of the company) | `src/pages/staff/detail/components/AssignStaffMemberToEvent.jsx` — `POST /event/event-list` with `{ company, type: "event", active: true }` |
| Generic email endpoint usable from the frontend | `POST /nodemailer/internal-single-email-notification` — read its payload shape in `src/pages/inventory/details/detailComponent/components/DeleteItemModal.jsx` |
| Public (unauthenticated) landing-page precedent: email link → landing → API actions | `/invitation` → `src/pages/authentication/InvitationLanding.jsx`, registered in `src/routes/no-authorized/NoAuthRoutes.jsx` |
| Multi-select table component | `SelectableTable` in `src/components/UX/` (re-exported from `src/components/UX/index.js`) |
| Members page (where the action starts) | `src/pages/conditionalPage/MainPage.jsx`; industry vocabulary via `getIndustryProfile` (`src/config/industryProfiles.js`) — e.g. "Students" for Education |

## 3. Architecture

```text
[Members page] --"Register to event" action-->
  [Modal step 1: pick active event]
  [Modal step 2: SelectableTable of members]
  [Send] --per member--> POST /nodemailer/internal-single-email-notification
                          to: minor ? parent_guardian_email : email
                          body: event details + confirmation link

confirmation link = {origin}/attendance-confirmation?<query params>

[Public landing /attendance-confirmation] --Confirm button-->
   consumer create-or-update (CreateNewUser.jsx pattern)
   → member now appears as attendee of the event
```

**Confirmation link params** (URL-encoded query string; there is no signed
token infrastructure — same trust model as the existing `/invitation` flow):
`memberEmail`, `memberFirstName`, `memberLastName`, `eventId`, `eventName`,
`company` (name), `companyId`, `minor` ("true"/"false"), `guardianEmail`
(empty when not minor). The landing must treat ALL params as untrusted
display data (no HTML injection; render as text).

## 4. Tasks

### Task 0 — Runtime validation spike (DO THIS FIRST, it gates the design)

The landing page runs **unauthenticated**. Verify (by reading
`src/api/devitrakApi.jsx` interceptors and `InvitationLanding.jsx`) that
`POST /auth/user-query`, `POST /auth/new`, `POST /db_consumer/new_consumer`,
and the consumer `PATCH` used in `CreateNewUser.jsx` are callable without an
`x-token` (InvitationLanding proves at least some endpoints are public —
confirm these specific ones follow the same pattern; the axios instances
attach `x-token` from localStorage only when present, so absence should be
tolerated by public endpoints). If any of these endpoints rejects
unauthenticated calls, STOP after implementing the registration/email half,
leave the landing behind a clearly named TODO, and report the exact endpoint
+ error so backend can whitelist it — do not fake or bypass auth.

### Task 1 — Pure utils (tests FIRST) in `src/pages/conditionalPage/utils/eventRegistrationUtils.js`

- `getConfirmationRecipient(member)` → `{ email, isGuardian }`:
  guardian email when `minor` is truthy, else member email; throws/returns
  null when the required email is missing (minors without guardian email
  must be reported, not silently skipped).
- `buildConfirmationLink(origin, member, event, company)` → the
  `/attendance-confirmation?…` URL with all params encoded
  (`encodeURIComponent`).
- `parseConfirmationParams(searchParams)` → validated object or
  `{ error }` when mandatory params are missing (used by the landing).
- `buildConsumerEventPayloads(member, event, company)` → the two payload
  shapes (new-consumer and merge-existing) mirroring `CreateNewUser.jsx`
  exactly (four arrays, `new Set` dedupe on merge).
- `buildAttendanceEmail({ member, event, recipient })` → `{ to, subject,
  message }` for the generic nodemailer endpoint; the guardian variant
  addresses the guardian and names the member ("Your student/child …" — use
  the neutral wording "on behalf of <member name>"); include event name,
  date range and the confirmation link. English copy.
- Tests (`eventRegistrationUtils.test.js`, same folder): minor→guardian,
  adult→self, missing guardian email → error, link building/encoding,
  param parsing round-trip, payload shapes (new + merge with dedupe).

### Task 2 — "Register to event" flow on the Members page

1. Entry point: a `BlueButtonComponent` action "Register to event" on
   `src/pages/conditionalPage/MainPage.jsx`, visible alongside the existing
   page actions (follow that page's action-button conventions; label can use
   the industry audience: e.g. "Register students to event" via
   `getIndustryProfile(...).audience` when available, else "Register members
   to event").
2. Modal (`ModalUX`) with two steps in one dialog:
   - **Event select**: antd/MUI select fed by `POST /event/event-list`
     `{ company: user.company, type: "event", active: true }` (react-query;
     copy `AssignStaffMemberToEvent.jsx`'s query + rendering of event names).
   - **Member selection**: `SelectableTable` listing members from the same
     source the page's main table uses (`POST /db_member/consulting-member` —
     reuse the page's existing query/cache key rather than refetching).
     Columns: name, email, minor badge ("Minor — guardian will be emailed",
     use `BadgeWithDot` or `PillUIComponent`), guardian email when minor.
     Rows for minors WITHOUT guardian email are disabled with a tooltip
     ("Missing guardian email — update the member first").
3. Send: for each selected member call the nodemailer endpoint with
   `buildAttendanceEmail(...)`. Batch sequentially with per-member
   success/failure collection; report via one antd `notification`
   ("X invitations sent" + list of failures if any). Disable the send button
   while in flight (`loadingState` on `BlueButtonComponent`).
4. No optimistic attendee writes here — persistence happens only at
   confirmation (user's decision).

### Task 3 — Public confirmation landing

1. `src/pages/authentication/AttendanceConfirmationLanding.jsx`, route
   `<Route path="/attendance-confirmation" element={<AttendanceConfirmationLanding />} />`
   added in **both** `src/routes/no-authorized/NoAuthRoutes.jsx` and
   `src/routes/authorized/AuthRoutes.jsx` (public pages reachable while a
   session exists follow this dual registration — verify how `/my-devices`
   handles it and copy that).
2. On load: `parseConfirmationParams`; invalid/missing params → friendly
   error state ("This confirmation link is invalid or incomplete."), no API
   calls.
3. Valid params → show event name, member name, and a Confirm button
   (`BlueButtonComponent`). On click, execute the consumer create-or-update
   sequence from `CreateNewUser.jsx` using `buildConsumerEventPayloads`:
   - `POST /auth/user-query { email: memberEmail }`
   - absent → `POST /auth/new` + `POST /db_consumer/new_consumer`
   - present → skip if `event_providers` already has `eventId` (show
     "already confirmed" state), else `PATCH` the merge payload.
4. Success state: "Attendance confirmed — see you at <event name>!".
   Failure: error state with a retry button. Idempotent: clicking twice or
   revisiting the link lands on "already confirmed".
5. This page is public: no Redux user access, no session headers assumptions,
   render all param-derived strings as plain text.

### Task 4 — Verification & closeout

1. New utils tests green; FULL `npm run test:unit` green (baseline 663 —
   do not regress).
2. `npx vite build` succeeds in-container (case-sensitive imports!). Run the
   build ALONE, not chained after the full test suite in the same exec —
   the container has been OOM-killed (exit 137) doing both back-to-back.
3. Targeted eslint on touched files: zero NEW problems.
4. `graphify update .`
5. Manual smoke notes for the user (you cannot browser-test): exact URLs and
   steps to verify, including a sample `/attendance-confirmation?...` URL
   built from a real member+event.
6. Single commit `feat(members): register members to events with email
   attendance confirmation`, trailer
   `Co-Authored-By: Claude <noreply@anthropic.com>`. **No push.**

## 5. Out of scope

- No "pending/declined" invitation tracking in the dashboard (nothing is
  persisted until confirmation — explicit user decision; a future phase can
  add an invitations array to the event document if requested).
- No new backend endpoints; if Task 0 finds one is needed, stop and report.
- No changes to the member data model, permission matrix, or consumers UI.
- No push to remote.
