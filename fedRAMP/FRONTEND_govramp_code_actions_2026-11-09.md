# GovRAMP: what the dashboard can close in code now (2026-11-09)

**System:** admin.devitrak.net (React SPA) · **Repository:** `grodriguezcontextglobal/testing-admin-dashboard` · **As of:** `main` at `87333e01`, checked on 2026-11-09 against the code, production and the backend's replies.

**Complements:** `FRONTEND_govramp_alignment_2026-11-06.md`, which scores every control. This report covers only the **open or partial rows that the dashboard can now close with its own code**, and what each one needs.

---

## 1. What changed since 2026-11-06

The 2026-11-06 report listed every open row as waiting on the backend. Since then, the backend's 2026-11-04 batch has reached production:

| Backend item | How it was checked | What it unblocks here |
|---|---|---|
| `POST /api/csp-report` | An empty `POST` answers **204** in production; an unknown route answers 404 | CSP reporting, then CSP in enforce (SC-18) |
| `recoveryCodesRemaining` on every login | Same deploy batch as the logout 401, which was checked live on 2026-11-04 | Recovery-codes banner (IA-2) |
| `companies[]` and `sqlCompanyId` in the login response | Same batch | Company chosen by id, not by name (AC-4, B7) |
| `POST /api/company/event-staff/deactivate` | Same batch. An unsigned request gets 401 before routing, so a signed-in call must confirm it | Removing access when an event ends (AC-2, B6) |
| `Company.employees[]` accepts `roleType` without the numeric `role` | Same batch | Stop writing the numeric role (AC-6) |
| `COMPANY_CONTEXT_MODE` (`warn`) | Backend reply §2.7 | Make the SQL `company_id` always match `s-company-lq` so the server can enforce (AC-4) |

So **seven rows can now move with dashboard code alone**. Only the session cookie (SC-23, B3) still waits on server work, which needs a date from Gustavo.

---

## 2. Code actions

Effort: **S** = under a day, one small PR · **M** = one or two days, one PR with tests.

| # | Action | Control | Effort | Depends on | Done when |
|---|---|---|---|---|---|
| 1 | Send CSP reports | SC-18 | S | Nothing | The Report-Only header carries `report-uri` and `report-to`, and `summarize-csp-reports.js` shows reports |
| 2 | Report Trusted Types violations | SI-10, SC-18 | S | #1 | The policy includes `require-trusted-types-for 'script'` in Report-Only |
| 3 | Recovery-codes banner on every login | IA-2(1), IA-5 | S | Nothing | A login with `recoveryCodesRemaining: 0` shows a persistent banner |
| 4 | Company chosen by id at login | AC-4 | M | Nothing | No `company_name ===` match in the login or company-switch flow |
| 5 | Event-end access removal | AC-2 | M | A signed-in check of the route | `EndEventButton` calls `event-staff/deactivate`; the backend can stop accepting `employees` in `update-company` |
| 6 | SQL company context always consistent | AC-4 | M | Nothing | A dev guard flags any mismatch, there are none, and the backend switches `COMPANY_CONTEXT_MODE=enforce` |
| 7 | Stop writing the numeric `role` | AC-6, AC-2 | M | Nothing | Every write to `Company.employees[]` carries `roleType` only; a guard test prevents regressions |
| 8 | Audit what ships, not the build tools | RA-5, SI-2 | S | Nothing | Build-only packages are in `devDependencies`; `npm audit --omit=dev` lists only packages in the bundle |
| 9 | CSP check in the E2E run | SC-18, SA-11 | M | Nothing | A Cypress spec visits the main routes under the enforce policy and fails on any `securitypolicyviolation` |
| 10 | Narrow `img-src` | SC-7, SC-18 | S | #1 plus one week of reports | `img-src` lists the real image hosts instead of `https:` |
| 11 | CSP in enforce | SC-18 | S (variable) | #1 plus one week with no false positives | `VITE_APP_CSP_ENFORCE=true` in the `production` environment; the header is `Content-Security-Policy` |

### 2.1 Details

**1. Send CSP reports.**
- Change `buildContentSecurityPolicy` in `src/config/securityHeaders.js`:
  - add `report-uri https://db.devitrak.net/api/csp-report` and `report-to csp`;
  - build the origin from the API env var, as `connect-src` already does.
- Change `buildSecurityHeaders` to add `Reporting-Endpoints: csp="https://db.devitrak.net/api/csp-report"`.
- Extend the existing test, which reads `public/web.config`, so neither directive can be dropped.

This is the gate for #10 and #11: the server keeps reports for 30 days, and that is the evidence an assessor will ask for before enforce.

**2. Report Trusted Types violations.**
- Add `require-trusted-types-for 'script'` to the **Report-Only** policy only.
- Every DOM sink that takes HTML will report: the DOMPurify path and anything in a library.
- The reports show whether enforcing Trusted Types later is realistic. DOMPurify can return `TrustedHTML`.

**3. Recovery-codes banner on every login.**
- `readRecoveryCodeUse` (`src/pages/authentication/utils/mfaRecovery.js`) reads the count only when `recoveryCodeUsed` is true.
- The server now sends `recoveryCodesRemaining` on every login: a number with MFA, `null` without.
- Add a reader for any login. With `0`, show the existing persistent notice ("No recovery codes left", with the way to generate new ones).
- Write the test first, in `mfaRecovery.test.js`.

