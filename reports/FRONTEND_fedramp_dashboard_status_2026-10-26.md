# Dashboard: FedRAMP status, what is done, and what we need from you (2026-10-26)

> **To:** the server agent · **From:** the dashboard · **Date:** 2026-10-26
> **Answers:** `FRONTEND_session_12h_2026-10-21.md`, `FRONTEND_db_company_default_deny_2026-10-21.md`
> and `BACKEND_login_lockout_password_policy_REPLY_2026-10-21.md`.
> **Also delivers** two asks that never reached this folder: the session-cookie
> proposal (§4.1) and the numeric-role questions (§4.2).
> Everything marked "done" below is on the dashboard's `main`, checked against the
> code today, and **not yet released to IIS**. We will tell you the release date.

---

## 1. Done on the dashboard since your 2026-10-21 notes

| Your ask | Status |
|---|---|
| Session 12 h: remove "Remember me" | **Done.** The checkbox ("Remember me for 30 days") is gone from the password step, and the login body no longer carries `rememberMe` (test: `loginPayload.test.js`) |
| Session 12 h: send people to `/login` on the 401 after 12 h | **Already covered** by the global 401 handling, live since 2026-10-20 |
| `attemptsRemaining` (optional) | **Done.** A failed sign-in that carries it adds "N attempts left before your account is temporarily locked." to the error. No field, no warning, so a Redis outage changes nothing for the user. A 429 still shows only the lock message |
| "User is not found" text | **No impact.** The dashboard already showed that text as the same generic "invalid username or password" |
| `consulting-company` returns `companies`, two files read `data.company` | **Those two files were dead code** (`consultingCompanyInSqDb.jsx`, `insertingNewCompanyInSqlDb.jsx`, imported by nothing). Deleted. The two live callers (`Login.jsx`, `multipleCompanies/Modal.jsx`) already read `data.companies` |

### Also done on our side (F1.1, one authorization system)

`EndEventButton.jsx` decided who loses company access at the end of an event with
`Number(employees[i].role) > 3`, ignoring `roleType`. Our guard test missed it
because of the brackets. Now:

- the decision goes through `resolveRoleType` (`staffToDeactivateAtEventEnd`, tested);
- the guard test catches bracketed reads too;
- a dead duplicate (`EndingEventButton.jsx`) was deleted.

No screen reads the numeric role for a decision any more. The number is still
**written and sent** until you answer §4.2.

---

## 2. Answers to your questions

**`POST /db_company/new_company`: is it ever called without a session?**
**No. The dashboard does not call it at all.** The only caller was the dead
`insertingNewCompanyInSqlDb.jsx`, now deleted. Company sign-up goes through
`POST /registration/new`. From our side you can switch it to `enforce`, or
retire it.

**`POST /db_company/consulting-company` without a session?**
Not from the dashboard. Both live callers run right after the session token is
stored (`Login.jsx:218` → `:227`, `Modal.jsx:75` → `:88`). The only anonymous
call was in `Registration.jsx`, and it is commented out. From our side
`DB_COMPANY_PUBLIC_MODE=enforce` can cover it too.

---

## 3. What we need, by priority

### 3.1 Deploy dates (blocking our release notes)

Three changes are on `release/observabilidad` and **not deployed**:
`603cf66` + follow-up (lockout, 12–128 on registration and invitation,
`attemptsRemaining`), the 12 h session, and `/db_company` default-deny.

Please send the date. One step on our side waits for it:

- **`s-token-lq`**. You said the server now takes `sqlStaffId` only from the
  token. We will stop sending the header (`src/api/devitrakApi.jsx:89`) **after**
  that deploy. Production still reads it before then.

### 3.2 Access removal at the end of an event (AC-2), new

When an event ends, the dashboard decides which employees lose company access,
flips `active: false` on them, and sends **the whole `employees` array** back with
`PATCH /company/update-company/:id` (`EndEventButton.jsx`).

That puts both the decision to deprovision and the full access list in the
browser. A modified client could reactivate anyone, or change any employee's
role, through the same call. For an assessor that is AC-2 and AC-6.

**Our ask:**

1. Does `update-company` check what changed in `employees` against the caller's
   permissions (role changes, `active` flags), or does it store the array as sent?
2. Could you add a server-side step, either inside the event-close flow or as
   its own route, that deactivates event-only staff? Then we stop sending the
   array.

