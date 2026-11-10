# GovRAMP: what is left in our hands (2026-11-10)

**System:** admin.devitrak.net · **Repository:** `grodriguezcontextglobal/testing-admin-dashboard` · **As of:** `main` at `c1603ae1`, released 2026-11-09 21:04 UTC. Production headers were checked on 2026-11-10.

**Scope:** only what the dashboard team decides, in code or in approach. Items that wait on the backend, legal or Gustavo's accounts are in §5 so that the picture is complete.

**Replaces:** `FRONTEND_govramp_pending_2026-11-09.md`. Action numbers (#1–#11) and decisions (D1–D5) keep their meaning; new items start at #12 and D6.

---

## 1. Summary

| | Items |
|---|---|
| **Done and in production** | #1 CSP reporting (PR #78) · #2 Trusted Types reporting (#80) · #3 recovery-codes notice on every sign-in (#81) · #8 build tools in `devDependencies` (#82) · D1 `style-src` accepted risk (#80) |
| **Done, PR open** | #4 company by SQL id at sign-in (**PR #83**) · #6 company-context dev guard and #7 `roleType`-only employees (**PR #84**) |
| **Code still to write** | #5 event-end access removal · #9 CSP check in the E2E run · #12 session cookie, client side behind a flag |
| **Code that waits on the week of reports** | #10 narrow `img-src` · #11 CSP in enforce |
| **Checks before or after a release** | #13 browser check of #81, #83 and #84 · #14 the SBOM in CI · #15 Cypress update for `systeminformation` |
| **Decisions** | D2–D5 (pending from the last report) · D6–D8 (new) |

**When this is done**, the dashboard has no open row of its own. What remains is:
- SC-23, which needs the server's cookie;
- AC-8, which needs the legal text;
- IA-5(7), the Twilio rotation;
- the server's `enforce` modes.

---

## 2. Calendar

| Date | What |
|---|---|
| 2026-11-09 21:04 UTC | Release with CSP and Trusted Types reporting. Checked in production: `Content-Security-Policy-Report-Only` carries `require-trusted-types-for 'script'`, `report-uri https://db.devitrak.net/api/csp-report` and `report-to csp`. The `Reporting-Endpoints` header is set, and there is no enforcing CSP header |
| **2026-11-16 or later** | The backend runs `node scripts/summarize-csp-reports.js --days 7` and sends the summary. It decides #10, #11, D2 and D4 |
| First release after a clean week, with #9 green | #11 CSP in enforce (D5) |

---

## 3. Code still to do

| # | Action | Control | Effort | State | Done when |
|---|---|---|---|---|---|
| 4 | Company chosen by SQL id at sign-in | AC-4 | — | **PR #83 open** | Merged and checked in the browser (#13) |
| 6 + 7 | Company-context dev guard; `Company.employees[]` written with `roleType` only | AC-4, AC-6 | — | **PR #84 open** | Merged and checked in the browser (#13); the backend is told (§5) |
| 5 | Event-end access removal | AC-2 | M | Not started | `EndEventButton` calls `POST /api/company/event-staff/deactivate` after the event is marked inactive, and no longer sends `employees` to `update-company` |
| 9 | CSP check in the E2E run | SC-18, SA-11 | M | Not started | A Cypress spec serves the build with the **enforce** policy, visits the main routes and fails on any `securitypolicyviolation` |
| 10 | Narrow `img-src` | SC-7, SC-18 | S | Waits for the reports | `img-src` lists the hosts seen in the reports instead of `https:` (D4) |
| 11 | CSP in enforce | SC-18 | S | Waits for the reports and #9 | `VITE_APP_CSP_ENFORCE=true` in the GitHub `production` environment (D5) |
| 12 | Session cookie, client side, behind a flag | SC-23, AC-12 | M | Not started (new) | With the flag on, requests use `withCredentials`, send `X-CSRF-Token` and stop writing `admin-token`; with it off, nothing changes (D6) |

### 3.1 Notes

**#5** was blocked on "a signed-in check of the route". D7 removes that block: build it now with a fallback.
- The contract is in the backend reply of 2026-11-04 (§1.3):
  - body `{ eventId, sqlCompanyId }` and header `x-company-id`;
  - permission `event:update`;
  - **409** if the event has not ended yet;
  - response `{ deactivated, keptInOtherEvents, sql }`.
- New since our first plan: someone who is also on another *active* event of the company keeps access. The client has to stop computing who to remove (`staffToDeactivateAtEventEnd`) and show what the server answers.
- After it ships, the backend can make `update-company` reject `employees` from this flow.

**#9** is the evidence that does not depend on production reports.
- It needs a dev server that sends the enforce header. Two options: Vite's `server.headers` in a Cypress-only mode, or a small static server over `dist/` with the headers from `buildSecurityHeaders`.
- Routes to visit:
  - home;
  - events and the event detail;
  - inventory;
  - consumers;
  - staff;
  - profile;
  - the start of Stripe Checkout.

**#12** is new: our phase 2 of the cookie work can be built before the server's phase 1, so that switching is configuration rather than code on the server's date.
- The plan agreed with the backend:
  - the server sets an HttpOnly cookie and a CSRF token;
  - the client sends `withCredentials`;
  - the client echoes the token in `X-CSRF-Token`;
  - the client stops writing `admin-token` to `localStorage`.
- Behind a flag (`VITE_APP_COOKIE_SESSION`, off), nothing changes until the server is ready.
- Places that read the token today:
  - `App.jsx` (session check);
  - `devitrakApi.jsx` (the `x-token` header);
  - `sessionExpiry.js`;
  - `Login.jsx` and `multipleCompanies/Modal.jsx` (writes);
  - `signatureVerificationDocuments/StaffMember.jsx`.
- `X-CSRF-Token` has to be in the API's CORS allow-list first; see the CORS note in the project memory.

---

## 4. Decisions

| # | Decision | Control | Recommendation | State |
|---|---|---|---|---|
| D1 | `style-src 'unsafe-inline'` stays | SC-18 | Accepted risk, recorded on the directive | **Done** (#80) |
| D2 | Enforce Trusted Types, or only report them | SI-10 | Decide from the reports. If only the two DOMPurify paths report (`DisplayArticle.jsx`, `ServiceStatusPage.jsx`), enforce with one DOMPurify policy. If libraries report, keep Report-Only and record why | Waits for the reports |
| D3 | `quill` 2.0.3 has no fix (low; XSS through its HTML export) | RA-5, SI-2 | Accept until a fix ships: HTML is inserted only through DOMPurify. Record it in the release record with a review date | To record. After #8 it is the **only** finding in `npm audit --omit=dev` |
| D4 | The `img-src` host list | SC-7 | Take it from the reports; one comment per host naming the feature that needs it | Waits for the reports |
| D5 | When the CSP switches to enforce | SC-18 | First release after a clean week, with #9 green. Rollback is `VITE_APP_CSP_ENFORCE=false` and a new release | Waits for the reports |
| D6 *(new)* | Build the client side of the cookie session before the server | SC-23 | **Yes, behind a flag (#12).** The server's date is then the only dependency, and the switch can be tested in staging the day phase 1 lands | To decide |
| D7 *(new)* | How to ship #5 without a signed-in probe | AC-2 | **Build it with a fallback:** call `event-staff/deactivate`; only on **404** fall back to the current `update-company` path and warn once. The first real event end in production is the check. A 409 or 403 is shown to the user, never retried | To decide |
| D8 *(new)* | Old `Company.employees[]` entries that carry only the numeric `role` | AC-6 | **Ask the backend for a one-off migration** that adds `roleType` from `role` (they own the data). The dashboard reads both through `resolveRoleType` and no longer writes `role` (#7). Not done from the client: rewriting other people's entries on any save is a side effect | To decide |

---

## 5. Checks (in our hands)

| # | Check | When |
|---|---|---|
| 13 | Browser check, with real accounts: a sign-in with recovery codes running low (#81); a single-company and a multi-company sign-in (#83); an invitation, a role change from the staff profile and one from Roles management (#84) | #81 is already in production. #83 and #84 before their release |
| 14 | The SBOM made by CI (`npm sbom --omit dev`) lists `workbox-*` and not `vite`, `rollup` or `workbox-build`. The host's npm 11 omits some direct dependencies, so this is checked on the CI artifact | On the next release run |
| 15 | Take the Cypress update when it brings `systeminformation` ≥ 5.33.16 (high, dev-only) | When Dependabot opens it |

---

## 6. Outside our hands

| Row | Control | Waiting on | Our part when it lands |
|---|---|---|---|
| Session token out of `localStorage` | SC-23, AC-12 | Server phase 1 (cookie, CSRF), date from Gustavo | Turn on #12 |
| System use notice text | AC-8 | Legal approval of `src/config/legalNotices.js` (`approvedByLegal: false`) | One-line change |
| Twilio token from the 2024 history | IA-5(7) | Rotation by Gustavo | None |
| `SESSION_MODE`, `DB_COMPANY_PUBLIC_MODE`, `COMPANY_CONTEXT_MODE` to `enforce` | AC-12, AC-3, AC-4 | Server configuration. `COMPANY_CONTEXT_MODE` should follow PR #84 and the backend's warn-log count | None |
| Mongo company ↔ SQL id link | AC-4 | The backend: the Mongo company stores `sqlCompanyId`, or the login answer carries the Mongo id | Replace the name match in `resolveMongoCompany` (PR #83) with the id |
| Second-person review | CM-3 | Accepted decision (2026-10-29); revisit if the assessor asks | None |

**To tell the backend once #84 is merged:**
- the dashboard no longer writes `role` in `Company.employees[]`;
- please send the count of `company context: body and header disagree` warnings before `COMPANY_CONTEXT_MODE=enforce`;
- D8 (migration of old entries), if agreed.

---

## 7. Suggested order

1. Merge **#83** and **#84**, and run the browser check (#13).
2. Decide **D6–D8**.
3. **#5** with the D7 fallback (M).
4. **#9** (M). It has to be in place before #11.
5. **#12** behind the flag (M), any time before the server's date.
6. From **2026-11-16**, with the summary: **D2**, **#10 + D4**, then **#11 + D5**.
7. **D3** goes into the next release record; **#14** on the next release run.
