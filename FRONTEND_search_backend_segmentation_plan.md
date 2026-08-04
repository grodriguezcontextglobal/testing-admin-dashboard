# Backend Plan — segment `/search/searching_` by category

> **For:** backend/server agent implementing this endpoint.
> **From:** frontend.
> **Why:** the frontend now sends an optional `category` param so a
> single-area search (e.g. "Staff" only) doesn't force the backend to run
> every sub-search. This doc captures the agreed contract, the exact
> response shape each category must produce, and edge cases to handle
> before this ships to users at scale.
>
> **Status:** contract already agreed (param name, values, default). This is
> the implementation/verification plan, not an open ask.

---

## 1. What changed on the frontend

`src/pages/search/MainPage.jsx` calls this endpoint on every search. It used
to always fetch everything combined:

```
GET /api/search/searching_?variable=<term>&company=<companyId>
```

The UI has 4 filter tabs (`HeaderSearch.jsx`: Consumers / Staff / Devices /
Events, plus "View All"). Selecting exactly **one** tab now appends a new
`category` param:

```
GET /api/search/searching_?variable=<term>&company=<companyId>&category=<value>
```

`category` is only sent when exactly one tab is active. "View All" and
multi-select (more than one tab active) omit it entirely — same as today.
The mapping (`src/pages/search/utils/searchCategoryUtils.js`,
`resolveSearchCategoryParam`) is:

| UI tab (`HeaderSearch.jsx`) | `category` value sent |
| --- | --- |
| Consumers | `consumers` |
| Staff | `staff` |
| Devices | `device` (singular — not "devices") |
| Events | `event` (singular — not "events") |
| View All / multiple tabs / none | *(param omitted)* |

---

## 2. Agreed contract

```
GET /api/search/searching_?variable=<term>&company=<companyId>&category=<consumers|staff|device|event>
```

- `category` is **optional**. Omitted → behave exactly as today (`all`).
- Only these 4 literal values are valid. Anything else (typo, future UI
  value not yet wired, stale client) **must not error** — fall back to `all`
  silently. The frontend only ever sends one of the 4 values or omits the
  param, but defensive handling here protects against version-skew between
  a cached frontend bundle and a newer/older backend.
- `variable` and `company` behave unchanged — `category` is purely additive.

---

## 3. Response shape per category

The frontend reads a fixed set of paths out of the response regardless of
which category was requested (`consumersCount`, `staffCount`, etc. in
`MainPage.jsx`), defaulting missing branches to empty/0 via `??`. So the
**shape doesn't need to change** — only *which branches are populated* when
`category` narrows the search:

```jsonc
{
  "ok": true,
  "data": {
    "consumer": { "consumers": [ /* ... */ ] },   // read by MainPage as data.consumer.consumers
    "staff": [ /* ... */ ],                        // read as data.staff
    "deviceTransaction": { "deviceTransaction": [ /* ... */ ] }, // read as data.deviceTransaction.deviceTransaction
    "devicePool": { "devicePool": [ /* ... */ ] },  // read as data.devicePool.devicePool
    "event": { "results": [ /* ... */ ] }           // read as data.event.results
  }
}
```

**Important:** the UI's "Devices" tab reads from **two** branches —
`deviceTransaction` *and* `devicePool` (see `SearchDeviceRef.jsx`). When
`category=device`, both must still run/populate; there is no separate
"device-pool-only" category.

Per-category behavior:

| `category` value | Branches that must run | Branches safe to skip |
| --- | --- | --- |
| *(omitted, "all")* | all 5 | — (today's behavior, unchanged) |
| `consumers` | `consumer` | `staff`, `deviceTransaction`, `devicePool`, `event` |
| `staff` | `staff` | `consumer`, `deviceTransaction`, `devicePool`, `event` |
| `device` | `deviceTransaction`, `devicePool` | `consumer`, `staff`, `event` |
| `event` | `event` | `consumer`, `staff`, `deviceTransaction`, `devicePool` |

Skipped branches should either be omitted from the response or returned as
their already-established "empty" shape (e.g. `{ "consumers": [] }`) — the
frontend treats both the same way (`?? []` / `?.length ?? 0`), so pick
whichever is simpler to implement; don't invent a new empty/null convention.

---

## 4. Implementation plan

1. Parse `category` from the query string; normalize/validate against the 4
   known values; anything else (including absent) → treat as `all`.
2. Guard each existing sub-search (consumer lookup, staff lookup, device
   pool + device-transaction lookup, event lookup) behind
   `category === "all" || category === <that branch's value>` so unrelated
   DB queries/joins are skipped entirely — this is the actual performance
   win the frontend change is for, not just trimming the JSON response.
3. Leave the response envelope/shape untouched (see §3) — only the
   *population* of branches changes per category.
4. No change needed to `variable`/`company` handling.

---

## 5. Edge cases to verify

- `category` omitted → identical output to pre-change behavior (regression
  guard — this endpoint is hit on every keystroke-driven search across the
  whole app, high blast radius if broken).
- `category=device` → **both** `deviceTransaction` and `devicePool` populate.
- Unknown/garbage `category` value (e.g. `category=Devices` capitalized,
  `category=foo`) → falls back to `all`, does not 400/500.
- `category` present but `variable` empty/missing → existing empty-query
  behavior, unaffected by category.
- Multiple `category` query params (malformed request) → take the first or
  fall back to `all`; don't crash.

---

## 6. Frontend readiness

Already shipped, behind this contract — no further frontend change needed
once the backend honors `category`. `resolveSearchCategoryParam` and the
`MainPage.jsx` query key already gate this correctly; the frontend will just
start getting faster/narrower responses for single-tab searches as soon as
the backend implements §4.
