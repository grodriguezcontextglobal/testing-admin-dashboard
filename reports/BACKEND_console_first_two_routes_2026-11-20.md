# `/summary` and `/companies` are built — and the money columns cannot come from our database (2026-11-20)

**From:** the backend agent (`server-testing`). **PR #96**, against `release/observabilidad`. **Not merged, not deployed.**
**Updates the table in** `BACKEND_console_dc3_endpoints_2026-11-19.md` §1.

You said you would flip `VITE_APP_PLATFORM_CONSOLE_MOCK` to `false` and wire these two first, so these two are what we built first.

**Do not wire them yet** — the table below still says `not deployed`, and our rule has not changed: a row flips to **live** in a note, not by probing. This note is so you can read the shapes and object before they are deployed rather than after.

---

## 1. The table

| Endpoint | Status |
|---|---|
| `GET /api/platform/me` | **live** |
| `GET /api/platform/summary?range=7d\|30d\|90d` | **built, PR #96** |
| `GET /api/platform/companies?search=&status=&plan=&page=&limit=` | **built, PR #96** |
| `GET /api/platform/companies/:id` | not built |
| `GET /api/platform/companies/:id/:resource` | not built |
| `GET /api/platform/:resource` | not built |
| `POST /api/platform/exports`, `GET .../exports/:jobId/file` | not built |

Both new routes hang off the chain that already existed, mounted with `router.use`, so **every read writes its row in `platform_audit_log` without anyone having to ask for it**. That was the reason for mounting it that way in M1 and it is paying off now: the two routes added no audit code at all.

Envelope exactly as your `normalizeSectionResponse` expects: `{ ok, data, page, limit, total }`, with `totals` and `filters` added when a screen has them. Page size caps at **100** — asking for more is not an error, you get 100 and `limit` tells you what you got.

---

## 2. The one you will not like: the money columns

**Neither transaction model stores an amount.**

| Model | Fields |
|---|---|
| `Transaction` | device, paymentIntent, consumerInfo, event_id, date, company, type |
| `StripeTransaction` | device, paymentIntent, clientSecret, user, eventSelected, provider, company, type |

The money lives in **Stripe and nowhere else**. So `revenue30dCents`, `volumeCents`, `refundsCents` and `amountCents` are not database queries. They are Stripe API calls, **one per client**, which makes every screen that shows a figure as slow and as failable as the `merchant` tab you already decided needs its own loading state.

**For now those fields return `null`**, which your table already renders as a dash. We are not sending `0`: "I do not know" and "this client billed nothing" are different sentences and only one of them is true.

`/summary` likewise returns `revenueCents: null`, `transactions: null`, `failedPayments: null`, `previous: null` and `topClientsByRevenue: []`.

**This needs a decision and it is not ours.** Three options, in the order we would pick them:

1. **Store the amount when a transaction is written.** Correct, cheap to query forever after, and it fixes every screen at once. Does nothing for the history — figures start the day it ships.
2. **A nightly job that pulls totals from Stripe into our database.** Figures up to 24 hours old, no per-request Stripe dependency, and it can backfill history.
3. **Call Stripe per request.** Correct and current, slow, rate-limited, and it makes the client list fail when Stripe has a bad afternoon.

Our recommendation is **1 and then 2**: start storing it now so it stops getting worse, then backfill. Until one of them happens, every money column in your design is a dash, and we would rather you see that now than discover it on the day you wire the screen.

---

## 3. Two things we decided because nobody had

**Client status.** Your screens paint four pills — `active`, `at_risk`, `trial`, `paused` — and no note of either side ever said which is which. It is a business rule, so it now lives in one place on our side:

```
cancelled | unpaid      -> paused
trialing                -> trial
past_due | incomplete   -> at_risk
devices overdue > 0     -> at_risk
otherwise               -> active
```

**The order matters.** A paused company with overdue devices stays `paused`: showing it as `at_risk` would send somebody chasing a client who already left. If you disagree with any line, say so — it is five lines in one function and a test, not a refactor.

**`devicesOverdue` is `null` for now.** It comes from the device-lease views and we have not wired that query yet. Which means that today a company is `at_risk` only through its subscription status, never through overdue devices. Worth knowing before you read the first screen and conclude everybody is healthy.

---

## 4. What a `/companies` row actually contains

```jsonc
{
  "id": "…", "name": "…",
  "ownerName": "…", "ownerEmail": "…",
  "plan": "Free",            // from CompanySubscription; no row means Free
  "status": "active",        // computed, §3
  "staffCount": 7,           // active employees
  "deviceCount": 240,        // item_inv
  "devicesOut": 31,          // item_inv where warehouse = 0
  "devicesOverdue": null,    // §3
  "revenue30dCents": null,   // §2
  "currency": "USD",
  "lastActivityAt": "2026-11-19T08:00:00.000Z"  // newest StaffActivityLog row
}
```

Field names are yours, from `PlatformClientsPage.jsx:23`. `search` matches name, owner name and owner email; `status` and `plan` filter as your `buildCompaniesQuery` sends them, and **`Pro` matches `Pro (trial)`** because a trial is a status and not a different plan — your rule, kept.

One thing to know about `deviceCount` and `devicesOut`: they are `0` when the company exists in SQL and has no inventory, and **`null` when the company does not cross to SQL at all**. Today all 21 cross, so you should see numbers everywhere. If a `null` ever appears in that column it is not a company with no devices — it is a company we could not resolve, and we would want to hear about it.

---

## 5. `/summary` names no client, and there is a test that says so

```jsonc
{ "range": "30d", "rangeDays": 30,
  "current": { "activeClients": 0, "totalClients": 0, "clientsAtRisk": 0,
               "activeEvents": 0, "devicesOut": 0, "devicesOverdue": null,
               "staffAccounts": 0, "staffWithMfa": 0,
               "revenueCents": null, "transactions": null, "failedPayments": null },
  "previous": null, "topClientsByRevenue": [], "computedAt": "…Z" }
```

`range` accepts `7d`, `30d`, `90d`; anything else is `30d` rather than an error, because a screen should not break over a URL parameter.

**No client is named anywhere in it**, which is what makes it the one console screen that can be left open on a shared monitor. That is now asserted by a test rather than left to good intentions — including `topClientsByRevenue`, which stays empty while §2 is unresolved and which, when it is filled, will be the first thing in `/summary` that names a client. Flag it in your design if that matters for where the screen gets displayed.

---

## 6. What we need from you

1. **The money question in §2.** Which of the three, and we build it.
2. **Any line of the status rule in §3 you would draw differently.**
3. **Whether `/companies/:id` or `devicesOverdue` comes next.** The profile unlocks a whole screen; overdue devices fix the `at_risk` pill and feed two of the three `attention` conditions. We lean towards `devicesOverdue`, because a status pill that cannot go red is worse than a missing screen — it is a screen that lies quietly.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
