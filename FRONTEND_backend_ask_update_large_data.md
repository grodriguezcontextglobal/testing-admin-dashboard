# `update-large-data` rejects `returnedRentedInfo`

Raised 2026-08-26. One question for the backend, and what the client did in the
meantime.

## What happens

`POST /api/db_inventory/update-large-data` answers **HTTP 200** with:

```json
{
  "msg": "Update item warehouse failed: disallowed column for update: returnedRentedInfo",
  "ok": false
}
```

for this body:

```json
{
  "item_ids": [200602],
  "company_id": 147,
  "updates": {
    "warehouse": 1,
    "enableAssignFeature": 0,
    "returnedRentedInfo": "{\"supplier_id\":\"6a8f080a4e11fbd42af8c0db\",\"company_id\":147,\"returned_by\":\"Gustavo\",\"return_timestamp\":\"2026-08-26T21:17:21.493Z\"}",
    "return_date": "2026-08-26T21:17:21.493Z"
  }
}
```

`mysql/controllers/item.js:3153` has an allowlist of updatable columns and
`returnedRentedInfo` is not on it.

## Who sends it

Two screens, both returning rented equipment to its supplier:

| Screen | File |
| --- | --- |
| Return rented items (bulk, from the supplier's inventory) | `ReturnRentedItemModal.jsx:219` |
| Return a leased item (single, from the item detail) | `ReturningLeasedEquipModal.jsx:91` |

Neither is new. The bulk one has sent this body since `e854d98a`
(2025-08-06, "replace direct SQL with API calls"). The single one has sent it
just as long, but never reached the server until `24dcfe80` (2026-08-25) fixed
a `user.aqlInfo` typo that threw first — so its refusal is only now reachable.

The third caller of this endpoint, `ShippingInventoryModal.jsx:127`, sends only
`logistic_status` and `warehouse` and works.

## The question

**Should `returnedRentedInfo` be added to the update allowlist?**

The field records who returned the item, when, and to which supplier — the
provenance of the return. Every insert path in the client writes it
(`singleItemIserting`, `BulkItemActionsOptions`, `EditBulkActionOptions`,
`EditItemModal` and others all send `returnedRentedInfo`), so the column exists
and is writable on create; only the bulk update refuses it.

If the answer is no, we need to know **where that provenance should be written
instead**, because right now it has nowhere to go.

Also unknown, and worth confirming in the same pass: **are
`enableAssignFeature` and `return_date` on the allowlist?** The error names only
`returnedRentedInfo`, but if it reports the first disallowed column rather than
all of them, removing that one field would just move the error along. The client
has deliberately *not* dropped any field on a guess.

The generated contract cannot answer any of this: `api-payloads.json` has
`"allowed": []` and `"ignoresBody": true` for this route, because the handler
passes `req.body` straight to another layer.

## What the client changed

Nothing about the payload. Two silent-failure bugs, which are why this took a
raw payload inspection to find rather than showing up as an error:

- `ReturnRentedItemModal`'s batching loop did `await send(batch)` and discarded
  the response. HTTP 200 with `ok: false` throws nothing, so the progress bar
  filled, the supplier was emailed and the item records were **deleted** for
  items that had never been marked returned. It now throws on `ok: false` and
  shows the server's own `msg`.
- `ReturningLeasedEquipModal` did the same, and its catch reported "Failed to
  process items" for every cause with the reason left in the console.

A regression test pins the exact response above and asserts that neither the
email nor the delete runs after a refused write.
