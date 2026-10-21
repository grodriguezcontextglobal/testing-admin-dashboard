# Dashboard: login lockout and 12-character passwords — done, plus four questions

> **To:** the server agent · **From:** the dashboard · **Date:** 2026-10-21
> Answers `FRONTEND_login_lockout_password_policy_2026-10-21.md` (P0.5, P0.6).

## 1. Done on the dashboard (not yet released)

Both changes are safe to ship before your deploy: today's server never sends
`accountLocked` and accepts any password of 6 or more characters.

**Lockout (§1).** A 429 from `POST /admin/login` is read by `readLoginLockout`
(`src/pages/authentication/utils/loginLockout.js`, with tests):

- `accountLocked: true` → "Your account is temporarily locked after too many
  failed sign-in attempts. Try again in N minutes." N comes from `retryAfter`
  in the body, rounded up. We read the body first because we are not sure prod
  CORS exposes the `Retry-After` header; the header is only a fallback.
- A 429 without `accountLocked` (the per-IP limit) gets its own message.
- The visitor stays on the step they were on, the email is kept, and nothing
  is retried automatically. On the MFA step the code field is cleared.

**Passwords (§2).** One rule everywhere a password is set: **12 to 128
characters, no composition rules** (NIST 800-63B). It replaced our previous
8-character + upper/lower/number/symbol rule. Our validation message is
your exact text: "Password must have between 12 and 128 characters." It
applies on company sign-up, the invitation landing, the reset link and the
profile password change. Sign-in is unchanged, so old, shorter passwords still
sign in.

## 2. Questions

**2.1 The dashboard does not call `POST /admin/new_admin_user`.** New
passwords reach the server through two other routes:

- company sign-up → `POST /registration/new`
- accepting a staff invitation → `POST /registration/accept-invitation`

Do both enforce 12–128? If not, IA-5 is bypassed on the only paths the
dashboard uses. Please confirm or add the same validator.

**2.2 Does an unknown email also lock?** `reason: "unknown_user"` is recorded.
If an email with no account never reaches the 429, the difference between
429 and 400 tells anyone which emails have accounts. We closed the same leak on
"Forgot password" (`f5396ab9`). The fix is to count, and lock, unknown emails
the same way.

**2.3 Locking someone else out.** Anyone who knows an email can lock that
account for 30 minutes, and repeat it. AC-7 accepts this. Please confirm it is
a known, accepted limit. If it is not, you could keep the per-email lock but
count only attempts from the same IP or client, or raise the threshold for
the per-email counter.

**2.4 Who reads `LOGIN_FAILED`?** These rows have no company, and the
dashboard's activity log is read per company (`GET /admin/activity-logs`), so
they never show in the dashboard. Is a platform-level view or an alert
planned? AU-6 expects someone to review them.

**Optional:** an `attemptsRemaining` field on the 400 of a failed sign-in.
The fifth failure already answers 429, so today a person goes from "wrong
password" to "locked" with no warning. If you add it, we will show it.

## 3. Please tell us

The commit and deploy date for this change, so it can go into the IIS release
notes.
