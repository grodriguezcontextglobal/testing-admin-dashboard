# Admin dashboard: where GovRAMP stands, 2026-11-25

**System:** admin.devitrak.net and ops.devitrak.net (one React SPA, two origins, IIS behind openresty) · **Repository:** `grodriguezcontextglobal/testing-admin-dashboard` · **Baseline:** GovRAMP / FedRAMP Moderate (NIST 800-53 rev. 5); first target the **GovRAMP Single Security Snapshot** · **As of:** `main` at `51172fb1`, production serving `admin-20261124-193949-51172fb`.

**Checked on 2026-11-25** against the running system: the headers both origins serve, `version.json`, the GitHub ruleset, the `production` environment's variables, `release.yml`, `npm audit`, the full test suite, the deployment-check run history, and a CORS preflight against the production API. Every number below was re-run today. None was carried from the previous note.

**Scope:** what the browser client owns. Server controls — the audit log itself, encryption at rest, backups, the API's own authorization — belong to the backend's package. Where a dashboard row waits on the server, it says so.

**Replaces:** `FRONTEND_govramp_status_2026-11-17.md`.

---

## 1. The short version

**Met moved for the first time in three snapshots.** The row that had been Open since the console was designed — the server logging every read of a client's data — is closed, and the console it was blocking is live in production.

| Row | Control | 2026-11-17 | 2026-11-25 |
|---|---|---|---|
| Console reads logged | AU-2, AU-12 | **Open** — "the console must not be enabled until this exists" | **Met.** M1 live and exercised since 2026-11-19 |
| Console access | AC-6 | Built, not enabled | **Live in production**, own origin, both locks running |
| Deployment is observable | CM-3, SA-10, AU-6 | POA&M opened 11-18 | **All four criteria met 11-23.** The document still says Open |
| CSP in enforce | SC-18 | Report-Only | **Report-Only.** Unmoved, read again today |
| Session token out of `localStorage` | SC-23 | Client ready, flag off | **Unchanged.** No release has ever been built with the flag on |

