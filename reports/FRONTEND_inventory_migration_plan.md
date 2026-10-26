# Frontend Action Plan — migrating off the raw-SQL endpoint (2026-08-10)

> **Audience:** the frontend agent.
> **This is the execution plan.** For endpoint contracts, params and status codes,
> see [`FRONTEND_raw_sql_endpoint_migration.md`](FRONTEND_raw_sql_endpoint_migration.md).
>
> **The legacy endpoint keeps working the whole time.** There is no flag day and
> no coordinated release. Migrate one call site per PR, in any order you like —
> the phases below are ordered by risk, not by dependency.

---

## Before you start: two things that apply to every phase

**1. Stop sending `company_id`.** The server reads it from the `s-company-lq`
header your client already attaches. Sending it in the body still works, so this
is not urgent, but new code should omit it.

**2. Don't bother fixing the interpolated `IN (...)` lists on call sites you are
about to migrate.** The reference doc's §2 tells you to replace
`` `IN (${items.map(i => `'${i.serial}'`).join(",")})` `` with placeholders. That
is correct advice *if a call site will sit unmigrated for a while* — it removes
a live injection bug today. But the catalog builds those lists server-side, so
migrating the call site fixes it anyway.

> **Decision rule:** migrating this cycle → migrate directly, skip the
> interpolation fix. Not migrating for weeks → do the interpolation fix now.
> Doing both on the same call site is wasted work.

---

## Phase 1 — the five attribute filters *(start here)*

**Why first:** five call sites collapse into one entry, they are pure reads, and
the shape is trivial. It proves the whole pattern end to end with almost no risk.

All five live in the same `Promise.all`-style block and look like this:

```js
// BEFORE
devitrakApi.post("/db_company/inventory-based-on-submitted-parameters", {
  query: "select * from item_inv where brand = ? and company_id = ?",
  values: [brandName, user.sqlInfo.company_id],
});

// AFTER
devitrakApi.post("/db_company/inventory-query", {
  queryName: "inventory.byAttribute",
  params: { attribute: "brand", value: brandName },
});
```

| Legacy `where` | `params` |
|---|---|
| `brand = ?` | `{ attribute: "brand", value: brandName }` |
| `category_name = ?` | `{ attribute: "category_name", value: categoryName }` |
| `item_group = ?` | `{ attribute: "item_group", value: groupItem }` |
| `location = ?` | `{ attribute: "location", value: decodeURI(locationName[0].slice(1)) }` |
| `ownership = ?` | `{ attribute: "ownership", value: decodeURI(ownership[0].slice(1)) }` |

`attribute` takes the **column name**, and only those five. Anything else is a
`400` — it is an allowlist, because that value is the one thing that cannot be a
bound parameter.

**Verify:** each screen returns the same rows as before. `result` is unchanged.

---

## Phase 2 — the rented-items screen (list + count + export)

Three call sites in one screen, and the pair matters: `rentedPage` and
`rentedCount` are **guaranteed by a test** to share the same filter, so the
total can no longer disagree with the list — which the two hand-built strings
could drift into.

```js
// BEFORE — four query/countQuery variants built by nested if (supplier_id) / if (search)
// AFTER — one call each, the optional filters are just optional params
const [dataResult, countResult] = await Promise.all([
  devitrakApi.post("/db_company/inventory-query", {
    queryName: "inventory.rentedPage",
    params: { supplierId: supplier_id, search, pageSize, offset },
  }),
  devitrakApi.post("/db_company/inventory-query", {
    queryName: "inventory.rentedCount",
    params: { supplierId: supplier_id, search },
  }),
]);
```

Omit `supplierId` / `search` (or pass `undefined`) when not filtering — the
whole nested-if ladder goes away.

The export path (`getAllQuery`) becomes:

```js
{ queryName: "inventory.rentedAll", params: { supplierId: supplier_id } }
```

**Verify:** page through results and confirm the total matches the number of
rows you can actually reach. Check page 1 and the last page.

---

## Phase 3 — the assignable-stock lookups

Five call sites, all reads. Two of them currently interpolate values into SQL,
so migrating them removes a real injection bug.

| Legacy | `queryName` | `params` |
|---|---|---|
| `SELECT serial_number … ORDER BY serial_number ASC` | `inventory.serialsByGroupCategoryLocation` | `{ itemGroup, categoryName, location }` |
| `SELECT * … AND serial_number in ('${…}')` ⚠️ | `inventory.itemsByGroupCategoryLocationSerials` | `{ itemGroup, categoryName, location, serialNumbers }` |
| `Select * … and serial_number = ?` (`query1`) | `inventory.assignableExactSerial` | `{ location, itemGroup, categoryName, serialNumber }` |
| `Select … serial_number >= ? … limit ?` | `inventory.assignableFromSerial` | `{ location, itemGroup, categoryName, startingSerial, quantity }` |
| `deviceInfoQuery` | `inventory.assignableBySerials` | `{ location, itemGroup, categoryName, serialNumbers }` |

