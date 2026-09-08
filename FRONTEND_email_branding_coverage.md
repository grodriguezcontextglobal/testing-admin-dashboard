# Email branding — coverage ask, and two client-side gaps we closed

**From:** frontend (admin dashboard) · **Date:** 2026-09-08
**About:** `Company.email_branding`, `nodeMailer/branding.js`, `POST /api/nodemailer/*`

The requirement from the client side is now stated plainly: **when a company
configures Email branding, every email Devitrak sends on its behalf must wear
it — and every event-related email in particular must keep the company's
template and format.** This document states what the dashboard does, what we
fixed, and the one part only the backend can answer.

---

## 1. How branding reaches a send today

`3007e996` chose the header route over editing the call sites:

> sessionHeaders sends `x-company-id` to `/api/nodemailer`, so the server
> resolves the sender's branding from a header the dashboard already attaches
> instead of us editing ~62 notification call sites.

So on the client the contract is one line (`src/api/sessionHeaders.js`):

```js
const COMPANY_ID_ROUTE = /\/api\/(staff|admin|company|stripe|nodemailer)(\/|$)/;
```

Verified in this review:

- **61 send call sites**, across **28 distinct `/api/nodemailer/*` endpoints**
  (inventory in §4). Every one is written with a leading slash, so all 61
  resolve to a path the regex matches and all 61 carry `x-company-id`.
  (A call written `"nodemailer/x"` instead of `"/nodemailer/x"` would still
  reach the server — axios inserts the separator — but `buildRequestPath`
  mirrors a plain concatenation, so the path would read `/apinodemailer/x`,
  miss the regex, and drop the header. None exist today; worth keeping in mind
  as the failure mode if branding ever goes missing for exactly one email.)
- No email is sent through `devitrakAWSApi`, which attaches no company header.
- No send passes its own HTML. The client sends structured fields
  (`subject`, `message`, recipients, event name) and the server renders — so
  branding is not being bypassed from this side.

## 2. Two client-side gaps, fixed in this change

**2.1 — Sessions that never re-ran login sent no header at all.**
`persistCompanyHeaders` was called in exactly two places: `Login.jsx` and the
multiple-companies switch modal. Redux is persisted, so a session that was
already open when these headers were introduced stays `authenticated` across
browser restarts and never runs the login flow again — it kept sending every
`/api/nodemailer` request with **no `x-company-id`**, and every email went out
Devitrak-branded with nothing in the UI to suggest it.

Fixed with a gap-filling backfill on boot: new `ensureCompanyHeaders(user)` in
`src/api/sessionHeaders.js`, called from `App.jsx` once the token validates.
It writes only keys that are absent, so the company-switch modal stays the
authority on which company is active. 5 new tests.

**2.2 — Saving branding left the session holding the old value.**
`EmailBrandingSettings` PATCHes `/company/update-company/:id` and its form is
seeded from `admin.user.companyData`, which only refreshed on a fresh login.
After a save, a reload showed the **pre-save** values, and saving again from
that stale form pushed them back — quietly switching branding off after the
client had turned it on. Now dispatches `onUpdateCompanyData` on success, the
same pattern Company info and My details already use.

## 3. What we need from the backend

1. **Which of the 28 endpoints in §4 render through `normalizeBranding` and the
   branded layout?** The client cannot tell. Our ask is all of them; what we
   need is the list of the ones that are not yet, so we can say something
   truthful in the UI in the meantime.
2. **`GET /nodemailer/branding-preview/templates`** is the only coverage signal
   the dashboard has — the settings page renders one preview per entry. Is that
   list the *branded* set, or just the previewable subset? If they can be made
   the same list, the settings page becomes self-documenting: whatever a client
   can preview is exactly what arrives branded.
3. **Mail sent as a side effect of a non-`/nodemailer` route** — event
   registration confirmations, transaction/receipt mail triggered from
   `/api/db_*` handlers, anything sent by the consumer app or by a scheduled
   job. Those requests carry `s-company-lq` but **never** `x-company-id`
   (`db_*` is scoped to the SQL id by design), and a cron has no request at
   all. Confirm those paths resolve branding from the company record rather
   than from the header, or tell us what to send.
4. **Pre-auth sends have no session, so no header**: `reset-admin-password`
   from `ForgotPassword.jsx` and `forcing-revoking-active-session` from
   `Login.jsx`. Note that the *same* `reset-admin-password` template sent from
   staff detail (authenticated) *does* carry the header — so today one client
   can receive that email branded and unbranded depending on where it was
   triggered. Decide which is right; if it should be branded in both, we need a
   company hint in the payload for the pre-auth case.

## 4. Inventory — every `/api/nodemailer` endpoint the dashboard calls

Event-related (sent while an event is in context), the set this request is
about:

| Endpoint | Client entry point |
| --- | --- |
| `assignig-device-notification` | quickGlance consumer assignment, `useCreateTransaction`, `useTransactionDeviceActions`, `payment/Confirmation` |
| `confirm-returned-device-notification` | `ReturnSingleItemInTransaction`, `useTransactionDeviceActions`, quickGlance inventory action |
| `device-report-per-transaction` | `ItemReportForClient`, `AddingDevicesToPaymentIntent`, `useTransactionDeviceActions` |
| `deposit-collected-notification` | `deposit/Capturing`, `DepositActionModal` |
| `deposit-return-notification` | `deposit/Releasing`, `DepositActionModal`, `search/ReleaseDeposit` |
| `lost-device-fee-notification` | 9 sites (consumer + quickGlance, cash and card) |
| `refund-notification` | `sendRefundReceiptEmail`, `StripeTransactionTable` |
| `massive-event-customer-notification` | `EmailNotification` (event-wide message) |
| `send-consumer-app-instructions` | `EventLinkNotification` (event QR link) |
| `events-begin-reminder` | `CardEventDisplay` |
| `feedback-email-notification` | `FeedbackEvent` |
| `single-email-notification` | `SingleEmail`, member reminders, `OverdueDevicesTable` |
| `customize-message-notification` | `RegisterMembersToEvent` |
| `liability-contract-email-notification` / `-consumer-` / `-member-` | consumer + staff + member assignment |
| `member-lease-return-device-notification`, `member-device-incident-notification`, `member-device-fee-receipt-notification` | school/member lease flows |
| `consumer-lease-return-device-notification`, `returned-items-to-renter-notification` | lease end, rental return |
| `invoice-notification` | `ServicePaymentConfirmation` |
| `internal-single-email-notification`, `staff_internal_notification`, `new_invitation` | internal + staff invitations |

Account-level: `reset-admin-password`, `forcing-revoking-active-session`,
`branding-preview` (settings page only, no send).
