# Devitrak Admin Console: implementation plan, backend and frontend (2026-11-11)

> **To:** backend agent · **From:** dashboard agent
> **Status:** design approved for planning by Gustavo. Nothing built on either
> side. Route names and response shapes are proposals; change them and tell us.
> **Design:** canvas "Devitrak Admin Console" (claude.ai artifact
> `8Paz5chN17mkJAVXwokb1s`): Overview, Clients, Client profile, Inventory,
> Transactions, Events, Members & consumers, Audit log.

## 1. What we are building

A console where Devitrak's own people see **every client company** at once:
the clients, their activity, transactions, events, merchant account,
inventory, members, consumers, staff and subscription, plus an audit log of
what Devitrak people did in the console.

**v1 is read-only.** No edits on a client's behalf, no impersonation, no
refunds. The only write is "export", which runs as a background job and is
audited.

## 2. Decisions already made

| # | Decision | Source |
|---|---|---|
| D1 | **Who gets in:** a user who is `super_user` **in the Context Global company** and whose sign-in email is **@devitrak.com**. Both are required. A @devitrak.com account without super_user is denied; a super_user of any other company is denied. | Gustavo, 2026-11-11 |
| D2 | **Audit retention:** a client's audit entries are kept while the client is active and for **120 days after the account closes**. | Gustavo, 2026-11-11 |
| D3 | Audit entries are written **by the server**, are append-only and cannot be edited or deleted by anyone through the app. | design |
| D4 | v1 is read-only (§1). | design |

**Why D1 needs care:** `super_user: true` is also set on whoever creates any
company (`Registration.jsx:165`, `createCompany.jsx:45`), so every client owner
has it. The check must be "super_user **of Context Global**", never the flag on
its own, or every client owner would see every other client.

## 3. Open decisions (defaults proposed, change if wrong)

| # | Question | Proposed default |
|---|---|---|
| O1 | How is "the Context Global company" identified? | A server config value (`PLATFORM_COMPANY_ID`), not a name match. |
| O2 | Is two-step sign-in required for console users? | Yes, required. GovRAMP IA-2 already expects it for privileged users. |
| O3 | Retention for entries not tied to a client (sign-ins, access changes). | Needs a decision. Suggest at least as long as the longest client retention. |
| O4 | What makes a client "At risk" / "needs attention"? | Devices overdue > 7 days, failed payments in 7 days, no admin login in 21 days, trial ending in ≤ 7 days, available stock < 10% before an event. Thresholds in server config. |
| O5 | Do console users see consumers' personal data (name, email)? | Yes, with every view/search/export audited. Minors shown only as member ID + guardian email. |
| O6 | Subscription tab: plans. | Use the Free / Paid plans from `FRONTEND_subscription_plans_2026-10-27.md`. The design's `[Plan name]` / `[YOUR PRICE]` placeholders get replaced by that. |
| O7 | "Add client" button in the Clients design. | Out of v1 (read-only). Remove from the screen. |

## 4. Backend plan (owner: backend agent)

### B1. Access check

- Compute `platformAccess` on the server:
  `isSuperUserIn(PLATFORM_COMPANY_ID) && emailDomain(user.email) === "devitrak.com"`.
  - Domain = the part after the **last** `@`, lower-cased, exact match. No subdomains (`x.devitrak.com`), no lookalikes.
  - The email must be the verified sign-in email, not a free-text contact field.
