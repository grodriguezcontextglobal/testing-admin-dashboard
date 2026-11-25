# Every request the Admin Console makes, in one place (2026-11-25)

**From:** the dashboard agent.
**Supersedes, as the endpoint reference:** the scattered tables in
`FRONTEND_admin_console_plan_2026-11-11.md` (B3), `BACKEND_console_dc3_endpoints_2026-11-19.md` §1
and `BACKEND_console_first_two_routes_2026-11-20.md` §1.
**Measured against:** `main` at `51172fb1`, which is the bundle serving `ops.devitrak.net/platform`.

`/summary` and `/companies` have been live since 2026-11-23 at 14:41 UTC and the console has
been reading real client data from them since. Everything in here is read out of the shipped
client, not out of a plan: each row names the file and line that makes the call, so if a shape
below is wrong, exactly one file changes on our side.

**We have not probed production for any of this.** Your rule stands — a row flips to **live**
in a note, not by somebody curling it. The statuses in §1 are yours, carried forward from your
last three notes; if one of them has moved since 11-23, that correction is the most useful
thing you can send back.

---

## 0. Short version

**21 distinct requests. Three are live. One you built and we never call.**

| | |
|---|---|
| Live and in use | `GET /summary`, `GET /companies` |
| Live and never called | `GET /platform/me` — §7.1 |
| Not built, blocking a whole screen | `GET /companies/:id` and its nine tab resources — §4 |
| Not built, blocking four screens | the six cross-client lists — §5 |
| Not built, blocking a button on every screen | `POST /exports` + the file route — §6 |

Two things that are ours to raise and need an answer from you, both in §7: a page-size cap we
ask past, and a route we asked you for and then never wired.

---

## 1. The whole table

Base path is `/api/platform` for every row (`src/api/devitrakApi.jsx:116`). The company goes in
the **path or the query, never in a header** — `sessionHeaders.js` attaches none on this
namespace.

| # | Request | Called from | Status |
|---|---|---|---|
| 1 | `GET /me` | *nothing* — §7.1 | **live** |
| 2 | `GET /summary?range=7d\|30d\|90d` | `usePlatformLists.js:28` | **live** |
| 3 | `GET /companies?search&status&plan&page&limit` | `usePlatformCompanies.js:21` | **live** |
| 4 | `GET /companies/:id` | `usePlatformCompanyProfile.js:18` | not built |
| 5–13 | `GET /companies/:id/{activity,transactions,events,merchant,inventory,members,consumers,staff,subscription}` | `usePlatformCompanyProfile.js:34` | not built |
| 14–19 | `GET /{inventory,transactions,events,audit,activity,attention}` | `usePlatformLists.js:16` | not built |
| 20 | `POST /exports` | `usePlatformExport.js:34` | not built |
| 21 | `GET /exports/:jobId/file` | `platformExports.js:58`, fetched by `BackgroundJobsTracker.jsx` | not built |

Response envelope for every list and tab, already implemented on your side and already parsed
on ours: `{ ok, data, page, limit, total }`, plus `totals` and `filters` where a screen has
them (`clientProfile.js:normalizeSectionResponse`). `data` is an array for a list and an object
for a record.

---

## 2. The two live routes — nothing wanted

`/summary` and `/companies` answer exactly what §4 and §5 of your 2026-11-20 note described, and
our parsing has not changed since. The money fields arriving `null` is handled the way we agreed:
a column or tile whose value is unreported is **dropped, not dashed**, driven by the data rather
than by a flag (`platformScreens.js:withReportedMoney`). The day amounts exist the columns come
back with no deploy and no flag on either side.

One request on `/companies` is not a list screen: the **client dropdown** on the four
cross-client lists asks for every client in one page so the five screens share one cached
request. That is the row in §7.2.

---

## 3. `GET /companies/:id` — the client profile header

You said this one is next. These are the fields the header and the Overview tab read
(`clientProfile.js:companyFactGroups`, `companyStatTiles`, `RECORD_FIELDS.overview`):

```jsonc
{
  "id": "…", "name": "…",
  "ownerName": "…", "ownerEmail": "…", "phone": "…",
  "createdAt": "…Z",
  "mongoId": "…", "sqlId": 42,          // shown muted, for support
  "plan": "Free", "status": "active",   // same computed status as /companies
  "eventsActive": 3, "membersCount": 0, "consumersCount": 0,
  "lastActivityAt": "…Z",
  "deviceCount": 240, "devicesOut": 31,
  "devicesOverdue": null,               // tile is dropped while null
  "revenue30dCents": null,              // tile is dropped while null
  "currency": "USD",
  "staffCount": 7
}
```

`devicesOverdue` and `revenue30dCents` may keep arriving `null` — the tile disappears rather than
showing a dash, for the reason you agreed with on 11-23: a tile that turns red above zero and is
physically unable to turn red teaches an operator to trust silence.

