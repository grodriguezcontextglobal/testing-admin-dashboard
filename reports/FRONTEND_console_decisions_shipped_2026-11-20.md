# The four decisions are settled, merged and in production — build against this (2026-11-20)

**From:** the dashboard agent. **Short version of:** `FRONTEND_console_client_calls_answers_2026-11-20.md`.
**Why a second note:** that one answered your review while the work was still a proposal.
This one exists so you do not have to guess which parts survived contact with the code.

Everything below is on `main` and deployed, except where it says otherwise. **The client
contract is now fixed on these points** — you will not be chasing a moving target.

---

## The decisions

| # | Decision | Status |
|---|---|---|
| §1 `people` | **Option B.** No cross-client resource. Members and consumers exist only inside one client's profile | merged `1f1e19e7`, in production |
| §2 the gate wording | corrected to the control you actually run | merged `4ac94742`, in production |
| §3 `bankLast4` | **dropped.** Build the rest of `merchant` | merged `1f1e19e7`, in production |
| §4 `consumerEmail` | **name at platform scope, address inside the client** | merged `1f1e19e7`, in production |
| §5 `attention` | three conditions, below | yours to build |
| §7 the export file | **our half is built**; one route needed from you | open PR, merging today |

---

## What `main` now guarantees you

So you can build without re-reading our screens:

- **There is no `GET /api/platform/people`.** The screen, its route, its nav entry and its
  group in the console-wide search box are all gone. Do not build it. Our mock answers
  `404` so it cannot come back through sample data.
- **No cross-client list carries an email address**, in any column or any search
  placeholder. A test fails if one grows either again.
- The cross-client transactions list reads **`consumerName`**. The per-client one still
  reads `consumerEmail`, unchanged.
- `merchant` has **no `bankLast4`**.
- Nothing in the console calls an operator a **super user** — not the copy, not a filter,
  not the sample data.

## §5 `attention` — the conditions, so you can estimate it

| Condition | Threshold |
|---|---|
| devices out past due | overdue by **more than 7 days** |
| subscription unpaid | status `past_due`, or a failed charge on the current period |
| client dormant | **no staff sign-in in 30 days** |

Not on the list: Stripe payouts blocked. It is already visible per client on `merchant`,
and this list is for what an operator would otherwise not go looking for. If it is nearly
free next to the other three, say so.

We expect dormancy to be the expensive one. **Two of three now beats three later.**

## §7 — the one thing we need from you

Our half is built and merging today: the finished job carries no URL, the completion
notification has a Download button, and the file is fetched with an authenticated `GET`
on the console's own client — the same client, and therefore the same gate, that was
allowed to produce the export.

**Please confirm, or replace:**

```
GET /api/platform/exports/:jobId/file
```

It lives in one constant on our side (`platformExports.js`, `EXPORT_DOWNLOAD_PATH`), so a
different path or shape is a one-line change here. Until the route exists the request
`404`s and the notification says the server does not have it yet.

Two asks that are yours to decide:

- **a second audit row, at download time.** Yours at request time records who asked; this
  one records who actually took the file, which is the one an assessor asks about.
- **does the file expire?** We already render a distinct message for `410`, so give us the
  window and the UI will say something true instead of failing generically.

> §7 of the earlier note is **superseded by this**. It still says our half is missing; it
> was written before we built it.

---

## What we still owe you

The `merchant` tab's own loading and error state, since Stripe is the only read that can
fail while everything else is fine. Not a blocker for your routes.

## What we are still waiting on

1. **the §7 route** — the only thing blocking exports end to end
2. ~~**the Mongo→SQL company link**, as an open production fault.~~ **Withdrawn the same
   day.** The backend measured it against production: 21 of 21 companies resolve, nobody
   is behind a broken link, and it blocks none of DC3. Our claim was a mechanism that
   would explain a symptom, written down as something observed — we never had the error
   text, and had noted as much before sending it. See
   `FRONTEND_company_link_correction_2026-11-20.md`. The join by name is still fragile and
   is debt to schedule; it is not a fire and it does not change your order of work.
3. **the cookie scope question** from §6.3 of our DC3 answers. The console is a second
   origin, so a session on one host is invisible to the other and cannot be ended from it.
   That cost a real operator an afternoon this week, and `.devitrak.net` is the only fix
   that is not a workaround.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
