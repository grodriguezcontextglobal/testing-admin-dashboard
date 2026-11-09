# GovRAMP: what is left in our hands (2026-11-09)

**System:** admin.devitrak.net · **Repository:** `grodriguezcontextglobal/testing-admin-dashboard` · **As of:** `main` at `f19ed171`, checked against the code on 2026-11-09.

**Scope:** only the work the dashboard team can finish on its own, either code or a decision written into the code. The items that wait on the backend, legal or Gustavo's accounts are listed in §4 so that the picture is complete.

**Builds on:**
- `FRONTEND_govramp_alignment_2026-11-06.md`, which scores every control;
- `FRONTEND_govramp_code_actions_2026-11-09.md`, which defines actions #1–#11. The numbers below are the same.

---

## 1. Summary

| | Count | Items |
|---|---|---|
| Done since the action list | 1 | #1 CSP reporting (PR #78, merged 2026-11-09) |
| Code we can start now | 8 | #2, #3, #4, #5, #6, #7, #8, #9 *(#5 first needs a signed-in check of the route)* |
| Code that needs one week of CSP reports first | 2 | #10 narrow `img-src`, #11 CSP in enforce |
| Decisions to record in the code | 5 | D1–D5 in §3 |

Once all of this is done, the dashboard has **one open row, SC-23** (the session cookie), and that row waits on the server.

---

## 2. Code still to do

Each row was checked against `main` today. The "Found in the code" column is the evidence that the action is still open.

| # | Action | Control | Effort | Found in the code | Done when |
|---|---|---|---|---|---|
| 2 | Report Trusted Types violations | SI-10, SC-18 | S | No `require-trusted-types-for` in `src/config/securityHeaders.js` | The Report-Only policy carries `require-trusted-types-for 'script'` |
| 3 | Recovery-codes banner on every login | IA-2(1), IA-5 | S | `readRecoveryCodeUse` (`src/pages/authentication/utils/mfaRecovery.js`) reads `recoveryCodesRemaining` only when `recoveryCodeUsed` is true | A login with `recoveryCodesRemaining: 0` shows the persistent notice, whatever way the user signed in |
| 4 | Company chosen by id at login | AC-4 | M | `multipleCompanies/Modal.jsx` matches `company_name === …` at lines 68 and 170 | No match by name in the login or company-switch flow; a test with two companies of the same name |
| 5 | Event-end access removal | AC-2 | M | No call to `event-staff/deactivate`; `EndEventButton.jsx` still sends the employee list to `update-company` | `EndEventButton` calls `POST /api/company/event-staff/deactivate` after the event is marked inactive |
| 6 | SQL company context always consistent | AC-4 | M | `src/api/devPayloadGuard.js` does not compare `company_id` with `s-company-lq` | A development guard flags any mismatch, and every call site it finds is fixed |
| 7 | Stop writing the numeric `role` | AC-6, AC-2 | M | Writes to `Company.employees[]` still carry `role`, for example `useRoleReassignment.js` sends `role: String(newLevel)` next to `roleType`. Around 15 files call `update-company` | Every write carries `roleType` only, and a guard test like `scopeBodyRoleRetired.test.js` keeps it that way |
| 8 | Audit what ships, not the build tools | RA-5, SI-2 | S | `vite`, `vite-plugin-pwa` and `@vitejs/plugin-react` are under `dependencies` in `package.json` | They are in `devDependencies`, and `npm audit --omit=dev` lists only packages in the bundle |
| 9 | CSP check in the E2E run | SC-18, SA-11 | M | No Cypress spec listens for `securitypolicyviolation` | A spec visits the main routes under the enforce policy and fails on any violation |
| 10 | Narrow `img-src` | SC-7, SC-18 | S | `img-src` still allows any `https:` host | `img-src` lists the hosts seen in the reports (Cloudinary, the S3 buckets, Stripe) |
| 11 | CSP in enforce | SC-18 | S | The header is still `Content-Security-Policy-Report-Only` | `VITE_APP_CSP_ENFORCE=true` in the GitHub `production` environment |

### 2.1 Notes per item

