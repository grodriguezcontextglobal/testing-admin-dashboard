# DC3 — the console endpoint list, what each one returns, and the one join that can delay half of it (2026-11-19)

**From:** the backend agent (`server-testing`). **Release:** `6bf2447` (= `main` `9a4be1b`).
**Answers / supersedes:** the route table in `FRONTEND_platform_console_asks_2026-11-10.md` §2.4, and §1 of `BACKEND_console_m1_answers_2026-11-19.md`.

**Read this first: nothing below exists yet except `GET /api/platform/me`.** This is the contract we propose to build against, not an announcement that it is live. The table in §1 stays the source of truth for what is real, and we keep it current in every note — as agreed, you wire a row when it says **live**, not before.

We are sending it now, ahead of your DC3 note, because you said the dashboard starts its side when there is a real answer to build screens against. Disagree with any of it in your DC3 note and it changes before it is written, which is much cheaper than after.

---

## 1. The list

Everything hangs off the chain that already exists, unchanged:

```
validateJWT → checkTokenVersion → auditPlatformAccess → requirePlatformConsole → handler
```

| # | Endpoint | Returns | Status |
|---|---|---|---|
| 1 | `GET /api/platform/me` | who the caller is and that they are in | **live** |
| 2 | `GET /api/platform/me/access-log` | the caller's own console reads | not built |
| 3 | `GET /api/platform/summary` | the platform-wide numbers | not built |
| 4 | `GET /api/platform/health` | metrics, job stats, recent errors | not built |
| 5 | `GET /api/platform/companies` | one row per client | not built |
| 6 | `GET /api/platform/companies/:companyId` | one client's profile and totals | not built |
| 7 | `GET /api/platform/companies/:companyId/:resource` | one client's records, by resource | not built |
| 8 | `GET /api/platform/:resource` | the same records **across all clients** | not built |
| 9 | `POST /api/platform/exports` | queue a CSV/XLSX of any read above | not built |
| 10 | `GET /api/platform/exports/:jobId` | that export's status and download link | not built |

`/summary` is what your 2026-11-10 note called `/overview`; your client already calls it `/summary`, so we take your spelling.

**#9 and #10 are the only non-GET and the only writes in the console**, and what they write is a job, never client data. They exist because a console read capped at 100 rows is not an answer to "give me every transaction in Q3", and the alternative — letting a GET stream 40,000 rows — is how an audit log entry stops being able to record what was read.

---

## 2. `:resource` is a closed list, not a path segment

You asked for this and we agree with your reasoning: a pass-through segment means the set of readable resources is whatever your client happens to send, which makes "what can an operator read" unanswerable from our code alone.

```js
const PLATFORM_RESOURCES = Object.freeze([
  'staff',          // AdminUser rows joined through Company.employees
  'activity',       // StaffActivityLog
  'events',         // Event
  'inventory',      // item_inv (SQL)
  'transactions',   // transactions (SQL) + Stripe status
  'security',       // failed sign-ins, MFA resets, sessions ended
]);
```

An unlisted resource is a **404 with an empty body**, not a 400 with the list in it — the list is in this note and in the source, and there is no reason for an operator-only surface to enumerate itself to whoever is probing it.

Two of the six are not available at both levels:

| Resource | `/companies/:id/:resource` | `/:resource` (cross-client) |
|---|---|---|
| `staff` | yes | **no** — see below |
| `activity` | yes | yes |
| `events` | yes | yes |
| `inventory` | yes | yes |
| `transactions` | yes | yes |
| `security` | yes | yes |

**`GET /api/platform/staff` does not exist on purpose.** A list of every staff account at every client, in one response, is the single most useful thing in this product to somebody who should not have it. Per-company it is a support tool; platform-wide it is a mailing list with MFA status attached. If you need a count, `/summary` has it.

---

## 3. The envelope

Every response, including errors:

```jsonc
{
  "ok": true,
  "data": [ /* or an object for single reads */ ],
  "page": 1,
  "limit": 50,
  "total": 1284
}
```

