# Client response — event allocation contract changes

**Answers:** `FRONTEND_event_allocation_changes.md` (branch `feat/event-allocation-hardening`, 2026-08-20)
**From:** frontend · **Date:** 2026-08-20

Your §1 is safe to deploy whenever you like — the client already sends the token
on both routes. Read §A for the one thing that would break if you also add
`authorizePermission`, and §D for a correction to the `00100003` diagnosis.

---

## Checklist verdicts

| Your item | Verdict |
|---|---|
| Send `x-token` on both container routes (§1) | ✅ **already done** — no client change |
| Handle `422` as non-retryable, surface `unresolved_serials` (§2) | ✅ **implemented this session** |
| Check `unresolved_serials` / `matched_count` on the `200` too (§2) | ✅ **implemented this session** |
| Send `Idempotency-Key` per batch on the queued route (§3) | ⛔ **N/A** — route has no callsite |
| Compare `total_items` against our own `data.length` (§4) | ✅ **implemented this session** |
| Drop `receivers-pool-bulk` after container allocation (§5) | ✅ **already done** — shipped `95a61580`, 2026-08-19 |
| Keep 1 job of N items; 500 per request (§5) | ⏸️ **deferred** — see §C |
| Fix the serial builder: `RX-100003` not `00100003` (§2) | ❌ **no such builder exists** — see §D |

---

## §A — ⚠️ Do NOT add `authorizePermission("event", "update")`

You offered to add it and asked us to say the word. **Please don't**, not without
widening the permission first.

Our permission matrix (`src/config/roles.js`) maps `event:update` to:

```js
const EVENT_RU = ["root_admin", "admin", "sale_manager", "event_manager", "assistant"];
```

That list **excludes `inventory_manager` and all four scoped inventory roles**
(`inventory_location_manager`, `inventory_location_assistant`,
`category_manager`, `category_assistant`).

Scanning stock into an event is warehouse work. The people who do it are exactly
the roles that list leaves out, so `authorizePermission("event", "update")` would
403 the primary users of both routes on day one — the failure mode you were
already worried about, and worse than it looks because those roles can still
*reach* the UI.

If you want these routes authorized, the honest key is an inventory-side one
(`inventory:update`, which does include all of them) or a new
`event:allocate_inventory` with a role list agreed on both sides. Happy to add
the latter to our matrix and hand you the list — just tell us which you prefer.
Leaving both routes on `validateJWT` + `checkTokenVersion` only is fine with us
in the meantime.

---

## §B — The queued container route stays unused, deliberately

`POST /inserting-items-in-event-from-container` has **zero callsites** in the
client and we are not planning to adopt it. The reasoning is recorded in
`src/pages/events/.../utils/containerAllocation.js`: it takes `item_id`s the
client would have to resolve itself, ignores `container_items`, never touches
`item_inv` or the receivers pool, and returns no counts. We use the synchronous
`/allocate-device-container-event` for all of it, exactly as your §0 recommends.

**So §3 (`Idempotency-Key`) and §4 (job counts) need nothing from us**, and the
`go build` in §7 is not blocking anything on our side. Worth knowing before you
spend more on that path — if it exists for another consumer, fine; if it existed
for us, it can be retired.

Two things from that section we did take note of and act on anyway:

- The `context.uid = null` → unpollable-jobId bug is a good general rule. We
  audited our own queued flows for it; the ones we poll
  (`/document/upload`, the XLSX importers) all run on authenticated routes.
- §4's `total_items`-is-the-matched-count trap applies to `insert-item-event`
  too, which **is** on our path via `/allocate-device-event`. Handled — see §D.

---

## §C — Container batch size stays at 150 until this deploys

`CONTAINER_BATCH_SIZE = 150` (pinned by a test to the 100–200 window you asked
for). Your §5 says 500 is safe again now that the statement is chunked at 1000 —
but that chunking lives on `feat/event-allocation-hardening`, which is **not
merged and not deployed**. Raising it now would send 10k-placeholder statements
at the currently deployed server, which is the `max_allowed_packet` failure the
150 exists to avoid.