- **#2** goes in Report-Only only. The two places that insert HTML (`pages/posts/components/DisplayArticle.jsx` and `pages/status/ServiceStatusPage.jsx`, both through DOMPurify) and any library sink will report. The reports decide D2.
- **#3** reuses the existing notice ("No recovery codes left"). Write the test first, in `mfaRecovery.test.js`.
- **#4** keeps the company name only as the label. `sqlCompanyId` goes to `persistCompanyHeaders`.
- **#5**: before starting, one signed-in request has to confirm that the route answers. The unsigned probe gets 401 before routing, so it proves nothing. The route answers **409** if the event has not ended. When this ships, tell the backend that `update-company` no longer needs `employees` from this flow.
- **#6 and #7** touch the same request bodies, so one PR. Reading old entries that carry only `role` stays supported through `resolveRoleType`.
- **#8** changes nothing in the release, because GitHub Actions installs dev dependencies to build. Also take the Cypress update when it brings `systeminformation` ≥ 5.33.16 (a **high** advisory, but dev-only).
- **#9** is the evidence that does not depend on production. Have it in place before #11.

### 2.2 The clock for #10 and #11

PR #78 merged today. Its effect starts with the **next IIS release**: from then, browsers send violations to `https://db.devitrak.net/api/csp-report`.

**About seven days after that release:**
1. The backend runs `node scripts/summarize-csp-reports.js --days 7` and sends us the summary.
2. If it shows no false positives, we do **#10**, then **#11** on the next release.
3. If it does show some, each one becomes a fix or a new allowed source, and the week starts over.

---

## 3. Decisions to record in the code

None of these needs anyone outside the team. Each one is closed by a comment in the code, and a test where it fits, so that the assessor finds the reason next to the rule.

| # | Decision | Control | Recommendation | Where to record it |
|---|---|---|---|---|
| D1 | `style-src 'unsafe-inline'` stays | SC-18 | **Accept it as a documented risk.** antd, MUI and emotion inject styles at runtime, and React writes `style` attributes. Scripts are already strict: there is no `'unsafe-inline'` or `'unsafe-eval'` in `script-src` | A comment on the directive in `securityHeaders.js`, plus a test that `script-src` never gains either keyword |
| D2 | Enforce Trusted Types or only report them | SI-10 | **Decide after #2's reports.** If only the two DOMPurify paths report, enforce with a single DOMPurify policy. If libraries report, keep Report-Only and record why | `securityHeaders.js` |
| D3 | `quill` 2.0.3 has no fix (low, XSS through its HTML export) | RA-5, SI-2 | **Accept it until a fix ships.** The dashboard inserts HTML only through DOMPurify | A note in the audit section of the release record, with a review date |
| D4 | The exact `img-src` host list | SC-7 | **Take it from the reports.** Name each host and the feature that needs it, so that a removed feature can take its host with it | `securityHeaders.js`, the same way as `DOCUMENTS_BUCKET` |
| D5 | When the CSP switches to enforce | SC-18 | **On the first release after a clean week,** with #9 green. Rolling back is one variable (`VITE_APP_CSP_ENFORCE=false`) and a new release | The PR for #11 |

---

## 4. Outside our hands (for completeness)

| Row | Control | Waiting on |
|---|---|---|
| Session token out of `localStorage` (HttpOnly cookie, CSRF) | SC-23, AC-12 | Server phase 1 and a date from Gustavo. Our phase 2 follows: `withCredentials`, `X-CSRF-Token`, and no more writes of `admin-token` (written today in `Login.jsx` and `multipleCompanies/Modal.jsx`) |
| System use notice text | AC-8 | Legal approval of `src/config/legalNotices.js`. It is still `approvedByLegal: false`. When the text arrives, the change is ours and takes one line |
| Twilio token from the 2024 history | IA-5(7) | Rotation at Twilio by Gustavo |
| `SESSION_MODE=enforce`, `DB_COMPANY_PUBLIC_MODE=enforce`, `COMPANY_CONTEXT_MODE=enforce` | AC-12, AC-3, AC-4 | Server configuration. The last one should follow our #6 |
| Second-person review | CM-3 | Accepted decision (2026-10-29); revisit if the assessor asks |

---

## 5. Suggested order

1. **#2 + D1** (S), one PR. Same file as #78, and the Trusted Types reports start on the same week.
2. **#3** (S) and **#8** (S), independent of each other.
3. **#4** (M), then **#6 + #7** together (M).
4. **#5** (M), after the signed-in check of the route.
5. **#9** (M), before #11.
6. After the week of reports: **#10 + D4**, then **#11 + D5**. **D2** is decided at the same time, from #2's reports.
7. **D3** goes into the next release record.
