# Admin Console — working plan for the six goals

**Date:** 2026-11-26
**Answers:** the backend's note *Dashboard Goals — Catching Up With the Server* (2026-11-26), written against production `c100545`.
**Scope:** the dashboard repository only. Every line below was checked against the code as it stands today; nothing here is taken from the note on trust.

---

## 1. Where the six goals actually stand

| # | Goal | State in this repo | Evidence |
|---|---|---|---|
| 1 | Show the error reference | **Not started** | `src/api/devitrakApi.jsx:134-195` reads `status`, `message` and nothing else. No occurrence of `ref` or `x-error-ref` anywhere in `src/api/`. |
| 2 | Handle `merchant`'s 501 | **Not started, and currently worse than "unhandled"** | `retryPlatformQuery` treats 501 as a 5xx worth retrying, so the tab retries twice before showing `"Couldn't load this section"` with a **Try again** button. |
| 3 | Render `/attention`'s `conditions` | **Not started** | `normalizeSectionResponse` (`clientProfile.js`) returns `rows, record, totals, filters, page, limit, total`. `conditions` is dropped on the floor. |
| 4 | Honour the declared `filters` | **Conflicts with what we shipped yesterday** | Commit `dc1cba75` (PR #149, merged, in production) **removed** `in_repair` and `upcoming` from the dropdowns and pinned their absence with tests. The note asks for them back, disabled, with a reason. |
| 5 | Wire `GET /platform/me` into the guard | **Done, waiting on a merge** | PR #150: `platformGate.js`, `usePlatformMe.js`, rewritten `PlatformGuard.jsx`, 21 tests. Not merged, so not in production. |
| 6 | Verify the nine tabs end to end | **Not started**, and one blocker found | `withReportedMoney` drops a column only when `format === "cents"`. Every non-money `null` in the note's table renders as a column of dashes. |

Goal 5 needs no work. The remaining five are below in the order we should take them.

---

## 2. Three questions for the backend before we start

These are not blockers for everything, but each one changes code we would otherwise write twice.

### 2.1 Is `X-Error-Ref` in `Access-Control-Expose-Headers`? (blocks half of Goal 1)

The note says the header rides on *every* response, including successful ones, so a request that did not quite fail can still be correlated. The console and the dashboard are a different origin from the API, and a cross-origin response header that is not named in `Access-Control-Expose-Headers` **does not exist as far as JavaScript is concerned** — `headers['x-error-ref']` reads `undefined`, with no error and no warning.

We hit exactly this on 2026-11-24 with the `RateLimit-*` family: the server was sending them and the browser could not read one of them. That was fixed and the fix is live as of today.

The body's `ref` field works regardless, so Goal 1 ships either way. The header fallback, and the whole "correlate a request that did not fail" idea, is dead on arrival unless the header is exposed. **Please confirm or add it.**

### 2.2 Which `filters` shape is canonical? (blocks Goal 4)

Two shapes are now in play:

```jsonc
// what we were asked for on /audit (2026-11-25)
"filters": { "staff": [ { "value": "a@b.c", "label": "a@b.c" } ] }

// what the note declares for /inventory (2026-11-26)
"filters": { "status": { "supported": [...], "unmeasured": [...], "applied": null, "note": "…" } }
```

We can read both, but we would rather read one. Is the `{supported, unmeasured, applied, note}` envelope the direction of travel for `filters.staff` too, or do the two shapes coexist by design — one for "here are the values that exist", the other for "here is what I can and cannot filter on"?

### 2.3 Does `/events` carry the same envelope as `/inventory`?

The note shows `filters.status` for `/inventory` and says `upcoming` is not offered as a filter, but it does not show an `/events` `filters` block. If `/events` sends one, we drive both screens from the server and never hard-code again. If it does not, `upcoming` stays off the Events screen and we are back to a hard-coded list on exactly one screen, which is the thing worth avoiding.

---

## 3. Two decisions that are ours, not the backend's

### 3.1 The Merchant tab: visible-and-explaining, or hidden?

The note puts this to us explicitly and both answers are defensible.

**Recommendation: keep it visible, with a deliberate "not available yet" state.** A missing tab raises a different question from an explained one — a tab that is not there reads as a dashboard that forgot about Stripe, and nobody can tell that apart from a bug on sight. An explained tab answers the question before it is asked, and the `needs` array the server sends is written precisely so the tab can say what it is waiting on. Hiding it also means re-adding it later, which is a second change for the same feature.

### 3.2 `in_repair` and `upcoming`: bring them back disabled, or leave them out?

Yesterday we removed them. Today the backend asks for them back as disabled options carrying a reason. Both positions come from the same principle — *a control that cannot carry an answer teaches a reader to distrust the screen* — and they disagree only on whether a disabled control is a control.

**Recommendation: bring them back, disabled, and only on the server's word.** The argument that changed my mind is the note's: an operator who expects "Lost" and does not find it assumes the screen is broken, which is the same failure we were trying to prevent, one step further out. But with one condition attached:

> The disabled options are built from `filters.status.unmeasured` as the server sends it. We do not hard-code a second list of things to grey out. If the server stops sending `unmeasured`, the options disappear rather than lingering as a hand-maintained fiction.

That condition is what makes this different from reverting `dc1cba75`. The tests that pin their absence get inverted, not deleted: they become "no option outside `supported ∪ unmeasured` can ever be offered".

---

## 4. The order, and why

1. **Goal 1 — the error reference.** It is the only one with a clock on it: it is live in production right now, it affects every screen in the dashboard rather than the console alone, and until it lands every 500 our users hit is unrecoverable detail. Start here even though it is the least interesting.
2. **Goal 2 — the 501.** Small, self-contained, and currently costing a user eight seconds of skeleton before a wrong answer. It also shares a file with Goal 1's render, so the two land together cheaply.
3. **Goal 4 + the `withReportedMoney` half of Goal 6.** Same idea in two places — never offer a control or a column that cannot carry an answer — and the generalisation of `withReportedMoney` is a prerequisite for Goal 6's walkthrough being readable.
4. **Goal 3 — `conditions`.** Needs a small design decision on the empty state, so it benefits from not being first.
5. **Goal 6 — the walkthrough.** Last by necessity: it is the goal that finds what the other five missed, which only works if the other five have landed.
6. **Merge PR #150** whenever CI is green. Independent of all of the above.

---

## 5. Goal by goal

### Goal 1 — Show the error reference

**Where.** `setupResponseInterceptor` in `src/api/devitrakApi.jsx:134`. It is shared by all four instances (`devitrakApi`, `devitrakApiAdmin`, `devitrakApiArticle`, `devitrakApiPlatform`), so doing it here covers the whole dashboard, not just the console. It already carries two global concerns, `handleUnauthorized` (401) and `handlePlanLimit`, so the shape for a third exists.

**New file: `src/api/errorReference.js`** — pure, no axios, no React:

- `readErrorReference(error)` → the string, or `null`. Body first (`error.response.data.ref`), header second (`error.response.headers['x-error-ref']`), trimmed, and `null` for anything that is not a non-empty string.
- `attachErrorReference(error)` → sets `error.errorRef` and returns the error, so the interceptor stays one line.

**In the interceptor.** Call it before the 401 branch, so even an expired session carries its reference. Log once, `console.error`, with the method and the full URL beside the reference — that alone earns its keep before any UI exists.

**In the UI, phase one only.** `PlatformRequestError.jsx` gains a small secondary line: `Reference a3f91c2b4e07`, click-to-copy, under the description, never in the title. Twelve hex characters get transcribed wrong by hand and a wrong reference is worse than none.

**Phase two, separately.** The dashboard outside the console renders `msg` in dozens of places. That is its own pass and it should not hold this one up; the interceptor work makes every one of those sites able to show a reference the day we get to it.

**Tests.** `src/api/errorReference.test.js`, beside the twelve test files `src/api/` already has — `planLimit.test.js` and `sessionExpiry.test.js` among them, which are this concern's two siblings in the same interceptor. No coverage-scope exception is needed. Cases: body wins over header; header used when the body has none; header read whatever its case and through an `AxiosHeaders` getter; `null` for an empty string, a non-string, a string body, a response with no data, and an error with no response at all (a network failure has no reference and must not invent one).

**Verify.** `POST /api/db_item/consulting-item` with `{}`. Before today it answered `{"msg":"syntax error at position 29"}`; now it answers the generic message plus a `ref`.

**Done when.** A 500 anywhere in the dashboard shows a reference the user can copy, and that reference appears in the browser console next to the failing URL.

---

### Goal 2 — Handle `merchant`'s 501 as "not served"

**Two parts, and the first one is not in the note.**

**(a) Stop retrying it.** `retryPlatformQuery` (`src/pages/platform/utils/platformQuery.js`) refuses to retry 4xx except 408 and 429, and retries everything else twice. 501 is a 5xx, so today the Merchant tab asks three times over about eight seconds for an answer that will never change. 501 is a refusal wearing a 5xx: it joins the no-retry side. Test first.

**(b) Render it as its own state.** `PlatformRequestError.jsx` already special-cases 404 ("The server does not have this yet"). 501 becomes a third branch:

- Title: *Not available yet* — not "couldn't load", which claims a failure that did not happen.
- Description: the server's own `msg`, verbatim. It is written to be read.
- The `needs` array as a short list underneath, when present.
- **No Try again button.** Offering a retry for a refusal is the same lie as a filter that cannot match.

**While we are in that file.** `notDeployed` is defined twice — `PlatformRequestError.jsx:5` and `PlatformClientProfilePage.jsx:59`. One definition, imported.

**Tab visibility.** Per §3.1, the tab stays. `CLIENT_PROFILE_TABS` is untouched.

**Tests.** `platformQuery.test.js`: 501 is not retried, 500 still is, 408/429 unchanged. The render branch is a component, so it is covered by the walkthrough in Goal 6 rather than by a unit test.

**Done when.** Opening the Merchant tab on any client shows a deliberate "not available yet" state, immediately, distinguishable at a glance from a failed request.

---

### Goal 3 — Render `/attention`'s `conditions`

**Read it.** `normalizeSectionResponse` in `src/pages/platform/utils/clientProfile.js` gains `conditions`, handled exactly like `filters`: the object as sent, or `null` when it is absent or is not an object. `usePlatformList` spreads that return value already, so the hook needs no change at all — which is the payoff from putting the normaliser where we put it.

**Shape it.** A pure helper in `platformScreens.js`:

```
attentionChecks(conditions) -> [{ key, label, active, reason, availableFrom }]
attentionSummary(conditions) -> "1 of 3 checks running"
```

Both derived from the payload, never from a constant. That is what makes 2026-12-09 arrive without a deploy: when `staffDormant` flips to `active: true`, the count and the list follow the response. A test pins exactly this — feed it a `conditions` where two are active and assert the summary says two, with no date logic anywhere in our code.

**The design decision.** Today the empty state says some version of "all clear". It has to stop saying that. The replacement names what ran: *"1 of 3 checks running — nothing found"*, with the two that are not running named underneath and their `reason` used verbatim where there is room.

This is the Overdue pill a third time. The rule by now is settled here: a screen may say nothing was found, but it may not say nothing is wrong unless it looked for everything.

**Done when.** An empty `/attention` list names which checks ran, and 2026-12-09 arrives without anyone shipping anything.

---

### Goal 4 — Honour the declared `filters`

Blocked on §2.2 and §2.3 for the final shape; the structure below holds either way.

**Read it.** A pure reader beside `normalizeSectionResponse`:

```
declaredFilterOptions(filters, param) -> [{ value, label, disabled, reason }]
```

`supported` → enabled. `unmeasured` → disabled, carrying `note` as the reason. Anything the server did not mention does not appear. Absent or malformed `filters` → `[]`, and the screen falls back to its declared list, so an old server does not empty the dropdowns.

**Use it.** `PLATFORM_LIST_SCREENS[...].filters` stops being the source of truth for *which* values exist and becomes the fallback and the label source. The screen asks the server first.

**The two options come back disabled** (§3.2), with a reason an operator can read: *"Lost is not recorded by the server"*, not a greyed-out word with no explanation.

**Totals.** `/events` sends `totals.upcoming: null`. `withReportedMoneyTiles` only drops `cents`, so that is a dash on screen today. It is fixed by the Goal 6 widening below, not here — same change, one place.

**Tests, inverted rather than deleted.** The tests from `dc1cba75` that assert `in_repair` and `upcoming` are absent become: no option outside `supported ∪ unmeasured` is ever offered, and an `unmeasured` option is never selectable. The protection survives; only the mechanism changes from a hand-maintained list to the server's declaration.

**Sample data.** `platformMockData.js` and the mock router must send the new `filters` envelope, or the sample build teaches a different contract from the live one — which is the trap that flag separation exists to prevent.

**Done when.** No dropdown in the console offers a value that can never match anything, and the ones that cannot be offered say why.

---

### Goal 6 — Verify the nine tabs end to end

**The blocker first.** `withReportedMoney` (`platformScreens.js:288`) filters on `column.format !== "cents"`. Every non-money `null` in the backend's table therefore renders as a full column of dashes: `members.status`, `members.joinedAt`, `members.devicesOut`, `consumers.status`, `consumers.lastSeenAt`, `consumers.devicesOut`, `inventory.lost`, `transactions.status`, `events.devicesNotReturned`.

The rule was never about money. It is: *a column where no row reports a value is a column that teaches the reader a fact nobody checked.* Widen both helpers to drop any column, of any format, where no row reports a value — money has no special claim to it.

One guard with the widening: a column must be dropped only when **every** row is null, never when some are. A sparse column is data; an empty one is a promise nobody kept.

**Things to confirm, not assume.**

- `staff.twoStepEnabled`: `null` (no account) and `false` (account, no MFA) are different facts. `formatSectionValue("bool", null)` → `—` and `("bool", false)` → `No` already distinguishes them. Confirm it survives the widening — a tab where every employee lacks an account would otherwise drop the column entirely, which is the right call, but check it reads that way on screen.
- `consumers.transactionsCount` and `events.consumersCount` are **real** numbers, not nulls. They must not be dropped.
- `subscription` returns `plan: "free"` for a client with no subscription document. That is a value, not an absence.
- Profile-tab `inventory` is grouped by model; cross-client `/inventory` is one row per device. The columns differ on purpose.

**The walkthrough.** Two clients, chosen deliberately:

1. One that cross-walks to SQL — all nine tabs, every one opened.
2. One that **does not** — `inventory` and `members` must be *empty*, never someone else's data. This is the only check on this page that is a security check, and it is the reason the walkthrough cannot be skipped.

Plus: `eventsActive` in the header matches the Events tab count (wrong until today, per the note), and every null above renders as a dropped column rather than a blank or a zero.

**Done when.** Someone has clicked through all nine tabs on two different clients and the surprises are written down — in a report, not in a memory.

---

## 6. One pass that exercises all six

Five minutes, after goals 1–4 land:

1. Sign in as an operator and open the console → **Goal 5** (does the guard ask `/me`?).
2. Open a client profile and walk all nine tabs → **Goals 2 and 6**.
3. Open the Inventory and Events filters → **Goal 4** (are `lost` and `upcoming` disabled, with a reason?).
4. Open the Overview with an empty attention list → **Goal 3** (does it say what was checked?).
5. Force a 500 on any route → **Goal 1** (is there a copyable reference?).

---

## 7. What we send back

The backend asked for two things specifically.

**Messages that used to be useful and now read generic.** We cannot produce that list from here — it comes from what our users hit, which means it comes after Goal 1 lands and the console starts logging references beside URLs. We will send it as it accumulates rather than as one batch, because the first few will tell them more than the fiftieth.

**Anything in the nine tabs that looks wrong rather than empty.** That is the output of the Goal 6 walkthrough, and it is the deliverable of this plan that they cannot get any other way.

Two things we owe them back that they did not ask for:

- §2.1, the `X-Error-Ref` exposure question. They have no way to see that from their side; it looks fine on every tool that is not a browser.
- The note that `GET /platform/me` went uncalled for a week is fair, and worth answering rather than absorbing: it is wired now (PR #150, 21 tests), and it is wired the way they described — the sign-in field as a hint, the server's answer as the correction. One deliberate difference: a 401 or 403 outranks a cached allow, but **any other failure keeps the hint's answer**, because "we could not ask" is not "no", and the server gates every request behind the screen anyway. A network blip must not lock an operator out of a read-only console.

---

## 8. What is deliberately not on this list

`GET /audit`, `GET /companies/options` and the two export routes are not built on the server yet, so there is nothing to wire. `devicesOverdue` is blocked on a business answer — lease due date, event return date, or the device's own — and that one decision unblocks `/attention`'s first condition and four endpoints at once. It is the highest-leverage item on either team's list and it is not an engineering problem.

`COMPANY_OPTIONS_LIMIT` is already 100 (`platformClients.js:51`), so §7.2 of the 11-25 note is closed from our side.