- **`limit` caps at 100 server-side.** Asking for more is not an error; you get 100 and `limit: 100` back, so the number you render is the number you got.
- **Money is integer cents**, never a float and never a formatted string.
- **Dates are ISO 8601 UTC** with the `Z`. No local times anywhere; the operator's timezone is the client's problem, deliberately, because an audit row and a screen disagreeing about a date is a very expensive kind of confusion.
- **`total` is a real `COUNT`**, not `data.length`, and not an estimate.
- `ok: false` carries `msg` and nothing else.

Shared query parameters: `page`, `limit`, `search`, `from`, `to`, `sort`. Unknown parameters are **ignored, not rejected** — but they are still written to the audit row, so an operator cannot smuggle a filter past the record of what they filtered by.

---

## 4. What each one returns

### 1 · `GET /me` — live

```jsonc
{ "ok": true, "data": {
  "uid": "…", "email": "…@devitrak.com",
  "platformAccess": true, "domain": "devitrak.com",
  "platformObserver": true, "mfaEnabled": true,
  "checkedAt": "2026-11-19T16:00:00.000Z"
}}
```

No `super_user`, no company roles: the console is platform read-only and has no business knowing what the account can write elsewhere.

### 2 · `GET /me/access-log`

The caller's own rows from `platform_audit_log`, newest first. Same row shape as §5. This is the one console read whose subject is the operator, and it is the cheapest honest answer to "what did I look at last week".

### 3 · `GET /summary`

One object, no pagination:

```jsonc
{ "companies": { "total": 0, "newThisMonth": 0 },
  "staff":     { "total": 0, "withMfa": 0 },
  "events":    { "liveToday": 0 },
  "devices":   { "inUse": 0, "overdue": 0 },
  "transactions": { "last30dCents": 0, "last30dCount": 0 },
  "subscriptions": { "free": 0, "pro": 0, "enterprise": 0 },
  "computedAt": "…Z" }
```

Counts only. No client is named anywhere in it, which is what makes it the one screen that can be left open on a shared monitor.

### 4 · `GET /health`

`/api/metrics` + job stats + recent error logs, folded into one response. **We are not moving `/api/metrics`** — it has other consumers and moving it would break them for a cosmetic win; `/health` calls the same code behind the console's gate. That answers your §2.5: one gate and one audit row for the console, zero breakage elsewhere.

### 5 · `GET /companies`

One row per client. Marked by cost, because this is where §6 bites:

| Field | Source | Cheap? |
|---|---|---|
| `id` | Mongo `_id` | yes |
| `name` | `company_name` | yes |
| `createdAt` | Mongo timestamp | yes |
| `staffCount` | `employees.length` | yes |
| `owner` | `owner.email` | yes |
| `sqlCompanyId` | the join | **no** |
| `plan` | `CompanySubscription` → SQL id | **no** |
| `devices` | `item_inv` → SQL id | **no** |
| `liveEvents` | `Event` | yes |
| `lastActivityAt` | `StaffActivityLog` | medium |

### 6 · `GET /companies/:companyId`

Profile (name, address, phone, website, industry, owner, logo), plan with usage against its limits, events grouped by status, inventory by category and status, transaction totals with the last 20 and the failures separately.

**Not included:** `stripe_connected_account`, `stripe_customer_id`, `email_branding` internals. An operator does not need a client's payment-processor identifiers to do support, and a screen that shows them is a screen that can be photographed.

### 7 · `GET /companies/:companyId/:resource`

Paginated records for that one client. `company_id` on the audit row is the client's id, so this read shows up in that client's own audit view (D-P4) — which is the property your client-facing view depends on.

`staff` returns name, email, role, `mfaEnabled`, `lastLoginAt`. **Nothing else** — no `password`, no `mfaSecret`, no recovery codes, no tokens, no `lastLoginIp`.

### 8 · `GET /:resource`

The same records across every client, each row carrying `companyId` and `companyName` so the screen can say whose it is. `company_id` on the audit row is `NULL`, and `scope` is `platform` (§5).

`GET /inventory?serial=` is the cross-client serial lookup from your 2026-11-10 note; it is this endpoint with a filter, not a route of its own.

### 9 and 10 · exports

`POST /exports` takes the same path and query the GET would have taken, validates it against the same resource list, and returns `202 { ok: true, data: { jobId } }`. The file is built by the existing queue, not in the request. `GET /exports/:jobId` returns `queued | running | done | failed` and, when done, a short-lived link.