**Ping us when the branch is live** and we'll raise it in one line plus a test
edit. Not urgent: at 150 containers per request nobody is waiting on this.

---

## §D — Correction: there is no client-side zero-pad on this path

Your §2 concludes: *"Looks like an 8-digit zero-pad built client-side where the
real serial carries an `RX-` prefix."*

We checked, and that is not what happened. `/allocate-device-event` has exactly
**one** callsite (`addSerialNumberRangeToEvent/addingItemsMethod/Sequential.jsx`).
The serials reaching it come from a scan/type input that does nothing but
`.trim()` them — no padding, no prefix stripping, no reformatting anywhere
between the input and the request body. `00100003` is what a human typed or what
a scanner read.

(There *is* reference-width `padStart` logic in the client, but it lives in the
consumer transaction screens — a different flow that never calls this endpoint.)

**This makes your §2 the entire fix, not half of it.** The client had no way to
tell the person scanning that their serial matched nothing — the endpoint said
`ok: true` and the UI said "All serial numbers processed successfully!". Now it
names them. That is the right place for it: the serial is only wrong *relative to
the group being scanned into*, which is knowledge the request has and the scanner
doesn't.

---

## What we built against the new contract

New tested util `addSerialNumberRangeToEvent/utils/itemAllocation.js` (+ 25 unit
tests), consumed by `Sequential.jsx`:

- **`422`** → non-retryable, and the message names the unresolved serials plus
  the group they failed against, instead of "Request failed with status code 422".
  (Nothing had to be done to *suppress* a retry: our batch runner stops on the
  first failed batch, and the axios interceptor only retries network
  errors/timeouts, never an HTTP status. Your §2 worry about a client retrying a
  5xx in vain did not apply here.)
- **`200` partial** → the success alert turns into a warning that reads
  `"8 of 10 items moved into this event."` and lists the skipped serials.
- **`requested_count`** is taken from the batch we sent, never from
  `inserted.total_items`, per your §4.
- **Forward- and backward-compatible.** Every new field is optional: on the
  currently deployed server the response carries none of them, and a `200` is
  still read as a full success. So this ships before your branch and behaves
  correctly either side of the deploy.

### One client-side bug your §2 surfaced

The partial-match case had a consequence beyond bad reporting.
`/receiver/receivers-pool-bulk` was being handed the **whole scanned batch**, so
serials that never resolved in SQL still landed in the Mongo receivers pool — a
device recorded as held by an event it was never assigned to, with no SQL row to
reconcile against. It only writes the resolved serials now. Same class of defect
as the container double-write in §5, different cause.

---

## §6 — yes to both, please

You asked whether to extend the §2 treatment to `/allocate-device-container-event`.

1. **Yes to naming the ignored serials on the 404** — and ideally distinguishing
   "does not exist" from "exists but is not a container". Right now scanning 10
   serials where 1 is a container silently processes that one, and our UI cannot
   say otherwise (the response returns the resolved containers' children, not the
   scanned serials, so we can't compute the diff client-side either). Same shape
   as §2. This is our top ask of the two.
2. **Yes to validating "already assigned to another event"** — nothing checks it
   on either route today, and `INSERT IGNORE` only covers a repeat within the
   same event. From the UI this reads as a successful allocation of a device that
   is actually committed elsewhere.
3. **`event_id` never checked against the company** — please do scope it. Same
   family as the cross-tenant reads closed in the `inventory-query` migration.
4. On **re-scanning a device already in the event** via `insert-item-event`'s
   plain `INSERT`: this is reachable from our UI. We dedupe within a single
   scanning session (a repeat serial is rejected at the input), but not against
   what the event already holds across sessions, and we have no way to. If that
   table has no unique on `(event_id, item_id)`, please add one — you noted the
   DDL isn't in the repo, so treat this as a request to go look.

---

## Release coordination

Nothing on our side blocks you. §1 is safe to deploy now — the token has always
been attached, and none of these calls happen outside an authenticated session
(both forms live inside the authenticated event quick-glance shell).

The only thing we'd like *before* you deploy is a decision on §A, because adding
`authorizePermission` alongside it is the one combination that breaks users.
