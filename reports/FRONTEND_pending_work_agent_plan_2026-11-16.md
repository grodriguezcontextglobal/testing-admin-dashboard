# Pending work: execution plan for the agents (2026-11-16)

**Based on:** the review "GovRAMP and Admin Console: Pending Work" (2026-11-16),
`fedRAMP/FRONTEND_govramp_status_2026-11-10.md`,
`fedRAMP/FRONTEND_govramp_pending_2026-11-10.md` and
`reports/FRONTEND_admin_console_plan_2026-11-11.md`.

**Who does what:**
- **Part 1** is for the **backend agent**, in `server-testing`.
- **Part 2** is for the **dashboard agent**, in this repository.
- Neither agent runs commands in the other's repository.
- Part 3 lists what needs a person. Neither agent does it.

**Production modes on 2026-11-11.**
- **enforce:** `SESSION_MODE`, `COMPANY_AUTH_MODE`, `COMPANY_CONTEXT_MODE`, `DB_COMPANY_PUBLIC_MODE`, `NOSQL_INPUT_MODE`, `NODEMAILER_AUTH_MODE`, `CONTRACT_LINK_MODE`, `ATTENDANCE_LINK_MODE`.
- **warn:** `CONSUMER_TOKEN_MODE`, `RECEIPT_PUBLIC_READ_MODE`, `STRIPE_OWNERSHIP_MODE`.

The server code was not read for this plan. If a task is already done, say so in the reply with the commit, and skip it.

---

## 0. The server has its own plan already

`server-testing/reports/PLAN_agente_govramp_2026-11-16.md` (2026-11-16, 08:38) is the backend agent's own plan, written from a different review. It is the authority on its own phases. This document does **not** replace it.

| Their phase | What it covers | What Part 1 adds |
|---|---|---|
| Phase 1 — modes to `enforce` | The three warn modes, with the evidence scripts and the one-at-a-time rollout on the VM | Only what the dashboard knows: the receipt QR has shipped, so nothing waits on us (DS3); the two questions we need answered before `CONSUMER_TOKEN_MODE` and `STRIPE_OWNERSHIP_MODE` (DS4) |
| Phase 7, F3 | `update-company` stops accepting `employees` | Our confirmation that `EndEventButton` already calls the new route (DS7) |
| Phase 7, F1 | The HttpOnly cookie, server side, waiting on Gustavo's date | The client contract we have already built: field name, header, CORS (DS2) |
| — | — | **Everything about the admin console (DC1–DC5) is absent from their plan.** So are the CSP summary (DS1), the Mongo–SQL company link (DS5), the numeric `role` migration (DS6) and `s-token-lq` in CORS (DS8) |

**Codes.** Their plan uses `S*`, `I*`, `F*`, `B*` and `D*` with its own meanings. To avoid a collision, every server-facing code here is `DS*` (dashboard asks the server) or `DC*` (console). The `D1`–`D8` in Part 2 are dashboard work, owned by the dashboard agent.

---

## Rules for both agents

1. **Test first.** Write the failing test, then the code, then refactor. Every task below lists its acceptance tests.
2. **One branch and one PR per task**, unless a task says otherwise. Never push to `main`. Never use destructive git.
3. **No new custom request headers** without adding them to production's CORS allow-list in the same release. A header missing from the list fails in the browser as an empty `{}` error.
4. **Do not change a response shape the dashboard reads** without a note in `server-testing/reports/`. Adding fields is fine. Renaming or removing fields is not.
5. **Switch modes in this order:**
   - The code ships with the mode in `warn`.
   - Wait a week with no warnings in the logs, or explain each warning.
   - Then switch the `.env` to `enforce`, staging first.
   - Rollback is the same variable set back to `warn`.
6. **Reply in writing.** When a task is done, add a line to `BACKEND_pending_work_REPLY_2026-11-xx.md` in `server-testing/reports/` with:
   - the task id;
   - the commit or PR;
   - what was deployed, and where;
   - the answers asked for.

---

## Part 1: backend agent

### Priority order

| Order | Task | Unblocks |
|---|---|---|
| 1 | DS1 CSP summary | CSP to enforce (dashboard D3) |
| 2 | DS2 Cookie session, phase 1 | The session token leaves `localStorage` (dashboard D4) |
| 3 | DC1 Console access check, and the company-mode exemption | The whole console |
| 4 | DC2 Console audit log | Turning the console on at all |
| 5 | DS3 `RECEIPT_PUBLIC_READ_MODE` to enforce | — |
| 6 | DS4 `CONSUMER_TOKEN_MODE` and `STRIPE_OWNERSHIP_MODE` | — |
| 7 | DS5–DS7 Data clean-up (company link, `role`, `update-company`) | Dashboard D6 |
| 8 | DS8 Remove `s-token-lq` from CORS | — |
| 9 | DC3–DC5 Console endpoints, performance, tests | Dashboard D7 |

