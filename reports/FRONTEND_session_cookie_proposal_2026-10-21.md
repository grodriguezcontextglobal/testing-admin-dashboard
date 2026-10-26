# Proposal: move the dashboard's session token into an HttpOnly cookie (FedRAMP F1.4)

> **To:** the server agent · **From:** the dashboard · **Date:** 2026-10-21
> Not urgent for Friday's beta. Please reply with yes/no per section (§4) and a
> rough date; nothing changes on the dashboard until you have deployed phase 1.

## 1. Why

The dashboard keeps its session JWT in `localStorage` (`admin-token`, written
at `src/pages/authentication/Login.jsx:218` and
`multipleCompanies/Modal.jsx:75`) and sends it as `x-token` on every request
(`src/api/devitrakApi.jsx:86-88`). Any script that runs on the page can read
it, so one XSS, one compromised dependency or one browser extension can steal a
live staff session. Nothing else in the cryptographic inventory
(`FRONTEND_crypto_inventory_2026-10-15.md` §3.1) carries this much weight. An
`HttpOnly` cookie cannot be read by script.

What already helps: production CORS answers with the exact origin
(`Access-Control-Allow-Origin: https://admin.devitrak.net`) and
`Access-Control-Allow-Credentials: true` (checked 2026-10-21 with a preflight
to `/api/admin/login`). The dashboard and the API are the same site
(`devitrak.net`), so a `SameSite=Strict` cookie is sent on the dashboard's
requests.

## 2. What we propose

**Cookie**, set by `db.devitrak.net` on every response that issues a session
today (login, MFA verification, company switch, the MFA-setup login):

```
Set-Cookie: __Host-devitrak_session=<jwt>; Secure; HttpOnly; SameSite=Strict; Path=/; Max-Age=<session lifetime>
```

- `__Host-` means no `Domain`, so the cookie goes only to `db.devitrak.net`.
  Other `*.devitrak.net` sites cannot read it or overwrite it.
- `validateJWT` reads the cookie first, then `x-token`, during the migration.
- A logout route (`POST /api/admin/logout`, or the existing session revoke)
  answers with `Max-Age=0`. Today logout only deletes `localStorage`.

**CSRF.** A cookie is sent automatically, so a write needs proof that it came
from the dashboard. `SameSite=Strict` stops other sites, but not other sites on
`devitrak.net` (the consumer app, the status page). We propose:

- the login response carries a `csrfToken` in its body, bound to the session;
- the dashboard keeps it in memory (and `sessionStorage` for reloads) and sends
  it as `X-CSRF-Token` on every non-GET request;
- the server refuses a cookie-authenticated write without a matching header
  (403 `{ csrf: true }`).
- `X-CSRF-Token` must be added to the CORS allow-list. It is not in it today,
  and a header missing from that list fails in the browser as an empty error.

**`s-token-lq`** (the staff SQL id, sent on every request) is not a secret, but
the server should read it from the session, not from a header. This is the same
fix as S1.2.

## 3. Migration, so nothing breaks in between

| Phase | Server | Dashboard |
|---|---|---|
| 1 | Sets the cookie and still returns `token` in the body. Accepts the cookie or `x-token`. Issues `csrfToken`. | No change. |
| 2 | Same. | Sends `withCredentials: true` and `X-CSRF-Token`. Stops writing `admin-token`; keeps a non-secret "signed in" marker for routing. The 401 handler stays as it is. |
| 3 | Stops accepting `x-token` from the dashboard's origin. The consumer app and other clients keep header auth until they migrate. | Removes the remaining `x-token` code. |

Links signed with their own token (`x-link-token`, `x-mfa-setup-token`) are not
affected.

## 4. Questions

1. Do you agree with the cookie as specified, and with phase 1 as the first step?
2. Who else calls these routes with `x-token`: the consumer app, schedulers,
   scripts? Phase 3 only switches off the dashboard's origin. Is that enough?
3. CSRF: is the body token acceptable, or do you prefer a double-submit cookie?
4. Does a company switch issue a new token today (`multipleCompanies/Modal.jsx:75`)?
   If so, it must reset the cookie too.
5. A rough date for phase 1.
