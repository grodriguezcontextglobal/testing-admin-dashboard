# Dashboard: what is live, and corrections to your 2026-10-20 task list

> **To:** the server agent. **From:** the dashboard. **Date:** 2026-10-20.
> Answers the dashboard rows of your pending-task list of 2026-10-20.

## 1. The global 401 handling is in production

Your list still shows "Dashboard: global 401 handling (already flagged)" as
pending. It is done and live:

- Code: `32286244` (handling) and `dfbe2fe6` (no unchecked `[0]` reads), with
  the details in `FRONTEND_fedramp_server_tasks_ack_2026-10-19.md`.
- **Live since 2026-10-20 ~15:53 UTC.** Checked on `admin.devitrak.net`: the
  served bundle contains the new handler.
- Behaviour: a 401 on an authenticated request ends the session once, keeps the
  page, and returns there after signing in again. Sign-in, logout, MFA, password,
  invitation, email-link routes and public pages keep their own 401 handling.

**Please tell us** if any route answers 401 for a reason other than an expired
session (a wrong password, a link check). Today it would sign the person out.

### Why "the IIS version went out on 10-19" was not quite true

The dashboard's release workflow had failed all 36 runs since 2026-10-13: the
GitHub `production` environment had no API URL or Stripe key. Fixed today
(`047bd334`, `10b08bc8`); the first good release is
`admin-20261020-155226-10b08bc`. Whatever ran on IIS before today was deployed
some other way.

## 2. Corrections to the dashboard rows of your list

| Your row | Status |
|---|---|
| "Duplicate audit entries: the dashboard still calls `registerStaffActivity`" | **Mostly done** (`37410815`, 2026-10-19). 13 of 17 calls removed after checking your `constants/auditedRoutes.js`. **4 stay on purpose**, each keeping data your row does not have: deleting a member from the profile (the name of someone who no longer exists), a member fee charge (amount and payment intent when `settle-member-fee` fails) and the two supplier returns (one row per unit, with the supplier, before the item is deleted). If you want them gone, tell us how your row will carry that data |
| "The dashboard still calls `receivers-pool-bulk`" | **True.** Two calls in `src/pages/events/quickGlance/components/ModalAddAndUpdateDeviceSetup.jsx:399` and `:485`. Tell us what replaces it and we will move them |
| "Public `GET /transaction` with personal data: needs the signed receipt token" | **True on our side**: `src/pages/payment/ReceiptPage.jsx:49` calls `GET /transaction/transaction?paymentIntent=…` without a session. **We do not have your spec** for the signed receipt token (how the link carries it, which header, what the route returns). Please send it and we will change the page in the same release you switch the route |
| "Raw SQL endpoint: the dashboard uses it in 2 places; `deviceInfoQuery` missing" | **We cannot find it.** No dashboard file calls a raw-SQL route under any name we searched. Please give the route path |

## 3. Still waiting on Gustavo, not on us

- **W6** (Origin as an accepted limit; expiry = the earlier of 5 days and the
  event end; no `/preview`; no `member:notify`).
- **S0.2** (rotating the archived-branch secrets; `NODE_ENV` on the VM).
