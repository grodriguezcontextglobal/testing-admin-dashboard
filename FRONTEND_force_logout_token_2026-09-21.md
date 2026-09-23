# The revoke page no longer asks for a password. The link needs its own secret

**To:** backend
**From:** frontend
**Date:** 2026-09-21
**Endpoints:** `POST /api/staff/force-logout`, `POST /api/nodemailer/forcing-revoking-active-session`
**Updated:** 2026-09-23 — the client changed and §3 is resolved; §1 and §2 stand

---

## Update, 2026-09-23 — read this first

The password field is **gone from the page**, not gated behind a token. A valid
email in the link is the whole trigger: `ForceLogout.jsx` posts the revoke as it
opens and never sends a password, not even one a legacy `?cred=` link hands it.

**§3 is resolved.** `forceEndSession` accepts `{ email }` on its own — confirmed
by the backend the same day — so the page works against the controller as
deployed. Nothing below asks for a password to keep working, because nothing we
send carries one.

**§1 and §2 still stand.** The link is still `?email=<address>` with no secret
in it, and the token is what ties a revoke to the inbox that received the mail
rather than to an address anyone can type. The page already posts a `token` when
the link carries one, so shipping it needs no release from us.

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

## Why we did not delete the field in the first pass

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

3. ~~**Accept `{ email }` on its own.**~~ **Done, 2026-09-23.** The controller
   takes `{ email }` with no password. The client sends `{ email }` or
   `{ email, token }` and never anything else.

## What the client does now

Shipped 2026-09-23, and it does not wait for you:

- **No password field, no button to press.** The page reads `email` / `x_email`,
  checks it looks like an address, and posts the revoke as it opens. A link
  whose email is missing or mangled goes back to `/login` with a message
  instead of posting anything.
- **`token` / `x_token` is posted when the link carries one**, so the body is
  `{ email, token }`; otherwise `{ email }`. Never a password.
- **A legacy `?cred=` password is read only to be deleted.** It is stripped from
  the URL with `replace` — no history entry, no back button, no `Referer` — and
  it is not sent. Same treatment the token gets once it has been read.
- **A failure shows your `msg` verbatim** with a Try again button, rather than
  spinning. That is what a revoke link hits today, on every click.
- The revoke fires **once**, not once per render: scrubbing the URL feeds a new
  `searchParams` back into the effect that fired it.

`src/pages/authentication/ForceLogout.test.jsx` pins all of it — 16 tests,
including that no password leaves the page and that the token survives being
scrubbed out of the address bar.

## One more thing worth a look, separately

`POST /api/nodemailer/forcing-revoking-active-session` takes `{ email }` and is
unauthenticated, so anyone can make us send that email to any address they can
name. It does not let them revoke anything — the link goes to the account's own
inbox — but it is an open relay for one of our templates, and it will get found.
Rate limiting by address, or requiring that a login attempt for that account
actually hit the 409 first, would both close it. Not a blocker for the above;
just next to it in the code.
