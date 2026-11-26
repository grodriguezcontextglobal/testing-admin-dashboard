# Admin dashboard: certification readiness for GovRAMP, 2026-11-26

**System:** `admin.devitrak.net` and `ops.devitrak.net` — one React SPA, two origins, IIS on DEVITRACKAPP behind openresty
**Repository:** `grodriguezcontextglobal/testing-admin-dashboard`
**Baseline:** GovRAMP / FedRAMP Moderate (NIST SP 800-53 rev. 5). First target: the **GovRAMP Single Security Snapshot**
**As of:** `main` at `eacdbf47`; production serving `admin-20261125-191149-eacdbf4` (built 2026-11-25T19:11:49Z) on **both** origins
**Scope:** what the browser client owns. Server-side controls — the audit log itself, encryption at rest, backups, the API's own authorization — belong to the backend's package. Rows that wait on the server say so.

**This note is not the weekly snapshot.** `FRONTEND_govramp_status_2026-11-25.md` is, and it still stands; it was written yesterday. This one answers a different question: *what does the package need before it can be submitted*, control by control, with the evidence an assessor would be handed and the exact gap where there is none.

**Everything numeric below was measured on 2026-11-26.** Nothing is carried from yesterday's note. Where a value is identical to yesterday's, it was re-run and found identical, and it says so. §8 lists every command.

---

## 1. The short answer

**The controls are in better shape than the package.** Of the things an assessor scores, most of what the dashboard owns is built, running and evidenced by a test that fails if it regresses. What is missing is not mechanism — it is **four documents that do not exist and two switches nobody has thrown.**

That is the whole finding, and it has been the whole finding for three weeks.

| | Blocking the Snapshot | Owner | Age |
|---|---|---|---|
| 1 | **The console's SSP section.** Vendor staff read customer data in production, and the SSP does not say so | Dashboard | Live since 11-23 |
| 2 | **No incident record for the 2026-11-23 outage.** Three hours, both origins, nobody noticed | Dashboard | 3 days |
| 3 | **POA&M `DVK-ADMIN-2026-001` is satisfied and still says `Status: Open`** — its target date was yesterday | Dashboard | Past due |
| 4 | **Two POA&Ms never opened:** the PlanetScale audit-grant limitation, and the `super_user`/MFA finding of 11-09 | Dashboard | 8 and 17 days |
| 5 | **CSP is still `Report-Only`** in production. The switch needs the backend's report summary, due 11-16 | Backend → us | 10 days late |
| 6 | **The session token is still in `localStorage`.** The client half shipped 11-10 and no release has ever been built with the flag on | **Dashboard** | 16 days |

Items 1–4 are writing. Items 5–6 are a configuration value and a release. **None of the six requires code that does not exist.**

An assessor reading the package today finds a system whose access control, session handling, change control, supply chain and audit logging are genuinely in place, and a document set that describes a system one release behind the one that is running. The second thing is what produces findings.

---

## 2. What moved in the last 24 hours

Three pull requests merged and one release shipped, so the numbers in yesterday's note are already stale in two rows.

