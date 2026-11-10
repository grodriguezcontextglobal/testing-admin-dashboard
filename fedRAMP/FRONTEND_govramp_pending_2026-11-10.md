# GovRAMP: what is left in our hands (2026-11-10, end of day)

**System:** admin.devitrak.net · **Repository:** `grodriguezcontextglobal/testing-admin-dashboard` · **As of:** `main` at `4a4a2a59` (PR #88). Last release `admin-20261110-192144-106c1fc` (19:21 UTC), which includes everything up to PR #87; #88 is merged and waits for the next release.

**Scope:** only what the dashboard team decides, in code or in approach. Items that wait on the backend, legal or Gustavo's accounts are in §6, so that the picture is complete.

**Replaces:** the morning version of this file and `FRONTEND_govramp_pending_2026-11-09.md`. Action numbers (#1–#15) and decisions (D1–D8) keep their meaning. #16 is new.

---

## 1. Summary

| | Items |
|---|---|
| **Done and in production** | #1 CSP reporting (#78) · #2 Trusted Types reporting (#80) · #3 recovery-codes notice (#81) · #4 company by SQL id (#83) · #5 event-end access removal (#86) · #6 company-context dev guard and #7 `roleType`-only employees (#84) · #8 build tools in `devDependencies` (#82) · #9 E2E CSP check (#87) · D1 |
| **Done, waiting for the next release** | #12 session cookie, client side, behind a flag (#88) |
| **Done, PR open** | #14 complete SBOM (see §3) |
| **Code that waits on the week of reports** | #10 narrow `img-src` · #11 CSP in enforce |
| **Checks** | #13 browser check · #15 Cypress update · the `csp` job as a required check |
| **Decisions** | D2, D4, D5 wait on the reports · D3 to record · D6–D8 decided |
| **New** | #16 design plan for a Devitrak super-user dashboard (§5) |

---

## 2. Calendar

| Date | What |
|---|---|
| 2026-11-09 21:04 UTC | Release with CSP and Trusted Types reporting |
| 2026-11-10 | Releases with #83–#86 (15:00 and 18:10 UTC) and #87 (19:21 UTC). The #87 release fixes icons that were fetched from Iconify's API, so they no longer show in the CSP reports from then on |
| **2026-11-16 or later** | The backend sends the CSP summary (`summarize-csp-reports.js --days 7`). It decides D2, #10 and D4. Iconify `connect-src` reports from before 19:21 UTC on 11-10 are explained by the #87 fix |
| First release after a clean week, with the `csp` job green | #11 CSP in enforce (D5) |
| The server's cookie phase 1 date (from Gustavo) | #12 on: `VITE_APP_COOKIE_SESSION=true`, staging first |

---

## 3. Code

| # | Action | Control | State | Done when |
|---|---|---|---|---|
| 9 | E2E CSP check | SC-18, SA-11 | **Done (#87).** `npm run test:csp`; a `csp` job in `ci.yml`. It found 18 files importing `@iconify/react/dist/iconify.js`, a second copy of the library that never got the offline icon bundle; fixed, with a guard test | — |
| 12 | Session cookie, client side, behind a flag | SC-23, AC-12 | **Done (#88), not released.** `src/api/sessionCredential.js` is the only code that touches the token; with `VITE_APP_COOKIE_SESSION=true` requests use credentials and `X-CSRF-Token`, and the JWT is no longer stored. The JWT is also no longer copied into the persisted Redux user | The backend confirms the items in `server-testing/reports/FRONTEND_cookie_session_client_ready_2026-11-10.md`, then a staging test with the flag on |
| 14 | Complete SBOM | CM-8, SR-4 | **PR open.** The release SBOM of 11-10 (`106c1fc`) had no dev tools, but **missed 9 direct production dependencies** (`react`, `react-dom`, `lodash` and the six `workbox-*`), plus about 100 transitive ones. `npm sbom --omit dev` (npm 11) drops production packages that a dev tool also depends on. CI and release now take the full SBOM and keep what the lockfile does not mark `dev` (`productionOnly` in `src/config/sbom.js`), and refuse an SBOM that misses a direct dependency. Locally: 458 components, all 54 direct dependencies, no dev tool | Merged; the next release's SBOM lists `react` and `workbox-*` |
| 10 | Narrow `img-src` | SC-7, SC-18 | Waits for the reports | `img-src` lists the hosts in the reports instead of `https:` (D4) |
| 11 | CSP in enforce | SC-18 | Waits for the reports | `VITE_APP_CSP_ENFORCE=true` in the GitHub `production` environment (D5) |

---

## 4. Decisions

| # | Decision | Recommendation | State |
|---|---|---|---|
| D1 | `style-src 'unsafe-inline'` stays | Accepted risk, recorded on the directive | Done (#80) |
| D2 | Enforce Trusted Types, or only report them | Decide from the reports. Only the two DOMPurify paths reporting: enforce with one DOMPurify policy. Libraries reporting: keep Report-Only and record why | Waits for the reports |
| D3 | `quill` 2.0.3 has no fix (low; XSS through its HTML export) | Accept until a fix ships: HTML is inserted only through DOMPurify. Record it in the release record with a review date | To record |
| D4 | The `img-src` host list | From the reports; one comment per host naming the feature | Waits for the reports |
| D5 | When the CSP switches to enforce | First release after a clean week, with the `csp` job green. Rollback: `VITE_APP_CSP_ENFORCE=false` and a release | Waits for the reports |
| D6 | Build the cookie client side before the server | Yes, behind a flag | Decided; done (#88) |
| D7 | Ship #5 without a signed-in probe | With a fallback, only on Express's HTML 404 | Decided; done (#86) |
| D8 | Old `Company.employees[]` entries with only the numeric `role` | The backend migrates them (map in the 11-10 follow-up note) | Decided; asked |

---

## 5. New: #16, a Devitrak super-user dashboard

**Ask (Gustavo, 2026-11-10):** a design plan for a new dashboard where Devitrak super users monitor every client: companies, inventory, transactions, everything. Only accounts on the `devitrak.com` domain are accepted.

**State:** plan written in `DESIGN_platform_console.md`, decisions D-P1 to D-P6 pending. It settles:
- **Where the check lives.** The domain check on the client is only presentation. The server has to require a dedicated role or claim, and match the domain exactly (`@devitrak.com`, not "contains devitrak").
- **Cross-tenant access against AC-4.** Reading every company's data runs against the company-context control we are closing (`COMPANY_CONTEXT_MODE=enforce`). It needs dedicated, separately authorised server routes, not a bypass.
- **Accountability:**
  - every access to a client's data is logged (AU-2, AU-12);
  - MFA is required;
  - read-only by default;
  - the access is disclosed in the SSP, since vendor staff reading customer data is something an assessor will ask about.
- **Where it runs.** A separate app, or a section of this one.

---

## 6. Checks (in our hands)

| # | Check | When |
|---|---|---|
| 13 | Browser check with real accounts: sign-in with recovery codes running low (#81); single- and multi-company sign-in (#83); an invitation and role changes from the staff profile and from Roles management (#84); ending an event and reading the notice (#86); sign-in, a save and logout after #88, with the flag off | Now: all but #88 are in production; #88 after the next release |
| 14 | The next release's SBOM lists `react`, `react-dom` and `workbox-*`, and no `vite`, `rollup` or `workbox-build` | The next release after the #14 PR |
| 15 | Take the Cypress update when it brings `systeminformation` ≥ 5.33.16 (high, dev-only) | When Dependabot opens it |
| — | Make the `CSP en modo enforce (E2E)` job a required check in the `main` ruleset | Before #11 |

---

## 7. Outside our hands

| Row | Control | Waiting on | Our part when it lands |
|---|---|---|---|
| Cookie phase 1 and its answers: the CSRF field name, `X-CSRF-Token` in the CORS allow-list (not there on 11-10; credentials and origin already are), the MFA setup token in phase 3, and the token kept in the login answer | SC-23, AC-12 | The backend; the date from Gustavo | Fix `CSRF_FIELD` if needed; turn on #12 |
| CSP summary | SC-18 | The backend, from 11-16 | D2, #10, #11 |
| `company context` warning count, then `COMPANY_CONTEXT_MODE=enforce` | AC-4 | The backend | None, unless the warnings name a call site |
| Migration of `role`-only employee entries (D8) | AC-6 | The backend | None |
| Mongo company ↔ SQL id link | AC-4 | The backend | Replace the name match in `resolveMongoCompany` with the id |
| `update-company` rejects `employees` from the event-end flow | AC-2 | The backend, once it sees #5 used | None |
| System use notice text | AC-8 | Legal approval of `src/config/legalNotices.js` | One-line change |
| Twilio token from the 2024 history | IA-5(7) | Rotation by Gustavo | None |
| `SESSION_MODE`, `DB_COMPANY_PUBLIC_MODE`, `COMPANY_CONTEXT_MODE` to `enforce` | AC-12, AC-3, AC-4 | Server configuration | None |

---

## 8. Suggested order

1. Merge the #14 PR; check the next release's SBOM.
2. #13 browser check.
3. Make the `csp` job required.
4. #16 design plan, while the reports accumulate.
5. From **2026-11-16**: D2, then #10 + D4, then #11 + D5.
6. D3 into the next release record.
7. #12 on, on the server's date.
