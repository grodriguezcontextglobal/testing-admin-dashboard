# GovRAMP alignment of the admin dashboard (2026-11-06)

**System:** admin.devitrak.net (React SPA, IIS behind openresty) · **Repository:** `grodriguezcontextglobal/testing-admin-dashboard` · **Baseline:** GovRAMP / FedRAMP Moderate (NIST 800-53 rev. 5), first target the **GovRAMP Single Security Snapshot** · **As of:** `main` at `4442a29a`, checked on 2026-11-06 against the code, the GitHub settings, `npm audit` and the headers `admin.devitrak.net` serves.

**Scope:** only what the browser client owns. Server controls (audit log, encryption at rest, backups, incident response, the API's own authorization) belong to the backend's package; where a dashboard control waits on the server, it says so.

---

## 1. Summary

The client side is **ready for the Snapshot, with two open rows**, both waiting on the backend. Nothing open is a known active exposure.

| Rows in §2 | Count | Which |
|---|---|---|
| Met, with evidence | 19 | |
| Partial: works today, the stronger form depends on someone else | 6 | AC-4 (B7), AC-8 text, recovery-codes banner, CSP enforce, second-person review, Twilio rotation |
| Open, waiting on the backend | 2 | SC-23 cookie (B3), event-end access removal (B6) |

What changed since the last report to the backend (`FRONTEND_fedramp_dashboard_status_2026-10-26.md`):
- PRs #51–#67 merged and released (production `Last-Modified` 2026-11-05 17:23 GMT).
- Lint at **0** and enforced by CI (`npm run lint`, `--max-warnings 0`).
- **SI-11:** no raw error objects reach the screen; a token leak through an error toast was closed.
- **SC-18:** every new tab opens without `window.opener`.
- **5,005 unit tests** in 302 files, all green on `main`.

---

## 2. Control by control

Status: **Met** · **Partial** · **Open** (with the owner).

### Access control and session (AC)

| Control | Status | How the dashboard meets it | Evidence |
|---|---|---|---|
| AC-2, AC-6 Account management, least privilege | **Met** in the client | One role system (`src/config/roles.js`, `resolveRoleType`, `hasPermission`); a guard test forbids role checks elsewhere. The numeric role is no longer sent in scope bodies (B5, PR #57). The server decides on `roleType` / `role_level` | `roles.test.js`, PR #57 |
| AC-2 Removing access when an event ends | **Open — backend** (B6) | Today the client sends the whole employee list to `update-company`. The backend will add `POST /api/company/event-staff/deactivate` and then stop accepting `employees` in that route | Backend reply 2026-11-04, §1.3 |
| AC-3 Access enforcement | **Met** in the client, enforced by the server | Gated UI uses `hasPermission`. Retired header `s-token-lq` no longer sent (B4, PR #56). The three contract changes of 2026-11-04 (logout 401 without token, `company-staff` 403, `receivers-pool` 403) were checked against every caller | `FRONTEND_contract_changes_ack_2026-11-04.md` |
| AC-4 Information flow (company scope) | **Partial — backend** (B7) | `x-company-id` and `s-company-lq` are set per route by `sessionHeaders.js`. The company is still matched by name at login until the server returns `sqlCompanyId` | Backend reply §1.4, §2.7 |
| AC-7 Unsuccessful logon attempts | **Met** | Lockout is server-side; the login shows `attemptsRemaining`, `accountLocked`, `retryAfter` | Login tests |
| AC-8 System use notification | **Partial — Gustavo / legal** | A notice is shown on the sign-in screen (`src/config/legalNotices.js`). The text is not yet approved by legal (`approvedByLegal: false`) | `legalNotices.test.js` |
| AC-11, AC-12 Session lock and termination | **Met** | Idle logout at **15 min** with a warning 2 min before, synced across tabs (`src/hooks/idleSession.js`, `useIdleSession.js`). 12 h maximum session. Global 401 handler ends the session and explains why (`idle`, `revoked`) in `src/api/sessionExpiry.js`. No "Remember me" | `idleSession.test.js`, `useIdleSession.test.js`, `sessionExpiry.test.js` |

### Identification and authentication (IA)

| Control | Status | How | Evidence |
|---|---|---|---|
| IA-2(1) MFA | **Met** | MFA required, with forced enrollment; recovery codes shown once with copy/download and confirmation; login with a recovery code; the reset-email step (A5, PR #58) | `MfaEnrollmentModal.test.jsx`, PR #58 |
| IA-2 Recovery codes running out | **Partial — backend** | The banner waits for `recoveryCodesRemaining` on every login (backend: will build) | Backend reply §2.4 |
| IA-5 Authenticator management | **Met** | Passwords 12–128 on registration, invitation and change; verified only on the server; no hashes or secrets in the bundle (guard test) | Secret-in-bundle test |

### System and communications protection (SC)

| Control | Status | How | Evidence |
|---|---|---|---|
| SC-8 Transmission confidentiality | **Met** | HSTS `max-age=31536000; includeSubDomains`; build refuses a non-`https` API URL | `curl -I` on 2026-11-06 |
| SC-7, SI-10 Boundary headers | **Met** | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` + `frame-ancestors 'none'`, `Referrer-Policy`, `Permissions-Policy`; `X-Powered-By` removed. A test reads `public/web.config` so they cannot be lost | `curl -I`, `securityHeaders` test |
| SC-18 Mobile code / CSP | **Partial — backend, then a date** | CSP is served in **Report-Only** since 2026-10-28, with only the real sources (Stripe, fonts, S3, the API origin). Moving to enforce needs `POST /api/csp-report` (backend item 4) so violations are seen before blocking | `curl -I` |
| SC-18 Reverse tabnabbing | **Met** (2026-11-05) | Every `window.open(..., "_blank")` passes `noopener,noreferrer`; every `target="_blank"` has `rel`. Guard test | `externalLinksGuard.test.js`, PR #67 |
| SC-23 Session authenticity | **Open — backend** (B3) | The token is still in `localStorage` as `x-token`. Phase 1 (server sets an HttpOnly cookie, CSRF token) has to land first; the client side (`withCredentials`, `X-CSRF-Token`) is phase 2 | Backend reply §1.1, date pending |
| SC-28 Data at rest in the browser | **Met** | No API responses cached by the service worker; the offline write queue keeps requests 15 min at most and is emptied on logout; personal data in the store lives in session storage only; logout clears every key in `SESSION_STORAGE_KEYS` | `offlineCaching.js` tests, D1 document |
| SC-13 Cryptography | **Met** | Cryptographic inventory kept; to be updated when B3 changes the session (D4) | Inventory document |

### System and information integrity (SI)

| Control | Status | How | Evidence |
|---|---|---|---|
| SI-2, RA-5 Flaw remediation, vulnerability scanning | **Met** | `npm audit --omit=dev`: **0 critical, 0 high**, 4 moderate, 4 low (`quill` 2.0.3, `deepmerge`). CI fails on a new high or critical unless `.github/audit-exceptions.json` accepts it with a reason and expiry (list empty today). Dependabot for npm, actions and Docker. CodeQL on every PR | CI log, `audit-exceptions.json`, `codeql.yml` |
| SI-10 Input handling / XSS | **Met** | The only HTML insertion goes through DOMPurify; no `eval` or `new Function`; post-login redirects only to own routes (`returnPathFrom`) | Code review 2026-11-05 |
| SI-11 Error handling | **Met** (2026-11-05) | Messages shown to people go through `src/utils/userFacingError.js`: the server's `msg`, a network notice, or a generic text, never the error object. This closed a case where `JSON.stringify(error)` put the `x-token` in a toast. Guard test forbids the old patterns | `userFacingError.test.js`, `userFacingErrorGuard.test.js`, PR #67 |
| SI-11, AU-9 Console output | **Met** (2026-11-06, E3) | The production build drops every `console` method (`src/config/productionConsole.js`, passed to esbuild as `pure`). Before, 125 `console.error` and 45 `console.warn` reached the bundle, and some printed a whole axios error with its headers. A guard test forbids arrow functions that return a console call, which esbuild cannot drop. Left: 5 `console.error` inside the `xlsx` library (WK1 opcode messages, no data) | `productionConsole.test.js` |

### Configuration, change management and development (CM, SA, SR)

| Control | Status | How | Evidence |
|---|---|---|---|
| CM-3, CM-4 Change control | **Met** | Ruleset "Main": no direct push, no force push, no deletion; PR required; required check "Lint, tests y build". Every release is built by GitHub Actions; the server installs only a zip whose SHA-256 matches | D3 document, ruleset API |
| CM-3 Second-person review | **Partial — accepted decision** | `required_approving_review_count: 0` (Gustavo's decision of 2026-10-29, option a). Approval is the maintainer's merge. The `production` environment has no required reviewer either, so a merged PR reaches production about 5 minutes after its release | D3 document |
| CM-6 Configuration settings | **Met** | Environment variables validated at build time | Build config tests |
| SA-11 Developer testing | **Met** | 5,005 unit tests, coverage report as a CI artifact, lint at 0 and enforced | CI artifacts |
| SA-10, SR Supply chain | **Met** | Actions pinned by SHA; CycloneDX SBOM attached to every release; gitleaks over the history; GitHub secret scanning and push protection | `release.yml`, PR #49, #50 |
| IA-5(7) Embedded secrets | **Partial — Gustavo** | No secrets in the bundle or the repo now. A Twilio token from a 2024 `.env` in the history still has to be **rotated** (the server does not call Twilio today, so rotation breaks nothing) | Backend reply §3 |

### Documents an assessor will ask for

| Document | Status |
|---|---|
| D1 Data kept in the browser | Done, `FRONTEND_D1_client_side_data_2026-11-02.md` |
| D2 Third parties in the browser | Done, `FRONTEND_D2_third_parties_in_browser_2026-11-02.md` |
| D3 Change management | Done, `FRONTEND_D3_change_management_2026-11-03.md` (lint line updated 2026-11-06: 0 warnings, enforced) |
| D4 Cryptographic inventory | Kept; update with B3 |
| D5 Accessibility (Section 508 / VPAT) | Not started; not a GovRAMP control, needed only for a federal purchase |

---

## 3. What is left, by owner

| # | Item | Control | Owner | Next step |
|---|---|---|---|---|
| 1 | CSP from Report-Only to enforce | SC-18 | Backend, then dashboard | Backend ships `/api/csp-report`; one week of reports with no false positives; we flip the header in `securityHeaders.js` |
| 2 | HttpOnly session cookie | SC-23, AC-12 | Backend (phase 1), then dashboard | Gustavo sets the date; server mounts the parser, sets the cookie and CSRF; we move to `withCredentials` + `X-CSRF-Token` and stop writing `admin-token` |
| 3 | Event-end access removal | AC-2 | Backend, then dashboard | New deactivate route; `EndEventButton` moves to it; then `update-company` stops accepting `employees` |
| 4 | Company by id at login | AC-4 | Backend, then dashboard | `sqlCompanyId` and `companies[]` in the login response; the selector stops matching by name |
| 5 | Recovery-codes banner | IA-2 | Backend, then dashboard | `recoveryCodesRemaining` on every login |
| 6 | System use notice text | AC-8 | Gustavo / legal | Approve the text in `legalNotices.js` and set `approvedByLegal: true` |
| 8 | Twilio token rotation | IA-5(7) | Gustavo | Rotate at Twilio, update the VM `.env` |
| 9 | `SESSION_MODE=enforce`, `DB_COMPANY_PUBLIC_MODE=enforce` | AC-12, AC-3 | Gustavo (date), backend | `.env` change on the VM; the dashboard needs no change |
| 10 | Moderate advisories (`quill`, `deepmerge`) | RA-5 | Dashboard | Watch Dependabot; take the fix when released |

Items 1, 2 and 9 are the ones an assessor is most likely to score: CSP in enforce, the session token out of `localStorage`, and server sessions enforced.

---

## 4. Where the evidence lives

- **Code and tests:** `src/config/roles.js`, `src/api/sessionHeaders.js`, `src/api/sessionExpiry.js`, `src/hooks/idleSession.js`, `src/config/offlineCaching.js`, `src/config/legalNotices.js`, `src/utils/userFacingError.js`, and their `*.test.js` files, including the guard tests.
- **Pipeline:** `.github/workflows/ci.yml`, `release.yml`, `codeql.yml`, `.github/dependabot.yml`, `.github/audit-exceptions.json`, `deploy/iis/Update-AdminSite.ps1`.
- **Plans and documents:** `fedRAMP/FRONTEND_action_plan_2026-10-26.md` (phases A–E), D1, D2, D3.
- **Coordination with the backend:** `server-testing/reports/` — the 2026-11-04 blockers report and its reply, the contract-changes acknowledgement, and the deploy note of 2026-11-05.