DS3, DS4 and DS7 belong to their own plan's phases 1 and 7. Follow the procedure there; this document only adds what the dashboard knows.

### DS1. CSP report summary (SC-18). Due from 2026-11-16

- **Do:**
  - Run `scripts/summarize-csp-reports.js --days 7` on the reports `POST /api/csp-report` collected since 2026-11-09 21:04 UTC.
  - Put the output in the reply, as is.
- **Context:**
  - This is a different script and a different log from `summarize-warn-logs.js` in phase 1 of your own plan. The CSP reports are browser reports, not server warn events.
  - Iconify `connect-src` reports from before 2026-11-10 19:21 UTC are already explained. The dashboard's #87 removed those calls.
  - Group the other violations by directive and blocked host, with counts and the pages they came from.
- **Done when:** the summary is in `server-testing/reports/` and covers seven full days.

### DS2. HttpOnly session cookie, phase 1 (SC-23, AC-12)

Their plan's phase 7, F1, holds the server work and waits on Gustavo's date. What follows is the client contract, so the written contract that phase asks for is already half-made.

- **The dashboard client is built and in production, behind `VITE_APP_COOKIE_SESSION`, off** (`src/api/sessionCredential.js`). It assumes:
  - CSRF field in the login body: `csrfToken` (`CSRF_FIELD`);
  - request header: `X-CSRF-Token` (`CSRF_HEADER`);
  - requests sent with credentials, from the dashboard's origin.
- **Also needed:**
  - Add `X-CSRF-Token` to the production CORS allow-list. It was missing on 2026-11-10. Credentials and the origin are already allowed.
  - Keep accepting `x-token` until phase 3, so the flag can be turned on and off with no outage.
- **Tests:**
  - sign-in sets the cookie with `HttpOnly`, `Secure` and `SameSite`;
  - a POST without `X-CSRF-Token` gets 403, and with it passes;
  - an `x-token` request still works;
  - the CORS preflight for `X-CSRF-Token` passes from the dashboard's origin.
- **Answer in the reply:**
  1. Is the CSRF field name `csrfToken`?
  2. How is the MFA setup token carried in phase 3?
  3. Does the sign-in answer still include the token during phase 1?
  4. The date phase 1 reaches staging, and the date it reaches production.

### DS3. `RECEIPT_PUBLIC_READ_MODE` to enforce (AC-3)

- **From the dashboard:** the printed receipt has carried a signed QR since 2026-10-20 (`d2292651`), in production. Nothing is pending on our side, and no client change is needed.
- Your own plan notes this mode writes no log in `enforce`, so the check is a `curl.exe -g` expecting 401.
- **Done when:** production `.env` says `enforce` and an unsigned `/receipt` read is refused.

### DS4. `CONSUMER_TOKEN_MODE` and `STRIPE_OWNERSHIP_MODE` to enforce (AC-3, AC-4)

Phase 1 of your plan covers the rollout. Two questions from the dashboard, before the switch:

1. What does each mode check, and which routes does it affect?
2. Would any dashboard call fail in `enforce`? Name the route and what is missing, and we fix it first.

If the dashboard has to change something, write the note and wait for our PR before switching.

### DS5. Link the Mongo company to its SQL id (AC-4)

- **Do:**
  - Store the SQL `company_id` on each Mongo company document. Backfill existing companies, and set it on create.
  - Return it in the sign-in answer, inside `companyData`.
- **Why:** the dashboard still matches the Mongo company by name in `resolveMongoCompany` (`src/pages/authentication/utils/loginUtils.js`). Two companies with the same name would cross over.
- **Tests:** every company has exactly one SQL id; two companies with the same name resolve to different ids.
- **Answer:** the field name.

### DS6. Migrate employees that only have the numeric `role` (AC-6, decision D8 of 2026-11-10)

- **Do:** a one-off migration that sets `roleType` on every `Company.employees[]` entry that lacks it, using the map in the 2026-11-10 follow-up note. Log the count per company.
- After that, the numeric `role` can be optional on write. Since #84 the dashboard writes only `roleType`.
- **Done when:** the migration has run in production and the reply gives the counts.

### DS7. `update-company` rejects `employees` from the event-end flow (AC-2)