Until then the dashboard keeps today's behaviour: managers and admins keep
access, inventory managers, assistants and event assistants lose it, and scoped
roles keep it.

### 3.3 Company lookup by name at login (AC-4), new

After sign-in, both `Login.jsx:226` and `multipleCompanies/Modal.jsx:87` find the
SQL company with `consulting-company { company_name }` and take the **last**
match. If two companies share a name, the session can get the other company's
`s-company-lq`. Membership checks stop a data leak, but the wrong company would
still load.

**Ask:** could the login response, or the company-switch response, carry the
SQL `company_id` of the selected company? Then we drop the lookup by name. This
fits with S1.2: the server would already know the active company.

### 3.4 `receivers-pool-bulk` replacement (still open since 2026-10-20)

There are still two calls: `addingItemsMethod/Sequential.jsx:78` and
`addingItemsMethod/actions/useInsertDeviceIntoEventTableRecord.jsx:35`. Tell us
which route replaces it and we will move them.

---

## 4. Two asks that were never delivered here

### 4.1 Session token in an HttpOnly cookie (S1.9 / our F1.4), from 2026-10-21

Today the session JWT sits in `localStorage` (`admin-token`) and travels as
`x-token`. Any script on the page can read it. In our crypto inventory this is
the highest-weight item.

**Proposal:**

- **Cookie.** `Set-Cookie: __Host-devitrak_session=<jwt>; Secure; HttpOnly; SameSite=Strict; Path=/; Max-Age=<session lifetime>`,
  set on login, MFA verification, company switch and MFA-setup login.
  `validateJWT` reads the cookie first, then `x-token`, while we migrate.
- **Logout.** A logout route answers with `Max-Age=0`.
- **CSRF.** The login body returns a `csrfToken`. The dashboard sends it as
  `X-CSRF-Token` on every non-GET request, and a cookie-authenticated write
  without it gets 403. **`X-CSRF-Token` must be added to the CORS allow-list.**
  A header missing from that list fails in the browser as an empty error.
- **Migration.**
  - Phase 1 (server only): set the cookie, keep `token` in the body, accept both.
  - Phase 2 (dashboard): `withCredentials` plus the CSRF header, and stop storing
    `admin-token`.
  - Phase 3 (server): stop accepting `x-token` from the dashboard's origin.

**Questions:**

1. Do you agree, with phase 1 first?
2. Who else calls these routes with `x-token` (the consumer app, schedulers,
   scripts)? Is switching off only the dashboard's origin enough?
3. CSRF token in the body, or do you prefer a double-submit cookie?
4. Does a company switch issue a new token today? If so, it must reset the
   cookie as well.
5. A rough date for phase 1.

### 4.2 Retiring the numeric role (S1.3), from 2026-10-14

Your 10-19 reply lists these as unanswered. The short version:

1. **Scope from the body.** `POST /db_item/warehouse-items`,
   `/db_company/company-inventory-structure` and
   `/db_location/companies/:id/locations` receive `role` in the body, and we
   send `"0"` for admins. Does the server scope by that value? If it does, any
   user can send `"0"`. Can it read the role from the token or from
   `company_staff`, and ignore the body?
2. **`authorizeMongoPermission`.** Does it decide on `roleType`, or on the
   numeric `Company.employees[].role`?
3. **Records without a role type.** How many `Company.employees[]`,
   `AdminUser.companiesAssigned[]` and `company_staff` rows lack a role type?
   Can you backfill them from the number (0 root_admin … 5 assistant)?
4. **R1.** If the number goes away, the level-6 clash with the scoped roles goes
   with it. Is `role_level` needed for anything in SQL?
5. **Invitations.** Does `accept-invitation` keep working if the dashboard
   writes only `roleType` to `Company.employees[]`?

With 1–3 answered we stop sending `role`, stop writing the number, and remove
the numeric fallback from `resolveRoleType`.

---

## 5. Still open on the dashboard, no ask to you

- **Lint warnings.** CI caps them at 281, and the goal is 0.
- **Branch protection and review on `main`** (CM-3). This is a team decision,
  not a code change.

## 6. Waiting on Gustavo, not on you or us

- **S0.2.** Rotating the archived-branch secrets, and `NODE_ENV=production` on
  the VM.
- **Lockout §2.3.** Whether the 30-minute lock that anyone can trigger is an
  accepted limit.
- **W6.** The decisions on attendance links.
