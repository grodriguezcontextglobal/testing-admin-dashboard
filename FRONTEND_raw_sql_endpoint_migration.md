# Frontend Map — `/inventory-based-on-submitted-parameters` migration (2026-08-10)

> **Audience:** the frontend agent.
> **This document is the contract reference** — what each endpoint accepts and
> returns. For the ordered, per-call-site execution plan, see
> [`FRONTEND_inventory_migration_plan.md`](FRONTEND_inventory_migration_plan.md).
>
> **One thing already shipped and may affect you today** (§1). Everything else is
> work you can do on your own schedule — no backend coordination required.

## Why this exists

The endpoint takes a raw SQL string from the request body and executes it:

```js
devitrakApi.post("/db_event/inventory-based-on-submitted-parameters", { query, values })
```

That contract is being retired. It's being done in phases so nothing breaks,
and **the phases you can act on now don't depend on the backend at all**.

| Phase | What | Status |
|---|---|---|
| 1 | Two of the three routes required no authentication — fixed | ✅ **Deployed** — see §1 |
| 2 | Server logs every distinct query shape to inventory them | ✅ Deployed (invisible to you) |
| 3 | Replace client SQL with server-side named queries | ✅ **Live** — `POST /inventory-query`, see §5 |

---

## §1 — Already shipped: those routes now require auth

`POST /api/db_event/...` and `POST /api/db_item/...` previously had **no
authentication middleware at all**. They now require `x-token` +
`checkTokenVersion`, matching `/api/db_company/...` which always had it.

**Expected impact: none.** You already call the `db_company` variant
successfully, which means your axios client attaches `x-token` globally.

**Please confirm anyway** — it's a one-minute check and the failure mode is a
sudden 401 on inventory screens:

- Verify the `devitrakApi` interceptor attaches `x-token` to **every** request,
  not just to a subset.
- Confirm none of these calls happen from a context without a session (a
  public page, a pre-login bootstrap, a background poll after logout).

If you find a call site with no session, tell backend rather than working
around it — an unauthenticated path into this endpoint is what we just closed.

---

## §2 — Do now: stop interpolating values into SQL

Three call sites build SQL by injecting values directly. This is a real
injection bug, not a theoretical one: a `serial_number` containing a quote
breaks the query, and a crafted one changes its meaning.

**These fixes work against the endpoint exactly as it behaves today. Ship them
whenever you like.**

### 2.1 The rule

Never put a value inside the SQL string. Generate one `?` per value and pass
the values in `values`, in the **exact left-to-right order the `?` appear in the
final statement**.

```js
// ❌ WRONG - value goes into the SQL text
`... AND serial_number IN (${items.map((i) => `'${i.serial_number}'`).join(",")})`

// ✅ RIGHT - only placeholders go into the SQL text
`... AND serial_number IN (${items.map(() => "?").join(",")})`
// ...and the values are appended to `values` in that position
```

### 2.2 The three call sites

**(a) `SELECT * FROM item_inv ... AND serial_number in (...)`**

```js
// BEFORE
query: `SELECT * FROM item_inv
  WHERE item_group = ? AND category_name = ? AND company_id = ? And location = ? AND warehouse = ?
  And serial_number in (${selectedData.map((item) => `'${item.serial_number}'`).join(",")})`,
values: [item_group, category_name, user.sqlInfo.company_id, location, 1],

// AFTER
query: `SELECT * FROM item_inv
  WHERE item_group = ? AND category_name = ? AND company_id = ? And location = ? AND warehouse = ?
  And serial_number IN (${selectedData.map(() => "?").join(",")})`,
values: [
  item_group, category_name, user.sqlInfo.company_id, location, 1,
  ...selectedData.map((item) => item.serial_number),   // the IN values come LAST, matching their position
],
```

**(b) `SELECT item_id FROM item_inv ... serial_number IN (...)` — also missing company scoping**

