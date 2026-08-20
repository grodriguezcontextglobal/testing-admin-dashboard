# Event allocation routes — contract changes

**Branch:** `feat/event-allocation-hardening` · **Base:** `main` @ `1a2d3a5` · **Date:** 2026-08-20
**Status:** not merged, not deployed. Nothing below is live yet.

Answers the 8 contract questions about `/inserting-items-in-event-from-container`
vs `/allocate-device-container-event`, and applies the fixes that came out of
them plus one on `/allocate-device-event`.

Read §1 first — it is the only breaking item and it needs a coordinated release.

---

## 0. The two container routes are NOT the same endpoint

Two distinct routes that coexist. Not a rename, and neither calls the other.

| Route | Nature | What it actually does |
|---|---|---|
| `POST /api/db_event/inserting-items-in-event-from-container` | **queued** (202 + jobId) | Only `INSERT`s the `item_id`s you already resolved. Does **not** expand `container_items`, does **not** touch `item_inv`, does **not** write the receivers pool. Its payload is only `{event_id, refDatabase}` — **every other field is discarded, `company_id` included**, so this path has no company scoping. |
| `POST /api/db_event/allocate-device-container-event` | **synchronous** (200) | Superset: expands the container's children, updates `warehouse`/`logistic_status`, `INSERT IGNORE`s into the event, and writes the receivers pool. |

**Recommendation: use the synchronous one for anything interactive.** When it
answers 200 the SQL is committed and the pool is written — there is nothing to
wait for. The queued one gives you no counts and starts up to ~4s later (see §5).

---

## 1. ⚠️ BREAKING — both container routes now require a session token

`validateJWT` + `checkTokenVersion` were added to:

- `POST /api/db_event/inserting-items-in-event-from-container`
- `POST /api/db_event/allocate-device-container-event`

Both were anonymous while their sibling `/allocate-device-event` was already
gated, and both write (`UPDATE item_inv` + `INSERT INTO item_inv_assigned_event`).

**Action required:** send `x-token` on both. If your axios client attaches it
globally you are already fine — verify, because these two are the only event
routes that used to work without it.

There was a second consequence worth knowing: without `validateJWT` there is no
`req.uid`, so the queued job was stored with `context.uid = null` and
**`GET /api/jobs/owned/:jobId` answered 404 for the very jobId the endpoint had
just returned.** Polling that job was impossible. It works now. (General rule:
any queued controller on an anonymous route produces orphan, unpollable jobs.)

**Not added:** `authorizePermission("event", "update")`, even though
`/allocate-device-event` carries it. Adding it would 403 any staff member
without that permission on day one. Tell us if you want it and we will
coordinate it separately.

**Release order:** deploy this only once your token is going out on both routes,
or those two calls start failing with 401.

---

## 2. `/allocate-device-event` — 500 → 422, and it now tells you which serials failed

This is the change that answers the `00100003` report.

### Before

```jsonc
// 500
{ "msg": "No items to allocate", "ok": false }
```

### After

```jsonc
// 422 — nothing matched
{
  "msg": "No items to allocate",      // kept verbatim, in case you compare it
  "ok": false,
  "unresolved_serials": ["00100003"],
  "requested_count": 1,
  "matched_count": 0
}
```

```jsonc
// 200 — partial match, no longer silent
{
  "ok": true,
  "requested_count": 3,
  "matched_count": 2,
  "unresolved_serials": ["RX-999999"],
  "result": [ { "item_id": 200574, "serial_number": "RX-100001" }, ... ],
  "inserted": { "inserted_items": 2, "total_items": 2 },
  "updateResult": { ... }
}
```

**Why 422:** the endpoint requires **all four** filters to match —
`company_id` **and** `item_group` **and** `category_name` **and**
`serial_number`. None matching is a wrong payload, not a server fault. As a 5xx
your client retried it in vain and the UI could not tell "fix the serial" from
"the server is down".

**Why the partial case mattered:** with 7 of 10 resolved it used to answer
`200 ok:true`, so the event went out three devices short while the system
reported ten. Now `unresolved_serials` names them.

**Actions:**
1. Treat **422** as "bad payload, do not retry" and show `unresolved_serials`
   in the toast.
2. On **200**, check `unresolved_serials.length` (or `matched_count` vs
   `requested_count`) before declaring success.

**Changed field:** `result[]` rows now carry `serial_number` alongside
`item_id`. Additive — existing readers of `item_id` are unaffected.

### About the `00100003` report specifically

Not a backend bug. That serial exists in company 147 but it is a
**Laptop / Electronics** (`item_id` 200571). The `Interpretation Receiver` /
`Receiver` items in that company are three, and their serials are prefixed:
`RX-100001`, `RX-100002`, `RX-100003`. Sending `RX-100003` matches.

Looks like an 8-digit zero-pad built client-side where the real serial carries
an `RX-` prefix. **Careful with partial matching:** `SN-100003` also exists in
that company (another Laptop), so `100003` is a sequence number shared across
item families — it does not identify a device on its own.