Forty-three pull requests merged since 2026-11-17 (#100, #105–#146). The suite is **5,554 tests in 332 files**, up from 5,344 in 324, all passing, lint at 0.

**And the two rows an assessor scores hardest still have not moved.** CSP enforce was due on 11-16 and is nine days late on the backend's summary; the cookie session is ours to release and has not been released. Both are a configuration switch, as they were two weeks ago.

**One row went backwards, and it is ours.** See §5.1 — CM-6 drops from Met to Partial.

**One row is new and it is the most important thing in this note.** On 2026-11-23 both sites were down for three hours and nobody noticed. There is no incident record. See §5.2.

### Control rows, over four snapshots

| Snapshot | Met | Partial | Open | Rows |
|---|---|---|---|---|
| 2026-11-06 | 19 | 6 | 2 | 27 |
| 2026-11-10 | 21 | 5 | 1 | 27 |
| 2026-11-17 | 21 | 5 | 2 | 29 |
| **2026-11-25** | **22** | **7** | **2** | **31** |

Read the Partial column honestly. It goes from 5 to 7 for two different reasons, and only one of them is a loss:

- **CM-6 dropped from Met to Partial** — a real downgrade, §5.1.
- **Trusted Types was given a status it never had.** In the 11-17 table that row read "Reported, never enforced" with no label and was not counted. It has not got worse; it has been labelled.

Open stays at 2 because one closed (AU-2/AU-12) and one opened (incident response).

---

## 2. What was done, 2026-11-17 → 2026-11-25

Forty-three pull requests. Grouped by what they were for.

### 2.1 The Admin Console went live

This is the bulk of the period: eighteen PRs between #110 and #137 took the console from "built, must not be enabled" to running against real client data on its own origin.

| What | PR |
|---|---|
| The console flag is passed to the build at all | #110, #116 |
| Sample data can ship; the **gate bypass still cannot** | #111 |
| The two gates cannot drift apart the way we had written them | #112 |
| Served on **ops.devitrak.net**, same artifact, repointed rather than rebuilt | #113, #114, #117 |
| A `@devitrak.com` sign-in lands on the console instead of the dashboard | #115, #118 |
| A refusal **explains itself** instead of ejecting the user to another origin; a way out, and a sign-out | #119, #120 |
| The screens describe the access control the server actually runs | #121 |
| **No cross-client index of people, and no bank details** | #122, #123 |
| A finished export can be collected | #124 |
| Money columns removed until the server has amounts to show | #127 |
| The access check runs on **every pull request** | #133 |
| Built against **real client data** instead of sample data | #137 |

Two of these are control events rather than features. **#122/#123 removed a cross-client index of people and bank details from the console** — a vendor-staff screen that could list every client's people is exactly the disclosure an assessor asks about, and it came out before the console was switched on. **#111** is the rule that the sample-data flag may ship while the gate bypass may not: convenience and authorization were deliberately separated so that turning on demo data can never open the door.

### 2.2 Deployment stopped being silent

| What | PR |
|---|---|
| A deployment is observable from outside the machine | #129 |
| `version.json` served uncached | #130 |
| **The check proves its own alarm fires** (drill mode) | #131 |
| A package whose `web.config` IIS cannot parse is refused | #136 |
| The `web.config` block that took both sites down, removed | #132, #135 |

### 2.3 The staff assistant ("Devi")

Six PRs (#138–#146): the pure core and a stub behind a flag, the hook and window, a rebuild against the contract the backend actually shipped, the chat UI, and the name. **Not enabled anywhere** — and see §5.1, because its flag never reaches the production build.

It matters to this report for one reason: it is the first dashboard feature whose server side **writes an audit row before it answers**, and refuses to answer if that write fails. That is the AU-2 posture the console had to be argued into, arriving by default in the next feature.

### 2.4 Everything else

AC-4 event and item scoping (#106, merged 11-18 and **now actually running in production** — it was the item the POA&M listed as "released but not deployed"), a source-reading guard so a new unscoped call site fails CI (#109), dependency bumps (#100, #128), and the reports that keep the backend exchange current (#107, #108, #125, #126, #134, #139, #141, #144).

---

## 3. Control by control

Status: **Met** · **Partial** · **Open** (with the owner). Every row re-checked 2026-11-25.

### Access control and session (AC)

| Control | Status | How the dashboard meets it | Evidence |
|---|---|---|---|
| AC-2, AC-6 Account management, least privilege | **Met** | One role system (`src/config/roles.js`, `resolveRoleType`, `hasPermission`); a guard test forbids role checks elsewhere | `roles.test.js`, `employeeRoleRetired.test.js` |
| AC-2 Access removed when an event ends | **Met** | The server decides; `update-company` ignores `employees` and reports it in `ignored_fields` | `eventStaffDeactivation.test.js` |
| AC-3 Access enforcement | **Met** in the client, enforced by the server | Gated UI uses `hasPermission` | Contract ack 2026-11-04 |
| AC-4 Information flow (company scope) | **Partial — backend** | Every SQL event and item lookup now names its company, and the guard test fails a new call site that does not (#106, #109, **live in production since 11-24**). **Left:** the Mongo company is still matched by name — no `sql_company_id` exists on either side — and `COMPANY_CONTEXT_MODE` is still `warn` | `eventSqlLookup.test.js`, `devPayloadGuard.test.js` |
| AC-6 Console access | **Met** | Live on `ops.devitrak.net/platform`. Entry needs **both** the server sending `platformAccess: true` **and** a sign-in address on the closed `@devitrak.com` allow-list. The domain check can only refuse, never grant; the server re-checks every `/api/platform` call and is the authority | `platform-access.cy.js` (9 cases, on every PR), M1 reply 2026-11-19 |
| AC-7 Unsuccessful logon attempts | **Met** | Server-side lockout; sign-in shows attempts left and retry time | Login tests |
| AC-8 System use notification | **Partial — legal** | The notice is on the sign-in screen; the text is unapproved (`approvedByLegal: false`) | `legalNotices.test.js` |
| AC-11, AC-12 Session lock and termination | **Met** | Idle sign-out at 15 min with a warning, across tabs; 12 h maximum; a global 401 handler ends the session and says why | `idleSession.test.js`, `sessionExpiry.test.js` |

### Identification and authentication (IA)

| Control | Status | How | Evidence |
|---|---|---|---|
| IA-2(1) MFA | **Met** | Required, with forced enrolment; recovery codes shown once; sign-in with a recovery code | `MfaEnrollmentModal.test.jsx` |
| IA-2 Recovery codes running out | **Met** | Checked on every sign-in | `mfaRecovery.test.js` |
| IA-5 Authenticator management | **Met** | 12–128 characters, verified only on the server; no secret in the bundle | Secret-in-bundle guard test |
| IA-5(7) Embedded secrets | **Partial — Gustavo** | No secret in the bundle or the repo. **A Twilio token from a 2024 `.env` in the git history still has to be rotated.** Open since 2026-11-04, unchanged | Backend reply 2026-11-04 §3 |

### System and communications protection (SC)

| Control | Status | How | Evidence |
|---|---|---|---|
| SC-8 Transmission confidentiality | **Met** | HSTS `max-age=31536000; includeSubDomains` on both origins; the build refuses a non-`https` API URL | `curl -I`, 2026-11-25 |
| SC-7, SI-10 Boundary headers | **Met** | `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(self)`; no `X-Powered-By`. **Verified on `ops.devitrak.net` as well as `admin.devitrak.net` today** — the new origin serves the same header set | `curl -I` both origins, 2026-11-25 |
| SC-18 Mobile code / CSP | **Partial — waiting on the summary** | **Still `Content-Security-Policy-Report-Only` in production on both origins, read today.** `script-src` allows no inline script or eval; `style-src 'unsafe-inline'` is an accepted risk (D1). The E2E check under the enforcing policy is a required check on `main` and passes. The switch needs `VITE_APP_CSP_ENFORCE=true`, which needs the report summary **due 2026-11-16 — nine days late** | `csp-enforce.cy.js`, `curl -I` 2026-11-25 |
| SC-18 Trusted Types | **Partial** | Reported, never enforced. Enforcing is decided from the reports (D2), which depend on the same summary | `securityHeaders.test.js` |
| SC-18 Reverse tabnabbing | **Met** | Every new tab opens without `window.opener`; guard test | `externalLinksGuard.test.js` |
| SC-23 Session authenticity | **Open — dashboard** | The token is still in `localStorage` and travels as `x-token`. The client half shipped on 11-10 and was tested end to end against production on 11-17. **Since then: nothing.** `VITE_APP_COOKIE_SESSION` is read from `vars.*` with no fallback and the `production` environment has no variables, so no release has ever been built with it on. The owner of this row is us, not the backend | `sessionCredential.test.js`, `release.yml:85` |
| SC-28 Data at rest in the browser | **Met** | No API response cached by the service worker; the offline queue holds 15 min at most and empties on sign-out | `offlineCaching` tests, D1 |
| SC-13 Cryptography | **Met** | Cryptographic inventory kept (D4) | D4 |

### System and information integrity (SI)

| Control | Status | How | Evidence |
|---|---|---|---|
| SI-2, RA-5 Flaw remediation | **Met** | `npm audit --omit=dev` run 2026-11-25: **0 critical, 0 high, 0 moderate, 2 low** — unchanged, the two accepted `quill` advisories with a review date of 2027-02-10. High or critical fails CI and the release unless accepted with an expiry. Dependabot and CodeQL both on | `audit-exceptions.json` |
| SI-10 Input handling / XSS | **Met** | The only HTML insertion goes through DOMPurify; no `eval`; sign-in redirects only to own routes. The assistant renders server text as React children, never as HTML, with a guard test | `assistantGate.test.js`, D3 |
| SI-11 Error handling | **Met** in the client | Messages to people never carry the error object; guard test | `userFacingErrorGuard.test.js` |
| SI-11, AU-9 Console output | **Met** | The production build drops every `console` call; guard test | `productionConsole.test.js` |

### Audit (AU)

| Control | Status | How | Evidence |
|---|---|---|---|
| AU-2, AU-12 Console reads logged | **Met — closed 2026-11-19** | Every read of a client's data by Devitrak staff is written to `platform_audit_log` before the response. Live and exercised end to end; denials carry a reason, and `not_on_allowlist` is distinct from `wrong_domain` so the two can be counted separately | `BACKEND_console_m1_live_2026-11-19.md` |

**This row carries a limitation that has to be written down rather than left in a report.** DC2 asked that the application's database user hold insert and select only on `platform_audit_log`. The engine is PlanetScale (`8.4.11-Vitess`) and grants permissions per password with scope roles, not per table — "insert and select on this one table" is **not expressible**. What exists instead is a compensating control: a test walks the source tree and fails if an `UPDATE` or `DELETE` against that table appears anywhere but the retention job. The backend recorded an open decision at 90 days — move the log to a store that can enforce it, or justify the limitation in the SSP. **Neither the limitation nor the 90-day decision is in a POA&M entry today.** It should be; see §4.

### Configuration, change management, development (CM, SA, SR)

| Control | Status | How | Evidence |
|---|---|---|---|
| CM-3, CM-4 Change control | **Met** | Ruleset "Main", active, verified today: no deletion, no force push, pull request required, required checks **"Lint, tests y build"** and **"CSP en modo enforce (E2E)"**. Releases are built by Actions; the server installs only a zip whose SHA-256 matches | Ruleset API, 2026-11-25 |
| CM-3 Second-person review | **Partial — accepted decision** | Required approvals: **0** (decision of 2026-10-29). The maintainer's merge is the approval. Still the row an assessor is most likely to question of those we control | Ruleset API, D3 |
| CM-6 Configuration settings | **Partial — dashboard** ⬇ | **Downgraded today.** Every flag is declared in `.env.dev.example` and validated at build time, but nothing connects a declared flag to the build that ships. See §5.1 | `envValidation.test.js`, `release.yml` |
| SA-11 Developer testing | **Met** | **5,554 unit tests in 332 files**, run 2026-11-25, all passing; lint at 0; coverage as a CI artifact; the enforcing-CSP E2E required on `main`. The console access spec (9 cases) now **runs on every pull request** (#133) — it is still not a *required* check | CI artifacts, local run 2026-11-25 |
| SA-10, SR, CM-8 Supply chain and inventory | **Met** | Actions pinned by SHA; gitleaks over the history; secret scanning. The release SBOM is complete and CI refuses one missing a direct dependency. **SBOMs from before 2026-11-10 20:20 UTC are incomplete** — quote a later release | Release SBOM |

### Incident response (IR) — new row

| Control | Status | How | Evidence |
|---|---|---|---|
| IR-4, IR-5, IR-6 Incident handling, monitoring, reporting | **Open — dashboard** | A three-hour total outage of both production origins on 2026-11-23 has **no incident record**, no timeline, no stated user impact and no corrective-action entry. The code fix is merged; the control artifact does not exist | §5.2 |

### Documents an assessor will ask for

| Document | Status |
|---|---|
| D1 Data kept in the browser | Done; add the cookie session when it is turned on |
| D2 Third parties in the browser | Done; depends on the CSP summary to finish |
| D3 Change management | Done, updated 2026-11-23 (rows 6 and 7, the deployment chain) |
| D4 Cryptographic inventory | Kept; update with the cookie session |
| D5 Accessibility (Section 508 / VPAT) | Not started; not a GovRAMP control |
| **The console's own SSP section** | **Still not written.** The console is now *live*, so this moved from "a gap" to "vendor staff are reading customer data in production and the SSP does not say so" |
| **An incident record for 2026-11-23** | **Does not exist** (§5.2) |
| **POA&M for the `super_user` / MFA finding of 2026-11-09** | **Still not opened.** 22 of 47 active accounts held the flag, none with MFA; remediated 11-16 to the intended four. Flagged as owed on 11-17, unchanged |

---

## 4. What is blocking, by owner

| Item | Control | Owner | Our part when it lands |
|---|---|---|---|
| **CSP report summary (DS1), due 11-16 — nine days late** | SC-18 | Backend | D2, `img-src` narrowed, then `VITE_APP_CSP_ENFORCE=true` and a release |
| **Build and release with the cookie flag on** | SC-23 | **Dashboard** | This is the whole item. Server phase 1 has been deployed since 11-17 |
| `localhost` origins out of the production CORS allow-list | AC-4, SC-7 | Backend + dashboard | **Verified still open today:** `Origin: http://localhost:5522` returns `Access-Control-Allow-Origin: http://localhost:5522` with `Allow-Credentials: true`. Agreed to come out with `SameSite=Lax` on cookie production day, which has not come |
| A real staging host with its own API origin | AC-4, SC-7, CA-2 | Dashboard → proposal | The permanent fix behind the row above |
| Mongo company ↔ SQL id link (DS5) | AC-4 | Backend | Replace the name match in `resolveMongoCompany` |
| `COMPANY_CONTEXT_MODE`, `SESSION_MODE`, `DB_COMPANY_PUBLIC_MODE` to `enforce` | AC-3, AC-4, AC-12 | Backend / Gustavo | None |
| Database error text returned to any session | SI-11 | Backend | ~351 sites across 52 files; not reachable anonymously. A shared error responder |
| `Access-Control-Expose-Headers` for the `RateLimit-*` family | — (defence in depth) | Backend | **Fixed 11-24** (`ce41d70`, PR #108); ships with the assistant deploy. Found by us: the API sends the headers and the browser has never been able to read one |
| Assistant endpoints deployed | — | Backend | Flip the flag — once it is wired into `release.yml` at all (§5.1) |
| System use notice text | AC-8 | Legal | A one-line change |
| Twilio token rotation | IA-5(7) | **Gustavo** | None. Open 21 days |
| Hardening report output analysed into POA&M entries | CM-6, CM-7, AC-2, AU-2 | **Gustavo → dashboard** | Read the `.txt` and write the entries. Open 8 days |
| **Close POA&M DVK-ADMIN-2026-001** | CM-3, SA-10, AU-6 | **Dashboard** | All four criteria met 11-23; the document says Open and its target date is **today** |
| **Write the 2026-11-23 incident record** | IR-4, IR-5, IR-6 | **Dashboard** | §5.2 |
| **Open a POA&M for the PlanetScale audit-grant limitation** | AU-9 | **Dashboard** | The backend already supplied the limitation, the compensating control and a 90-day decision date |
| **Open a POA&M for the `super_user` / MFA finding** | AC-2, AC-6, IA-2(1) | **Dashboard** | The remediation evidence exists; the entry does not |
| **Write the console's SSP section** | AC-6, AU-2 | **Dashboard** | The console is live; this is now overdue rather than pending |

---

## 5. What turned up while writing this

### 5.1 A flag the code reads can silently never reach production, and it has now happened twice

The 11-17 note recorded this about the console: `VITE_APP_FEATURE_PLATFORM_CONSOLE` was declared in `.env.dev.example` and **did not appear in `release.yml` at all**, so setting it in the `production` environment would have done nothing. It was fixed in #110 and #116.

**The same thing is true today of the assistant.** `VITE_APP_FEATURE_ASSISTANT` and `VITE_APP_ASSISTANT_STUB` are declared in `.env.dev.example` (lines 71 and 75) and **do not appear anywhere in `.github/`**. Six merged PRs, a feature that reads company data, and the flag that governs it is not a thing the release pipeline knows about.

Today that is harmless — the feature should be off, and it is off twice over. The problem is the class, not the instance:

- **`envValidation.test.js` tests the opposite direction.** It warns about a `VITE_APP_` variable that nothing reads. Nothing asserts that a variable the client *does* read is passed by the release. I checked: no test in `src/` reads `release.yml` for flags (`webConfigHosts.test.js` reads it, for hosts).
- **The `production` environment still has zero variables** (`total_count: 0`, verified today). `VITE_APP_CSP_ENFORCE`, `VITE_APP_COOKIE_SESSION` and `VITE_APP_FEATURE_SUBSCRIPTION_PLANS` are read from `vars.*` **with no fallback**, so all three are empty, so all three are off. For CSP and the cookie that matches the plan. The subscription plans page has now been in production and invisible for **nineteen days**.

For CM-6 the control is not "flags are declared" but "configuration settings are established and enforced". A declaration that the release can silently ignore is not enforcement, so the row goes to **Partial** until a test compares the `VITE_APP_*` names the client reads against the names `release.yml` passes, and fails on a flag that exists in one and not the other. That test is small and it closes the class.

### 5.2 Three hours down, nobody noticed, and there is no record

On 2026-11-23 a `web.config` change took **both production sites** down for about three hours. The cause was an XML comment containing `--`, which IIS refuses to parse. It is fixed (#132, #135) and a release is now refused if its `web.config` cannot be parsed (#136), which is the right engineering answer.

**The control gap is not the bug. It is that nobody knew.**

The reason is worth putting in the record verbatim, because it generalises: the service worker served the application from its precache, so **a browser already in use was measuring the cache, not the server**. Anyone with the dashboard open — including the people who would have reported it — saw a working application. The API lives on another machine and kept answering, so the backend's own monitoring saw nothing either.

What exists today: a scheduled external deployment check (#129, #131) that compares `version.json` against the expected tag and has run clean every ten hours since. **That check answers "is the deployed version the one we released", not "is the site up"** — it would not have gone red for this outage, because the version it read would have been correct right up until IIS stopped serving.

What does not exist:

1. **An incident record.** No timeline, no stated user impact, no detection time, no corrective actions. I searched `fedRAMP/` — there is nothing. IR-4, IR-5 and IR-6 are all evidenced by exactly this artifact, and a three-hour outage with none of it is a finding an assessor will reach without help.
2. **An availability check distinct from the version check.** One request for a page that cannot come from a precache, from outside both machines.

The honest framing for the record is also the most favourable one: this is the second time in eight days that a production problem was invisible from inside. The first produced POA&M `DVK-ADMIN-2026-001` and a working detective control. The second should extend it rather than start a new argument.

### 5.3 The POA&M is finished and still says it is open

`DVK-ADMIN-2026-001` sets four completion criteria and a target of **2026-11-25 — today**. Measured today:

| | Criterion | Evidence |
|---|---|---|
| 1 | Root cause recorded and fixed | The updater had never been installed; it is installed and deploying on its own |
| 2 | A stopped updater is visible within 20 minutes, from outside the VM | **The drill went red at 2026-11-23 16:19 UTC** (`workflow_dispatch`, conclusion `failure`) — the alarm path ran end to end against real data for the first time. The document's own wording: *"criterion 2 is met on the first drill run that goes red"* |
| 3 | Production states its version and the check reads it | `https://admin.devitrak.net/version.json` returns `admin-20261124-193949-51172fb`, matching the latest release and today's `main` |
| 4 | Change management describes the pipeline as it is | D3 rows 6 and 7 |

The five scheduled runs since then all conclude "Deployment reached production". **All four criteria are met and the header still reads `Status: Open`.** Closing it is a documentation edit, and leaving a satisfied POA&M open past its own target date reads worse to an assessor than the original weakness did.

### 5.4 The console is live, and the SSP does not mention it

Stated plainly because it is the single largest disclosure gap in the package. Devitrak staff can read any client company's inventory, transactions, people and audit log, from `ops.devitrak.net`, in production, today. The access design is sound and documented in this repository, the audit log is live, and the cross-client people index and bank details were removed before launch (#122, #123).

None of that is in the SSP. **Vendor staff reading customer data is disclosed, or it is a finding** — the 11-17 note already said so, when it was hypothetical. It is no longer hypothetical.

---

## 6. Where the evidence lives

- **Measured today (2026-11-25):** `curl -I https://admin.devitrak.net/`, `curl -I https://ops.devitrak.net/`, `curl https://admin.devitrak.net/version.json`, `curl -X OPTIONS https://db.devitrak.net/api/company/search-company -H "Origin: http://localhost:5522"`, `gh api .../environments/production/variables`, `gh api .../rulesets/26116340`, `gh run list --workflow=deploy-check.yml`, `npm audit --omit=dev`, `vitest run`, `eslint src`.
- **Code and tests:** `src/config/roles.js`, `envValidation.js`, `securityHeaders.js`, `legalNotices.js`; `src/api/sessionCredential.js`, `sessionHeaders.js`; `src/utils/userFacingError.js`; `src/pages/platform/**`; `src/pages/assistant/**`; their guard tests; `cypress/e2e/csp/csp-enforce.cy.js`; `cypress/e2e/platform/platform-access.cy.js`.
- **Pipeline:** `.github/workflows/ci.yml`, `release.yml`, `codeql.yml`, `deploy-check.yml`; `.github/audit-exceptions.json`; ruleset "Main" (id 26116340).
- **Plans and documents:** `fedRAMP/` — the action plan, D1–D3, `POAM_2026-11-18_deploy_not_observable.md`, and this note.
- **Coordination with the backend:** `reports/` here and `server-testing/reports/` there.