- Return `platformAccess: true|false` in the login/session response and in `GET /api/platform/me`.
- Middleware `requirePlatformAccess` on **every** `/api/platform/*` route. Re-check on each request against the database (not only from the JWT), so removing super_user takes effect immediately.
- Must work with both the header session and the HttpOnly cookie session (`COOKIE_SESSION`, GovRAMP #12).
- **No new custom request headers.** Production's CORS allow-list rejects unknown headers as an empty `{}` error. The company is always in the path (`/companies/:id`), never in `x-company-id`.

### B2. Audit log

- New store `platform_audit_log` (append-only). One row per `/api/platform/*` request, **including denied ones**, and per console sign-in.
- Fields: `id, at (UTC), actorUserId, actorEmail, action (view|search|export|signin|access_change), companyId|null, resource (e.g. company.subscription), details (query/filters, row count for exports), ip, geo (city/country, best effort), userAgent, result (allowed|denied), reason`.
- **Fail closed:** if the audit write fails, the request fails.
- No update or delete route. The app's database user has insert/select only on this store, if the DB allows it.
- Retention job (D2): delete a client's rows 120 days after the client's account closes. Rows with `companyId = null` follow O3.
- Access changes: when someone becomes or stops being super_user in the Context Global company (existing staff routes), also write an `access_change` row here.

### B3. Endpoints (all `GET` unless noted, all paginated `?page&limit`, all read-only)

| Route | For screen | Notes |
|---|---|---|
| `/api/platform/me` | shell | `{ platformAccess, name, email }` |
| `/api/platform/summary?range=7d\|30d\|90d` | Overview | KPI tiles with previous-period deltas |
| `/api/platform/attention` | Overview | clients + reason + kind (O4) |
| `/api/platform/activity?limit` | Overview | latest staff activity across clients |
| `/api/platform/companies?search&status&plan&sort` | Clients | status computed server-side (O4); per row: staff, devices, out, overdue, revenue 30d, last activity |
| `/api/platform/companies/:id` | Profile header + Overview tab | owner, contact, created, Mongo id, SQL id, KPIs, alerts, glance |
| `/api/platform/companies/:id/activity?category` | Profile › Activity | categories: transaction, event, inventory, member, staff; plus `source` (dashboard, consumer app, automatic) |
| `/api/platform/companies/:id/transactions` | Profile › Transactions | totals + rows |
| `/api/platform/companies/:id/events` | Profile › Events | assigned, not returned, consumers, revenue, lead |
| `/api/platform/companies/:id/merchant` | Profile › Merchant | Stripe Connect account: charges/payouts enabled, schedule, bank last4, requirements, balance, disputes, fees 30d, last payouts. Cache a few minutes; Stripe rate limits. |
| `/api/platform/companies/:id/inventory` | Profile › Inventory | status counts + item groups (serial range as **text**) |
| `/api/platform/companies/:id/members` | Profile › Members | |
| `/api/platform/companies/:id/consumers` | Profile › Consumers | |
| `/api/platform/companies/:id/staff` | Profile › Staff | role, scope, two-step on/off, last login, actions 30d |
| `/api/platform/companies/:id/subscription` | Profile › Subscription | depends on the subscription-plans work (O6): plan, status, dates, payment method last4, usage vs limits, invoices |
| `/api/platform/inventory?search&status&company&category` | Inventory | serial search across all clients; status counts; devices by client |
| `/api/platform/transactions?type&company&search` | Transactions | totals + rows |
| `/api/platform/events?status&company&search` | Events | totals + rows |
| `/api/platform/people?kind=members\|consumers&company&status&search` | Members & consumers | totals + rows |
| `/api/platform/audit?action&actor&company&from&to` | Audit log | totals + rows; reading the audit log is itself audited |
| `POST /api/platform/exports` `{ resource, filters }` | every "Export" button | `202` + job id on the existing job queue; CSV when done; audited with row count |

Responses: `{ ok, data, page, limit, total }`. Money as integer cents plus currency. Dates as ISO UTC.

### B4. Performance

- Cross-client aggregates read Mongo and the SQL `db_*` side. Summary, attention and per-client KPIs: precompute (rolling snapshot every few minutes, or nightly for 90-day ranges) rather than computing per request.
- Indexes for serial search across companies and for `platform_audit_log (companyId, at)` and `(actorUserId, at)`.
- Rate-limit `/api/platform/*` per user.

### B5. Tests we ask the server to have

1. Client owner with `super_user: true` in their own company → `403` on every `/api/platform/*` route.
2. @devitrak.com user who is **not** super_user in Context Global → `403`.
3. Super_user in Context Global with a non-devitrak email → `403`.
4. Allowed and denied requests each write exactly one audit row; a failing audit write fails the request.
5. No route updates or deletes audit rows.
6. Retention job removes a closed client's rows only after 120 days.
7. Super_user removed → next request is `403` (no stale JWT access).

## 5. Frontend plan (owner: dashboard agent)

Every step is test-first (Vitest inside the container), within the usual
coverage scope (`src/config`, `src/hooks`, `src/store`, `src/pages/**/utils`).

| Step | Work | Files | Tests first |
|---|---|---|---|
| F0 | Flag `FEATURE_PLATFORM_CONSOLE` (`VITE_APP_FEATURE_PLATFORM_CONSOLE`), default OFF; add to `.env.dev.example` | `src/config/featureFlags.js` | `featureFlags.test.js` |
| F1 | `hasPlatformAccess(user)` in roles.js: true **only** when the server sent `platformAccess === true`. Never derived on the client from `super_user` or the email. Not a roleType, not in `ALL_ROLES`. | `src/config/roles.js` | `roles.test.js`: super_user + @devitrak.com but no `platformAccess` → false; `platformAccess: true` → true |
| F2 | Keep `platformAccess` from the login response in the admin slice (on login only; profile saves use `onUpdateProfile`) | `src/store/slices/admin*` | slice test |
| F3 | API client `devitrakApiPlatform = createDevitrakApiInstance("/platform")` (no ad hoc Axios) | `src/api/devitrakApi.jsx` | `sessionHeaders` test: `/api/platform/...` gets neither `x-company-id` nor `s-company-lq` (today's regexes already exclude it; the test locks it) |
| F4 | React Query hooks, one per endpoint; keys `["platform", resource, params]`; invalidate with one key per call, never a grouped array | `src/hooks/platform/` | hook tests with mocked client |
| F5 | Pure helpers: status → badge, attention reasons, cents → money, filters → query params, serials kept as text (never `Number()`) | `src/pages/platform/utils/` | utils tests |
| F6 | Routes `/platform/*` in `AuthRoutes.jsx` behind the flag **and** `hasPlatformAccess`; anyone else is redirected home. `PlatformLayout` with its own sidebar; entry link in the user menu only for platform users | `src/routes/authorized/AuthRoutes.jsx`, `src/pages/platform/` | guard test |
| F7 | Screens, in this order: Clients → Client profile (built on ProfileShell; each tab loads its own query when opened) → Overview → Inventory → Transactions → Events → Members & consumers → Audit log. Internal UX components only; loading and empty states on every table. | `src/pages/platform/**` | utils/hooks per screen |
| F8 | Exports through the existing 202 + polling flow (`BackgroundJobsTracker`) | | |
| F9 | Cypress (dev server on 5523): client admin opening `/platform` is redirected; platform user sees the client list; no company headers on `/api/platform` calls | `cypress/e2e/platform*.cy.js` | |
| F10 | Finish each milestone with lint, Vitest, `vite build` and `graphify update .` | | |

## 6. Order of work and dependencies

| Milestone | Backend | Frontend | Done when |
|---|---|---|---|
| M1 Access + audit | B1, B2, `/me` | F0–F3, F6 shell | a platform user sees an empty console; a client owner gets `403` and is redirected; both are in the audit log |
| M2 Clients | `/companies`, `/companies/:id` | F4–F5, Clients + profile header + Overview tab | list and profile header show real data |
| M3 Profile tabs | `/companies/:id/*` (subscription waits for O6) | remaining tabs | all nine tabs on real data |
| M4 Cross-client pages | summary, attention, activity, inventory, transactions, events, people | Overview, Inventory, Transactions, Events, People | |
| M5 Audit page + exports | `/audit`, `/exports`, retention job | Audit page, F8, F9 | E2E green |
| M6 Rollout | | flag ON for 2–3 super users first, review their audit trail, then all | |

The frontend can build F0–F5 and the screens against mocks while the backend
works on M1–M2. Nothing is switched on in production before B1 and B2 are
live.

## 7. Risks

- **Wrong access check (critical):** the super_user collision in §2. B5 tests 1–3 cover it.
- **Personal data exposure:** members/consumers pages. Mitigated by D1, O5 and auditing every read.
- **Load on production databases:** cross-client queries. Mitigated by B4 snapshots and pagination.
- **Stripe rate limits** on the Merchant tab. Mitigated by caching.
- **CORS:** a new header would break in production. None is needed.

## 8. What we need back from the backend

1. Agreement or changes on the route list (§4 B3) and response shape.
2. Answers to O1–O5.
3. Whether staff two-step status and last login are stored today (Staff tab).
4. Whether consumer activity in the consumer app is logged today, or only staff activity (`/api/admin/activity-logs`).
5. An ETA for M1.