```js
// BEFORE
query: `SELECT item_id FROM item_inv WHERE item_group = ? AND category_name = ?
  AND serial_number IN (${devicesFetchedPool.map((item) => `${item.device}`).join(",")})`,
values: [devicesFetchedPool[0].type, props.category],

// AFTER
query: `SELECT item_id FROM item_inv WHERE item_group = ? AND category_name = ? AND company_id = ?
  AND serial_number IN (${devicesFetchedPool.map(() => "?").join(",")})`,
values: [
  devicesFetchedPool[0].type, props.category, user.sqlInfo.company_id,
  ...devicesFetchedPool.map((item) => item.device),
],
```

**(c) `DELETE FROM item_inv_assigned_event ... item_id IN (...)`**

```js
// BEFORE
query: `DELETE FROM item_inv_assigned_event WHERE event_id = ?
  AND item_id IN (${responseItem.data.result.map((item) => `${item.item_id}`).join(",")})`,
values: [event.sql.event_id],

// AFTER
query: `DELETE FROM item_inv_assigned_event WHERE event_id = ?
  AND item_id IN (${responseItem.data.result.map(() => "?").join(",")})`,
values: [event.sql.event_id, ...responseItem.data.result.map((item) => item.item_id)],
```

> Note this one stays unscoped by company — see §4. It's a `DELETE`, so it's the
> highest-priority item for the Phase 3 catalog. Don't try to bolt a
> `company_id` onto it yourself; that table doesn't have the column.

---

## §3 — ⚠️ Landmine: how the server expands `IN (?)`

The controller has special handling: if the SQL contains a literal `IN (?)` and
the matching value is an **array**, it expands the array into `IN (?, ?, ?)`.
That's how this working call site passes lists safely today:

```js
query: "UPDATE item_inv set warehouse = 1, update_at = NOW() WHERE item_group IN (?) AND category_name IN (?) AND serial_number IN (?) AND company_id = ?",
values: [[type], [category], [...devices], company_id],
```

**It only works because every `IN (?)` appears before every other `?` in that
statement.** The server consumes the `IN (?)` values first, in the order the IN
clauses appear, and then appends the remaining values. So for a statement like:

```sql
WHERE a = ? AND b IN (?)
```

the final placeholder order is `a`, then `b`'s list — but the server would build
the values as `b`'s list, then `a`. **Silently misaligned**, and it fails as
wrong results or a type error, not as an obvious crash.

**Guidance: don't use the `IN (?)` + array form.** Generate explicit `?` per
value as shown in §2. That's always correct regardless of where the IN clause
sits. The existing `UPDATE` above works and can stay, but don't copy the pattern
into new code.

---

## §4 — Queries with no company scoping

Four of the known shapes have no company filter at all, meaning they can read or
write across tenants. Two you can fix yourself, two you can't:

| Shape | Fixable now? |
|---|---|
| `SELECT item_id FROM item_inv WHERE item_group=? AND category_name=? AND serial_number IN (...)` | ✅ add `AND company_id = ?` — see §2.2(b) |
| `SELECT item_id, item_group, brand, serial_number, location, warehouse, cost, category_name FROM item_inv WHERE item_id IN (...)` | ✅ add `AND company_id = ?` |
| `DELETE FROM item_inv_assigned_event WHERE event_id=? AND item_id IN (...)` | ❌ table has no `company_id`; scoping needs a join to `item_inv` — leave to Phase 3 |
| `SELECT staff_id, first_name, last_name, email FROM staff_member WHERE staff_id IN (...)` | ❌ same — company lives in a bridge table. **This reads staff PII unscoped.** Leave to Phase 3 |

For the two you can fix, `company_id` still comes from `user.sqlInfo.company_id`
for now. Be aware the server will stop trusting that value in Phase 3 and derive
it from the session instead — which is the point, since browser state can be
edited.

---

## §5 — The replacement endpoint (LIVE, migrate to this)