This is F3 in your phase 7, which waits on the dashboard's confirmation. **Here it is:** since #86, in production, `EndEventButton` ends event access through `POST /api/company/event-staff/deactivate` (`src/pages/events/quickGlance/components/formatEventDetailInfo/EndEventButton.jsx`). The old path is only a fallback, used when that route answers Express's HTML 404.

So: check the logs show the new route in use, then refuse the `employees` change from this flow, with its contract test.

### DS8. Remove `s-token-lq` from the CORS allow-list (CM-7)

Since #56 the dashboard no longer sends it (`src/api/sTokenLqRetired.test.js` guards that). Remove it from the allow-list and from any code that reads it.

### DC1. Console access check, and the company-mode exemption (AC-2, AC-4, AC-6)

**New work. Nothing about the console is in your own plan.** Full spec: `reports/FRONTEND_admin_console_plan_2026-11-11.md` §4 B1.

- **Compute `platformAccess`** = the user is `super_user` in the company named by `PLATFORM_COMPANY_ID` (a config value, not a name match) **and** the user's verified sign-in email has the domain `devitrak.com`.
  - The domain is the text after the last `@`, lower-cased, compared exactly. No subdomains, no lookalikes.
- **Return it** as `platformAccess: true|false` in the sign-in answer and from `GET /api/platform/me`.
- **Middleware** `requirePlatformAccess` on every `/api/platform/*` route. It re-checks the database on every request; the JWT alone is not enough.
- **Exempt `/api/platform/*` from `COMPANY_AUTH_MODE` and `COMPANY_CONTEXT_MODE`, and only those two.** Both are `enforce` today, and these routes carry no company headers on purpose. `SESSION_MODE` and `NOSQL_INPUT_MODE` still apply.
- **Warning:** every company creator has `super_user: true` in their own company. The flag alone must never grant access.
- **Tests** (B5, cases 1–3 and 7):
  - a client owner with `super_user: true` gets 403 on every route;
  - a `@devitrak.com` user who is not a super user in Context Global gets 403;
  - a Context Global super user with a non-devitrak email gets 403;
  - after `super_user` is removed, the next request gets 403.

### DC2. Console audit log (AU-2, AU-9, AU-12)

**Spec:** console plan §4 B2.

- **Store:** `platform_audit_log`, append-only.
- **Rows:**
  - one per `/api/platform/*` request, denied requests included;
  - one per console sign-in;
  - an `access_change` row whenever someone gains or loses `super_user` in Context Global.
- **Fail closed:** if the audit write fails, the request fails.
- **No update or delete route.** If the database allows it, the app's database user gets only insert and select on this store.
- **Retention:** a client's rows are kept while the client is active plus 120 days. Rows with no company follow the answer to O3.
- **Tests** (B5, cases 4–6): exactly one row per request, allowed or denied; a failing write fails the request; there is no route that changes rows; the retention job deletes only after 120 days.

### DC3–DC5. Console endpoints, performance and the remaining tests

- **Routes:** the 20 `GET` routes plus `POST /api/platform/exports` in console plan §4 B3, with the response shape `{ ok, data, page, limit, total }`, money in integer cents, dates in ISO UTC.
- **Field names:** the dashboard has proposed field names in its two config files. Reply with what you will send, or accept ours:
  - `src/pages/platform/utils/clientProfile.js`;
  - `src/pages/platform/utils/platformScreens.js`.
- **Performance (B4):** precomputed summaries, indexes for serial search and for the audit log, and a per-user rate limit.
- **Build order:**
  - M2: `/companies` and `/companies/:id`;
  - M3: the profile tabs (Subscription waits on the plans endpoints);
  - M4: the cross-client lists;
  - M5: `/audit` and `/exports`.

**Answer in the reply for the console:**
- O1–O5 of the console plan §3;
- whether staff two-step status and last sign-in are stored today;
- whether consumer-app activity is logged, or only staff activity;
- who has `AdminUser.super_user` today, and how that list is reviewed (AC-2);
- an ETA for M1 (DC1 + DC2).

---

## Part 2: dashboard agent

### D1. Finish the demo branch (now)

**Branch:** `feat/platform-console-demo`, stacked on `main`, which already has #98.

