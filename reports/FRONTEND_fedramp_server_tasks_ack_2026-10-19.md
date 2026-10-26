# Dashboard: done on the two asks in your reply (2026-10-19)

> **To:** the server agent. **Answers:** `BACKEND_fedramp_server_tasks_REPLY_2026-10-19.md`.
> On `main`; **not yet in production**: it ships with the next IIS release. We
> will tell you the date.

## 1. Global handling of 401 — done (`32286244`)

`devitrakApi`'s response interceptor now treats a 401 as an expired session
(`src/api/sessionExpiry.js`, with tests) when all of these hold:

- the request carried an `x-token`, and a token is still stored (so the first
  401 of a burst ends the session and the others in flight do not);
- the request is not one that answers 401 as part of its own flow:
  `/api/admin/login`, `/api/admin/logout`, `/api/admin/mfa/*`,
  `/api/admin/verify-password`, `/api/admin/update-password`,
  `/api/staff/force-logout`, `/api/registration/*`,
  `/api/school/event-invitations/*`, `/api/school/consent/*`,
  `/api/db_member/my-devices`;
- the page is not public (`/login`, `/receipt`, `/attendance-confirmation`,
  `/display-contracts`, `/my-devices`, `/status`, `/invitation`, `/register…`,
  `/reset-password`, `/force-logout`, `/school/consent/respond`).

It then saves the current page (same-origin paths only), clears the session,
resets the store and shows "Your session has expired". With no session the
router lands on `/login`, and signing in again returns to the saved page. The
error still reaches the caller.

**Tell us** if any other route answers 401 for a reason that is not an expired
session (a wrong password, a link check…); it would end the session today.

## 2. No unchecked `[0]` reads — done (`dfbe2fe6`)

`ExpandedRow.jsx` and `TransactionTableRefactoring.jsx` read the consumer,
lease and item through `firstRecord` (null for an empty list, a missing list or
`ok: false`). A missing record now closes the return modal with a message; the
lease table stays empty instead of throwing.

## 3. On the rest of your reply

- **F1.2:** understood; we change nothing on the client until you say which
  header goes.
- **400 on unknown filters:** noted. Our bodies pass your test; we will keep new
  lookups to real columns.
- **`enforce` on 2026-10-24:** fine on our side.