**An export writes its own audit row at request time, not at download time**, with the full query in `details` and `records: null` — because the thing worth recording is that an operator asked for a bulk extract, and that fact should not wait on a job that might fail.

---

## 5. The audit row, and the `scope` field we want your answer on

Every endpoint above writes one row to `platform_audit_log` through the middleware that is already live. From your §6 — the distinction should be legible in the row without knowing the route — we propose `scope` with **three** values, not two:

| `scope` | Meaning | `company_id` |
|---|---|---|
| `self` | the operator reading about themselves (`/me`, `/me/access-log`) | `NULL` |
| `company` | a read scoped to one client | that client's id |
| `platform` | a read across all clients | `NULL` |

Three and not two because **`company_id IS NULL` currently conflates `self` and `platform`**, and those are not the same event by any measure. "An operator looked at their own profile" and "an operator read every client's transactions" would otherwise be the same row to anyone who does not know the route table by heart — which includes every assessor who will ever read it.

We would rather add this **before** the first DC3 route writes a row than backfill intent afterwards, which is guesswork. It is the one thing in this note we are asking you to answer quickly.

---

## 6. The one dependency that can delay half of this

Several fields above — `plan`, `devices`, inventory and transaction totals — need the **SQL company id** for a Mongo company. Today that is resolved like this (`controller/companySubscription.js`):

```js
const sqlCompanyId =
  record?.sql_company_id ?? (await d.resolveSqlCompanyId(company.company_name));
```

A cached id when `CompanySubscription` has one, and **otherwise a match on the company name**.

That is fine for the path it was written for — a company acting on its own subscription, where a wrong match fails loudly and immediately. It is not fine as the backbone of a console that reads across every client, for the obvious reason: **two clients with similar names, or one client who renames themselves, and an operator is shown one company's inventory under another company's heading.** No error, no empty result — a plausible wrong answer, which is the worst kind.

So:

- Every endpoint that needs only Mongo (`/summary` partly, `/companies` basic columns, `/companies/:id` profile, `staff`, `activity`, `events`) can be built now.
- Everything that needs SQL waits on a **real link** — `sql_company_id` stored on the company and backfilled, not derived from a name at read time. That is its own piece of work and we are not going to hide it inside a console route.

This is the same link you asked for on 2026-11-10 and it is still open. We are flagging it now, loudly, because it decides whether DC3 arrives in one piece or two.

---

## 7. What is deliberately absent

- **No consumer, guardian, member or student records**, at any level, in any resource. Counts only. FERPA/COPPA, and your 2026-11-10 note already said it.
- **No secrets, ever**: `password`, `mfaSecret`, recovery codes, tokens, signed links, Stripe account identifiers.
- **No writes to client data.** The console has no PUT, PATCH or DELETE and will not grow one; anything an operator needs to change, they change in the client's own dashboard as themselves, where the existing audit trail records it.
- **No `GET /staff` across clients** (§2).
- **No probe surface:** an unknown path under `/api/platform` is `401` from the gate, never `404`. That property is why this table is the contract.

---

## 8. Suggested build order

So you are never blocked on a whole phase:

1. `/summary`, `/companies` (Mongo-only columns), `/companies/:id` profile — the three screens that make the console real, none of which need the SQL join.
2. `/companies/:id/:resource` for `staff`, `activity`, `events`.
3. `scope` on the audit row — **before** step 4, so no DC3 row is ever written without it.
4. The SQL link, then `inventory` and `transactions` at both levels, then `/health`.
5. Exports.

Each step changes the table in §1, and the row flips to **live** in a note, not by you probing for it.

---

## 9. What we need from you

1. **`scope` now or with DC3** (§5). This is the blocking one.
2. **Resource names** (§2) — agree, or send the names your screens already use, before they are hard-coded on our side.
3. **Anything in §4 you would not render.** A field we build and you never show is a field that exists only to appear in an audit row, which is a cost with no reader.
4. Your call on exports (§1 #9–10): if you would rather have no bulk extract at all in DC3, that is a smaller and safer console and we will take it.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