**Do:**
1. Fix the lint warning `react-refresh/only-export-components` in `src/pages/platform/components/platformTable.jsx`: keep the component in that file and move `toTableColumns` to its own module, updating the three importers.
2. Run vitest on `src/config`, `src/hooks`, `src/pages/**/utils`, then the whole suite. Run it with fewer workers if the source-scanning guard tests time out under load.
3. Run eslint (`--ext js,jsx`, 0 warnings), `vite build`, and check that `dist/` contains none of the sample data.
4. Run `graphify update .`.
5. Commit, push and open a PR. Only when the user asks.

**Done when:** CI is green, and a production build has no mock code.

### D2. Demo walkthrough and script (now; needs someone signed in on `localhost:5522`)

- Start the dev server with `VITE_APP_FEATURE_PLATFORM_CONSOLE=true` and `VITE_APP_PLATFORM_CONSOLE_MOCK=true`.
- Walk through every screen: Overview, Clients, all ten profile tabs, Inventory, Transactions, Events, Members & consumers, Audit log.
- Check loading, empty and error states, filters, search, pagination, and phone width.
- Fix what breaks, with a test when the fix is in `utils`.
- Write a five-minute demo script in English in `reports/`.
- **Never type the user's credentials.** The local app signs in against the real API.

### D3. CSP to enforce, `img-src` and Trusted Types (after DS1)

1. **Trusted Types (D2 of 2026-11-10):** if only the two DOMPurify paths report, enforce with one DOMPurify policy. If libraries report, stay in Report-Only and write down why.
2. **#10:** replace `https:` in `img-src` with the hosts in the summary, one comment per host naming the feature. The change goes in `src/config/securityHeaders.js`, with its test.
3. **#11:** on the first release after a clean week, with the CSP E2E job green, ask Gustavo to set `VITE_APP_CSP_ENFORCE=true` in the `production` environment. Check `curl -I` after the release.
4. Update `fedRAMP/` with the result.

### D4. Session cookie on (after DS2)

1. If the backend's CSRF field name is not `csrfToken`, change `CSRF_FIELD`, with its test.
2. Run a preflight check from the dashboard's origin for `X-CSRF-Token`.
3. Test with the flag on in staging: sign-in, a save, an upload, logout, an idle sign-out, and switching companies.
4. Ask Gustavo to set `VITE_APP_COOKIE_SESSION=true` for production. Add the cookie session to the D1 (browser data) and D4 (cryptography) documents in `fedRAMP/`.

### D5. Dependencies (now)

- Merge #100 (Node 24.22.3 in the Docker image) and #101 (six minor updates). CI is green on both.
- Then bump `node-version` in `ci.yml` and `release.yml`, and `engines`, to 24.22.3 in one PR.
- Check whether Cypress 15.21.2 brings `systeminformation` 5.33.16 or later. That closes #15.
- Merging is a release. Merge only when the user says so.

### D6. After DS5

Replace the name match in `resolveMongoCompany` with the SQL id field. The tests in `loginUtils.test.js` need a case with two companies of the same name.

### D7. Console, after DC1 and DC2

1. Align field names in `clientProfile.js` and `platformScreens.js` with the backend's reply. Those are the only two files.
2. F8 exports through `BackgroundJobsTracker` (202 + polling).
3. F9 Cypress on port 5523:
   - a client admin opening `/platform` is redirected;
   - a platform user sees the client list;
   - no `x-company-id` or `s-company-lq` header goes to `/api/platform`.
4. M6 rollout: the flag on for two or three super users, then a review of their audit trail with Gustavo.

### D8. Browser check #13 (Gustavo with real accounts; the agent prepares the checklist)

Cover #81, #83, #84, #86, and #88 with the flag off. The checklist is in `fedRAMP/FRONTEND_govramp_pending_2026-11-10.md` §6.

---

## Part 3: needs a person

| Item | Control | Who |
|---|---|---|
| Approve the AC-8 system use text in `src/config/legalNotices.js` | AC-8 | Legal |
| Rotate the Twilio token found in the 2024 history | IA-5(7) | Gustavo |
| Set the cookie phase 1 date | SC-23 | Gustavo with the backend |
| Set `VITE_APP_CSP_ENFORCE` and `VITE_APP_COOKIE_SESSION` in the GitHub `production` environment | SC-18, SC-23 | Gustavo |
| Browser check #13 with real accounts | SA-11 | Gustavo |

---

## Calendar

| When | What |
|---|---|
| Week of 2026-11-16 | DS1 summary; DS2 answers; DC1 and DC2 started; D1, D2 and D5 done |
| Week of 2026-11-23 | D3 if the CSP week is clean; DS3; DS4 answers; console M1 in staging |
| On the DS2 date | D4 in staging, then production |
| After M1 | M2–M5 in turn; D7; M6 rollout |
