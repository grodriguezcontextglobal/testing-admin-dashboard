# Admin dashboard: work since 2026-11-03, and where GovRAMP stands

**System:** admin.devitrak.net (React SPA, IIS behind openresty) · **Repository:** `grodriguezcontextglobal/testing-admin-dashboard` · **Baseline:** GovRAMP / FedRAMP Moderate (NIST 800-53 rev. 5); first target the **GovRAMP Single Security Snapshot** · **As of:** `main` at `8227a8d1`, release `admin-20261117-142624-8227a8d`.

**Checked on 2026-11-17** against the code, the GitHub ruleset, `npm audit`, the `production` environment's variables, the headers production serves, and the backend's reports folder. Every number below was re-run today; none was carried over from the previous status note.

**Scope:** what the browser client owns. Server controls (the audit log, encryption at rest, backups, incident response, the API's own authorization) belong to the backend's package. Where a dashboard control waits on the server, the row says so.

**Replaces:** `FRONTEND_govramp_status_2026-11-10.md`.

---

## 1. The short version

Two weeks of work: **52 pull requests merged**, lint from 280 warnings to 0, a new cross-client Admin Console built end to end, and two read-only scripts for the production VM.

**And the three rows an assessor scores hardest have not moved since 2026-11-10.**

| Row | Control | State today | Waiting on |
|---|---|---|---|
| CSP in enforce | SC-18 | Report-Only in production (header read today) | The backend's report summary, due 11-16 |
| Session token out of `localStorage` | SC-23 | **Tested end to end against production today and it works.** Flag still off in the production build | Us: one rollback check, then a release build |
| Server modes to `enforce` | AC-3, AC-4, AC-12 | Server configuration | The backend |

All three are a configuration switch. **Two of them still cannot be switched by us — the third stopped being one of those this afternoon.** See below.

**Answered the same day this note was written.** An earlier draft of this report recorded that the exchange with the server team had been stalled since 2026-11-06, and asked for answers separately from work. The reply arrived on 2026-11-17 (`reports/BACKEND_pending_work_REPLY_2026-11-17.md`) and answered six of the eight questions outright — and by the end of the day the remaining cookie question was answered too, with the code deployed.

What it changes:

- **The cookie contract is accepted as the dashboard built it** — `csrfToken`, `X-CSRF-Token`, credentials from our origin. The dashboard changes nothing.
- **The CORS allow-list is fixed, and we verified it ourselves the same day.** `X-CSRF-Token` was missing; it shipped hours after the reply, together with the removal of the retired `s-token-lq`. A preflight against production (`OPTIONS https://db.devitrak.net/api/...`, `Origin: https://admin.devitrak.net`) returns `X-CSRF-Token` in `Access-Control-Allow-Headers` and no `s-token-lq`. That closes the server half of DS8 (CM-7) and removes the failure mode where the browser would have reported the cookie flag's first request as an empty `{}` error. **The cookie itself still does not exist on the server** — this clears the path, it does not open it.
- **The console field names are accepted**, so the two proposal files stay as they are.
- **`CONSUMER_TOKEN_MODE` cannot affect the dashboard**; it only acts on the consumer app's origin.
- **`STRIPE_OWNERSHIP_MODE` can** — see the new risk below.
- **The CSP summary (DS1) is a command on the VM, not development**, and is running.

**And then A3 was answered too, hours later** (`reports/BACKEND_cookie_session_phase1_2026-11-17.md`). **Cookie phase 1 is deployed on the server, switched off.** Turning it on there is an environment variable and a restart; the date asked for was today.

So the SC-23 row above changed owner during the afternoon. It is no longer waiting on the backend — it is waiting on **a staging run by us**, and then on a release build, because our half of the flag is read at build time and not at run time. We reviewed the contract against `src/api/sessionCredential.js` line by line and **no client change is needed to start** (`FRONTEND_cookie_phase1_review_2026-11-17.md`). Three things qualify that:

- **The order is not reversible.** With our flag on, the client stops sending `x-token` altogether. The server mode has to be `dual` before our flag goes on, never the other way round.
- **We have no staging host.** The test will run from a local build pointed at the production API, with `dual` enabled there. That is safe because production users keep the flag off and keep sending `x-token`, which the server honours outright.
- **Phase 3 is a real deadline for us, not a formality.** Our client reads `exp` and `sqlStaffId` out of the token in the sign-in body. Phase 3 removes that body, and with it our only source for both. We asked for the claims, and **the server added `sessionExpiresAt` and `sqlStaffId` to the response the same day**, so the dependency is solved before it bit.

**The run happened, and it passed** (`FRONTEND_cookie_phase1_test_results_2026-11-17.md`). From a local build against the production API, signed in as a real account:

- **`admin-token` is no longer written to `localStorage`.** That absence is the control. Every request authenticated on the cookie alone, with no bearer token anywhere in the page — the first time the dashboard has done that against production.
- **A write without `X-CSRF-Token` is refused with 403** and the server's own message, not an empty `{}`; with the header it succeeds; a **GET** passes without it.
- **The gate is global, not per-route.** A POST to a `/api/staff` path that does not exist answers **403, not 404** — so the check runs ahead of the router and cannot have been wired into a subset. That was the one question that could have turned the flip into an outage, and it is closed.

What is left on this row is **ours**: a rollback check with the flag off, which needs a fresh sign-in, and then a release build — because our half of the flag is read at build time, so turning it on in production is a deploy and turning it off again is another one.

We could not see the `Set-Cookie` line from the browser — page scripts cannot read response headers — so we said so and asked for it. **The server team sent it the same day, generated by a script that boots the real Express stack and transcribes what goes over the wire**, rather than typed by hand, with three tests asserting the attributes so the line cannot drift silently:

```
dvk_session=<elided>; Max-Age=43200; Path=/; Expires=…; HttpOnly; Secure; SameSite=None
```

`HttpOnly` and `Secure` are therefore evidenced, not assumed, and `Max-Age=43200` is the 12 h AC-12 ceiling in the header itself. `SameSite` becomes `Lax` on production day. That block goes in the evidence pack as sent.

**One item is now with Gustavo:** the M1 ETA for the console's access check and audit log (A7). That is what the console row is waiting on.

Two more server items shipped in the same deploy: `s-token-lq` is out of the CORS allow-list (CM-7, closed on both sides) and `update-company` no longer accepts `employees` from the event-end flow — **ignored rather than rejected**, so the inventory screen that posts the whole company keeps working and the field comes back in `ignored_fields` (AC-2).

### Control rows, over the three snapshots

| Snapshot | Met | Partial | Open | Rows |
|---|---|---|---|---|
| 2026-11-06 | 19 | 6 | 2 | 27 |
| 2026-11-10 | 21 | 5 | 1 | 27 |
| **2026-11-17** | **21** | **5** | **2** | **29** |

Read that last row carefully. **Met did not move, and open went up.**

Two rows are new, both from the Admin Console: **AU-2/AU-12** (the server must log every read of a client's data) is **Open**, and **AC-6 console access** is a fourth state — built, tested, not enabled. The console did not close a control; it added one, and that one is the backend's.

This is the right outcome rather than a setback — building the console surfaced an audit obligation that was always going to exist, and surfaced it before anyone could read a client's data. But the scorecard should not be read as progress on the Snapshot. The seven days of work went into a new system and into the production VM, not into the rows above, because the rows above are not ours to close.

---

## 2. What was done, 2026-11-03 → 2026-11-17

52 pull requests, #51 to #105. Grouped by what they were for.

### 2.1 GovRAMP controls closed in code

| Control | What shipped | PR |
|---|---|---|
| CM-7, SA-11 | **CodeQL** static analysis on every push and PR | #51 |
| CM-3 | **D3, change management** written down: the ruleset, the release chain, who approves | #52, #93 |
| C2 / code quality | **Lint from 280 warnings to 0**, in ten reviewed batches, then `npm run lint` made part of CI | #53, #55, #59–#66 |
| AC-4 | The dashboard stopped sending and storing **`s-token-lq`** | #56 |
| AC-6 | Inventory scope routes stopped receiving **`role`** in the body | #57 |
| IA-2(1) | After an MFA reset, sign-in sends people to the **emailed link** instead of a dead end | #58 |
| SI-11 | Messages to people go through `userFacingError.js`; **no internal data in a user-facing error**; new tabs open without `window.opener` | #67 |
| SI-11, AU-9 | The production build **drops every `console` call** (E3) | #70 |
| SC-18 | The **CSP reports** to `/api/csp-report`; **Trusted Types** reported too | #78, #80 |
| IA-2 | **Recovery-codes notice on every sign-in**: none left is an error, one or two left is a warning | #81 |
| RA-5 | Build tools moved to `devDependencies`, so the production audit means what ships | #82 |
| AC-4 | The SQL company is chosen **by id at sign-in, not by name** | #83 |
| AC-4, AC-6 | Dev guard for company context; `Company.employees[]` written with **`roleType` only** | #84 |
| AC-2 | **The server removes staff access when an event ends**; the client no longer sends the employee list | #86 |
| SC-18, SA-11 | **E2E test of the build under the enforcing CSP**, a required check on `main` since 11-10. It found icons being fetched from Iconify's API, which enforcing would have broken | #87, #92 |
| SC-23 | **Session cookie, client side, behind a flag.** The JWT is no longer copied into the persisted store | #88 |
| CM-8, SR-4 | **The release SBOM was silently incomplete** — missing `react`, `react-dom`, `lodash`, six `workbox-*` and ~100 transitive packages, from an npm 11 bug. Fixed; CI now refuses an SBOM that misses a direct dependency | #89 |
| RA-5, SI-2 | Low and moderate advisories **accepted in writing with a review date**; every release's notes now carry the audit result | #91 |

**One of these is worth reading twice.** The SBOM bug (#89) meant every release before 2026-11-10 20:20 UTC shipped an inventory that omitted React itself. An assessor who pulled an old SBOM would have been looking at a document that did not describe the system. Quote a release from that time or later.

### 2.2 The Devitrak Admin Console (task #16)

A cross-client console where Devitrak staff oversee every client company. Asked for on 2026-11-10; designed, built, tested and merged by 2026-11-17.

| What | PR |
|---|---|
| Design plan, with the control questions it has to answer | #90, #94, #95, #97 |
| Shell and Clients list, behind `VITE_APP_FEATURE_PLATFORM_CONSOLE` | #96 |
| Client profile; `platformAccess` kept at sign-in | #98 |
| Cross-client screens (inventory, transactions, people, audit log), demo data, and the access E2E spec | #103 |
| CSV export through the job queue; a refused request stops retrying; the console became **its own page**; the rest of the design; **the `@devitrak.com` domain as a second lock** | #105 |

**The access rule, because it is the part an assessor will ask about.** Entry requires **both** the server sending `platformAccess: true` **and** the sign-in address ending in `@devitrak.com`. The order matters: the domain check can only **refuse**, never grant. The server stays the authority and re-checks every `/api/platform` request. What the domain adds is a second lock — if the server ever wrongly marked an outside address, that alone would not also put every client's data on that person's screen. The domain is the text after the **last** `@`, compared whole, so `mail.devitrak.com`, `devitrak.com.attacker.test` and `devitrak.co` are all refused.

**The console is off, and more firmly than intended.** See §5.

### 2.3 The production VM

| What | Commit |
|---|---|
| Read-only **network inventory** script (CM-8) | `ff65c970` |
| Read-only **hardening report** script — local accounts, password and lockout policy, audit policy, RDP, firewall, SMB, services (AC-2, AC-7, AU-2, CM-6, CM-7) | `35bce702` |

Both are report-only: they read and print, they change nothing, and the release pipeline never runs them. The hardening script has been run on the production VM; **its output has not been analysed yet** — that is the next step, and it turns into POA&M entries.

Its `.txt` output carries account names, internal IP addresses and RDP client addresses. **This repository is public.** The output must not be committed, and must be redacted before it goes to IT Masters.

### 2.4 Product work in the same period

| What | PR |
|---|---|
| Subscription plans page in Profile (Free / Pro / Enterprise), behind a flag | #71 |
| Global notice when the server refuses for a plan limit, with "Upgrade plan" | #72, #76 |
| Equipment status on the event card, in one line | #68 |
| A failed terms-acceptance record no longer breaks the catch | #54 |
| Global CSS loads before components again | #73 |
| Dependency bumps | #74, #75 |

---

## 3. Control by control

Status: **Met** · **Partial** · **Open** (with the owner). Every row re-checked 2026-11-17.

### Access control and session (AC)

| Control | Status | How the dashboard meets it | Evidence |
|---|---|---|---|
| AC-2, AC-6 Account management, least privilege | **Met** in the client | One role system (`src/config/roles.js`, `resolveRoleType`, `hasPermission`); a guard test forbids role checks elsewhere. `Company.employees[]` written with `roleType` only | `roles.test.js`, `employeeRoleRetired.test.js` |
| AC-2 Removing access when an event ends | **Met** in the client | `EndEventButton` calls `POST /api/company/event-staff/deactivate`; the server decides. **Closed on the server 2026-11-17:** `update-company` now ignores `employees` and returns it in `ignored_fields` | `eventStaffDeactivation.test.js` |
| AC-3 Access enforcement | **Met** in the client, enforced by the server | Gated UI uses `hasPermission` | Contract acknowledgement 2026-11-04 |
| AC-4 Information flow (company scope) | **Partial — backend** | The SQL company is chosen by id; a dev guard flags any `company_id` differing from `s-company-lq`. **Left:** the Mongo company is still matched by name, because the Mongo document has no SQL id. `COMPANY_CONTEXT_MODE` is still `warn` | `loginUtils.test.js`, `devPayloadGuard.test.js` |
| AC-6 Console access (new) | **Built, not enabled** | Both locks described in §2.2; 9 Cypress cases. The server is the authority (DC1, unanswered) | `platform-access.cy.js`, `roles.test.js` |
| AC-7 Unsuccessful logon attempts | **Met** | Lockout is server-side; sign-in shows attempts left, lockout and retry time | Login tests |
| AC-8 System use notification | **Partial — legal** | A notice is on the sign-in screen; the text is not approved (`approvedByLegal: false`) | `legalNotices.test.js` |
| AC-11, AC-12 Session lock and termination | **Met** | Idle sign-out at 15 min with a warning, across tabs; 12 h maximum; a global 401 handler ends the session and says why | `idleSession.test.js`, `sessionExpiry.test.js` |

### Identification and authentication (IA)

| Control | Status | How | Evidence |
|---|---|---|---|
| IA-2(1) MFA | **Met** | MFA required with forced enrolment; recovery codes shown once; sign-in with a recovery code; reset-email step | `MfaEnrollmentModal.test.jsx` |
| IA-2 Recovery codes running out | **Met** | Checked on every sign-in | `mfaRecovery.test.js` |
| IA-5 Authenticator management | **Met** | Passwords of 12–128 characters, verified only on the server; no hashes or secrets in the bundle | Secret-in-bundle guard test |
| IA-5(7) Embedded secrets | **Partial — Gustavo** | No secret in the bundle or the repo. A Twilio token from a 2024 `.env` **in the git history still has to be rotated**. Not verifiable from here; it stays open until Gustavo confirms | Backend reply 2026-11-04 §3 |

### System and communications protection (SC)

| Control | Status | How | Evidence |
|---|---|---|---|
| SC-8 Transmission confidentiality | **Met** | HSTS `max-age=31536000; includeSubDomains`; the build refuses a non-`https` API URL | `curl -I`, 2026-11-17 |
| SC-7, SI-10 Boundary headers | **Met** | `nosniff`, `X-Frame-Options: DENY` with `frame-ancestors 'none'`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`; `X-Powered-By` removed | `curl -I` 2026-11-17, `securityHeaders.test.js` |
| SC-18 Mobile code / CSP | **Partial — waiting on the summary** | **Still `Content-Security-Policy-Report-Only` in production, read today.** `script-src` allows no inline script or eval; `style-src 'unsafe-inline'` is an accepted risk (D1). The E2E check under the enforcing policy is a required check and passes. The switch needs `VITE_APP_CSP_ENFORCE=true`, which needs the summary that was due 11-16 | `csp-enforce.cy.js`, `curl -I` |
| SC-18 Trusted Types | Reported, never enforced | Enforcing is decided from the reports (D2) | `securityHeaders.test.js` |
| SC-18 Reverse tabnabbing | **Met** | Every new tab opens without `window.opener`; guard test | `externalLinksGuard.test.js` |
| SC-23 Session authenticity | **Open — backend; client ready** | The token is still in `localStorage` and travels as `x-token`. The client side is built and in production, **off**. Three of the four answers landed on 11-17: the field name is `csrfToken`, the sign-in answer keeps the token through phase 1, and `X-CSRF-Token` is now in the production CORS allow-list (verified by preflight). What is left is phase 1 itself on the server, which has **no date** and needs Gustavo | `sessionCredential.test.js` |
| SC-28 Data at rest in the browser | **Met** | No API response cached by the service worker; the offline queue holds 15 min at most and empties on sign-out; personal data in session storage only | `offlineCaching` tests, D1 |
| SC-13 Cryptography | **Met** | Cryptographic inventory kept (D4) | D4 |

### System and information integrity (SI)

| Control | Status | How | Evidence |
|---|---|---|---|
| SI-2, RA-5 Flaw remediation, vulnerability scanning | **Met** | `npm audit --omit=dev` run 2026-11-17: **0 critical, 0 high, 0 moderate, 2 low** (`quill`, `react-quill-new`; one advisory, no fix, accepted until 2027-02-10 with its mitigation). High or critical fails CI and the release unless accepted with an expiry. Dependabot and CodeQL both on | `audit-exceptions.json` |
| SI-10 Input handling / XSS | **Met** | The only HTML insertion (`DisplayArticle.jsx`) goes through DOMPurify; no `eval` or `new Function`; sign-in redirects only to own routes | Code review, D3 |
| SI-11 Error handling | **Met** | Messages to people never carry the error object; guard test | `userFacingErrorGuard.test.js` |
| SI-11, AU-9 Console output | **Met** | The production build drops every `console` call; guard test | `productionConsole.test.js` |

### Audit (AU)

| Control | Status | How | Evidence |
|---|---|---|---|
| AU-2, AU-12 Console reads logged | **Open — backend (DC2)** | The console screens state in writing that the server records every read and that the record cannot be edited or deleted, kept for the client's lifetime plus 120 days. **The server does not write that log yet.** Until it does, the console must not be enabled | Console plan §B2; `ConsoleNotice` |

### Configuration, change management, development (CM, SA, SR)

| Control | Status | How | Evidence |
|---|---|---|---|
| CM-3, CM-4 Change control | **Met** | Ruleset "Main", active, verified today: no deletion, no force push, pull request required, **required checks "Lint, tests y build" and "CSP en modo enforce (E2E)"**. Releases are built by GitHub Actions; the server installs only a zip whose SHA-256 matches | Ruleset API, 2026-11-17 |
| CM-3 Second-person review | **Partial — accepted decision** | Required approvals: **0** (Gustavo's decision of 2026-10-29). The maintainer's merge is the approval. This is the row an assessor is most likely to question of those we control | Ruleset API, D3 |
| CM-6 Configuration settings | **Met** | Environment variables validated at build time; every flag declared in `.env.dev.example`, including both console flags | `envValidation.test.js` |
| SA-11 Developer testing | **Met** | **5,344 unit tests in 324 files**, run 2026-11-17; coverage as a CI artifact; lint at 0; the E2E CSP check required on `main`. **Gap: the console access spec is not in CI** — see §5 | CI artifacts |
| SA-10, SR, CM-8 Supply chain and inventory | **Met** | Actions pinned by SHA; gitleaks over the history; secret scanning. The CycloneDX SBOM of every release is complete, and CI refuses one missing a direct dependency. **SBOMs from before 2026-11-10 20:20 UTC are incomplete** — use a later release as evidence | Release SBOM |

### Documents an assessor will ask for

| Document | Status |
|---|---|
| D1 Data kept in the browser | Done; add the cookie session when it is turned on |
| D2 Third parties in the browser | Done |
| D3 Change management | Done, updated 2026-11-10 |
| D4 Cryptographic inventory | Kept; update with the cookie session |
| D5 Accessibility (Section 508 / VPAT) | Not started; not a GovRAMP control |
| **The console's own section in the SSP** | **Not written.** Vendor staff reading customer data is disclosed, or it is a finding |

---

## 4. What is blocking, by owner

| Item | Control | Owner | Our part when it lands |
|---|---|---|---|
| CSP report summary (DS1), due 11-16 | SC-18 | Backend | D2, then `img-src` narrowed, then `VITE_APP_CSP_ENFORCE=true` and a release |
| Cookie session phase 1 and four answers (DS2) | SC-23, AC-12 | Backend | Fix the CSRF field name if needed; staging with the flag on; then production |
| Console access check and company-mode exemption (DC1) | AC-3, AC-6 | Backend | None; the client is built |
| **Console audit log (DC2)** | **AU-2, AU-12** | **Backend** | **None. The console stays off until this exists** |
| Console endpoints, performance, tests (DC3–DC5) | — | Backend | **Complete inventory sent 2026-11-17:** six endpoints, one envelope, all read-only (`FRONTEND_platform_endpoints_complete_list_2026-11-17.md`). The screens are built against it |
| Mongo company ↔ SQL id link (DS5) | AC-4 | Backend | Replace the name match in `resolveMongoCompany` |
| `role`-only employee entries (DS6) | AC-6 | Backend | None |
| `COMPANY_CONTEXT_MODE`, `SESSION_MODE`, `DB_COMPANY_PUBLIC_MODE` to `enforce` | AC-3, AC-4, AC-12 | Backend / Gustavo | None |
| ~~`update-company` rejects `employees` from the event-end flow~~ | AC-2 | Backend | **Done 2026-11-17** (ignored, not rejected) |
| System use notice text | AC-8 | Legal | A one-line change |
| Twilio token rotation | IA-5(7) | Gustavo | None |
| Hardening report output analysed into POA&M entries | CM-6, CM-7, AC-2, AU-2 | Gustavo → dashboard | Read the `.txt` and write the entries |
| Browser check of #81, #83, #84, #86, #88 with real accounts | — | Gustavo | — |
| **`localhost` origins out of the production CORS allow-list** | AC-4, SC-7 | Backend + dashboard | **Date agreed 2026-11-17:** they come out in the same deploy that sets `SameSite=lax` — cookie production day |
| A real staging host for the dashboard, with its own API origin | AC-4, SC-7, CA-2 | Dashboard → proposal | The permanent fix behind the row above. Also removes "we test production from a laptop" from the SSP |
| **Database error text returned to the client** | SI-11 | Backend, with our route list | ~351 sites across 52 files; **not reachable anonymously**. A shared error responder, not 351 edits |
| ~~Cookie rollback check with the flag off~~ | SC-23 | Dashboard | **Done 2026-11-17.** Flag off, fresh sign-in, `admin-token` back and the cookie pair gone |
| ~~Company scoping on `events_information` and `consulting-item`~~ | AC-4 | Dashboard | **Merged 2026-11-18, PR #106.** Eight call sites scoped, a source-reading guard against new ones. The server makes the columns required next |
| Console first operator and host | AC-2, AC-4 | Gustavo → backend | Decided 2026-11-18: Gustavo alone to start (**the gate requires MFA**), host `ops.devitrak.net` |

---

## 5. What turned up while writing this

These were not known on 2026-11-10. Three are gaps; the first is a safety property worth stating plainly so nobody assumes otherwise.

**1. The console cannot be switched on from the GitHub environment, and nothing says so.**
`VITE_APP_FEATURE_PLATFORM_CONSOLE` is declared in `.env.dev.example` but **does not appear in `.github/workflows/release.yml` at all**. Setting the variable in the `production` environment would do nothing; the build would never read it. Today that is a good thing — the console must not be enabled before DC1 and DC2 exist — but it is an undocumented accident rather than a decision, and the person who eventually turns the console on will lose an afternoon to it. It should be wired in, defaulting to `false`, at the same time as the audit log lands.

**2. The `production` GitHub environment has zero variables set.**
Verified today: `total_count: 0`. `VITE_APP_CSP_ENFORCE`, `VITE_APP_COOKIE_SESSION` and `VITE_APP_FEATURE_SUBSCRIPTION_PLANS` are read from `vars.*` with **no fallback**, so all three are empty, so all three are off. For CSP and the cookie that matches the plan. For the **subscription plans page**, shipped on 11-06, it may not — that feature has been in production and invisible for eleven days. Worth a decision either way.

**3. The console access E2E spec is not in CI.**
`cypress/e2e/platform/platform-access.cy.js` — 9 cases, the client half of the check that keeps one company's staff out of every other company's data — runs only when someone runs it by hand. CI has two jobs, and this is in neither. Before the console is enabled it should be a required check on `main`, the way the CSP job is. Note that it needs its own dev server, because with the demo-data flag on the guard opens to everyone by design.

**4. Asking better questions moved more than two weeks of work did.**
The exchange with the server team had stalled since 2026-11-06 — not for lack of effort on either side, but because our notes mixed things that needed *a sentence* with things that needed *a sprint*, and a 13-item list reads as 13 items of work. Splitting them into **answers** (one sentence each) and **work** (a date each) got a full reply the same day, and by the end of that day seven of the eight were answered, the CORS fix was live, cookie phase 1 was deployed and tested, and two response fields we had only mentioned in passing had been added for us.

The lesson is ours to keep, not theirs: **when something has been blocked for two weeks, the problem is often the shape of the ask.** The one item still open — the M1 ETA for the console's access check and audit log — is being scoped on their side and waits on **Gustavo** for the console's own date.

**5. Testing the cookie turned up two things that have nothing to do with the cookie.**
Both were found by sending deliberately malformed requests while the session was open, and both are now dated rather than discovered.

- **Database error text reaches the client (SI-11).** A malformed body answered `500` with `{"msg":"syntax error at position 29"}` — the SQL engine's own words. The server team measured the shape of it: **~351 response sites across 52 files**, 19 of which return the whole error object rather than its message. It is the codebase's default error shape, so the fix is one shared error responder applied directory by directory, not 351 edits. **The part that reranks it:** we probed sixteen of those endpoints with no session and every one answered `401` with no error text, so **the leak is not reachable anonymously — it is reachable by anyone holding any session**, including a low-privilege or compromised staff account. Still worth fixing; a different sentence in the POA&M.
- **Production CORS allows `localhost` origins** (`:5522`, `:5523`) with credentials. It is what made today's test possible and it is the only staging path the dashboard has. The risk is sharper than we first wrote: with a `SameSite=None` session cookie, any page on those ports gets the session attached, and while the CSRF token stops writes, **GETs are exempt by design and go through**. Agreed date: they come out in the same deploy that moves `SameSite` to `Lax`. The permanent answer is a staging host of our own, which we owe as a proposal.

**6. Six screens ask the server for an event without naming the company — and one of them uses whatever comes back. (AC-4, and it is ours.)**
Fixing the error leak above made this visible, because the SQL syntax error had been covering it. `POST /db_event/events_information` is called from six places with `event_name` + `zip_address` and **no company column**, so the server has no way to scope the answer. Two things make it a finding rather than a tidy-up:

- **We already work around it in the browser.** `pickSqlEventId` in `eventDraft.js` asks unscoped and then filters the rows by `company_assigned_event_id` client-side. Nobody writes that unless the response sometimes contains rows that are not ours — so the cross-company read is not theoretical. It is being discarded after the fact, in the one place where a control does not count.
- **The careless variant of the same lookup exists too.** `CardEventDisplay.jsx` takes `events.at(-1)` — the last row of an unscoped result, with no company check — and uses it as the event's SQL identity for quick glance. Two companies with the same event name and the same zip, and it picks the wrong one; that id is then used for what follows.

`POST /db_item/consulting-item` has a smaller version of the same thing: 20 of 22 call sites send `company_id`, and two look an item up by `item_id` alone (the device profile, and the in-stock check before deleting).

**Fixed and merged on 2026-11-18 (PR #106).** Every call site now builds its body through `eventSqlLookup.js`, which **returns null rather than an unscoped body** — a request with no company is the bug it exists to prevent, so the caller sends nothing instead of quietly dropping the field. `pickOwnEventRow` stays as the second lock. A guard test reads the source tree and fails if a new call site omits the company; writing it precisely — resolving the call expression by balanced parentheses instead of a window of lines — found **five more** `events.at(-1)` sites than the manual audit had. The server makes both columns required next, in that order, so nothing breaks in between.

---

## 5a. What the backend's reply added

Two facts from `reports/BACKEND_pending_work_REPLY_2026-11-17.md` belong in the record.

**`AdminUser.super_user` was far more widely held than anyone thought (AC-2, AC-6, IA-2(1)).** On 2026-11-09 an audit found **22 of 47 active accounts** carrying the flag — 15 test accounts and 5 people outside the platform team — and **none of them had MFA**. On 2026-11-16 it was reduced to the intended four, with 20 revocations and 2 grants, one audit-trail row each, evidence kept on the VM. The list is produced by `scripts/super-user-access.js --list` and reviewed monthly with the ConMon package.

This needs to be **written into the SSP and opened as a POA&M entry**, for three reasons:

1. The remediation is strong evidence, better than if the number had always been four: a review found something and the correction is documented per account. The audit-trail rows are the artifact.
2. **"None had MFA" is an IA-2(1) finding, not only an AC-2 one**, and needs its own sentence — including whether MFA is now required for the four, and whether the monthly review checks MFA state as well as membership.
3. It is the direct evidence for the console's own access design. `super_user` alone was never a safe gate, and now there is a documented reason why.

**`STRIPE_OWNERSHIP_MODE` can produce 404s on dashboard calls.** It applies to staff sessions on `routes/stripe.js`, `routes/subscription.js` and `routes/transaction.js`: the resource must belong to the company in `x-company-id` or the caller must be a platform super user, otherwise `enforce` answers **404** — deliberately not confirming whether the resource exists. Company-to-Stripe links are partly resolved **by company name** today, so a mismatch would appear as a 404 on a call that works now. The seven-day warn report around **2026-11-23** lists which calls `enforce` would have rejected; if any are ours, we get the list and a fix before the switch.

**One correction to this report's own framing.** The Mongo company is matched by name (AC-4) because **the name is the only bridge that exists today**: the Mongo company document carries no SQL id, and `company_info` carries no Mongo `_id`. The field will be `sql_company_id`, it does not exist yet, and the backfill itself can only match by name once, with duplicates listed for a human. So this row is not a shortcut the dashboard took — it is the only thing available, on both sides.

**One thing the dashboard found in its own code while checking that.** Two call sites send the **numeric** SQL `company_id` to `PATCH /db_staff/company-staff`: `UpdateRoleInCompany.jsx` and `useRoleReassignment.js`. The backend reports that `company_staff.company_id` holds the **Mongo ObjectId as a string**, unlike the numeric `company_id INT` in five other tables. Whether the server uses the body field or resolves the company itself is the backend's to answer, and has been asked. Both call sites are role changes, so if it does matter it is an AC-6 event rather than a data-quality one, and it should be settled before `COMPANY_CONTEXT_MODE` goes to `enforce`.

---

## 6. Where the evidence lives

- **Code and tests:** `src/config/roles.js`, `securityHeaders.js`, `sbom.js`, `auditGate.js`, `legalNotices.js`; `src/api/sessionCredential.js`, `sessionHeaders.js`, `sessionExpiry.js`; `src/hooks/idleSession.js`; `src/utils/userFacingError.js`; `src/pages/platform/**`; their `*.test.js` files including the guard tests; `cypress/e2e/csp/csp-enforce.cy.js`; `cypress/e2e/platform/platform-access.cy.js`.
- **Pipeline:** `.github/workflows/ci.yml`, `release.yml`, `codeql.yml`; `.github/dependabot.yml`; `.github/audit-exceptions.json`; the ruleset "Main".
- **Plans and documents:** `fedRAMP/` (action plan, D1–D3, the pending list); `reports/FRONTEND_admin_console_plan_2026-11-11.md`.
- **VM scripts:** `deploy/it/inventario-red-vm.ps1`, `deploy/it/endurecimiento-vm.ps1`. Report-only; never run by the release pipeline.
- **Coordination with the backend:** `server-testing/reports/`.