```
POST /api/db_company/inventory-query
POST /api/db_event/inventory-query
POST /api/db_item/inventory-query
```

All three are the same handler — mounted on every namespace so a call site can
migrate **without also changing which URL prefix it posts to**. Keep the prefix
you already use.

### Request

```js
devitrakApi.post("/db_event/inventory-query", {
  queryName: "inventory.itemsByIds",
  params: { itemIds: [12, 13], supplierId },   // per-entry, see table below
});
// company comes from the s-company-lq header your client already sends
```

**You do not need to send `company_id` in the body.** The server reads it from
the **`s-company-lq`** header (the SQL company id) that your API client already
attaches to every request. Sending `company_id` in the body or query still works
for call sites you haven't touched yet — the header simply wins when both are
present — but new code should just omit it.

### Response

Identical to the old endpoint — `{ ok: true, result }`, where `result` is the
driver's rows. **No parsing changes.**

| Status | When |
|---|---|
| `400` | missing/unknown `queryName`, no company context, or bad params (message says which) |
| `401` | no staff identity resolvable on the request |
| `403` | you are not an active staff member of that company |
| `500` | unexpected server error |

### The company is no longer trusted, wherever it comes from

Header or body, it makes no difference to the security model: both are values
your client chose to send. Before using it, the server checks it against your
staff membership, and answers `403` if you are not an active member of that
company.

**That check is the whole point of the migration.** Previously the company
filter was simply whatever SQL the browser put in the request, sourced from
`user.sqlInfo.company_id` — editable client state — so anyone could read another
tenant's rows by changing it.

### Catalog

| `queryName` | `params` | Replaces |
|---|---|---|
| `inventory.itemsByIds` | `itemIds[]`, `supplierId?` | rented items by id list |
| `inventory.serialsByGroupCategoryLocation` | `itemGroup`, `categoryName`, `location`, `warehouse?`(1) | serial list for a group/category/location |
| `inventory.itemsByGroupCategoryLocationSerials` | `itemGroup`, `categoryName`, `location`, `serialNumbers[]`, `warehouse?`(1) | `SELECT *` for specific serials |
| `inventory.itemIdsByGroupCategorySerials` | `itemGroup`, `categoryName`, `serialNumbers[]` | item ids from serials ⚠️ |
| `inventory.itemsSummaryByIds` | `itemIds[]` | summary columns by id list ⚠️ |
| `inventory.assignableExactSerial` | `location`, `itemGroup`, `categoryName`, `serialNumber` | exact-serial assignable lookup |
| `inventory.assignableFromSerial` | `location`, `itemGroup`, `categoryName`, `startingSerial`, `quantity` | range-from-serial with limit |
| `inventory.assignableBySerials` | `location`, `itemGroup`, `categoryName`, `serialNumbers[]` | the `deviceInfoQuery` lookup |
| `inventory.byAttribute` | `attribute`, `value` | the five `select * … where <attr> = ?` screens |
| `inventory.rentedPage` | `pageSize`, `offset`, `supplierId?`, `search?` | paginated rented list |
| `inventory.rentedCount` | `supplierId?`, `search?` | its `COUNT(*)` companion |
| `inventory.rentedAll` | `supplierId?` | unpaginated export |
| `inventory.markInWarehouse` | `itemGroup`, `categoryName`, `serialNumbers[]` | the `UPDATE … warehouse = 1` |
| `eventAssignments.deleteByEventAndItems` | `eventId`, `itemIds[]` | the `DELETE` from `item_inv_assigned_event` ⚠️ |
| `staff.idsByEmails` | `emails[]` | staff ids from emails ⚠️ |
| `staff.detailsByIds` | `staffIds[]` | staff names/emails by id ⚠️ |

`attribute` for `inventory.byAttribute` is limited to: `brand`,
`category_name`, `item_group`, `location`, `ownership`.

