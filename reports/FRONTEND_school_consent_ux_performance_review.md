# Review — Guardian Consent Public Section (2026-07-28)

**Scope:** `src/pages/schoolConsent/` — `GuardianConsentResponsePage.jsx`,
`guardianConsentPublicApi.js`, `GuardianConsentResponsePage.test.jsx`.
This is the unauthenticated, guardian-facing page opened from the consent
email link (`/school/consent/respond?otc=...`).

## Test status

10/10 tests green (`docker compose exec devitrak-client npx vitest run
src/pages/schoolConsent`). No regressions from the contract fix earlier
this session.

## Behavior review

The page correctly handles: missing OTC, loading, 404 (invalid link), 410
(expired link), an already-`agreed`/`refused` consent (read-only result),
and submitting `agreed`/`refused` with a signer name. Error branching for
the submit mutation (404/409/410/422/generic) is complete and matches the
server contract in `FRONTEND_student_members_endpoints.md` §2.4.

## Findings — ranked by severity

### 1. ✅ FIXED (2026-07-28) — No visual confirmation after a successful submit

`submitMutation.onSuccess` only fires a transient antd `notification` — it
never invalidates/refetches `["publicConsent", otc]` and never updates
local state to switch the page into a "thank you, recorded" view. The
Agree/Refuse form **stays on screen, fully interactive**, after a
successful response. A guardian who doesn't notice the toast (easy to miss
on mobile, or if it's already dismissed) has no way to tell their answer
was recorded, and could plausibly click the other button. The server is
idempotent-safe against this (a second submit returns "already responded"),
but the frontend should not rely on that as its confirmation UX.

**Fix applied:** tracks `submittedStatus` from the mutation's own response
(`data.status`, falling back to the submitted decision) and renders the
same read-only `Result` branch immediately — no extra GET request, distinct
"Thank you!" copy for the just-submitted case vs. the pre-existing
"Consent Already Provided/Refused" copy for a reload/repeat visit. 12/12
tests green (2 new cases), lint clean.

### 2. ✅ FIXED (2026-07-28) — Already-responded check doesn't use the server's `mutable` flag

`consent?.status === "agreed" || consent?.status === "refused"` is used to
decide read-only vs. form. The contract doc explicitly ships a `mutable`
boolean for exactly this ("`mutable:false` means the guardian already
responded — show the recorded decision as read-only"). Relying on a
hardcoded status allowlist means any future terminal status (e.g. a
"revoked" state) silently falls through to showing the editable form again
on a consent that shouldn't be changeable.

**Fix applied:** gates on `consent?.mutable === false` when the field is
present (`typeof consent?.mutable === "boolean"`), falling back to the
agreed/refused status allowlist only when `mutable` is absent (legacy
responses). 15/15 tests green (3 new cases: mutable:false with an
unrecognized status, legacy fallback with no mutable field, mutable:true
overriding a stale status), lint clean.

### 3. ✅ FIXED (2026-07-28) — The public API client has no server failover and no retry

`guardianConsentPublicApi.js` calls `import.meta.env.VITE_APP_DEVITRACK_API`
directly via a bare `axios.create()`. Every other API surface in the app
goes through `devitrakApi.jsx`, whose response interceptor retries against
`VITE_APP_DEVITRACK_API_BACKUP` on `Network Error`/timeout
(`switchServer()`). This page — reached from an email link, with no admin
around to help — has zero resilience: if the primary server has a blip,
the guardian sees a bare "Unable to load consent details" with no retry
path except manually reloading. `useQuery`/`useMutation` are also both set
`retry: false`, compounding this.

**Fix applied:** `guardianConsentPublicApi.js` now imports
`getActiveServerSynchronously`/`switchServer` from `serverManager.js`
(no auth logic — pure origin selection) and adds a response interceptor
that fails over to the backup server on a network/timeout error, mirroring
`devitrakApi.jsx`'s pattern. The query and mutation now use a shared
`shouldRetryTransientError` predicate (in new `consentPageUtils.js`) that
retries network/5xx errors up to 2 times but never retries a definitive
404/409/410/422 (this also fixed a latent issue: the mutation previously
had no explicit `retry`, so it silently used React Query's default of 3
blind retries on *any* error, including ones a retry can't fix). Also
added a "Try again" button on the generic error `Result` that calls
`refetch()`. Per the repo's own test-scope convention, `src/api/**`
(including `serverManager.js` and `devitrakApi.jsx`'s interceptor) isn't
unit-tested elsewhere, so the interceptor wiring here follows that same
convention and isn't separately unit-tested; the retry predicate (a pure
function) and the "Try again" button are.

### 4. ✅ FIXED (2026-07-28) — No expiry warning on a pending consent

The retrieve response includes `expires_at`, but the pending-form view
never surfaced it. A guardian who leaves the tab open for days wouldn't
know their link was about to go stale until they came back to a 410.

**Fix applied:** new `formatConsentExpiryMessage(expiresAt)` pure util
renders "This link expires on {date}." as a warning `Alert` under the
policy details, only when `expires_at` is present and parses to a valid
date.

### 5. ✅ FIXED (2026-07-28) — Long consent text has no height cap

`consent.consent_text` rendered as a full unbounded paragraph. A full
legal AUP policy could make the page very long on mobile, pushing the
Agree/Refuse buttons far below the fold.

**Fix applied:** the consent text now renders inside a bordered
`max-height: 240px` / `overflow-y: auto` container, keeping the action
buttons reachable regardless of policy length.

### 6. ✅ FIXED (2026-07-28) — Guardian-name fallback text differed between spots

The header sentence fell back to "Guardian" when `guardian.full_name` was
missing; the already-responded message fell back to "The guardian" for
the same missing value (a third variant existed too, in different code
paths). Not a functional bug, just inconsistent placeholder copy.

**Fix applied:** both sentence-position fallbacks now use the same
"Guardian" text. The field-row "—" placeholder was left as-is
intentionally — it's a data-value placeholder, not a sentence fallback,
and "—" would read as broken grammar if substituted into either sentence.

## Status: all 6 findings fixed (2026-07-28)

28/28 tests green across `src/pages/schoolConsent/` (up from 10 at the
start of this review — 18 new test cases), lint clean, graphify updated.