```js
// BEFORE — the interpolated one
query: `SELECT * FROM item_inv WHERE item_group = ? AND category_name = ? AND company_id = ?
        And location = ? AND warehouse = ?
        And serial_number in (${selectedData.map((i) => `'${i.serial_number}'`).join(",")})`,
values: [valueItemSelected.item_group, valueItemSelected.category_name,
         user.sqlInfo.company_id, valueItemSelected.location, 1],

// AFTER
{
  queryName: "inventory.itemsByGroupCategoryLocationSerials",
  params: {
    itemGroup: valueItemSelected.item_group,
    categoryName: valueItemSelected.category_name,
    location: valueItemSelected.location,
    serialNumbers: selectedData.map((i) => i.serial_number),
  },
}
```

`warehouse` defaults to `1`; pass it only if you need something else.
`quantity` on `assignableFromSerial` is the old `LIMIT` and must be a positive
integer (`400` otherwise).

---

## Phase 4 — item lookups by id

| Legacy | `queryName` | `params` |
|---|---|---|
| `SELECT item_id, serial_number, item_group … item_id IN (…) AND ownership='Rent' AND company_id=? [AND supplier_info=?]` | `inventory.itemsByIds` | `{ itemIds, supplierId? }` |
| `SELECT item_id, item_group, brand, serial_number, location, warehouse, cost, category_name … item_id IN (…)` | `inventory.itemsSummaryByIds` | `{ itemIds }` |

`ownership = 'Rent'` is baked into `itemsByIds` — don't pass it.

⚠️ **`itemsSummaryByIds` now filters by company.** The legacy version did not.
In normal use this changes nothing (`item_id` is globally unique, and you pass
ids you already obtained legitimately), but if a screen was relying on reading
another company's items, it will now come back empty — and that is a bug worth
reporting, not routing around.

---

## Phase 5 — staff lookups ⚠️ *read the warning*

| Legacy | `queryName` | `params` |
|---|---|---|
| `SELECT staff_id, email from staff_member where email in (…)` | `staff.idsByEmails` | `{ emails }` |
| `SELECT staff_id, first_name, last_name, email … staff_id IN (…)` | `staff.detailsByIds` | `{ staffIds }` |

**These return fewer rows than before, deliberately.** The legacy queries had no
company filter at all — they read staff PII across every tenant. The catalog
versions are scoped through `company_staff` to **active members of your
company**.

Two ways a screen can notice:
- A staff member from another company is no longer returned (correct — that was
  a cross-tenant read).
- **A deactivated member of your own company is no longer returned.** If you
  render historical attribution ("assigned by …"), their name will go missing.

If that second case breaks a screen, say so — the `is_active` filter can be
relaxed without giving up the company scoping. Don't work around it client-side.

---

## Phase 6 — the event-return flow *(biggest win, most care)*

Three call sites collapse into **one** endpoint, and this fixes a real bug: as
three separate calls they are three independent transactions, so a failure
partway leaves stock marked returned to the warehouse **and still assigned to
the event**.

```js
// BEFORE — three sequential posts: UPDATE warehouse, SELECT item_id, DELETE assignments
// AFTER — one atomic call
await devitrakApi.post("/db_event/return-event-devices", {
  event_id: event.sql.event_id,
  item_group: devicesFetchedPool[0].type,
  category_name: props.category,
  serial_numbers: devicesFetchedPool.map((item) => item.device),
});
```

```jsonc
{ "ok": true, "returned_items": 12, "removed_assignments": 12, "skipped_serials": 0 }
```

You no longer send `item_ids` — the server derives them from company-scoped
rows. Handle `skipped_serials > 0` (some serials don't exist or belong to
another company) and `404` (none matched).

**Verify on a staging company first**, and check both counts land where you
expect. This is the only phase that writes.

---

## Rollout summary

| Phase | Call sites | Risk | Fixes a bug? |
|---|---|---|---|
| 1 — attribute filters | 5 → 1 entry | very low | — |
| 2 — rented list/count/export | 3 | low | list/total can no longer drift |
| 3 — assignable lookups | 5 | low | removes 1 SQL injection |
| 4 — items by id | 2 | low | closes a cross-tenant read |
| 5 — staff lookups | 2 | **medium** — fewer rows | closes a cross-tenant PII read |
| 6 — event return | 3 → 1 endpoint | **medium** — writes | fixes inconsistent state on failure |

**≈20 call sites → 12 catalog entries + 1 endpoint.**

When every phase is done, tell backend. The legacy endpoint's shape auditing
will confirm zero remaining traffic, and only then does the raw-SQL controller
get deleted — that is what actually closes the vulnerability.

## If you hit a call site not covered here

Its SQL never reached backend. **Send the template rather than working around
it** — an entry gets added. Leaving it on the legacy endpoint indefinitely is
what keeps the old controller alive.
