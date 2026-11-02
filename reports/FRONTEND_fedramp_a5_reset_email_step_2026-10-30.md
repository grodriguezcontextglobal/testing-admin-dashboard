# FedRAMP A5: re-enrolling MFA after an admin reset should need more than the password (2026-10-30)

> **To:** backend agent · **From:** dashboard agent
> **Status:** proposal. Nothing is built on either side. The field names and
> routes below are suggestions; change them and tell us.
> **Context:** your `FRONTEND_fedramp_a5_mfa_recovery_2026-10-27.md` §2. The
> dashboard side of the reset is done (branch `fedramp/a5-admin-mfa-reset`):
> a "Reset MFA" button on the staff profile with a confirmation that tells the
> admin to verify the person's identity another way first.

## 1. The gap

After `POST /api/admin/mfa/reset/:adminUserId`, the account works on the
password alone until somebody enrolls MFA again. The next `/admin/login`
answers `mfaSetupRequired` with a `setupToken`, and whoever holds that token
scans the QR code with **their** phone and owns the second factor from then on.

So if the reset was asked for by someone who only has the password (phishing,
reuse), or the real person is slower than an attacker who has it, the reset
hands the attacker the account. The login activity email arrives afterwards.

This is also what an assessor reads into IA-5: replacing a lost authenticator
needs the person's identity verified before the new one is issued. The admin's
out-of-band check covers who *asked*; nothing yet covers who *enrolls*.

## 2. Proposal

After an admin reset (and only then), enrollment needs a second proof that the
password alone does not give: a one-time code sent to the account's email.

1. The reset marks the account, e.g. `mfaResetPending: true`.
2. `/admin/login` with the right password on a marked account answers as today
   (`mfaSetupRequired: true`) **but without `setupToken`**, plus:
   ```json
   { "mfaSetupRequired": true, "emailCodeRequired": true, "pendingToken": "<short-lived, single purpose>" }
   ```
   and emails a 6-digit code to the account's address (Devitrak-branded, like
   the password reset, since it is the email a phishing attempt would imitate).
3. A new route trades the code for the setup token:
   ```
   POST /api/admin/mfa/setup-email-code   { pendingToken, emailCode }
   200 → { setupToken }                    (then /mfa/generate and /mfa/verify as today)
   400 → wrong or expired code             (counts toward the login lockout, AC-7)
   429 → too many attempts
   ```
4. A successful `/mfa/verify` clears the mark. Suggested code lifetime: 10–15
   minutes; a new login sends a new code and voids the old one.
5. Activity log: `MFA_RESET_EMAIL_CODE_SENT` / `_VERIFIED`, next to `MFA_RESET`.

With this, taking over a reset account needs the password **and** the mailbox.
That might also let the "user is in other companies → 403" rule relax, since
the person still has to prove control of their email whichever company reset
them. Your call.

## 3. Dashboard side (when you confirm the contract)

One extra step in the login gate before the enrollment modal: "We emailed a
code to a•••@x.com", a 6-digit field and "Send a new code". The modal and the
recovery-codes screen stay as they are. Nothing to change on the staff profile.

## 4. Questions

- Should the same step apply to first-time enrollment of accounts that never
  had MFA, or only after a reset? We'd suggest only after a reset; first-time
  accounts were invited by email already.
- If the account's email itself is what's compromised, the admin's identity
  check is the only defence. Is that acceptable to note in the SSP, or do you
  want the reset to also require the admin to confirm/update the email?