---

## 3. `Idempotency-Key` is now honoured on the queued container route

`POST /inserting-items-in-event-from-container` accepted no dedup key and the
Go worker's `INSERT` was plain, so your automatic retry re-enqueued the same
batch and inserted it twice.

**Action:** send `Idempotency-Key: <uuid>` per logical batch (one uuid per
batch, reused across that batch's retries — not one per attempt). Without the
header nothing is deduplicated, exactly as before. The header is already
allowed by CORS.

The command also switched to `INSERT IGNORE`, which the synchronous path
already used.

---

## 4. The queued job now returns counts

The job result used to carry nothing. It now returns, in `result`:

```jsonc
{ "inserted_items": 487, "total_items": 500 }
```

**Read `total_items` carefully — it is NOT how many you sent.** It is how many
matched/were processed. With `INSERT IGNORE`,
`total_items - inserted_items` = what was already assigned to that event.

The same trap already existed on `insert-item-event` (used by
`/allocate-device-event`): its `total_items` is `len(itemIDs)`, i.e. the matched
count, never the requested count. Compare against your own `data.length`.

⚠️ **This one needs a `go build` on the worker host to take effect** — see §7.

---

## 5. Ordering, polling and batch size

**Synchronous route (`/allocate-device-container-event`):** when it returns 200
everything is committed. Call `update-event-inventory-freshest-data` and
`update-global-state` right away. No polling.

**Remove your `receivers-pool-bulk` call for containers.** The endpoint already
writes the receivers pool itself, and `poolReceiversBulk` does `insertMany`
with no dedup — calling it after duplicates every child device in the pool.
This is a client-side fix; we did not change it.

**Queued route:** `202` guarantees nothing yet. The worker polls every
`QUEUE_POLL_MS` (default 4000ms), so the job starts up to ~4s later. Poll
`GET /api/jobs/owned/:jobId` until `status: "done"` before refreshing the event
inventory. The worker chains no refresh server-side.

**Batch size:**

- Queued: **1 job of N items, never N jobs of 1.** The worker is a sequential
  loop — one job at a time, `QUEUE_BATCH` 20 per tick, a tick every 4s. 500
  jobs of 1 item is ~25 ticks ≈ 100s of pure waiting. The Go side already
  chunks internally at 1000.
- Synchronous: **500 is safe now.** It used to build one placeholder per
  expanded item in a single statement (500 containers × 20 children = 10,500
  placeholders, past `max_allowed_packet`); it is chunked at 1000 now, inside
  the same transaction, so it stays all-or-nothing.

---

## 6. Validation that stayed synchronous, and what is still missing

`/allocate-device-container-event` returns everything in the HTTP response:

| Case | Response |
|---|---|
| missing `company_id` or `event_id` | 400 |
| `data` empty or not an array | 400 |
| no serial resolves to a container | 404 |
| SQL error | 500 + rollback |

Still open, so you do not plan around it:

- That **404 does not distinguish "serial does not exist" from "exists but is
  not a container"**, and it does not say which serials it ignored — send 10
  with 1 container and it processes that one, silently. Same defect §2 just
  fixed on the other route; say the word and we do it here too.
- **"already assigned to another event" is validated nowhere.** `INSERT IGNORE`
  only covers a repeat within the same event.
- **Re-scanning a device already in the event**, on `/allocate-device-event`,
  goes through the Go `insert-item-event`, which still uses a plain `INSERT` —
  it either duplicates the row or 500s depending on whether a unique exists on
  `(event_id, item_id)`. We could not verify: that table has no DDL in the repo.
- **`event_id` is never checked against the company.**

---

## 7. Deploy notes

1. **Merge order matters.** §1 is breaking; ship it with (or after) your token
   change.
2. **The Go worker must be rebuilt** for §3's `INSERT IGNORE` and all of §4.
   There is no Go toolchain on the dev machine, so those two files are
   committed but uncompiled; the box that runs the worker builds it each
   deploy. Until then the queued route behaves as before on those two points.
   Everything else (§1, §2, §5's chunking) is pure Node and takes effect on
   deploy.
3. Nothing needs a DB migration.

**Tests:** 942/943 on the branch. The single failure is a pre-existing,
separately deferred gap (`routes/auth.js GET /:id` missing `validateJWT`),
unrelated to this work.

---

## Quick checklist for the client

- [ ] Send `x-token` on both container routes (§1) — **blocking**
- [ ] Handle `422` as non-retryable and surface `unresolved_serials` (§2)
- [ ] Check `unresolved_serials` / `matched_count` on the `200` too (§2)
- [ ] Send `Idempotency-Key` per batch on the queued route (§3)
- [ ] Compare `total_items` against your own `data.length`, not as a request count (§4)
- [ ] Drop the `receivers-pool-bulk` call after container allocation (§5)
- [ ] Keep 1 job of N items; 500 per request is fine again (§5)
- [ ] Fix the serial builder: `RX-100003`, not `00100003` (§2)
