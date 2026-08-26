# Pending Frontend Tasks — as of 2026-08-25

> Backlog captured from a walkthrough of the running app. Eleven items across
> four areas. Each one below carries where it lives, so whoever picks it up does
> not start from a blank search.
>
> Nothing here is started. Scope questions were answered by the reporter on
> 2026-08-25 and are folded in below — **no item is blocked on the backend**.

---

## Events

### E1 — Create new consumer from an event

**UI, layout only.** `src/pages/consumers/utils/CreateNewUser.jsx` is the shared
create form; the event-side entry point is in the quick-glance consumer area
(`src/pages/events/quickGlance/consumer/`).

Confirmed scope: the complaint is the layout, not the event association. Do not
change what the form submits.

### E2 — Staff added from the event quick-glance page does not display a name

**Bug.** `src/pages/events/quickGlance/staff/` —
`StaffMainPage.jsx`, `StaffTable.jsx`, `EditingStaff.jsx`.

The new row appears but with no name. Two likely causes, in order:

1. The optimistic/refetched row is read from a different response shape than the
   table's column expects (`first_name`/`last_name` vs a composed `name`).
2. The list is not invalidated after the add, so the table shows a stale row
   built from the request rather than from the server's answer.

Same family as the `membersInfoQuery` invalidation gap fixed in `71c56930` —
check the cache key first.

### E3 — Consumer detail page → email notification

**UI.** The email components are shared and live in
`src/components/notification/email/`:

```text
EmailNotification.jsx        EmailReturnRentalItems.jsx
EventLinkNotification.jsx    FeedbackEvent.jsx
ItemReportForClient.jsx      SingleEmail.jsx
```

The consumer-detail entry point hangs off
`src/pages/events/quickGlance/consumer/ConsumerDetail/ConsumerActionRail.jsx`.

Because the folder is shared, a redesign there lands on every screen that sends
mail — check each caller before changing a shared component's props. Note
`EmailReturnRentalItems` was already verified this session to accept a `Set`
safely (`Array.from(items)`).

### E4 — Quick glance → payment confirmation page

**UI.** `src/pages/events/quickGlance/consumer/ConsumerDetail/AssigningDevice/AddingDevicesToPaymentIntent.jsx`
plus `.../actions/transactions/useCreateTransaction.js`.

Touches Stripe payment intents — read `useCreateTransaction` before changing
anything on screen, and keep the request shape.

---

## Suppliers

### S1 — Create new supplier

**UI.** `src/pages/inventory/actions/utils/suppliers/NewSupplier.jsx`.

Sibling screens in `src/pages/inventory/details/OwnershipDetail/components/suppliers/`
were rebuilt on `action-form__*` (`ReturnRentedItemModal`, commit `880e498e`) —
this one has not been, so it is the odd screen out in that folder.

---

## Documents

> **The field that answers "which path" already exists on both.** No backend ask.
>
> - A **document** carries `trigger_action`, shown in the upload form under the
>   label "Uses for" (`src/components/documents/DocumentUpload.jsx:175`). Values:
>   `onboarding` (displayed as *Staff*), `event`, `consumer`, `school_consent`
>   (Education companies only), plus the company's own representative label.
> - A **folder** carries `trigger_action` too, alongside `folder_name`,
>   `folder_description` and `documents[]`
>   (`src/pages/Profile/Documents/Documents.jsx:25-30`), and the form already
>   refuses to save without it (`:104`, `:500`).
>
> So D1 and D2 are not "add a concept" — the data is there and the view simply
> ignores it. Everything is listed flat.

### D1 — Show documents on the right path for their usage/purpose

**System.** `src/pages/Profile/Documents/Documents.jsx` (510 lines, list + folder
dialog + upload all inline), `DocumentCard.jsx`, `ViewDocument.jsx`,
`EditDocument.jsx`.

Group and route by `trigger_action` instead of listing everything together.

One thing to settle while designing: `trigger_action` is a single value, so a
document belongs to exactly one path. If a document ever needs to serve two
(onboarding *and* consumer), that is the point at which it becomes a backend
change — worth confirming it is not already needed before building around the
single-value assumption.

### D2 — Show folders on the right path for their usage/purpose

**System.** Same module and same field. Design with D1 — one navigation model,
not two — and keep the vocabulary identical in both, since the two dropdowns
today are written separately and can drift.

### D3 — Create new document — **redesign**

**UI.** `src/components/documents/DocumentUpload.jsx` (266 lines) with
`new_form_components/` (`SectionHeader`, `SectionLabel`, `SectionFooter`).

Confirmed as a redesign of the existing form, not new functionality.

**Blocker, still standing:** PDF document upload is broken against the
201 → 202 + polling migration (see `FRONTEND_task_queue_changes.md`). Fix the
upload first, or the redesign lands on a flow that cannot complete.

### D4 — Create new folder — **redesign**

**UI.** The folder dialog inside
`src/pages/Profile/Documents/Documents.jsx` (`handleCreateFolder` at `:78`, the
dialog around `:400-505`).

Confirmed: both "create a document" and "create a folder" already exist under
Documents; this is a redesign of the folder dialog. It is worth extracting out of
`Documents.jsx` while redesigning — that file currently holds the listing, the
folder dialog and the document-picker in one component.

---

## Inventory

### F1 — Forecast shows every date one day early — **root cause confirmed**

**Bug.** `src/pages/inventory/table/extras/AdvanceSearchResultPage.jsx:244` and
`:249`:

```js
render: (row) => new Date(row.date_begin).toLocaleDateString(),
render: (row) => new Date(row.date_end).toLocaleDateString(),
```

`new Date("2026-05-01")` parses a bare `YYYY-MM-DD` as **UTC midnight**, and
`toLocaleDateString()` then renders it in local time — the previous day for
every user west of UTC. Searching `05/01/2026–05/05/2026` displays
`04/30/2026–05/04/2026`, exactly as reported.

The outbound request is **not** at fault: `AdvanceSearchModal.jsx:89-92` builds
the string from local `getFullYear`/`getMonth`/`getDate`, so the server receives
the dates the user picked.

**Fix:** use `formatDay` from
`src/pages/inventory/table/extras/forecastInventory/utils/forecastSummary.js`,
which was written for precisely this and is already tested. Promote it out of
`forecastInventory/utils/` if the result page should not import across folders.

**While in there:** the same file sends `2026-5-1`, not `2026-05-01`. Both
happen to work today because the unpadded form is parsed as *local* time and the
padded form as *UTC* — a difference worth removing rather than relying on.

### F2 — Forecast modal

**UI.** `src/pages/inventory/table/extras/AdvanceSearchModal.jsx`.

The result page behind it was rebuilt as sections with a tested
`forecastSummary.js` (commit `fde2e369`); the modal that opens it was not, so
the two no longer look like the same feature. Fix **F1** in the same pass — the
date handling that causes it lives in this file's sibling.

---

## Suggested order

1. **F1** — confirmed cause, one-line fix, already-tested helper. Do it first.
2. **E2** — a name not rendering is a small, well-bounded cache/shape bug.
3. **D1 + D2 together** — one navigation model over a field that already exists.
4. **D4**, then **D3** — the folder dialog is self-contained; D3 waits on the
   broken PDF upload, which is the only remaining blocker in the list.
5. **F2**, **S1**, **E1** — redesigns with no open questions.
6. **E3** — shared components, so it reaches every screen that sends mail.
7. **E4** — last, because it touches Stripe payment intents.
