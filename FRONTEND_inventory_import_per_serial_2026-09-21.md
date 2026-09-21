# Bulk inventory import — the payload loses what the spreadsheet said

**To:** backend
**From:** frontend
**Date:** 2026-09-21
**Endpoint:** `POST /api/db_item/bulk-item-alphanumeric` → job `inventory:bulk-insert-alphanumeric`

---

## What this is

A measurement, not a proposal looking for a problem. We replayed the client's
own import logic against a real 500-row customer-shaped workbook
(`mocks/inventory/Inventory_Template_Mock_500.xlsx`) and counted how many units
would be written with a value that is not theirs.

```
500 rows -> 18 requests (grouped by category + device name)

cost           482 / 500 units get a value from another row
location       394 / 500
main_warehouse 395 / 500
ownership      187 / 500
sub_location   455 / 500
image_url        0 / 500 sent — every picture is dropped
```

Only the 18 rows that happen to be first in their group land correctly on every
field. Nothing is rejected, so the import reports success.

This is not a client bug we are asking you to absorb — the client has been
fixed to stop guessing (see *What the client does now*). It is a shape problem
in the payload, and the client cannot fix it alone.

## Why it happens

The body carries **one** `cost`, `ownership`, `main_warehouse`, `location`,
`sub_location` and `image_url`, plus a `list` of serial numbers, and
`queue/handlers/inventoryBulkInsert.js` copies those scalars onto every row it
inserts:

```js
return batch.map((serial) => [
  ..., serial, warehouse, main_warehouse, ..., location, ..., image_url, ...
]);
```

A spreadsheet has one row per unit, and units of the same model genuinely
differ. In the measured file, inside a single device group:

| Field | Distinct values inside one group |
|---|---|
| Cost | one per unit (33 of 33, for the microphones) |
| Location | 5 |
| Taxable Location | 5, and it differs from Location on 72 rows overall |
| Sub Locations | 12–15 |
| Ownership | 3 |
| **Brand** | **1 — always** |
| **Description** | **1 — always** |
| **Image** | **1 — always; no group has two** |

So the split is clean, and it is not the one the payload assumes. Brand,
description and image really are group-level. The other five are not.

## What we are asking for

`extra_serial_number` already solves exactly this, in this exact handler:

```js
// extra_serial_number llega como JSON string de un array de objetos
// {serial: extraInfo} ... Se aplana a un mapa serial -> extraInfo
function buildExtraInfoMap(extraSerialNumber) { ... }
```

We would like the same treatment for the five fields that vary, under a
`_by_serial` suffix, same encoding, same flattening:

```jsonc
{
  "category_name": "Audio",
  "item_group": "Wireless Microphone",
  "brand": "Shure",                     // group-level, unchanged
  "descript_item": "...",               // group-level, unchanged
  "list": ["AUD-1", "AUD-2"],

  // present only when the batch does NOT agree on the field
  "cost_by_serial":           "[{\"AUD-1\":258.42},{\"AUD-2\":235.56}]",
  "location_by_serial":       "[{\"AUD-1\":\"Miami, FL\"},{\"AUD-2\":\"Orlando, FL\"}]",
  "current_location_by_serial": "...",  // mirrors location
  "main_warehouse_by_serial": "...",
  "ownership_by_serial":      "...",
  "sub_location_by_serial":   "...",    // value is the JSON array, as today
  "image_url_by_serial":      "...",

  // which fields arrived as maps, so you can 400 if you do not read them yet
  "per_serial_fields": ["cost", "location"]
}
```

Rules the client already follows, so you can rely on them:

- **A scalar and its map are never both sent for the same field.** The scalar is
  present when every serial in the batch agrees; otherwise it is absent and the
  map is there instead. An absent scalar is deliberate — it is how we stopped
  sending a plausible wrong number.
- `per_serial_fields` lists exactly the fields that came as maps. If you reject
  the request while support is being built, we will show that to the user rather
  than insert rows with holes.
- A serial missing from a map has no value for that field; treat it as you treat
  a serial missing from `extra_serial_number` today.

### The one design question that is yours

`location` is not just another column: the handler resolves it to one
`location_id` and `canWriteInScope(access, "create", { locationId, categoryName })`
gates the whole request on it — *"Single location + category per request, so an
all-or-nothing check is correct."*

A per-serial `location` breaks that assumption. Two ways out, and we do not have
a view on which is right for you:

1. **Keep one location per request.** Then the client groups by device name *and*
   location, and the measured file becomes **89 requests** instead of 18. Correct
   data, and the scope check stays exactly as it is. This is our default
   assumption if we do not hear otherwise.
2. **Resolve each distinct location in the request and run the scope check over
   all of them, all-or-nothing.** Then the file is **18 requests**. More work on
   your side, and the 403 message needs to name which location was refused.

Everything else on the list is independent of this — `cost`, `ownership`,
`main_warehouse` and `sub_location` have no scope meaning, and their maps are
useful either way.

## What the client does now

Shipped 2026-09-21, no server change required:

- **Pictures placed inside cells are read.** Excel 365's "Place in Cell" writes a
  rich value (`xl/richData/`), not a drawing, and neither SheetJS nor ExcelJS
  follows it — the 87 pictures in the measured file were invisible. The client
  now walks the chain and uploads each distinct file once (87 cells, 4 files) to
  Cloudinary, with the same `imageID` and gallery registration a manually added
  item image gets. This also answers Fredrik's *"absolutely no link outside
  Devitrak"* (beta testing part 2, `9:38`): the Image column no longer documents
  a public URL.
- **Nothing is flattened silently.** Where a batch disagrees, the scalar is
  omitted and the map is sent.
- **A preview before anything is sent**: units read, rows skipped and why,
  duplicate serials, locations to be created, images found. It says nothing
  about requests, batches or modes — how we cut the file up is ours to decide,
  not theirs to understand.
- **Locations are ensured once each**, not once per group.
- Requests go out four at a time, each with its own `Idempotency-Key`, each
  tracked as a background job.

### This is now blocking, not a nice-to-have

**Decided 2026-09-21: the client always sends one request per device name, with
the maps.** The alternative — splitting until every request carries a single
value per field — is 499 requests for 500 units, and it asked the person
importing a spreadsheet to choose between two shapes of our own API. That is not
a question a customer should be shown, so the choice is gone.

The consequence is direct: **until `bulk-item-alphanumeric` reads the
`_by_serial` fields, an import of a file like this one fails.** It fails cleanly
— the scalar is absent, the endpoint answers 400, nothing is written, and the
screen says *"This file needs a server update that isn't live yet"* rather than
repeating a message about a missing location that the customer cannot act on.
No partial or wrong data either way.

A file whose units genuinely are identical within a device group still imports
today, because then the batch agrees and only scalars are sent. It is the
realistic files — different purchase prices, units spread across cities — that
need this.

The 499-request shape stays implemented and tested (`IMPORT_MODES.COMPATIBLE`),
so if you decide against the maps we can switch back in one line. We would
rather not.

## Numbers to check us against

The client suite pins all of these against the real workbook
(`src/pages/inventory/utils/inventoryImport.integration.test.js`), so if any of
them moves the test fails rather than the claim quietly ageing:

| | |
|---|---|
| rows read / skipped | 500 / 0 |
| units with a picture | 87, backed by 4 files |
| requests, grouped by device name | 18 |
| requests, one value per flattened field | 499 |
| requests, device name + location | 89 |
| distinct locations | 5 |
| groups whose group-level fields disagree | 0 |
| duplicate serials | 0 |
