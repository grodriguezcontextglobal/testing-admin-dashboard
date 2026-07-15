# Frontend Contract Change Report — Task Queue (Phases 1–3)

> **For:** frontend agent/team.
> **Context:** the backend added a **durable task queue** (store-and-forward over MongoDB):
> several operations that used to run synchronously are now **enqueued** and processed in the
> background, so they aren't lost if the server or an external dependency (SendGrid, S3, Go
> worker, a webhook) goes down. This **changes the shape and status code of several responses**.
> This document lists exactly what changed and what needs to be adjusted on the frontend.
>
> Assumed base URL: Mongo routes hang off `/api/...` and MySQL routes off `/api/db_...`.

---

## 0. Executive summary (the bare minimum you need to know)

1. **~37 endpoints** that used to respond **`201`** now respond **`202 Accepted`** with the same
   `ok: true` plus a `jobId`. **Global action:** treat `202` as success on every call to these
   endpoints (if the frontend currently does a strict `status === 201` or `=== 200` check, it will
   break).
2. Most of them are emails and logs → **cosmetic change** (adjust "sent" copy to "queued").
3. **One important exception — PDF document upload (`POST /api/document/upload`)**: moves to a
   **real async contract**. The frontend no longer receives `document` in the response; it must
   **poll** `GET /api/jobs/owned/:jobId` to get it (see §4). Endpoint ready on the backend.
4. **Another important exception — alphanumeric bulk inventory upload
   (`POST /api/db_item/bulk-item-alphanumeric`)**: same async-polling contract as document upload,
   **plus** this route now requires the `x-token` auth header (it was public before). See §5.
5. **Stripe (payments): NOTHING changes on the frontend.** See §7.
6. **NEW (this update) — two bulk *edit* endpoints move from `200 { updated_count }` /
   `200 { total_updated }` to the same async-polling contract, `x-token` now required on both**:
   - `POST /api/db_company/update-items-based-on-alphanumeric-serial-number`
   - `PUT /api/db_item/event-items/bulk-update`

   See §10.

---

## 1. Cross-cutting change: `201` → `202`

All endpoints in the tables below now respond **`202`** on the happy path (previously `201`). The
body keeps `ok: true` and adds `jobId`. If the frontend does a strict status-code check, adjust it
to accept `202`. Ideally: treat any `2xx` with `ok: true` as success.

Error codes (`400` validation, `500`) **do not change** except where noted.

---

## 2. Emails — `POST /api/nodemailer/*` (35 routes) · impact: LOW (cosmetic)

**Before:** `201 { ok: true, notification: "Email sent" }`
**Now:** `202 { ok: true, notification: "Email queued", jobId: "<id>" }`

- The email is no longer sent within the request: it's enqueued and a worker sends it (with
  retries).
- **Frontend action:**
  - Accept `202` as success.
  - If the UI shows "Email sent", change the copy to something like **"Email queued / will be sent
    shortly"** (more honest: at response time it hasn't been sent yet).
  - If any flow **blocked** waiting for confirmation of the actual send, remove that block.
- **Headers (`x-token`, `x-company-id`, etc.) are still sent the same way** — nothing changes on
  the request side.
- Routes that validated input (liability contracts, terms and conditions, etc.) **still return the
  same `400`** with the same `msg` when fields are missing.

Applies to **all** routes under the `/api/nodemailer/*` namespace. List (not exhaustive due to
line wrapping, but the change is uniform across all 35):

```
/assignig-device-notification            /confirm-returned-device-notification
/deposit-return-notification             /deposit-collected-notification
/early-remind-notification               /event-staff-notification
/lost-device-fee-notification            /confirmation-account
/login-existing-consumer                 /reset-admin-password
/edit-device-admin                       /customized-notification
/single-email-notification               /new_invitation
/internal-single-email-notification      /events-begin-reminder
/staff_internal_notification             /leased-equip-staff-notification
/invoice-notification                    /refund-notification
/send-consumer-app-instructions          /massive-event-customer-notification
/device-report-per-transaction           /feedback-email-notification
/liability-contract-email-notification   /liability-contract-consumer-email-notification
/liability-contract-member-email-notification
/returned-items-to-renter-notification   /terms-and-conditions-acceptance
/consumer-lease-return-device-notification  /member-lease-return-device-notification
/completed-task-notification             /failed-task-notification
/forcing-revoking-active-session         /member-email-notification
```

> Note: `massive-event-customer-notification` and `feedback-email-notification` may respond
> `200 { ok: true, notification: "No email sent to any consumers" }` (no `jobId`) when there are no
> recipients — that's a success case, not an error.