| | 2026-11-25 | 2026-11-26 |
|---|---|---|
| Production build | `admin-20261124-193949-51172fb` | **`admin-20261125-191149-eacdbf4`** (#147, #148, #149) |
| `Access-Control-Expose-Headers` for `RateLimit-*` | Fixed in the API, **not deployed** | **Live.** Verified by preflight today |
| POA&M `DVK-ADMIN-2026-001` | Satisfied, open, **due today** | Satisfied, open, **past due** |
| Incident record for 11-23 | Does not exist | Does not exist |
| Suite on `main` | 5,554 / 332 | **5,562 / 332** |

Nothing else changed. CSP is byte-for-byte the policy served yesterday; the `production` environment still holds zero variables; `localhost:5522` is still in the production CORS allow-list with credentials.

**Not yet merged, in the working tree today** (relevant because one of them is a control, §3 AC-2):

- The console gate now asks `GET /api/platform/me` instead of trusting the copy of `platformAccess` that redux-persist keeps in `localStorage`. Until this merges, **a revoked operator keeps the console on screen until they sign out**, not until they reload.
- Every console read of the Mongo `Event` collection carries `type: 'event'`, in the hook rather than in a screen, so no screen can omit it.
- Suite in the working tree: **5,595 in 334 files**, all passing; `eslint src` at 0.

---

## 3. Control by control

**Met** · **Partial** · **Open**, with the owner. Every row re-checked 2026-11-26. "Evidence" names what an assessor is handed.

### 3.1 Access control (AC)

| Control | Status | Implementation | Evidence |
|---|---|---|---|
| AC-2, AC-6 Account management, least privilege | **Met** | One role system — `src/config/roles.js`, `resolveRoleType`, `hasPermission`. A guard test fails the build if a role check appears anywhere else | `roles.test.js`, `employeeRoleRetired.test.js` |
| AC-2 Access removed when an event ends | **Met** | The server decides; `update-company` ignores an `employees` payload and reports it in `ignored_fields` | `eventStaffDeactivation.test.js` |
| AC-2 **Revocation takes effect without a sign-out** | **Partial — dashboard** | The console gate reads `platformAccess` from the sign-in response, and redux-persist writes that store to `localStorage`, so the copy outlives the tab. Every `/api/platform` request is still refused by the server, so **nothing leaks** — but the operator keeps the screens. The fix (ask `/me`, treat the sign-in field as a hint that can only refuse) is written and tested, not merged | `platformGate.test.js`, `usePlatformMe.test.js` (working tree) |
| AC-3 Access enforcement | **Met** in the client, enforced by the server | Gated UI goes through `hasPermission` | Backend contract ack, 2026-11-04 |
| AC-4 Information flow (company scope) | **Partial — backend** | Every SQL event and item lookup names its company, and a source-reading guard fails CI on a new call site that does not (#106, #109; in production since 11-24). **Left:** the Mongo company is still matched *by name* — no `sql_company_id` exists on either side — and `COMPANY_CONTEXT_MODE` is still `warn` | `eventSqlLookup.test.js`, `devPayloadGuard.test.js` |
| AC-6 Console access | **Met** | Live on `ops.devitrak.net/platform` (the host redirects `/` → `/platform`, verified today). Entry needs **both** the server sending `platformAccess: true` **and** a sign-in address on the closed `@devitrak.com` allow-list; the domain check can only refuse, never grant. The server re-reads all five facts from the database on every call and is the authority | `platform-access.cy.js` — 9 cases, runs on every PR; backend M1 note 2026-11-19 |
| AC-7 Unsuccessful logon attempts | **Met** | Server-side lockout; the sign-in screen shows attempts remaining and the retry time | Login tests |
| AC-8 System use notification | **Partial — legal** | The notice is on the sign-in screen. The text is unapproved: `approvedByLegal: false` | `legalNotices.test.js` |
| AC-11, AC-12 Session lock and termination | **Met** | Idle sign-out at 15 minutes with a warning, synchronised across tabs; 12-hour maximum; a global 401 handler ends the session and says why | `idleSession.test.js`, `sessionExpiry.test.js` |

### 3.2 Identification and authentication (IA)

| Control | Status | Implementation | Evidence |
|---|---|---|---|
| IA-2(1) Multi-factor | **Met** | Required, with forced enrolment; recovery codes shown once; sign-in accepts a recovery code | `MfaEnrollmentModal.test.jsx` |
| IA-2 Recovery codes exhausted | **Met** | Checked on every sign-in | `mfaRecovery.test.js` |
| IA-5 Authenticator management | **Met** | 12–128 characters, verified only server-side; no secret in the bundle | Secret-in-bundle guard test |
| IA-5(7) Embedded secrets | **Partial — Gustavo** | No secret in the bundle or the working tree. **A Twilio token from a 2024 `.env` remains in the git history and has not been rotated.** Open since 2026-11-04 — 22 days | Backend reply 2026-11-04 §3 |

> Checked today and worth recording because it reads like a finding and is not one: `VITE_APP_TWILIO_AUTH_TOKEN` and `VITE_APP_AWS_HEADER_AUTH` appear in `src/`, but **only inside `envValidation.test.js`**, as the fixtures for "warn about a variable nothing reads". No shipping code reads either name.

### 3.3 System and communications protection (SC)

| Control | Status | Implementation | Evidence |
|---|---|---|---|
| SC-8 Transmission confidentiality | **Met** | `Strict-Transport-Security: max-age=31536000; includeSubDomains` on both origins; the build refuses a non-`https` API URL | `curl -I`, both origins, 2026-11-26 |
| SC-7, SI-10 Boundary headers | **Met** | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(self)`, no `X-Powered-By`. **Identical on both origins**, re-verified today | `curl -I`, both origins |
| SC-18 Mobile code / CSP | **Partial — waiting on the backend** | **Still `Content-Security-Policy-Report-Only`** in production, read today and byte-identical on both origins. The policy is strict where it matters: `script-src` permits no inline script and no `eval`; `object-src 'none'`; `base-uri 'self'`; `form-action 'self'`; `frame-ancestors 'none'`. `style-src 'unsafe-inline'` is an accepted risk (D1). The enforcing policy is exercised by an E2E check that is **required on `main`** and passes. The switch is `VITE_APP_CSP_ENFORCE=true`, which needs the report summary **due 2026-11-16 — 10 days late** | `csp-enforce.cy.js`; `curl -I` 2026-11-26 |
| SC-18 Trusted Types | **Partial** | `require-trusted-types-for 'script'` is present in the policy — and the policy is Report-Only, so it is reported and never enforced. It enforces with the same switch as the row above | `securityHeaders.test.js`; policy read today |
| SC-18 Reverse tabnabbing | **Met** | Every new tab opens without `window.opener`; guard test | `externalLinksGuard.test.js` |
| SC-23 Session authenticity | **Open — dashboard** | The token is in `localStorage` and travels as `x-token`. The client half shipped 11-10 and was tested end to end against production on 11-17. `VITE_APP_COOKIE_SESSION` is read from `vars.*` with no fallback, and the `production` environment has **zero variables** (verified today), so no release has ever been built with it on. **This row is ours, not the backend's** — server phase 1 has been deployed since 11-17 | `sessionCredential.test.js`; `release.yml:85`; environment API |
| SC-28 Data at rest in the browser | **Met** | No API response is cached by the service worker; the offline queue holds 15 minutes at most and empties on sign-out | `offlineCaching` tests, D1 |
| SC-13 Cryptography | **Met** | Cryptographic inventory kept and current | D4 |

### 3.4 System and information integrity (SI)

| Control | Status | Implementation | Evidence |
|---|---|---|---|
| SI-2, RA-5 Flaw remediation | **Met** | `npm audit --omit=dev` run today: **0 critical, 0 high, 0 moderate, 2 low** — the two accepted `quill` advisories, review date 2027-02-10. High or critical fails CI and the release unless accepted with an expiry. Dependabot and CodeQL both on | `.github/audit-exceptions.json`, audit run 2026-11-26 |
| SI-10 Input handling / XSS | **Met** | The only HTML insertion goes through DOMPurify; no `eval`; sign-in redirects only to the app's own routes; the assistant renders server text as React children, never as HTML, with a guard test | `assistantGate.test.js`, D3 |
| SI-11 Error handling | **Met** in the client | Messages shown to people never carry the error object; guard test | `userFacingErrorGuard.test.js` |
| SI-11, AU-9 Console output | **Met** | The production build drops every `console` call; guard test | `productionConsole.test.js` |

### 3.5 Audit and accountability (AU)

| Control | Status | Implementation | Evidence |
|---|---|---|---|
| AU-2, AU-12 Console reads logged | **Met — closed 2026-11-19** | Every read of a client's data by Devitrak staff is written to `platform_audit_log` **before** the response. Denials carry a reason, and `not_on_allowlist` is kept distinct from `wrong_domain` so the two can be counted separately | `BACKEND_console_m1_live_2026-11-19.md` |
| AU-9 Audit log protection | **Partial — dashboard, undocumented** | See below | — |

**AU-9 carries a limitation that must be in the package rather than in a report.** DC2 asked that the application's database user hold `INSERT` and `SELECT` only on `platform_audit_log`. The engine is PlanetScale (`8.4.11-Vitess`), which grants per password with scope roles, not per table: *"insert and select on this one table"* is **not expressible**. The compensating control that exists instead is a test that walks the source tree and fails if an `UPDATE` or `DELETE` against that table appears anywhere but the retention job. The backend recorded an open decision at 90 days — move the log to a store that can enforce it, or justify the limitation in the SSP.

**Neither the limitation nor the 90-day decision is in a POA&M entry.** It is the single most assessor-visible gap in this family, because it is a known, documented, accepted deviation with no paperwork.

### 3.6 Configuration management, development, supply chain (CM, SA, SR)

| Control | Status | Implementation | Evidence |
|---|---|---|---|
| CM-3, CM-4 Change control | **Met** | Ruleset "Main" (id 26116340), **enforcement `active`**, verified today: no deletion, no force push, pull request required, required checks **"Lint, tests y build"** and **"CSP en modo enforce (E2E)"**. Releases are built by Actions; the server installs only a zip whose SHA-256 matches | Ruleset API, 2026-11-26 |
| CM-3 Second-person review | **Partial — accepted decision** | `required_approving_review_count: 0`, re-read today, with `require_code_owner_review: false`. The maintainer's merge is the approval (decision of 2026-10-29). Of everything the dashboard controls, this is the row an assessor is most likely to question | Ruleset API, D3 |
| CM-6 Configuration settings | **Partial — dashboard** | Measured exactly today, see below | `envValidation.test.js`, `release.yml` |
| CM-7 Least functionality | **Met** | The gate bypass flag cannot ship — a guard test fails the build if it is ever true in a build config — and it is deliberately separate from the sample-data flag, so turning on demo data can never open the door | `featureFlags.test.js` |
| SA-11 Developer testing | **Met** | **5,562 tests in 332 files on `main`**; 5,595 in 334 in the working tree, run today, all passing; `eslint src` at 0; coverage published as a CI artifact; the enforcing-CSP E2E required on `main`. The console access spec (9 cases) runs on every pull request but is **not a required check** | CI artifacts; local run 2026-11-26 |
| SA-10, SR, CM-8 Supply chain and inventory | **Met** | Actions pinned by SHA; gitleaks over the history; secret scanning on. The release SBOM is complete and CI refuses one missing a direct dependency. **SBOMs built before 2026-11-10 20:20 UTC are incomplete — quote a later release** | Release SBOM |

**CM-6, measured rather than asserted.** The control is not "flags are declared", it is "configuration settings are established and enforced". Today:

- **15** `VITE_APP_*` names are read by shipping code (tests excluded).
- **13** are passed by `.github/workflows/release.yml`.
- The two that are not: **`VITE_APP_FEATURE_ASSISTANT`** and **`VITE_APP_ASSISTANT_STUB`**. They appear **nowhere in `.github/`**. Six merged PRs built that feature; the flag governing it is not something the release pipeline knows exists.
- The `production` environment holds **zero variables**, so `VITE_APP_CSP_ENFORCE`, `VITE_APP_COOKIE_SESSION` and `VITE_APP_FEATURE_SUBSCRIPTION_PLANS` — all read from `vars.*` with no fallback — are empty, and therefore off. For the first two that matches the plan. **The subscription plans page has now been in production and invisible for twenty days.**

Today this is harmless: the assistant should be off, and it is off twice over. **The problem is the class, not the instance.** `envValidation.test.js` tests the opposite direction — it warns about a declared variable nothing reads. Nothing asserts that a variable the client *does* read is passed by the release.

The three commands in §8 that produced the numbers above **are** the missing test. Until it exists and fails on a mismatch, a declaration the release can silently ignore is not enforcement, and this row stays Partial.

### 3.7 Incident response (IR)

| Control | Status | Implementation | Evidence |
|---|---|---|---|
| IR-4, IR-5, IR-6 Incident handling, monitoring, reporting | **Open — dashboard** | A three-hour total outage of both production origins on 2026-11-23 has **no incident record**: no timeline, no stated user impact, no detection time, no corrective-action entry. The code fix is merged (#132, #135) and a release is now refused if its `web.config` cannot be parsed (#136). The control artifact does not exist | §5 |

### 3.8 Contingency and availability (CP)

| Control | Status | Implementation | Evidence |
|---|---|---|---|
| CP-2, SI-4 Detection of a production failure | **Partial — dashboard** | A scheduled external check compares `version.json` against the expected tag (#129), proves its own alarm fires in drill mode (#131), and has run **clean on its last six scheduled runs, most recently 2026-11-26T15:41Z**. It answers *"is the deployed version the one we released"* — **not** *"is the site up"*. It would not have gone red for the 11-23 outage | `gh run list --workflow=deploy-check.yml` |

---

## 4. The evidence package: what exists, what does not

An assessor asks for artifacts, not for assurances. This is the inventory.

| Artifact | Controls | State |
|---|---|---|
| D1 Data kept in the browser | SC-28, SC-18, AC-4 | **Done.** Add the cookie session when it is turned on |
| D2 Third parties in the browser | SC-18, SA-9 | **Done**, finishes with the CSP summary |
| D3 Change management | CM-3, CM-4, SA-10 | **Done**, updated 2026-11-23 (rows 6 and 7, the deployment chain) |
| D4 Cryptographic inventory | SC-13 | **Kept.** Update with the cookie session |
| D5 Accessibility (Section 508 / VPAT) | — | Not started; **not a GovRAMP control** |
| POA&M `DVK-ADMIN-2026-001` | CM-3, SA-10, AU-6 | **Satisfied on all four criteria; header still reads `Status: Open`; target date 2026-11-25, now past** |
| **Console SSP section** | AC-6, AU-2, AC-4 | **Does not exist** |
| **Incident record, 2026-11-23** | IR-4, IR-5, IR-6 | **Does not exist** |
| **POA&M — PlanetScale audit-grant limitation** | AU-9 | **Does not exist.** The backend already supplied the limitation, the compensating control and the 90-day decision date |
| **POA&M — `super_user` / MFA finding, 2026-11-09** | AC-2, AC-6, IA-2(1) | **Does not exist.** 22 of 47 active accounts held the flag, none with MFA; remediated 11-16 to the intended four. The remediation evidence exists; the entry does not |

**Four of the ten rows are missing documents, and every one of them documents something that is already fixed or already decided.** That is the cheapest work in this report and the most damaging to leave undone: an assessor who finds a satisfied POA&M still marked Open, or a live cross-tenant console absent from the SSP, stops trusting the rest of the package.

### Why the console SSP section is first

Stated plainly: **Devitrak staff can read any client company's inventory, transactions, people and audit log, from `ops.devitrak.net`, in production, today.**

The design is sound and documented in this repository — a closed allowlist, a domain check that can only refuse, MFA, the server as the authority, every read logged before the response, and the cross-client index of people and the bank details removed *before* launch (#122, #123). None of that is in the SSP.

Vendor staff reading customer data is disclosed, or it is a finding. The 11-17 note said so while it was still hypothetical. It stopped being hypothetical on 11-23.

---

## 5. The 2026-11-23 outage, and why it belongs in the package

On 2026-11-23 a `web.config` change took **both production sites** down for about three hours. The cause was an XML comment containing `--`, which IIS refuses to parse.

**The control gap is not the bug. It is that nobody knew.**

The reason generalises, which is why it should be in the record verbatim: the service worker served the application from its precache, so **a browser already open was measuring the cache, not the server**. Everyone with the dashboard open — including the people who would have reported it — saw a working application. The API runs on another machine and kept answering, so the backend's monitoring saw nothing either.

What exists: the version check described in §3.8, clean on every run. **It answers the wrong question for this failure** — the version it read would have been correct right up until IIS stopped serving.

What does not exist:

1. **An incident record.** No timeline, no user impact, no detection time, no corrective actions. IR-4, IR-5 and IR-6 are evidenced by exactly this artifact, and a three-hour outage with none of it is a finding an assessor reaches without help.
2. **An availability check distinct from the version check** — one request for a page that cannot be served from a precache, made from outside both machines.

The honest framing is also the most favourable one: this is the second time in eight days that a production problem was invisible from inside. The first produced `DVK-ADMIN-2026-001` and a working detective control. The second should **extend that POA&M rather than start a new argument** — same weakness class, one layer further out.

---

## 6. Blocking items, by owner

| Item | Control | Owner | Age | What we do when it lands |
|---|---|---|---|---|
| **CSP report summary (DS1)**, due 11-16 | SC-18 | Backend | **10 days late** | Finish D2, narrow `img-src`, set `VITE_APP_CSP_ENFORCE=true`, release |
| **Build and release with the cookie flag on** | SC-23 | **Dashboard** | 16 days | This is the whole item. Server phase 1 deployed since 11-17 |
| **Write the console's SSP section** | AC-6, AU-2 | **Dashboard** | Overdue | — |
| **Write the 2026-11-23 incident record** | IR-4/5/6 | **Dashboard** | 3 days | — |
| **Close `DVK-ADMIN-2026-001`** | CM-3, SA-10, AU-6 | **Dashboard** | Past due | A documentation edit |
| **Open the PlanetScale audit-grant POA&M** | AU-9 | **Dashboard** | 8 days | — |
| **Open the `super_user`/MFA POA&M** | AC-2, AC-6, IA-2(1) | **Dashboard** | 17 days | — |
| **Merge the `/me` console gate** | AC-2 | **Dashboard** | Written, tested | Revocation stops needing a sign-out |
| **A CM-6 test: flags read vs. flags released** | CM-6 | **Dashboard** | — | Closes the class, not the instance |
| **An availability check, not a version check** | CP-2, SI-4 | **Dashboard** | — | Extends `DVK-ADMIN-2026-001` |
| `localhost` origins out of the production CORS allow-list | AC-4, SC-7 | Backend + dashboard | **Still open today:** `Origin: http://localhost:5522` returns that origin with `Allow-Credentials: true` | Agreed to come out with `SameSite=Lax` on cookie production day |
| A real staging host with its own API origin | AC-4, SC-7, CA-2 | Dashboard → proposal | — | The permanent fix behind the row above |
| Mongo company ↔ SQL id link (DS5) | AC-4 | Backend | — | Replace the name match in `resolveMongoCompany` |
| `COMPANY_CONTEXT_MODE`, `SESSION_MODE`, `DB_COMPANY_PUBLIC_MODE` → `enforce` | AC-3, AC-4, AC-12 | Backend / Gustavo | — | None |
| Database error text returned to any session | SI-11 | Backend | — | ~351 sites in 52 files; not reachable anonymously. A shared error responder |
| System use notice text | AC-8 | **Legal** | — | A one-line change |
| **Twilio token rotation** | IA-5(7) | **Gustavo** | **22 days** | None |
| VM hardening report analysed into POA&M entries | CM-6, CM-7, AC-2, AU-2 | **Gustavo → dashboard** | 9 days | Read the `.txt`, write the entries |

**Eleven of the nineteen rows are ours, and eight of those eleven are writing or a configuration value.**

---

## 7. Recommended order

Not by control weight — by how much package credibility each hour buys.

1. **Close `DVK-ADMIN-2026-001`** (minutes). A satisfied POA&M left open past its own target date reads worse than the weakness it records.
2. **Write the 11-23 incident record** (an hour), extending that POA&M with the availability check rather than opening a new item.
3. **Open the two missing POA&Ms** (an hour). Both describe things already decided; neither needs new analysis.
4. **Write the console's SSP section** (half a day). The largest disclosure gap in the package.
5. **Merge the `/me` gate** (ready now). Makes AC-2 true in the live system, not only in the design.
6. **Release with `VITE_APP_COOKIE_SESSION=true`.** Sixteen days of client-side readiness that nobody can see.
7. **Add the CM-6 flag test.** Small, and it closes a class that has already bitten twice.
8. **Chase the CSP summary.** The only blocking item we cannot do ourselves.

Steps 1–4 are documents about work that is already finished. They cost one day between them, and they are the difference between a package that describes the running system and one that does not.

---

## 8. How every number here was produced

Run on 2026-11-26, in this order:

```bash
curl -I https://admin.devitrak.net/            # headers, CSP mode
curl -I https://ops.devitrak.net/              # same set, second origin; 302 → /platform
curl    https://admin.devitrak.net/version.json
curl    https://ops.devitrak.net/version.json  # both origins, same build
curl -X OPTIONS https://db.devitrak.net/api/company/search-company \
     -H "Origin: http://localhost:5522" -H "Access-Control-Request-Method: POST" -I
gh api .../environments/production/variables --jq .total_count        # 0
gh api .../rulesets/26116340                                          # active, 4 rules, 0 approvals
gh run list --workflow=deploy-check.yml --limit 6                     # 6 × success
npm audit --omit=dev                                                  # 0/0/0/2
./node_modules/.bin/vitest run                                        # 5,595 in 334, working tree
./node_modules/.bin/eslint src                                        # exit 0
```

The CM-6 numbers, which are the three commands that should become a test:

```bash
grep -o "^VITE_APP_[A-Z_]*" .env.dev.example | sort -u                      # declared: 14
grep -o "^ *VITE_APP_[A-Z_]*:" .github/workflows/release.yml | tr -d ' :' | sort -u   # released: 13
# every VITE_APP_* read by src/ excluding *.test.*                          # read: 15
# read − released = VITE_APP_FEATURE_ASSISTANT, VITE_APP_ASSISTANT_STUB
```

**Where the evidence lives**

- **Code and guard tests:** `src/config/roles.js`, `envValidation.js`, `securityHeaders.js`, `legalNotices.js`, `featureFlags.js`; `src/api/sessionCredential.js`, `sessionHeaders.js`; `src/utils/userFacingError.js`; `src/pages/platform/**`; `src/routes/authorized/PlatformGuard.jsx`; `src/pages/assistant/**`.
- **Pipeline:** `.github/workflows/ci.yml`, `release.yml`, `codeql.yml`, `deploy-check.yml`; `.github/audit-exceptions.json`; ruleset "Main" (id 26116340).
- **Documents:** `fedRAMP/` — the action plan, D1–D3, `POAM_2026-11-18_deploy_not_observable.md`, `FRONTEND_govramp_status_2026-11-25.md`, and this note.
- **Backend coordination:** `reports/` here, and `server-testing/reports/` there.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
