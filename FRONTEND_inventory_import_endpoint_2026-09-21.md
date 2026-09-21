# One endpoint for a spreadsheet import

**To:** backend
**From:** frontend
**Date:** 2026-09-21
**Supersedes:** `FRONTEND_inventory_import_per_serial_2026-09-21.md` — that asked
for per-serial fields on the existing endpoint. Tried in production-shaped
conditions today; the shape is the problem, not the fields.

---

## What we tried, and what it cost

A customer spreadsheet is one row per unit. The endpoint we have,
`POST /api/db_item/bulk-item-alphanumeric`, is one request per *group of
identical units*: one cost, one location, one ownership, plus a list of serial
numbers.

Three attempts, in order:

**1. One request per device name, first-row values.** What shipped before this
week. Measured against a real 500-row file: **482 of 500 units** would have been
written with another row's cost, 394 with another row's location. Nothing is
rejected, so it reports success. That is why it was changed.

**2. One request per device name, per-unit values as `{serial: value}` maps**
(the previous ask). The server does not read those maps, and the scalar it wants
is deliberately absent, so it answers
`400 "Company ID and Location Name are required."` Correct behaviour on both
sides — and a blocked import.

**3. One request per distinct combination of values.** Today's fallback. It
works, and it is unusable:

> **The 500-row file needs 499 requests. The rate limiter allows 300 per 15
> minutes per IP** (`index.js:91`, `RATE_LIMIT_MAX` default 300).

Gustavo hit that ceiling on a real upload this afternoon. Only the groups whose
units happened to be identical got in; every device stocked in more than one
location failed. Add the per-location `verifyAndCreateLocation` calls and one
upload per distinct image and the budget is gone before the inventory is.

There is no fourth arrangement of the current endpoint that fixes this. **A file
of N units needs a number of requests that grows with N, and the limit does
not.**

## What we are asking for

One endpoint that takes a spreadsheet import whole.

```
POST /api/db_item/bulk-item-from-spreadsheet
```

Queued like the others — `202 { jobId }`, polled through `GET /api/jobs/...` —
and handled by something like `inventory:bulk-insert-from-spreadsheet`.

### Body

```jsonc
{
  "company_id": 7,
  "company": "ABC Interpreting",

  // Every unit, with its own values. One object per spreadsheet row.
  "units": [
    {
      "serial_number": "AUD-2026-000001",
      "category_name": "Audio",
      "item_group": "Wireless Microphone",
      "brand": "Shure",
      "descript_item": "Wireless handheld microphone for event audio",
      "cost": 258.42,
      "ownership": "Permanent",
      "main_warehouse": "Miami, FL",
      "location": "Miami, FL",
      "sub_location": ["Section A", "Locker A110"],
      "extra_serial_number": [
        { "keyObject": "Band", "valueObject": "G50" },
        { "keyObject": "Type", "valueObject": "Handheld" }
      ],
      "image_url": "https://res.cloudinary.com/.../image1.jpg"
    }
  ],

  // Fixed for every unit in a spreadsheet import, as they are today.
  "defaults": {
    "warehouse": 1,
    "display_item": 1,
    "enableAssignFeature": 1,
    "container": 0,
    "containerSpotLimit": null,
    "isItInContainer": 0,
    "containerId": "[]",
    "returnedRentedInfo": "",
    "return_date": null,
    "supplier_info": ""
  }
}
```

Size is not a concern: 500 units of this shape is a few hundred KB against a
50 MB body limit (`index.js:135`). Images are already URLs — the client uploads
them to Cloudinary before calling, once per distinct picture.

### What we need the handler to do

1. **Resolve each distinct location, creating the missing ones.** The client
   does this today with one call per location before the import, which is more
   requests against the same budget. It belongs here: the server is already
   resolving `location_id` per request.

2. **Run the scope check over every location and category in the payload,
   all-or-nothing.** This is the part that needs your judgement. The current
   handler resolves one `location_id` and calls
   `canWriteInScope(access, "create", { locationId, categoryName })` — correct
   for one group, and the reason a request cannot span locations today. A
   spreadsheet import genuinely does. We suggest refusing the whole import if
   any (location, category) pair is outside the caller's scope, and naming the
   first offending pair in the message so it can be fixed in the file.

3. **Insert one row per unit, with that unit's own values.** No scalar is
   shared. `extra_serial_number` is per unit and already in the shape
   `item_inv` stores.

4. **Answer `202 { jobId }`**, and make the job's result something we can show:

   ```jsonc
   { "inserted": 500, "failed": [ { "serial_number": "...", "reason": "..." } ] }
   ```

   A per-serial failure list matters more here than elsewhere: 500 units is too
   many for "the import failed" to be actionable.

5. **Honour `Idempotency-Key`**, as `insertBulkItemAlhpanumericFormat` does. The
   client already sends one per request.

### Decisions that are yours

- **Duplicate serials.** The client detects them within the file and warns
  before sending. Against serials already in the company it cannot check. Reject
  the whole import, or insert what is new and report the rest? We would rather
  the latter, with the list.
- **Partial failure.** One transaction per import, or per batch inside the job?
  The existing handler runs a group in one transaction with a dedicated
  connection; 500 units is within that, but the ceiling is yours to set.
- **A ceiling on `units`.** The current job is documented to ~15,000 serials.
  Whatever number you pick, tell us and the paste/import UI will enforce it
  before sending rather than after.

## What the client does, and what changes

Already done, and unaffected by this:

- Reads the spreadsheet, **including pictures placed inside cells** (Excel's
  rich-data format, which neither SheetJS nor ExcelJS reads), uploads each
  distinct picture once and carries the URL.
- Keeps every unit's own values rather than collapsing them.
- Shows a preview before anything is sent: units read, rows skipped and why,
  duplicate serials, locations that will be created.
- Ensures locations once each, not once per group.

When this endpoint exists the client sends **one request** instead of 499, drops
its own location-creation loop, and shows the job's result. The split fallback
and `IMPORT_MODES.COMPATIBLE` are deleted.

Until then the import is effectively unusable for any file where units of one
model sit in more than one location — which is most real inventory.

## Numbers, so nothing here is an impression

Measured on `mocks/inventory/Inventory_Template_Mock_500.xlsx`, pinned in
`src/pages/inventory/utils/inventoryImport.integration.test.js`:

| | |
|---|---|
| units in the file | 500 |
| device names | 18 |
| distinct value-combinations (= requests today) | **499** |
| requests allowed per 15 min per IP | **300** |
| distinct locations | 5 |
| distinct pictures (87 cells) | 4 |
| units that would get another row's cost, pre-fix | 482 |
