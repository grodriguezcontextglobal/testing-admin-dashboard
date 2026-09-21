# Revoke-session link needs its own secret before the password can go

**To:** backend
**From:** frontend
**Date:** 2026-09-21
**Endpoints:** `POST /api/staff/force-logout`, `POST /api/nodemailer/forcing-revoking-active-session`

---

## What was asked for

Beta testing 2026-09-18, part 1 `5:15` — Fredrik, on the revoke page asking for
the password again:

> "So there you have a level of verification already. The only thing you're
> asking is to revoke a session. They get an e-mail and then they can click
> revoke it."
>
> `5:32` — "I'm logging in here with my credentials and I wouldn't get this
> e-mail here… had I not provided the right MFA authentication code."

He is right about the part he is describing. `loginUser` runs the MFA check
**before** it raises the 409 session conflict, so anyone who sees "an active
session already exists" has already passed both factors. A third password prompt
proves nothing new.

## Why we did not just delete the field

The password is doing a second job nobody designed for it. The link in the email
is:

```
https://admin.devitrak.net/force-logout?email=<address>&timestamp=<ms>
```

`nodemailer/returningDeviceMessage.js` → `forceLogoutNotificationHtmlTemplate`.
There is no secret in it. The page is public, and `POST /staff/force-logout` has
no `validateJWT`. So the password is the only thing standing between a URL
anyone can type and ending that account's session.

Remove it with the link unchanged and the flow becomes: know an email address,
end that person's session. Repeatedly. They cannot be locked out permanently —
they just log in again — but they can be kept from staying logged in, and
nothing in the request identifies who did it.

So what has to change is not "stop checking the password". It is **move the
proof from something the visitor knows to something only the recipient of the
email has**.

## What we are asking for

1. **Put a single-use token in the link.**

   ```
   /force-logout?email=<address>&token=<opaque>
   ```

   The link is built in `nodemailer/returningDeviceMessage.js` →
   `forceLogoutNotificationHtmlTemplate(userEmail)`, reached from
   `nodeMailer/notifications.js:910`
   (`forcingRevokingActiveSession = createQueuedEmailController(buildForcingRevokingActiveSessionMessage)`).
   The template's intro line also promises *"You will be asked to confirm your
   password on our site"*, which stops being true at the same moment.

   Our suggestion, entirely yours to decide: random, stored in Redis under
   something like `force_logout_token:<token>` → the account id, TTL in the
   order of 15 minutes, deleted on use. A fresh one per email sent, so a second
   request invalidates the first.

2. **Accept it at `POST /api/staff/force-logout`:**

   ```jsonc
   { "email": "ana@bridgespcs.org", "token": "<opaque>" }
   ```

   Same success shape as today. For a token that is expired, already spent or
   does not match the email, an error the page can show as-is — we render
   `msg` verbatim.

3. **Keep `{ email, password }` working** until the links already sitting in
   inboxes have expired. `forceEndSession` currently 400s on a missing password;
   after this it should accept either one and reject a request carrying neither.

## What the client already does

Shipped 2026-09-21, and inert until you send a token:

- `ForceLogout.jsx` reads `token` / `x_token`. **When the link carries one, no
  password is asked for** — the page is a sentence and a button, which is the
  single click Fredrik asked for. When it does not, the password field is
  exactly as it is today.
- The token is stripped out of the URL the moment it is read, with `replace`, so
  it does not survive in history, behind the back button, or in a `Referer` —
  the same treatment the legacy `cred` parameter gets.
- The submitted body is `{ email, token }` or `{ email, password }`, never both.

So the day `forceLogoutNotificationHtmlTemplate` starts appending `&token=`, the
password step disappears on its own. No further client release.

`src/pages/authentication/ForceLogout.test.jsx` pins both paths, including that
a tokenless link still asks for the password.

## One more thing worth a look, separately

`POST /api/nodemailer/forcing-revoking-active-session` takes `{ email }` and is
unauthenticated, so anyone can make us send that email to any address they can
name. It does not let them revoke anything — the link goes to the account's own
inbox — but it is an open relay for one of our templates, and it will get found.
Rate limiting by address, or requiring that a login attempt for that account
actually hit the 409 first, would both close it. Not a blocker for the above;
just next to it in the code.
