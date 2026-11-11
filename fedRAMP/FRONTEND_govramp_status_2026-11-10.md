# GovRAMP status of the admin dashboard (2026-11-10)

**System:** admin.devitrak.net (React SPA, IIS behind openresty) · **Repository:** `grodriguezcontextglobal/testing-admin-dashboard` · **Baseline:** GovRAMP / FedRAMP Moderate (NIST 800-53 rev. 5); first target the **GovRAMP Single Security Snapshot** · **As of:** `main` at `fdaa074d`. Checked on 2026-11-10 against the code, the GitHub ruleset, `npm audit`, release `admin-20261110-211710-8b171d6` and the headers production serves (build of 21:42 UTC).

**Scope:** only what the browser client owns. Server controls (audit log, encryption at rest, backups, incident response, the API's own authorization) belong to the backend's package. Where a dashboard control waits on the server, the row says so.

**Replaces:** `FRONTEND_govramp_alignment_2026-11-06.md`. The work list is in `FRONTEND_govramp_pending_2026-11-10.md`.

---

## 1. Summary

**The client side is ready for the Snapshot.** Every row that is not met waits on the backend, on legal, on Gustavo, or on one more week of CSP reports. No open row is a known active exposure.

| Rows in §2 | 06-11 | **10-11** | Which, today |
|---|---|---|---|
| Met, with evidence | 19 | **21** | |
| Partial: works today; the stronger form depends on someone else | 6 | **5** | AC-4 company link, AC-8 legal text, SC-18 CSP enforce, CM-3 second reviewer, IA-5(7) Twilio rotation |
| Open | 2 | **1** | SC-23: the client is ready behind a flag, and the server's cookie is not |

**What changed since 2026-11-06 (PRs #68–#93):**

| Area | Change | PR |
|---|---|---|
| SC-18 | The CSP reports to `/api/csp-report` (`report-uri`, `report-to`), and Trusted Types are reported too. Live since 2026-11-09 21:04 UTC | #78, #80 |
| SC-18, SA-11 | E2E test: the build under the **enforcing** CSP, main screens, fails on any blocked resource. Required check on `main` since 2026-11-10. It found icons fetched from Iconify's API, which enforcing would have broken; fixed | #87, #92 |
| IA-2 | Recovery-codes notice on every sign-in | #81 |
| AC-4 | The company is chosen by its SQL id at sign-in, not by name | #83 |
| AC-4, AC-6 | Dev guard for company context; employees written with `roleType` only | #84 |
| AC-2 | The server removes staff access when an event ends; the client no longer sends the employee list | #86 |
| SC-23 | Session cookie on the client, behind `VITE_APP_COOKIE_SESSION` (off); the JWT is no longer copied into the persisted store | #88 |
| CM-8, SR-4 | The release SBOM was missing `react`, `react-dom`, `lodash`, `workbox-*` and about 100 more (an npm 11 bug). Fixed and checked on a release: 458 components | #89 |
| RA-5, SI-2 | Low and moderate advisories accepted in writing with a review date; every release's notes carry the audit result | #91 |
| RA-5 | Build tools moved to `devDependencies`; production audit is down to one low advisory | #82 |

---

## 2. Control by control

Status: **Met** · **Partial** · **Open** (with the owner).

### Access control and session (AC)

| Control | Status | How the dashboard meets it | Evidence |
|---|---|---|---|
| AC-2, AC-6 Account management, least privilege | **Met** in the client | One role system (`src/config/roles.js`, `resolveRoleType`, `hasPermission`); a guard test forbids role checks elsewhere. `Company.employees[]` is written with `roleType` only; the numeric `role` is no longer written (#84) | `roles.test.js`, `employeeRoleRetired.test.js` |
| AC-2 Removing access when an event ends | **Met** in the client (#86) | `EndEventButton` calls `POST /api/company/event-staff/deactivate`. The server decides, and keeps access for staff on another active event. Fallback only on Express's HTML 404. **Left on the server:** `update-company` still accepts `employees` from this flow | `eventStaffDeactivation.test.js` |
| AC-3 Access enforcement | **Met** in the client, enforced by the server | Gated UI uses `hasPermission`; the server enforces | Contract acknowledgement 2026-11-04 |
| AC-4 Information flow (company scope) | **Partial — backend** | The SQL company is chosen by id (#83). A dev guard flags any `company_id` that differs from `s-company-lq` (#84). **Left:** the Mongo company is still matched by name, because the Mongo document has no SQL id. The server's `COMPANY_CONTEXT_MODE` is `warn` | `loginUtils.test.js`, `devPayloadGuard.test.js` |
| AC-7 Unsuccessful logon attempts | **Met** | Lockout is server-side; the sign-in shows attempts left, lockout and retry time | Login tests |
| AC-8 System use notification | **Partial — legal** | A notice is shown on the sign-in screen. The text is not approved yet (`approvedByLegal: false`) | `legalNotices.test.js` |
| AC-11, AC-12 Session lock and termination | **Met** | Idle sign-out at 15 min with a warning, across tabs; 12 h maximum; a global 401 handler ends the session and says why | `idleSession.test.js`, `sessionExpiry.test.js` |

### Identification and authentication (IA)

| Control | Status | How | Evidence |
|---|---|---|---|
| IA-2(1) MFA | **Met** | MFA required with forced enrolment; recovery codes shown once; sign-in with a recovery code; reset-email step | `MfaEnrollmentModal.test.jsx` |
| IA-2 Recovery codes running out | **Met** (#81) | On every sign-in: none left, a persistent error; one or two left, a warning | `mfaRecovery.test.js` |
| IA-5 Authenticator management | **Met** | Passwords of 12 to 128 characters, verified only on the server; no hashes or secrets in the bundle (guard test) | Secret-in-bundle test |
| IA-5(7) Embedded secrets | **Partial — Gustavo** | No secret in the bundle or the repo. A Twilio token from a 2024 `.env` in the git history still has to be **rotated** | Backend reply 2026-11-04 §3 |

### System and communications protection (SC)

| Control | Status | How | Evidence |
|---|---|---|---|
| SC-8 Transmission confidentiality | **Met** | HSTS `max-age=31536000; includeSubDomains`; the build refuses a non-`https` API URL | `curl -I`, 2026-11-10 |
| SC-7, SI-10 Boundary headers | **Met** | `nosniff`, `X-Frame-Options: DENY` with `frame-ancestors 'none'`, `Referrer-Policy`, `Permissions-Policy`; `X-Powered-By` removed | `curl -I`, `securityHeaders.test.js` |
| SC-18 Mobile code / CSP | **Partial — one week of reports** | **Report-Only**, reporting to `/api/csp-report` since 2026-11-09. `script-src` allows no inline script or eval; `style-src 'unsafe-inline'` is an accepted risk (D1). **The E2E check under the enforcing policy is a required check**; it passes on all main screens. Switching to enforce (#11) waits for the server's CSP summary from 2026-11-16; rollback is one variable | `csp-enforce.cy.js`, `curl -I` |
| SC-18 Trusted Types | Reported (Report-Only) | `require-trusted-types-for 'script'` is reported, never enforced. Enforcing is decided from the reports (D2) | `securityHeaders.test.js` |
| SC-18 Reverse tabnabbing | **Met** | Every new tab opens without `window.opener`; guard test | `externalLinksGuard.test.js` |
| SC-23 Session authenticity | **Open — backend; client ready** | The token is still in `localStorage` and travels as `x-token`. **The client side is built and in production, off** (#88): with the flag on, the cookie and `X-CSRF-Token` are used and the token is not stored. Waits on the server's phase 1 and four answers: the CSRF field name, `X-CSRF-Token` in CORS (missing today), the MFA setup token, and the token kept in the sign-in answer | `sessionCredential.test.js`, backend note 2026-11-10 |
| SC-28 Data at rest in the browser | **Met** | No API response cached by the service worker; the offline queue holds 15 min at most and is emptied on sign-out; personal data in session storage only; sign-out clears every session key | `offlineCaching` tests, D1 |
| SC-13 Cryptography | **Met** | Cryptographic inventory kept (D4); update it when the cookie session is turned on | D4 |

### System and information integrity (SI)

| Control | Status | How | Evidence |
|---|---|---|---|
| SI-2, RA-5 Flaw remediation, vulnerability scanning | **Met** | `npm audit --omit=dev`: **0 critical, 0 high, 0 moderate**, 2 low packages (one advisory: `quill` 2.0.3, no fix, accepted until 2027-02-10 with its mitigation, D3). High or critical fails CI and the release unless accepted with an expiry. **Every release's notes record the audit result and the accepted risks.** Dependabot and CodeQL | `audit-exceptions.json`, release `8b171d6` notes |
| SI-10 Input handling / XSS | **Met** | The only HTML insertion (`DisplayArticle.jsx`) goes through DOMPurify; no `eval` or `new Function`; sign-in redirects only to own routes | Code review, D3 |
| SI-11 Error handling | **Met** | Messages to people go through `userFacingError.js`, never the error object; guard test | `userFacingErrorGuard.test.js` |
| SI-11, AU-9 Console output | **Met** | The production build drops every `console` call; guard test | `productionConsole.test.js` |

### Configuration, change management and development (CM, SA, SR)

| Control | Status | How | Evidence |
|---|---|---|---|
| CM-3, CM-4 Change control | **Met** | Ruleset "Main": no direct push, no force push, no deletion; PR required; **required checks "Lint, tests y build" and "CSP en modo enforce (E2E)"**. Releases are built by GitHub Actions; the server installs only a zip whose SHA-256 matches | Ruleset API, D3 |
| CM-3 Second-person review | **Partial — accepted decision** | No required approval (Gustavo's decision of 2026-10-29); the maintainer's merge is the approval | D3 |
| CM-6 Configuration settings | **Met** | Environment variables validated at build time; every flag declared in `.env.dev.example` | `envValidation.test.js` |
| SA-11 Developer testing | **Met** | **5,177 unit tests** in 312 files, coverage as a CI artifact; lint at 0; the E2E CSP check | CI artifacts |
| SA-10, SR, CM-8 Supply chain and inventory | **Met** | Actions pinned by SHA; gitleaks over the history; secret scanning. **The CycloneDX SBOM of every release is complete** (#89): 458 components, and CI refuses one that misses a direct dependency. **SBOMs of releases before 2026-11-10 20:20 UTC are incomplete** (no `react`, `workbox-*` and others); use a later one as evidence | Release `8b171d6` SBOM |

### Documents an assessor will ask for

| Document | Status |
|---|---|
| D1 Data kept in the browser | Done; add the cookie session when it is turned on |
| D2 Third parties in the browser | Done |
| D3 Change management | Done; updated 2026-11-10 with the second required check |
| D4 Cryptographic inventory | Kept; update with the cookie session |
| D5 Accessibility (Section 508 / VPAT) | Not started; not a GovRAMP control |

---

## 3. What is left, by owner

| Item | Control | Owner | Next step |
|---|---|---|---|
| CSP to enforce, then `img-src` narrowed and Trusted Types decided | SC-18, SC-7 | Backend (summary from 11-16), then dashboard | One clean week of reports; `VITE_APP_CSP_ENFORCE=true` and a release (#11, D5); `img-src` from the reports (#10, D4); D2 |
| HttpOnly session cookie | SC-23, AC-12 | Backend phase 1 and answers, then configuration | `X-CSRF-Token` into the CORS allow-list; staging with the flag on; then production |
| Mongo company ↔ SQL id link | AC-4 | Backend | Then the name match goes |
| `COMPANY_CONTEXT_MODE`, `SESSION_MODE`, `DB_COMPANY_PUBLIC_MODE` to `enforce` | AC-4, AC-12, AC-3 | Backend / Gustavo | Server configuration; company context after a week with no warnings |
| `role`-only employee entries | AC-6 | Backend | One-off migration (D8) |
| `update-company` rejects `employees` from the event-end flow | AC-2 | Backend | Once the new route is seen in use |
| System use notice text | AC-8 | Legal | Approve the text in `legalNotices.js` |
| Twilio token rotation | IA-5(7) | Gustavo | Rotate at Twilio |
| Browser check of #81, #83, #84, #86, #88 with real accounts | — | Gustavo | `FRONTEND_govramp_pending_2026-11-10.md` §6, #13 |

The three rows an assessor is most likely to score are **CSP in enforce**, **the session token out of `localStorage`** and **server sessions enforced**. All three are a configuration switch on our side once the server and the reports are ready.

---

## 4. Worth knowing before an assessment

- **Platform access (task #16, not a dashboard control yet).** The server has a flag, `AdminUser.super_user`, that bypasses company scoping for reads **and writes** in every company. It is the broadest permission in the system; an assessor will ask who has it and how it is reviewed (AC-2, AC-6). The plan for a read-only Devitrak console (`DESIGN_platform_console.md`) asks the backend for the list, and recommends dedicated `@devitrak.com` accounts, required MFA and every read audited.
- **Old SBOMs.** Releases before the #89 fix attached an incomplete SBOM (§2, SA-10). Quote a release from 2026-11-10 20:20 UTC or later.

---

## 5. Where the evidence lives

- **Code and tests:**
  - `src/config/roles.js`, `src/config/securityHeaders.js`, `src/config/sbom.js`, `src/config/auditGate.js`;
  - `src/api/sessionCredential.js`, `src/api/sessionHeaders.js`, `src/api/sessionExpiry.js`;
  - `src/hooks/idleSession.js`, `src/config/legalNotices.js`, `src/utils/userFacingError.js`;
  - their `*.test.js` files, including the guard tests;
  - `cypress/e2e/csp/csp-enforce.cy.js`.
- **Pipeline:** `.github/workflows/ci.yml` (lint, tests, SBOM, the CSP E2E job), `release.yml` (SBOM and the audit section in the notes), `codeql.yml`, `.github/dependabot.yml`, `.github/audit-exceptions.json`, the ruleset "Main".
- **Plans and documents:** `fedRAMP/` (action plan, D1–D3, the pending list) and `DESIGN_platform_console.md`.
- **Coordination with the backend:** `server-testing/reports/`. On 2026-11-10 there are three notes awaiting replies: the GovRAMP follow-up, the cookie session, and the platform console.