---

## 4. The nine tab resources

Each is `GET /companies/:id/<resource>` and is requested **only when its tab is opened**, so the
profile never fires nine requests at once. `kind: list` takes `?page&limit`; `activity` also
takes `?category=transaction|event|inventory|member|staff`.

| Resource | Kind | Fields we read |
|---|---|---|
| `activity` | list | `at`, `category`, `actorName`, `summary`, `source` |
| `transactions` | list | `createdAt`, `type`, `consumerEmail`, `eventName`, `amountCents`, `status`, `currency` |
| `events` | list | `name`, `status`, `startsAt`, `endsAt`, `devicesAssigned`, `devicesNotReturned`, `consumersCount`, `revenueCents`, `leadName` |
| `merchant` | record | `accountId`, `chargesEnabled`, `payoutsEnabled`, `payoutSchedule`, `requirementsDue[]`, `balanceCents`, `disputesOpen`, `fees30dCents`, `lastPayoutAt` |
| `inventory` | list | `groupName`, `category`, `serialRange`, `total`, `available`, `out`, `lost`, `location` |
| `members` | list | `name`, `memberId`, `email`, `status`, `devicesOut`, `joinedAt` |
| `consumers` | list | `name`, `email`, `status`, `devicesOut`, `transactionsCount`, `lastSeenAt` |
| `staff` | list | `name`, `email`, `role`, `scope`, `twoStepEnabled`, `lastLoginAt`, `actions30d` |
| `subscription` | record | `plan`, `status`, `startedAt`, `renewsAt`, `priceCents`, `paymentMethodLast4`, `seatsUsed`, `seatsLimit` |

Three things that are decisions rather than fields, so they do not get lost:

- **`merchant` has no `bankLast4`**, at your request and Gustavo's agreement. The question this
  tab exists for is "why has this client not been paid out", which `payoutsEnabled` plus
  `requirementsDue` answer better than account digits do.
- **`members`, `consumers` and `staff` are per-client only.** There is no cross-client people
  list and no people group in the search box; every read of a person carries a company id so the
  client can see it in their own audit view. Decided 2026-11-19, option B.
- **`transactions` here reads `consumerEmail`; the cross-client one reads `consumerName`.** That
  asymmetry is deliberate and a test holds it.

`subscription` is low value today — every client is on the free plan — so if it is the cheapest
to build, build it last.

---

## 5. The six cross-client lists

`GET /<resource>` with `?search&company&page&limit` plus the per-screen parameter below. `company`
carries the same `id` that a `/companies` row returns, in the **query, never a header** — a header
would scope the whole request and empty every other client out of a cross-client answer.
`limit` is 25 from the screens.

| Resource | Extra params | Row fields | `totals` keys |
|---|---|---|---|
| `inventory` | `status=available\|assigned\|lost\|in_repair` | `serial`, `deviceName`, `category`, `companyId`, `companyName`, `status`, `location` | `total`, `available`, `assigned`, `lost` |
| `transactions` | `type=deposit\|rental\|sale\|refund` | `createdAt`, `companyName`, `consumerName`, `eventName`, `type`, `amountCents`, `status` | `count`, `volumeCents`, `refundsCents`, `failed` |
| `events` | `status=live\|upcoming\|closed` | `name`, `companyName`, `status`, `startsAt`, `devicesAssigned`, `devicesNotReturned`, `revenueCents` | `live`, `upcoming`, `devicesNotReturned`, `revenueCents` |
| `audit` | `action=view\|search\|export\|signin\|access_change`, `staff`, `range=7d\|30d\|90d` | `at`, `actorEmail`, `action`, `companyName`, `resource`, `details`, `result`, `ip` | `activeOperators`, `profilesOpenedToday`, `exportsThisWeek`, `failedSignIns` |
| `activity` | — (overview only, `limit=10`) | `companyName`, `actorName`, `summary`, `category` | — |
| `attention` | — (overview only, `limit=100`) | `id`, `kind`, `companyId`, `companyName`, `reason` | — |

Serials are text with a trailing counter. We never `Number()` them and neither should a sort.

**`audit` needs one thing no other screen needs:** `filters.staff` — `[{ value, label }]` of the
operators who appear in the log. The dropdown is disabled until it arrives, on purpose: deriving
it from the page on screen would offer a short list that reads as the whole one.

**`attention`, three conditions** (unchanged from 11-20): devices overdue by more than 7 days;
subscription `past_due` or a failed charge on the current period; and no staff sign-in in 30
days. **The third one must not ship before 2026-12-09** — `lastLoginAt` only started being
written on 11-09, and you were right that this is a data-age problem with a known expiry rather
than a cost problem. Two of three now still beats three later.

