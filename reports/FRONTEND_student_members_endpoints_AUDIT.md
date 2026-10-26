# Audit — FRONTEND_student_members_endpoints.md vs. current dashboard (2026-07-28)

> Reviewed every endpoint listed in `FRONTEND_student_members_endpoints.md`
> against what's currently implemented in this repo. Method: Graphify +
> targeted grep per endpoint path, then read the actual call sites.

## Already correctly integrated — no action needed

| Endpoint | Where | Notes |
|---|---|---|
| `POST /school/dashboard`, `/roster` | school dashboard pages | unchanged since 07-22 doc, already covered |
| `POST /school/guardians` | `guardianConsentApi.fetchStudentConsent`-adjacent flows | — |
| `POST /school/guardians/add` | `guardianConsentApi.saveGuardian`, called from `Single.jsx` | **already sends `guardian_id` to link an existing guardian** (`buildExistingGuardianLinkPayload`) or creates a new one (`buildNewGuardianLinkPayload`) — matches the updated §2.3 contract exactly |
| `POST /school/guardians/search` | `guardianConsentApi.searchGuardians`, called from `Single.jsx` on blur + on submit | search-by-email → auto-link flow already matches §2.3 |
| `POST /school/consent/request` | `guardianConsentApi.sendConsentRequest`, called from `StudentConsentPanel.jsx` | correct for the **initial** send |
| `POST /school/consent/public/retrieve` / `/respond` | `schoolConsent/guardianConsentPublicApi.js` + `GuardianConsentResponsePage.jsx` | fixed this session — contract confirmed nested (`consent`/`company`/`guardian`/`student`), test aligned, 19/19 green |
| `POST /school/consent`, `/consent/status` | `guardianConsentApi.fetchStudentConsent`, compliance views | — |
| `POST /school/settings`, `/settings/consent-enforcement` | `Profile/school_compliance/` | already built, routed, tested |
| `POST /db_member/overdue-leases` | `OverdueDevicesTable.jsx`, `MembersStatsRow.jsx` | already wired |
| `POST /db_member/bulk-return` | `OverdueDevicesTable.jsx` | already wired (grade filter, condition_note) |
| `POST /db_member/my-devices` | `authentication/MyDevicesPortal.jsx`, routed public in `NoAuthRoutes.jsx` | functionally correct — see minor note below |

## Real gap — contract drift, fix recommended

**`StudentConsentPanel.jsx`'s "Resend" button calls the wrong endpoint.**

Line ~109-116: when status is `expired`/`refused`/`stale` the button label
switches to "Resend", but `handleSendConsentRequest` still calls
`sendConsentRequest` → `POST /school/consent/request` — the **initial**-send
endpoint. The server now has a dedicated `POST /school/consent/resend` with
different semantics (404 if no request exists yet, 409 if already
agreed/refused, 422 if no guardian email) that the frontend has never called.
Calling `/request` again for an already-existing request may not match what
the backend expects on that path.

**Fix:** add `resendConsentRequest(payload)` to `guardianConsentApi.js`
(`POST /school/consent/resend`), and branch in `StudentConsentPanel.jsx`:
`consentStatus` in `expired/refused/stale` → call resend; anything else →
call the existing request. Needs a new/updated test in
`StudentConsentPanel.test.jsx` for the resend path (404/409/422 handling
per §4 of the doc).

## Missing entirely — net-new feature (§2.6, FERPA/COPPA data-subject rights)

No UI or API wrapper exists anywhere for:

- `POST /school/student/export` — data-access request (dump everything held on a student)
- `POST /school/student/erase` — anonymize or hard-delete (⚠️ doc explicitly calls out that `mode:"delete"` is destructive and needs a confirmation step)
- `POST /school/student/access-log` — access/disclosure history

This is a full feature, not a small integration — likely its own settings/
admin panel (probably under Profile or the member detail dashboard, gated
`member:update` + Education industry, same pattern as compliance settings).
Needs product/UX input on where this lives before implementation (not just
a wiring task like the others).

## Minor / non-blocking

- `MyDevicesPortal.jsx` calls the public `/db_member/my-devices` route through
  the **authenticated** `devitrakApi` client instead of a plain axios instance
  like `guardianConsentPublicApi.js` uses for the other public route. Not a
  functional bug (the interceptor only attaches `x-token` if one exists in
  `localStorage`, so it degrades gracefully with no session) — just
  inconsistent with the pattern established for public/unauthenticated calls.
  Low priority cleanup, not urgent.

---

## Recommended order

1. **Fix the Resend contract drift** (`StudentConsentPanel.jsx` + new
   `resendConsentRequest`) — small, TDD, matches an already-live backend
   endpoint that's simply uncalled today.
2. **Scope the FERPA/COPPA data-subject panel** (§2.6) with the user — needs
   a UX decision (where it lives, who can trigger `erase`, what the
   confirmation flow looks like for `mode:"delete"`) before any code.
3. Optional cleanup: switch `MyDevicesPortal.jsx` to a plain axios client for
   consistency — bundle with unrelated small cleanup work, not urgent on its
   own.