---

## 3. Logs — impact: MEDIUM (response body changes)

| Endpoint | Before | Now |
|---|---|---|
| `POST /api/event-log/feed-event-log` | `201 { ok: true, feedEvent: <saved document> }` | `202 { ok: true, jobId }` |
| `POST /api/notificationlog/notification-feed-log` | `201 { ok: true, feedNotification: <saved document> }` | `202 { ok: true, jobId }` |

- **Important change:** the saved document **is no longer in the response** (it's persisted by the
  worker). If any frontend component used `response.feedEvent` / `response.feedNotification` (e.g.
  to grab the newly created `_id` or to render the record), **that dependency needs to go away**.
  These endpoints are "fire-and-forget" (register and move on).
- **Frontend action:** accept `202`; remove any use of the returned document.

> `POST /api/notificationlog/...` — mind the path: the namespace stays lowercase
> (`notificationlog`, no dash, no camelCase).

### `POST /api/error_log/error_log` — NO contract change

- Still responds **`200 { ok: true, errorId, msg }`** with the **same `errorId`** as always (the id
  is real and stable; it can still be "saved for future reference").
- Only change: it now validates input → returns **`400 { ok: false, msg }`** if `componentStack` or
  `error` is missing (previously that case ended up as `500`). Optional: handle the `400`.

---

## 4. ⚠️ PDF document upload — `POST /api/document/upload` · impact: HIGH (async contract)

**Before:** `201 { ok: true, document: <full document with its S3 URL> }`
**Now:** `202 { ok: true, msg: "Document queued for upload", jobId: "<id>" }`

The upload to S3 and the document creation now happen in the worker. The frontend **no longer
receives `document` in the response** — it must get it via **polling** of the job status:

**Expected flow:**
1. `POST /api/document/upload` (multipart, same as today) → receives `{ jobId }`.
   - **Important:** keep sending `created_by` in the body with the **logged-in user's Mongo uid**
     (the same one that comes in the JWT). That value becomes the job's "owner" and is what enables
     the polling in step 2. (The frontend already sends `created_by` today; just make sure it's the
     authenticated user's uid.)
   - **Send an `Idempotency-Key` header** (a UUID per upload action) — see §4.1 "Idempotency".
2. Poll **`GET /api/jobs/owned/:jobId`** every ~1–2s (sending the usual session token —
   `x-token`). **Use this endpoint, NOT `/api/jobs/:jobId`** (see security note).
3. When the job reaches `status: "done"`, the document is in **`result.document`**.
4. If it reaches `status: "dead"` (retries exhausted), show an error and offer to retry the
   upload. See `lastError` for details.

Response of `GET /api/jobs/owned/:jobId` (SLIM, just what's needed for polling):
```json
{ "ok": true, "id": "<jobId>", "type": "document:upload-pdf",
  "status": "pending|processing|done|failed|dead", "attempts": 1,
  "lastError": null, "result": { "document": { /* the created document */ } } }
```
Status codes: `401` if there's no valid token · `400` if `jobId` is invalid · `404` if the job
doesn't exist **or isn't yours** (not distinguished, for privacy) · `200` on success.

Upload input validation that **does not change**: `400` if there's no file, `404` if the company
doesn't exist (validated before enqueueing, still synchronous).

### 4.1 Idempotency — avoiding duplicate uploads (StrictMode / double-click / retry)

The backend deduplicates the upload **if the frontend sends an `Idempotency-Key` header**
(recommended: a UUID v4). Given two requests with the same key, the backend returns **the same
`jobId`** and uploads the document **only once** (it even handles two near-simultaneous requests).

```
POST /api/document/upload
Idempotency-Key: 3f9a2c7e-...   (UUID per upload action)
```

> The backend already has `Idempotency-Key` in its CORS allowlist. If adding the header makes the
> request show up as **"canceled" / 0 B / no status** in the Network tab, that's a blocked CORS
> preflight — flag it to the backend (already accounted for; it just requires the server to be
> running the new code).

⚠️ **Stable key across React StrictMode:** in development, StrictMode invokes effects **twice**,
firing the upload twice. For deduplication to work, **the same key must arrive in both
invocations**. That's why the UUID **must NOT be generated inside the `useEffect`** that does the
upload (each invocation would generate a different one and the backend would see two different
operations). Generate it in a stable way instead: in a `useRef`/`useMemo`, in the user event
handler, or derived from stable form data. That way the StrictMode duplicate collapses into a
single document.

- Without the header, there's no deduplication (the backend uploads whatever it receives) — but
  it's recommended to always send it: it also protects production from double-clicks and network
  retries.
- On a deduplicated duplicate, the response is the same (`202 { jobId }`, the same id) → the
  polling in step 2 works identically.

### 🔒 Security note (why `/owned/:jobId` and not `/:jobId`)

There are TWO job-status endpoints, with different access control — **use the right one**:
- **`GET /api/jobs/owned/:jobId`** → any authenticated user, but **only their own job** (the
  backend validates that the job's `context.uid` matches the token's uid). **This is the one the
  document upload flow must use.**
- `GET /api/jobs/:jobId` and `GET /api/jobs/stats` → **`super_user` only** (admin/observability
  panel, §8.2). A regular user gets `403` here.

> The blocker that existed in a previous version of this document (polling was only available on
> the super_user endpoint) **is already resolved on the backend** with `/api/jobs/owned/:jobId`.
> The flow in §4 is completable.

---

## 5. ⚠️ Alphanumeric bulk inventory upload — `POST /api/db_item/bulk-item-alphanumeric` · impact: HIGH (new auth + async contract)

**Before:** `201 { ok: true, msg: "Alpha bulk items inserted successfully" }` — inserted up to 15,000
serials (`list`) synchronously within the same request/response cycle, with no real transaction
(each 1,000-row batch auto-committed independently) and no idempotency.
**Now:** `202 { ok: true, msg: "Bulk items queued for insertion", jobId: "<id>" }` — the INSERT runs
in the worker, inside a single transaction (full rollback if it fails mid-way).

### 5.1 Auth change — now requires `x-token`

This route **did not have `validateJWT`** before (it was one of the few public routes in
`mysql/routes/item.js`). It now requires it, because the token's `uid` becomes the job's owner
(needed for the polling step below).

- **Required action:** add the **`x-token`** header (the usual session JWT) to the
  `alphaNumericInsertItemMutation` request. If the HTTP client this mutation currently uses is a
  "public" one without an auth interceptor, move it to the authenticated client — without this the
  request now returns `401`.
- If `sqlStaffId` is resolved via header instead of coming from the JWT, also include `s-token-lq`
  (same criterion as the rest of the authenticated routes).
- The `template` the frontend builds (`list`, `extra_serial_number`, and the rest of the fields)
  **does not change** — no identity field needs to be added to the body, `uid` comes from the JWT.

### 5.2 Expected flow

1. `POST /api/db_item/bulk-item-alphanumeric` with `x-token` (new) + `Idempotency-Key` header
   (recommended, UUID per submit — see §4.1, same mechanism) → receives `{ jobId }`.
   - `400`/`404` (missing `location`/`company_id`, or the location doesn't exist) **do not change**:
     they remain synchronous, handle them exactly as today.
2. Show an **immediate** "queued" toast, NOT a success toast: *"Your upload of N items was
   registered and is being processed in the background. We'll notify you when it's ready."* Clearing
   the form/`scannedSerialNumbers` is already safe at this point (the job is registered). **Do not
   navigate yet** to `/inventory`.
3. Poll **`GET /api/jobs/owned/:jobId`** (same `x-token`, same endpoint used for documents — NOT
   `/api/jobs/:jobId`, that one is `super_user`-only) every ~3s until a terminal `status`.
   - **Important:** this polling must live somewhere that survives navigation (a React Query hook
     with `queryKey: ['job', jobId]` + `refetchInterval`, or a global `JobToastProvider` in the root
     layout) — not a local `setInterval` in the form component. If the user navigates away right
     after seeing the "queued" toast (step 2), a local poll would die with the unmount and the final
     result would never reach them.
4. **`status: "done"`** → only then: success toast (*"N items were successfully created in
   inventory"*), the two existing `clearCacheMemory(...)` calls, and `navigate("/inventory")` only if
   the user is still on that screen (otherwise the global toast is enough).
5. **`status: "failed"` or `"dead"`** → show `lastError` in a readable form, offer a retry (same
   `Idempotency-Key` if it's the same attempt, a new one if it's a distinct submit).

### 5.3 Validation checklist for this flow

- [ ] Small upload (~5 serials) end-to-end: queued → initial toast → polling → final toast → navigation.
- [ ] Nonexistent location → immediate `404`, without enqueueing.
- [ ] Navigate to another screen right after the `202` → confirm the final toast still arrives
      (validates polling is global, not local to the form).
- [ ] Rapid double-click on submit → both requests return the **same** `jobId` (idempotency).
- [ ] Request without `x-token` → confirm it now returns `401` (previously worked without a token).

---

## 6. Other `201 → 202` endpoints · impact: LOW

| Endpoint | Before | Now | Note |
|---|---|---|---|
| `POST /api/db_event/inserting-items-in-event-from-container` | `201 { ok: true, msg }` | `202 { ok: true, msg: "Items queued for insertion into event", jobId }` | Just accept `202`; everything else stays the same. |
| `POST /api/document/upload/xlsx` (inventory import) | could return `502` if the import webhook was down | `200 { ok: true, msg, data: { s3Location, signedUrl } }` (no `502`) | **The special `502` handling can be removed**: if the webhook is down, it's now retried in the background and the response is still successful (the file already landed in S3). The actual import result still arrives via the usual callbacks. |

---

## 7. Stripe (payments) — NO frontend changes ✅

Stripe mutations (capture, cancel, refund) **were not enqueued** (money doesn't get "buffered").
They were hardened on the backend (retries + circuit breaker), but the **contract is identical**:
same endpoints, same codes, same bodies. Nothing to change.

- Only observable nuance: if Stripe were down, the backend can now respond faster with a
  "service unavailable" error (instead of hanging while retrying). The frontend's existing generic
  error handling already covers this.

---

## 8. NEW endpoints available

### 8.1 Polling your own job — any authenticated user

| Endpoint | Auth | Returns |
|---|---|---|
| `GET /api/jobs/owned/:jobId` | `validateJWT` (session token, `x-token`) | `{ ok, id, type, status, attempts, lastError, result }` — only if the job belongs to the user (`context.uid === token uid`); otherwise `404`. SLIM response (no `payload`/`context`). |

This is the one used by the document upload flow (§4). Useful for any future async task where the
user who triggered it needs to check its result.

### 8.2 Platform observability — `super_user` only

Require `validateJWT` + being a `super_user`. For an admin/support panel (optional):

| Endpoint | Returns |
|---|---|
| `GET /api/jobs/stats` | `{ ok, stats: { pending, processing, done, failed, dead, total } }` |
| `GET /api/jobs/:jobId` | `{ ok, id, type, status, payload, context, attempts, lastError, result, ... }` (full response) — `400` if `jobId` isn't a valid ObjectId, `404` if it doesn't exist |

Possible job states (`status`): `pending` → `processing` → `done` | `failed` | `dead`
(`dead` = retries exhausted, requires manual intervention).

---

## 9. Actionable checklist for the frontend

- [ ] **Global:** accept `202` as success on all affected calls (ideally: any `2xx` + `ok:true`).
- [ ] **Emails (`/api/nodemailer/*`):** adjust "sent" copy → "queued"; remove any blocking that
      waited for actual send confirmation.
- [ ] **Logs:** stop using `feedEvent` / `feedNotification` from the response.
- [ ] **`error_log`:** (optional) handle the new `400`.
- [ ] **`inserting-items-in-event-from-container`:** accept `202`.
- [ ] **`upload/xlsx`:** remove the special `502` handling.
- [ ] **PDF documents (`/api/document/upload`):** send `created_by` = logged-in user's uid; send
      `Idempotency-Key` header (stable UUID across StrictMode, see §4.1); implement polling of
      **`GET /api/jobs/owned/:jobId`** → `result.document` (see §4).
- [ ] **Alphanumeric bulk inventory upload (`/api/db_item/bulk-item-alphanumeric`):** add `x-token`
      header (route now requires auth); add `Idempotency-Key` header; switch success handling from
      immediate `201` to `202 { jobId }` + global polling of `GET /api/jobs/owned/:jobId` before
      showing the success toast / navigating (see §5).
- [ ] **Stripe:** nothing.
- [ ] (Optional) Admin panel using `GET /api/jobs/stats` and `GET /api/jobs/:jobId` (super_user).
- [ ] **`update-items-based-on-alphanumeric-serial-number`:** add `x-token`; replace
      `response.updated_count` with polling of `GET /api/jobs/owned/:jobId` → `result.updated_count`
      (see §10.1).
- [ ] **`event-items/bulk-update`:** add `x-token`; replace `response.total_updated` with polling of
      `GET /api/jobs/owned/:jobId` → `result.updated_count` — note the field rename (see §10.2).

---

## 10. ⚠️ NEW (this update) — Bulk *edit* endpoints migrated to the queue · impact: HIGH (new auth + async contract)

Two mass-**update** endpoints (not insert) had the same problem as §5: a single UPDATE running
synchronously inside the request/response cycle, potentially touching thousands of rows, with the
HTTP connection held open the whole time and no idempotency. Both are now enqueued, same pattern as
§4/§5.

### 10.1 `POST /api/db_company/update-items-based-on-alphanumeric-serial-number`

Bulk-edits `item_inv` rows, either by a list of serial numbers or by a `reference` criteria
(`updateAll: true` with `category_name`/`item_group`/`brand`).

**Before:** `200 { ok: true, msg: "<N> item(s) updated successfully.", updated_count: <N> }`
**Now:** `202 { ok: true, msg: "Bulk item update queued", jobId: "<id>" }`

- **Auth change:** this route **did not have `validateJWT`** before (public). It now requires
  `x-token` (same `validateJWT` + `checkTokenVersion` as the rest of the authenticated routes) —
  without it, the request now returns `401`. No new field needs to be added to the body; `uid`
  comes from the JWT and becomes the job owner.
- **`400` validation is unchanged** — same messages, same triggers, still synchronous (not
  enqueued): `company_id is required.` / `reference must include at least one of: item_group,
  category_name, brand.` / `At least one field is required to update.` / `Provide list or
  extra_serial_number with serial number keys.` / invalid `extra_serial_number` JSON.
- **`updated_count` is no longer in the immediate response.** Get it via polling
  **`GET /api/jobs/owned/:jobId`** (same endpoint/mechanics as §4/§5) → `result.updated_count`
  once `status: "done"`.
- **Frontend action:** accept `202`; add `x-token` to this mutation's request if it isn't already
  authenticated; replace any code reading `response.updated_count` with a poll of
  `GET /api/jobs/owned/:jobId` → `result.updated_count`; update any "updated" toast to fire only on
  `status: "done"` (same UX pattern as §5.2 — queued toast first, success toast after polling
  resolves).

### 10.2 `PUT /api/db_item/event-items/bulk-update`

Bulk-edits `event_item_shipping` rows (`shipping_status`, `active`, `notes`) filtered by the same
allowed fields.

**Before:** `200 { ok: true, message: "<N> item(s) have been updated for event <event_id>.",
total_updated: <N> }`
**Now:** `202 { ok: true, message: "Event item shipping bulk update queued", jobId: "<id>" }`

- **Auth change:** also previously public, now requires `x-token` (`validateJWT` +
  `checkTokenVersion`). Same `401` note as above.
- **`400` validation unchanged** (same `message` field, not `msg` — this controller has always used
  `message`, unlike most others): `company_id and event_id are required.` / `At least one update
  field must be provided.` / `At least one filter condition must be provided.` / `No valid fields
  to update. Allowed fields are: ...` / `No valid filter fields provided. Allowed fields are: ...`.
- ⚠️ **Field rename in the polled result:** the old synchronous response used `total_updated`. The
  job's `result` object uses **`updated_count`** instead (same key as §11.1, for consistency) — poll
  `GET /api/jobs/owned/:jobId` → `result.updated_count`, **not** `result.total_updated`.
- **Frontend action:** accept `202`; add `x-token`; replace `response.total_updated` with a poll of
  `GET /api/jobs/owned/:jobId` → `result.updated_count`.

### 10.3 Validation checklist for both

- [ ] Small edit (a handful of serials / a narrow event filter) end-to-end: queued → polling →
      success toast with the real row count from `result.updated_count`.
- [ ] Existing `400` cases (missing `company_id`, empty `updates`/`filters`, disallowed field names,
      etc.) still surface immediately, without a `jobId` and without polling.
- [ ] Request without `x-token` on either endpoint → confirm `401` (previously worked without one).
- [ ] Navigate away right after the `202` → confirm the final toast still arrives (global polling,
      not a local `setInterval` tied to the form/table component — same requirement as §5.2).

---

## 11. Open questions / to coordinate with backend

1. Recommended polling interval (the worker runs every ~4s by default; a 1–2s frontend polling
   interval is reasonable).
2. Confirm that the `created_by` the frontend currently sends on document upload is the
   **authenticated user's Mongo uid** (needed for `GET /api/jobs/owned/:jobId` to recognize the
   owner).
3. Recommended polling interval for the bulk inventory upload job (§5.2) — same ~3s guidance as
   document upload, or does a 15,000-serial job warrant a longer interval to reduce load?
4. Same polling-interval question for the two new bulk-edit jobs (§10) — both are single UPDATE
   statements (DB-bound, not batched Node-side), so they likely finish faster than the bulk insert;
   a 1–2s interval is probably fine, but confirm before locking it in.