### ⚠️ Five entries now return fewer rows than before — on purpose

The marked entries replace queries that had **no company filter at all**, so
they could read or write another tenant's rows. The catalog versions are scoped:

- `staff.idsByEmails`, `staff.detailsByIds` — scoped through `company_staff`
  (only **active** members of your company). If your UI expected a staff member
  who is inactive or belongs to another company, they will now be absent.
- `eventAssignments.deleteByEventAndItems` — scoped through a join to
  `item_inv`. It will no longer delete assignments for items outside your
  company.
- `inventory.itemIdsByGroupCategorySerials`, `inventory.itemsSummaryByIds` — now
  filtered by company.

If any screen depends on the old cross-company behaviour, that is a bug worth
raising rather than working around.

### ⭐ `POST /return-event-devices` — replaces three calls with one

This one is **not** a catalog entry; it is its own endpoint, because it replaces
a sequence rather than a single statement.

Today returning devices from an event is three separate calls:

```js
// 1. UPDATE item_inv SET warehouse = 1 ... WHERE serial_number IN (...)
// 2. SELECT item_id FROM item_inv WHERE ... serial_number IN (...)
// 3. DELETE FROM item_inv_assigned_event WHERE event_id = ? AND item_id IN (...)
```

Those are three independent transactions. If anything fails between the first
and the last — a network blip, a deadlock — the stock is marked returned to the
warehouse **and still assigned to the event**, and nothing later reconciles it.

Replace all three with:

```js
devitrakApi.post("/db_event/return-event-devices", {
  event_id: event.sql.event_id,
  item_group: devicesFetchedPool[0].type,
  category_name: props.category,
  serial_numbers: devicesFetchedPool.map((item) => item.device),
});
```

Response:

```jsonc
{
  "ok": true,
  "returned_items": 12,        // rows set back to warehouse
  "removed_assignments": 12,   // event assignments deleted
  "skipped_serials": 0         // serials that matched nothing in your company
}
```

`skipped_serials > 0` means some serials don't exist or belong to another
company — surfaced rather than silently dropped, so you can tell a partial
result from a complete one. `404` means none of them matched.

You no longer send `item_ids`: the server derives them itself from
company-scoped rows. That is deliberate — the old `DELETE` took ids straight
from the browser with no company filter of its own.

### Migration order suggested

1. Start with the five `inventory.byAttribute` call sites — one entry replaces
   all of them, and they're simple reads.
2. Then the rented list/count/export trio (`rentedPage` / `rentedCount` /
   `rentedAll`) — note `rentedPage` and `rentedCount` are guaranteed to share
   the same filter, so pagination totals stay consistent.
3. Then **`/return-event-devices`** (see above), which retires three call sites
   at once and fixes a real consistency bug. Verify on a staging company first.
   The catalog entries `inventory.markInWarehouse` and
   `eventAssignments.deleteByEventAndItems` exist for any other caller, but if
   you are doing the event-return flow, prefer the single endpoint.
4. Last, the staff lookups.

### Coverage

**Every call site backend received now has a catalog entry** — including the
`deviceInfoQuery` one, which maps to `inventory.assignableBySerials`.

If you hit a call site that has no entry, that means its SQL never reached
backend. Don't work around it: send the template and an entry gets added. The
legacy endpoint stays mounted throughout, so an unmigrated call site keeps
working in the meantime.

---

## Summary — what to action

1. **Confirm** `x-token` is attached on every call to this endpoint (§1).
2. **Fix** the three interpolated-value call sites (§2). No backend dependency,
   ship whenever.
3. **Migrate** call sites to `/inventory-query` (§5), in the suggested order.
4. **Don't** adopt the `IN (?)` + array pattern in new code (§3).
5. **Raise** any call site with no matching catalog entry, rather than working
   around it.

The legacy endpoint keeps working the entire time — there is no flag day, and
you can migrate one call site per PR.
