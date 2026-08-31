# Backend ask — refused writes, and the chains built on top of them

**From:** frontend (dashboard)
**Date:** 2026-08-31
**Related client commits:** `846b2a44` (staff chain), `0a70a3bd` (member/student chain)

> **Evidence basis.** Everything below comes from client-side source and from
> behaviour observed live during a recorded product walkthrough on 2026-08-28.
> **Nothing here was reproduced against a server by the frontend** — no
> requests, tests or processes were run against the API repo. Where a claim is
> inferred rather than observed, it says so. Please confirm or correct the
> contract facts before anyone builds on them.

---

## 1. The primary ask — a refused write should not answer `200`

### What we see

Several write endpoints answer **HTTP 200 with a body of `{ ok: false, msg }`**
when they decline to perform the write. Axios treats `200` as success, so on the
client a refusal is indistinguishable from a completed write unless every single
call site remembers to open the body and look.

They did not all remember. That is the bug we have now fixed twice.

### Why it costs more than it looks

These writes are not independent — they are **chains**, where each step assumes
the previous one landed. When step 2 of 6 answers `200 { ok: false }`:

- steps 3–6 execute anyway, against a state that does not exist;
- the UI reports success;
- the records disagree with each other, and nobody finds out until someone
  notices a device is missing from a shelf.

That is the exact failure a user hit during the walkthrough: an error was
displayed, **and the device had been transferred anyway**. His words:

> *"if you are going to give an error message, it should not be transferred."*

### The ask

**Return a 4xx for a refused write.** `400` for a rejected payload, `409` for a
conflict (already assigned, already returned), `403` for a permission refusal.
Keep `msg` in the body — it is good, we surface it — but let the status code
carry the outcome.

If the `200 { ok: false }` shape has to stay for backward compatibility with
other consumers, say so and we will keep the client-side guards permanently.
We would rather know than guess.

### Endpoints we have had to guard

Verified from client source. This is not necessarily the full set — it is the
set that appears in the two assignment/return chains.

| Endpoint | Chain | Step it performs |
|---|---|---|
| `POST /db_item/item-out-warehouse` | both | move units out of / back into stock |
| `POST /document/verification/member/signed_document` | member | record the signed document |
| `POST /document/verification/staff_member/signed_document` | staff | same, staff side |
| `POST /db_member/new-member-assigned-device-lease` | member | one lease row per device |
| `POST /db_member/update-member-assigned-device-lease` | member | close the lease on return |
| `POST /db_lease/new-lease` | staff | one lease row per device |
| `POST /db_event/returning-item` | member | restock on return |
| `POST /db_event/new_event` | staff | the lease event |
| `POST /db_event/event_device_directly` | staff | event links |
| `POST /receiver/receivers-pool` | staff | receiver pool |

**Question:** which of these actually use `200 { ok: false }`, and which return a
real error status today? We guarded all of them because we could not tell the
two apart from the client. A list would let us relax the ones that do not need
it.

---

## 2. The ask behind the ask — these chains should not be the client's job

Guarding each write is mitigation, not a fix. The underlying problem is that a
single business operation — *hand a device to a person* — is **six or seven
separate HTTP writes orchestrated from a browser**, with no transaction around
them.

Consequences we live with today:

- A tab closed mid-chain leaves the records inconsistent, and no guard can
  prevent that.
- We have written a **client-side compensating rollback** (put the device back
  when the lease is refused). It is best-effort by nature, and it can itself be
  refused — which is a bug we just had to fix, because a refused rollback was
  reporting success.
- Every new client that talks to this API has to reimplement the same order and
  the same guards, correctly, from scratch.

**Ask:** one transactional endpoint per business operation, which either commits
everything or commits nothing:

- `POST /assign-devices` — warehouse move + verification + leases + notification
- `POST /return-device` — restock + close lease + outcome/condition

We are not asking for this next week. We are asking whether it is on the roadmap,
because if it is, we would rather not build more UI against the multi-write
shape.

---

## 3. What returns `400` on the signed-document verification?

During the walkthrough, assigning a device failed with
`Request failed with status 400`. The working diagnosis at the time was that a
legal document had been attached and needed to be removed first.

**Questions:**
1. What conditions make
   `POST /document/verification/{member|staff_member}/signed_document`
   answer `400`?
2. Does that `400` carry a `msg` a user could act on? We currently surface the
   server's own words; if the body is empty the operator sees a bare status code.

Note this one **does** appear to use a real `4xx`, which is the behaviour we are
asking for everywhere else in §1.

---

## 4. Security — the activity log has no server-side rank filter

**Standing ask, now with more weight behind it.**

`POST/GET /api/admin/activity-logs` returns the company's full log set. The
role hierarchy that decides who may read whose activity (`canViewStaffActivity`
in `src/config/roles.js` — root_admin reads all, every other role reads its own
rank and below) is enforced **only in the browser**.

So a lower-ranked staff member's browser receives the entire company log over
the wire and hides most of it. Anyone with devtools sees all of it.

**Ask:** a server-side filter parameter, with the rank check applied on the
server — the client filter becomes presentation, not access control.

**Why now:** FedRAMP was named as a company goal in the same meeting. An access
control that exists only in the client does not survive a security review, and
"who may read the audit trail" is one of the first things such a review looks
at. Same flavour of concern as the IDOR reported previously.

---

## 5. Smaller open items

**Supplier documents have no download route.** The contract has
`POST /api/company/provider-upload-document/:id` (multer field `document`) and
nothing else — no `GET`, no delete. A filed invoice can only be opened if the
server happens to store an absolute URL on the record; otherwise the row renders
"Stored" instead of a link. Company documents (`/api/document`) already have the
right pattern — `GET /document/download/:id/:uid` → `{ ok, downloadUrl }`. Should
supplier documents get the same?

**`inserting-items-in-event-from-container`** — named in the task-queue
migration doc, but there is no client call site for that exact path. The nearest
is `POST /db_event/allocate-device-container-event`. Rename, or an endpoint we
never integrated?

---

## 6. Heads-up — FedRAMP as a design constraint

Not an ask, context so the API is not designed into a corner.

FedRAMP was set as a company goal in the 2026-08-28 meeting. Explicitly **not** a
certification project right now; the instruction was to understand the
requirements so that what we build from here does not have to be rebuilt later.

Two items on the API side worth having on your radar:

- **Audit trail retention and scope.** §4 above is the access-control half. The
  other half is how long log rows are kept and whether any of them carry
  personal data — relevant because part of the product handles minors' records.
- **Dependency vulnerability management.** GitHub currently reports 113
  vulnerabilities on the dashboard repo's default branch (45 high, 59 moderate,
  9 low). If the API repo has a similar backlog, it is worth knowing the number
  now rather than during a review. This is a heads-up about our own house too,
  not a complaint about yours.

---

## Summary of what we need back

1. Confirm or correct the `200 { ok: false }` refusal contract, and tell us
   which endpoints in the §1 table actually use it. **(highest value)**
2. Say whether transactional assign/return endpoints (§2) are plausible, so we
   know whether to keep building against the multi-write shape.
3. Document what makes the signed-document verification return `400` (§3).
4. A server-side rank filter for the activity log (§4).
5. A decision on supplier document downloads, and the container-endpoint naming
   (§5).