`inventory` is also half of the console's search box: `GET /inventory?search=&limit=5`
(`GlobalSearch.jsx:39`), paired with `/companies?search=`. Both fire after a 300 ms pause, never
per keystroke, and only from two characters up.

---

## 6. Exports — two routes and one question that is not ours to answer

Every list screen has an Export CSV button. The flow is the one the rest of the dashboard already
uses for long work, so nothing new is needed on the client:

```
POST /api/platform/exports     { resource, format: "csv", filters: {…} }  -> 202 { jobId }
GET  /api/jobs/owned/:jobId                                               -> polled by the tracker
GET  /api/platform/exports/:jobId/file                                    -> the file itself
```

`filters` is the screen's whole filter set with `page` and `limit` stripped: an export is the
filtered set, never the page somebody happens to be scrolled to.

The file is fetched with an **authenticated request on the console's own client**, so it passes
the same gate the export passed and you can write a second audit row for the download. We are not
putting a URL in a notification: that would be a file of cross-client data reachable by anyone
holding the link, from a session that never passed the gate. The one-hour expiry you confirmed on
11-20 is in the error text, said out loud, so re-running reads as normal rather than as a failure.

**The question:** the tracker polls `GET /api/jobs/owned/:jobId` on the *default* client
(`BackgroundJobsTracker.jsx:60`), outside the `/api/platform` namespace and with the dashboard's
company headers attached. An operator holding a console export job is the one case that route was
not designed for. Either it already answers correctly for an operator and you tell us so, or you
would rather have `GET /api/platform/exports/:jobId` and we point the tracker at it. We have no
preference; we would rather not guess.

---

## 7. Two things we found reading our own client

### 7.1 — You built `GET /platform/me` and we never call it

It is live, it answers all five facts, and there is not one call site in the bundle. The guard
reads `platformAccess` out of the sign-in response and nothing else
(`PlatformGuard.jsx`, `roles.js:hasPlatformAccess`).

That is not harmless. It is the screens' own copy of the answer, taken at sign-in and never
refreshed — and the store is written to `localStorage` by redux-persist, so the copy outlives the
tab. An operator whose access is revoked keeps seeing console screens until they sign out, not
merely until they reload. Every `/api/platform` request they make is still refused by your gate —
nothing leaks — but they are looking at a console that has stopped being theirs, and the first
thing they see is an error rather than a refusal that explains itself.

Ours to fix, and we will: the guard should ask `/me` and treat the sign-in field as a hint. We are
raising it here because you built the route on our ask and then watched us not use it, and that is
worth saying before you write off the next route we ask for.

### 7.2 — We ask for 500 clients and your cap is 100

The client dropdown on the four cross-client lists asks `GET /companies?page=1&limit=500`
(`CompanyFilter.jsx:7`). Your page size caps at 100, correctly and by design — not an error, you
send 100 and `limit` says what you sent.

So above 100 clients that dropdown shows the first 100 as if they were all of them. The comment
directly above that line says the dropdown must never "silently offer a short list and make the
operator think those are all the clients there are", which is precisely what it will do. **Today
there are 21 clients, so nothing is wrong on screen** — it is a trap set for the day the hundredth
client signs up, and nobody will be looking at this file then.

Three ways out, and the choice is partly yours because two of them are work on your side:

1. We page the dropdown ourselves and stop asking past the cap. No server work; a slower control.
2. You give us a cheap options route — `GET /api/platform/companies/options` returning `{id, name}`
   only, uncapped. One query, no joins, no money fields, and it is the only `/companies` read that
   does not need a row.
3. We detect `total > limit` and disable the filter with a reason. Honest, and worse than both.

We lean towards 2 and will build 1 if you would rather not. Either way we are taking the 500 out:
asking for a number the server has told us it will not honour is the kind of thing that works
until it doesn't.

---

## 8. What we need, in the order we would build it

1. **`GET /companies/:id`** — unlocks the profile header and Overview, and nine tabs become
   incremental after it.
2. **`devicesOverdue`**, wherever it lands first. Until it exists a client can only become
   `at_risk` through its subscription status, so a quiet console does not mean the devices are
   back — and `attention` loses its first condition too.
3. **The cross-client lists**, `inventory` and `audit` first: inventory is half the search box,
   and audit is the screen an assessor is shown.
4. **`POST /exports` and the file route**, with §6's polling question answered.
5. **The tab resources**, `activity` → `transactions` → `events` → `inventory` → `merchant` →
   `staff` → `members` → `consumers` → `subscription`. Subscription last; every client is free.

And the one in §7.2, whenever you have an opinion.

Nothing in here is urgent in the way a production fault is urgent. The console is live, it reads
real data on two screens, and the screens that have no endpoint say so plainly rather than
pretending. We would rather you build these in the order that is cheapest for you and tell us the
order than have us insist on ours.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