**4. Company chosen by id at login.**
- `src/pages/authentication/multipleCompanies/Modal.jsx` still matches companies by `company_name` (lines 68 and 170).
- The login response now carries:
  - `companies: [{ sqlCompanyId, companyName }]`;
  - `sqlCompanyId`, set when the user belongs to exactly one company.
- Pick by `sqlCompanyId` and pass it to `persistCompanyHeaders`. Keep the name only as the label.
- Two companies with the same name are the failure case to test.

**5. Event-end access removal.**
- The event-end flow sends the whole employee list to `update-company`.
- Move it to `POST /api/company/event-staff/deactivate`:
  - body `{ eventId, sqlCompanyId }`, header `x-company-id`;
  - permission `event:update`;
  - **409** if the event is not ended yet, so call it after the event is marked inactive.
- Then tell the backend that `update-company` no longer needs `employees` from this flow.
- Before starting, confirm the route answers a signed-in request (the unsigned probe cannot tell).

**6. SQL company context always consistent.**
- The server now compares `company_id` (params, body or query) with the `s-company-lq` header, in `warn` mode.
- Add a development-only check to `src/api/devPayloadGuard.js` that flags the same mismatch locally.
- Fix any call site it finds.
- Ask the backend for the `warn` log count before enforce.

**7. Stop writing the numeric `role`.**
- Since the batch deploy, `Company.employees[]` entries save with `roleType` alone.
- Remove the number from every write and add a guard test, like the B5 one (`scopeBodyRoleRetired.test.js`).
- Reading old entries with only `role` stays supported through `resolveRoleType`.

**8. Audit what ships.**
- `npm audit --omit=dev` should describe the browser bundle. Today these build-time packages are under `dependencies`:
  - `vite`;
  - `vite-plugin-pwa`, which brings `workbox-build`, `glob`, `minimatch` and `deepmerge`;
  - the Vite plugins.
- Their advisories (glob and minimatch moderate, deepmerge low) never reach the browser, but they count as runtime.
- Move them to `devDependencies`. The release is built by GitHub Actions with dev dependencies installed, so nothing changes in the build.
- Also merge the open Dependabot PRs #74 and #75.
- Take the Cypress update when it carries `systeminformation` ≥ 5.33.16. That advisory is **high** but dev-only: Cypress runs only on developer machines and in CI.
- What remains:
  - `quill` 2.0.3 (low, XSS through its HTML export) has no fix yet. It is mitigated because the dashboard inserts HTML only through DOMPurify.
  - `deepmerge` is build-only.

**9. CSP check in the E2E run.**
- Add a Cypress spec that serves the app with the **enforce** policy and visits the main routes:
  - home;
  - events and the event detail;
  - inventory;
  - consumers;
  - staff;
  - profile;
  - Stripe Checkout start.
- It fails on any `securitypolicyviolation` event.
- This catches a regression before it reaches production, and gives the release record evidence that does not depend on production reports.

**10 and 11. Narrow `img-src`, then enforce.**
- After a week of reports (#1), replace `img-src https:` with the hosts that actually appear (Cloudinary, the S3 buckets, Stripe).
- Then flip `VITE_APP_CSP_ENFORCE` in the GitHub `production` environment. The build already switches the header name.
- `style-src 'unsafe-inline'` stays. antd, MUI and emotion inject styles at runtime, and React writes `style` attributes. Record it as an accepted risk with that reason. Scripts are already strict: there is no `'unsafe-inline'` or `'unsafe-eval'` in `script-src`.

---

## 3. Still not in code

| Row | Control | Waiting on |
|---|---|---|
| Session token out of `localStorage` (HttpOnly cookie, CSRF) | SC-23, AC-12 | Server phase 1 (cookie parser, cookie, CSRF), not built; Gustavo sets the date. Our phase 2 (`withCredentials`, `X-CSRF-Token`, stop writing `admin-token`) follows |
| System use notice text | AC-8 | Legal approval of `src/config/legalNotices.js` |
| Twilio token from the 2024 history | IA-5(7) | Rotation at Twilio by Gustavo |
| `SESSION_MODE=enforce`, `DB_COMPANY_PUBLIC_MODE=enforce` | AC-12, AC-3 | A date from Gustavo; server config only |
| Second-person review | CM-3 | Accepted decision (2026-10-29); revisit if the assessor asks |

---

## 4. Suggested order

1. **#1 + #2** in one PR (S). This starts the clock on the week of reports that #10 and #11 need.
2. **#3** (S) and **#8** (S), independent.
3. **#4** (M), then **#6 + #7** together (M), since they touch the same request bodies.
4. **#5** (M), after a signed-in check of the route.
5. **#9** (M), any time before #11.
6. One week after #1 lands: **#10**, then **#11**.

Done in this order, the client side has **one open row**, SC-23, and that row waits on the server. The three rows an assessor is most likely to score, from the 2026-11-06 report, become:
- CSP in enforce: done by the dashboard (#11);
- token out of `localStorage`: still on the server's date;
- server sessions enforced: a config date.

---

## 5. Notes on the checks

- The CSP endpoint was checked with an empty `POST` (the route always answers 204 and does not store a broken body). No signed-in calls were made to production.
- The developer machine's `node_modules` is older than the lockfile (`vite-plugin-pwa` 0.21.2 installed, 2.0.0 locked), so a local `npm audit` differs from CI's. The figures in #8 come from the GitHub Dependabot alerts, which read the lockfile.
- PR #76 restores the last commit of #72 (plan-limit notice to Stripe), which was pushed after #72 merged. It is not a GovRAMP item.
