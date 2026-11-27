# Goals to reach: the dashboard, and the Admin Console

**Date:** 2026-11-27
**Scope:** everything the browser client owns, split into the two products that share this repository.
**Measured against:** `main` at `eacdbf47`; production serving `admin-20261125-191149-eacdbf4` on both origins; the control review of 2026-11-26; the backend's goals note of 2026-11-26.

This supersedes nothing. `FRONTEND_console_goals_plan_2026-11-26.md` remains the working detail for the backend's six console goals; this document is the level above it — every goal either product still has to reach, with what it is blocked on and what "done" means.

---

## 0. Where the work actually is right now

Three branches hold unmerged work. Knowing which is which prevents the mistake this repository has made three times this month: reading a pull-request title instead of the file tree.

| Branch | Holds | State |
|---|---|---|
| `feat/console-gate-and-event-filter` (#150) | The `/me` gate, `type: 'event'` on every Event read, and the access spec that proves revocation | Pushed `44fcc06f` today; CI re-running |
| `docs/govramp-certification-status` (#151) | The 26-11 control review | Green, unmerged |
| `feat/console-error-reference` | **Uncommitted.** The API error reference (D1) and the 501 handling (C2) | 5,591 tests pass, lint 0, build OK |

**Nothing in the third row is committed.** It is finished work sitting in a working tree, which is the least durable place it could be.

---

# Part A — The dashboard

The customer-facing product at `admin.devitrak.net`. Every goal here is driven by the GovRAMP package rather than by a feature request, because that is where the open items are.

---

## A1. Finish the error reference across the product

**Why.** Since 2026-11-26 a 500 no longer carries its own message — it answers `"The server could not complete the request"` plus a `ref`. Phase one is written: the interceptor attaches `error.errorRef` for all four axios instances and logs it beside the URL, and the console's error state renders it. **Phase two is the rest of the dashboard**, which renders `msg` in dozens of places and currently shows the generic sentence with nothing to quote.

**What.**
1. Commit and open a PR for the branch above. It is done; it is not safe.
2. Sweep the sites that render an error to a person and pass `reference={error?.errorRef}` to `ProfileErrorState`. The prop already exists and all 25 existing importers can use it unchanged.
3. For screens that do not use `ProfileErrorState`, decide one placement rule and apply it — secondary, under the message, never in the title.

**Done when.** A 500 anywhere in the dashboard shows a reference the user can copy, and that reference appears in the browser console next to the failing URL.

**Blocked on.** Nothing. One open question with the backend (below) affects only the header fallback, not the body's `ref`.

**Size.** Phase two is a wide, shallow change: many files, one line each.

---

## A2. Release once with the cookie session on

**Control.** SC-23 — the only row in the whole review marked **Open** that is ours alone.

**Why.** The session token is in `localStorage` and travels as `x-token`. The client half shipped on 2026-11-10 and was tested end to end against production on 11-17. Server phase 1 has been deployed since 11-17. **No release has ever been built with the flag on** — `VITE_APP_COOKIE_SESSION` is read from `vars.*` with no fallback and the `production` environment holds zero variables, so it is empty, and therefore off.

**What.** Set the variable and release. That is the entire item; there is no code to write.

**Done when.** A production build carries the flag, the session is a cookie, and D1 and D4 (the browser-storage and cryptographic inventories) are updated to say so.

**Blocked on.** Nothing, for 17 days.

**Size.** A configuration value and a release, plus two document updates.

---

## A3. Turn CSP from Report-Only to enforce

**Control.** SC-18, and with it Trusted Types, which is in the policy and therefore reported and never enforced.

**Why.** The policy is already strict where it matters — no inline script, no `eval`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'` — and the enforcing version is exercised by an E2E check that is **required** on `main` and passes. The only thing between here and enforce is reading the violation reports.

**What.** When the backend's summary arrives: finish D2, narrow `img-src` to what the summary shows is actually used, set `VITE_APP_CSP_ENFORCE=true`, release.

**Blocked on.** The backend's CSP report summary, due 2026-11-16 — **11 days late**. This is the single oldest cross-team blocker in either product.

**Size.** Half a day once the summary exists.

---

## A4. Make configuration enforcement testable (CM-6)

**Why.** The control is not "flags are declared", it is "settings are established and enforced". Measured on 26-11: **15** `VITE_APP_*` names are read by shipping code and **13** are passed by `release.yml`. The two that are not are the assistant's pair, and they appear nowhere in `.github/`. Six merged pull requests built that feature and the release pipeline does not know its flag exists.

Today this is harmless — the assistant should be off and is off twice over. **The problem is the class, not the instance.** The existing test checks the opposite direction: it warns about a declared variable nothing reads. Nothing asserts that a variable the client *does* read is passed by the release.

**What.** A test that reads the `VITE_APP_*` names out of `src/` (tests excluded) and out of `.github/workflows/release.yml`, and fails on a name in the first set that is missing from the second. Then add the assistant's two flags to the workflow.

**Done when.** Adding a flag to the client and forgetting the workflow fails CI.

**Size.** The three commands that produced the numbers above *are* the test. Half a day.

---

## A5. An availability check, distinct from the version check

**Control.** CP-2, SI-4.

**Why.** The scheduled check compares `version.json` with the expected tag, proves its own alarm fires, and has run clean on its last six runs. **It answers the wrong question for the failure that actually happened**: on 2026-11-23 both production sites were down for three hours and the version it read would have stayed correct right up until IIS stopped serving. Worse, the service worker served the app from its precache, so every browser already open — including those of the people who would have reported it — saw a working application.

**What.** One request, from outside both machines, for something that cannot be served from a precache, alarming on a non-200.

**Done when.** A total outage of either origin is detected without a human noticing first.

**Size.** Small. It is a second job in an existing workflow.

---

## A6. The four documents that block the Snapshot

These are not code and they are the cheapest work either product has. Each one documents something **already built, already fixed, or already decided**.

| # | Document | Control | Age |
|---|---|---|---|
| 1 | The 2026-11-23 incident record: timeline, user impact, detection time, corrective actions | IR-4, IR-5, IR-6 | 4 days |
| 2 | Close POA&M `DVK-ADMIN-2026-001` — satisfied on all four criteria, header still reads `Status: Open`, target date 11-25 | CM-3, SA-10, AU-6 | 2 days past due |
| 3 | Open a POA&M for the PlanetScale audit-grant limitation — the backend already supplied the limitation, the compensating control and the 90-day decision date | AU-9 | 9 days |
| 4 | Open a POA&M for the `super_user`/MFA finding of 11-09 — 22 of 47 active accounts held the flag, none with MFA; remediated 11-16; the evidence exists, the entry does not | AC-2, AC-6, IA-2(1) | 18 days |

**Why this ordering matters more than its size suggests.** An assessor who finds a satisfied POA&M still marked Open, or a known accepted deviation with no paperwork, stops trusting the rest of the package — including the twenty-three rows that are genuinely Met with a test behind them.

**Note on #1.** The 11-23 outage should **extend `DVK-ADMIN-2026-001` rather than open a new argument**: it is the same weakness class as the finding that POA&M already covers — a production problem invisible from inside — one layer further out.

---

## A7. Two smaller open rows

**AC-8, the system use notification.** The text is on the sign-in screen and is unapproved: `approvedByLegal: false`. The row cannot go green without a person outside engineering. Owner: legal, via Gustavo.

**IA-5(7), the Twilio token.** No secret is in the bundle or the working tree, but a token from a 2024 `.env` remains in the git history and has not been rotated. Open since 2026-11-04 — **23 days**. Owner: Gustavo.

---

## A8. Decide what the subscription plans page is for

**Why.** #71, #72 and #76 shipped on 2026-11-06–09 behind `FEATURE_SUBSCRIPTION_PLANS`. The flag is read from `vars.*` with no fallback and the `production` environment holds zero variables, so the page has been **in production and invisible for twenty-one days**. The backend endpoints it needs answered 404 when last checked.

**What.** One of two things, not a third: turn it on when the endpoints exist, or remove the flag and the code until they do. Dead code behind a flag nobody can turn on is the thing CM-7 is about.

**Blocked on.** `GET /company/subscription` and the checkout route.

---

# Part B — The Admin Console

`ops.devitrak.net/platform`. Live on real client data since 2026-11-23. Read-only, cross-client, five server-side checks on every request.

---

## B1. Write the console's section of the SSP

**This is the first item in this document that is genuinely urgent, and it is not code.**

**Why.** Stated the way an assessor will state it: **Devitrak staff can read any client company's inventory, transactions, people and audit log, from `ops.devitrak.net`, in production, today.** That has been true since 23 November.

The design is sound and every piece of it is documented *in this repository* — a closed allowlist, a domain check that can only refuse, MFA, the server as the authority, every read written to `platform_audit_log` before the response, and the cross-client index of people and the bank details removed **before** launch rather than after. None of it is in the System Security Plan.

Vendor access to customer data is disclosed, or it is a finding. There is no third outcome.

**What.** A section covering: who may enter and how the five checks run; what data is reachable and what deliberately is not; how every read is logged and for how long it is kept; the two-origin session isolation and why; and the AU-9 limitation with its compensating control.

**Done when.** The section exists and the four bullets above can each be traced to a test or a backend note.

**Blocked on.** Nothing.

---

## B2. Merge #150 — the gate asks the server who this is

**Control.** AC-2. The only console control row that is Partial for a reason we can fix today.

**Why.** The guard reads `platformAccess` from the sign-in response, and redux-persist writes that store to `localStorage`, so the copy outlives the tab. **Nothing leaks** — the server refuses every `/api/platform` request — but a revoked operator keeps the screens until they sign out, not until they reload, and what they meet is an error rather than a refusal that explains itself.

**State.** Written, tested, and pushed. The access spec failed four of nine cases because its catch-all answered `/me` with the company list — a body that does not say yes — and the guard refused, correctly. Fixed today in `44fcc06f`, which also adds the three cases that were missing: the server refusing although the sign-in copy still says yes; a 401 as a refusal; and any other failure *not* being one, because "we could not ask" is not "no" and a blip must not lock an operator out of a read-only console.

**Done when.** Revoking an operator's access takes effect on their next navigation or window focus, and what they see is a sentence.

---

## B3. Make the console access check able to block

**Why.** `Acceso a la consola (E2E)` runs on every pull request and is **not** in the required set on ruleset "Main" — only "Lint, tests y build" and "CSP en modo enforce (E2E)" are. It was red for a full day on #150, the one pull request that changes the gate it guards, and nothing but a person reading the page would have stopped that merging.

**A check that cannot block is not a control.** It is a notification.

**What.** Add it to the ruleset's required checks, the way the CSP check was added in #92.

**Done when.** A red console-access run blocks the merge.

**Size.** One API call, and the user's explicit go-ahead — this changes branch protection.

---

## B4. Render `/attention`'s `conditions`

**Why.** `/attention` is live but measures **one of the three conditions** we specified. When the list comes back empty — and today it often will — an operator reads "nothing needs attention". What it means is "one of three things was checked, and that one found nothing".

This is the Overdue tile for the third time. The rule is settled in this codebase by now: *a screen may say nothing was found, but it may not say nothing is wrong unless it looked for everything.*

**What.**
1. `normalizeSectionResponse` keeps `conditions`, handled exactly like `filters`. `usePlatformList` spreads that return value already, so the hooks need no change — the payoff from putting the normaliser where we put it.
2. Pure helpers in `platformScreens.js`: `attentionChecks(conditions)` and `attentionSummary(conditions)`, both derived from the payload and never from a constant.
3. The empty state stops saying "all clear" and says which checks ran, using each `reason` verbatim where there is room.

**Done when.** An empty `/attention` names which checks ran, **and 2026-12-09 arrives without anyone shipping anything** — the server turns `staffDormant` on by reading the date itself, so a test must pin that our count follows the payload rather than a constant of ours.

---

## B5. Honour the declared `filters`

**Why.** Two dropdowns offered values the database cannot answer. Selecting them returned an empty list, which reads as "there are none" when the truth is "this is not recorded". On 11-25 we removed them; the backend now sends a declaration and asks for them back **disabled, with a reason** — because an operator who expects "Lost" and does not find it assumes the screen is broken, which is the same failure one step further out.

**Decision taken 2026-11-26:** they come back disabled, **driven only by the server's `unmeasured` list**. No hand-maintained second list of things to grey out. The tests that pin their absence get inverted, not deleted: no option outside `supported ∪ unmeasured` is ever offered.

**Blocked on** two answers from the backend:
- Which `filters` shape is canonical — the `[{value,label}]` asked for on `/audit`, or the new `{supported, unmeasured, applied, note}` envelope? We can read both; we would rather read one.
- Does `/events` send a `filters` block too? If not, `upcoming` stays off exactly one screen by a hard-coded rule, which is the thing worth avoiding.

**Work that is not blocked.** `declaredFilterOptions(filters, param)` can be written and tested against both shapes now.

---

## B6. Walk the nine tabs, and fix what the walk needs first

**Why.** The tabs answer. **Nobody has opened them in a browser on either side** — both teams tested shapes, not screens. This is the goal that finds what the other five missed, which is also why it must run last.

**The blocker to clear first.** `withReportedMoney` drops a column only when `format === "cents"`. Every non-money `null` the backend listed therefore renders as a full column of dashes: `members.status`, `members.joinedAt`, `members.devicesOut`, `consumers.status`, `consumers.lastSeenAt`, `consumers.devicesOut`, `inventory.lost`, `transactions.status`, `events.devicesNotReturned`. The rule was never about money — it is that *a column where no row reports a value teaches the reader a fact nobody checked*. Widen both helpers to any format, with one guard: drop only when **every** row is null. A sparse column is data; an empty one is a promise nobody kept.

**Confirm rather than assume:** `staff.twoStepEnabled` is `null` for an employee with no account and `false` for one with an account and no MFA — different facts the UI must not merge. `consumers.transactionsCount` and `events.consumersCount` are real numbers and must not be dropped. `subscription` returns `plan: "free"` for a client with no subscription document, which is a value and not an absence.

**The walk.** Two clients chosen deliberately: one that cross-walks to SQL, and one that **does not** — where `inventory` and `members` must be *empty*, never someone else's data. That second one is the only security check on this list, and it is the reason the walk cannot be skipped. Plus: `eventsActive` in the header matches the Events tab count.

**Done when.** Someone has clicked through all nine tabs on two different clients and the surprises are written down in a report.

---

## B7. The 501, and the error reference, in the console

**State: written, uncommitted**, on `feat/console-error-reference` together with A1.

`merchant` answers 501 — the server holds the route but not the data, because those nine fields are Stripe account state and a stale copy of the sign-up form would read as fact. Three parts, two of which the backend's note did not ask for:

1. **It stopped being retried.** 501 is a refusal wearing a 5xx; it cost the tab about eight seconds of skeleton for an answer that cannot change.
2. **It renders as "Not available yet"**, with the server's `msg` verbatim and its `needs` as a sentence, and **no Try again button** — offering a retry for a refusal is the same lie as a filter that cannot match.
3. **The sample data was fixed too.** The mock answered `merchant` with 200 and nine fields, so a demo build was the only place in the product where that tab worked.

**Decision taken 2026-11-26:** the tab stays visible and explains itself. A missing tab reads as a dashboard that forgot about Stripe, and that is indistinguishable from a bug on sight.

---

## B8. Waiting on the backend, with nothing for us to do yet

| Item | Note |
|---|---|
| `GET /audit` | **The screen an assessor is actually shown.** Worth pulling forward above the others |
| `GET /companies/options` | Uncapped `{id, name}`, so the client dropdown stops being limited at all. Our side is already correct: `COMPANY_OPTIONS_LIMIT` is 100, matching the server's cap |
| `POST /exports` + the file route | After `/audit` |
| `devicesOverdue` | **Blocked on a business answer, not on engineering.** Lease due date, event return date, or the device's own. One decision unblocks `/attention`'s first condition and four endpoints at once — four already have the hole cut to the right shape and are returning `null` into it |
| `X-Error-Ref` exposure | Is the header named in `Access-Control-Expose-Headers`? Cross-origin, a header that is not is invisible to JavaScript — it reads `undefined`, silently. The body's `ref` works regardless, so this blocks only the "correlate a request that did not fail" half |

---

# Part C — The order to work in

Across both products, with the reasoning rather than a ranking.

1. **Commit the error-reference branch and open its PR.** Finished work in a working tree is the least durable state in this repository, and it holds two goals (A1 phase one, B7).
2. **B1 — the console SSP section.** Oldest, cheapest, and the only item where every day it is late is a day the gap is real in production.
3. **A6 — the four documents.** Same argument, four more times.
4. **B2 — merge #150** once CI is green.
5. **A2 — release with the cookie flag.** Seventeen days of nothing standing in the way.
6. **B3 — make the console check required**, before the next change to the gate rather than after.
7. **B5 + B6's widening** together: same idea, two places — never offer a control or a column that cannot carry an answer.
8. **B4 — `conditions`**, which needs a small design decision and so benefits from not being first.
9. **A4, A5** — the two tests that turn an assertion into enforcement.
10. **B6 — the walk**, last by necessity: it is the one that finds what the other nine missed.

**A3 and A8 are not on this list** because they are not ours to start. They are the two teams' shared queue, and the CSP summary at eleven days late is the one worth asking about by name.

---

## What this document does not claim

Every figure here was measured on 2026-11-27 or carried from the control review of 11-26 with its date attached. The control counts — 23 Met, 10 Partial, 2 Open — are counts of the rows in that review, not an official GovRAMP tally; no assessor has scored this system and none has been scheduled.
