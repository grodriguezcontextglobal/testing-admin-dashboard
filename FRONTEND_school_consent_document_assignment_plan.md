# Plan — assign an uploaded Document as the School Consent document

> **For:** frontend implementation + backend/server agent (new public
> endpoint + schema field needed).
> **From:** frontend, following up on `FRONTEND_school_consent_ux_performance_review.md`.
> **Why:** today the guardian consent page (`GuardianConsentResponsePage.jsx`)
> renders `consent.consent_text` — a plain string produced entirely
> server-side, with no frontend way to author/upload/preview it. The existing
> `Documents` module (`src/pages/Profile/Documents/`) already has PDF
> upload, storage, and viewing — this plan wires that module into the school
> consent flow instead of building a second document system.
> **Status: Steps A–E all implemented and verified against a real running
> backend (2026-08-04).** Timeline of what was found along the way:
> 1. Earlier the same day, `POST /school/settings/consent-enforcement`
>    accepted `consent_document_id` but didn't echo/persist it in a
>    same-session round-trip — backend has since started persisting it
>    (confirmed below), so treat that as resolved rather than a live gap.
> 2. `GET /document/*` is keyed by the **Mongo** company id
>    (`user.companyData.id`), while `/school/settings*` and the consent-
>    request endpoints use the **SQL** `company_id` — two different ids were
>    being conflated in `StudentConsentPanel.jsx`/`SchoolComplianceSettings.jsx`,
>    fixed to use the right one per call.
> 3. **Step D confirmed live:** `POST /school/consent/public/retrieve` now
>    returns `company.consent_document_id` (a raw Mongo document id — not a
>    `document: {view_url}` object as originally proposed in §2 Step D
>    option 1). Frontend resolves it into a viewable URL itself (Step E,
>    below), so the shape difference didn't block anything.
> 4. **Step E implemented:** `GuardianConsentResponsePage.jsx` now fetches
>    and renders the actual assigned PDF via
>    `fetchPublicConsentDocument()`, falling back to legacy `consent_text`
>    when no document is assigned. `StudentConsentPanel`'s document-required
>    gate (Step C) is intentionally informational-only, not blocking —
>    see the note in §6 below on why.
> 5. **🔴 New security finding, same shape as the L8 finding in
>    `SCHOOL_pilot_365_test_scenarios.md`:** `GET /document/:id` and
>    `GET /document/download/:id/:userId` responded with **no auth headers
>    at all and an arbitrary/dummy `:userId`** (`000000000000000000000000`
>    worked). These were assumed authenticated (see the original §4 "Never
>    reuse" note below, written before this was tested) — that assumption
>    was **wrong**. This is what makes Step E work today, but it also means
>    **any document in any company is fetchable by anyone who can guess/see
>    a 24-hex-char Mongo id**, no session required. Needs the same backend
>    escalation as L8 — see `FRONTEND_backend_security_report_company_scoping.md`.

---

## 1. Current state (confirmed by reading the code)

**Document module** (`src/pages/Profile/Documents/`, `src/components/documents/DocumentUpload.jsx`):
- Upload is `POST /document/upload` (multipart, async job queue: 202 →
  `{ jobId }` → poll `GET /jobs/owned/:jobId` → `result.document`).
- Fields captured today: `title`, `trigger_action` (`onboarding` / `event`
  / `consumer` / company-industry — **no school/consent option**),
  `language`, `description`, `expiration_date`, `tags`, plus
  hardcoded `company_id`, `created_by`, `at_`, `requires_signature: false`,
  `document_type: "document"`.
- Viewing a document (`ViewDocument.jsx`) requires auth: `GET
  /document/:id` (metadata) + `GET /document/download/:id/:userId` →
  `{ ok, downloadUrl }`, a **signed URL scoped to an authenticated company
  user**, refreshed client-side every 4.5 minutes because it expires.
  **This endpoint cannot be reused for the guardian page** — it takes a
  `userId` and is only meaningful for an authenticated dashboard user.

**School consent settings** (`SchoolComplianceSettings.jsx`):
- Only toggles (`enforce_member_consent`, `enforce_under_13`) plus a free-text
  `required_consent_policy_version` string. No document reference at all.

**Sending a request** (`StudentConsentPanel.jsx` → `sendConsentRequest` /
`resendConsentRequest`):
- Payload is `{ company_id, member_id, guardian_id, policy_type: "AUP",
  policy_version }`. No `document_id`.

**Guardian-facing page** (`GuardianConsentResponsePage.jsx`,
`guardianConsentPublicApi.js`):
- Already fully public/unauthenticated: uses a bare `publicApi` axios
  instance (only origin failover via `serverManager.js`, **no auth
  headers**) to call `retrievePublicConsent(otc)` /
  `respondPublicConsent(otc, decision, name)`.
- Renders `consent.consent_text` as a plain scrolling paragraph
  (`max-height: 240px`).

**The gap:** there is no path from "upload a PDF" to "guardian sees this
exact file on the public page" — and the one existing file-serving endpoint
(`/document/download/:id/:userId`) is explicitly authenticated, so it must
not be reused as-is for a logged-out guardian.

---

## 2. Proposed end-to-end flow

### Step A — Upload & tag the document as "School Consent"

In `DocumentUpload.jsx`, add a new `trigger_action` option:

```jsx
<Select.Option value="school_consent">School Consent</Select.Option>
```

When `trigger_action === "school_consent"` is selected, also send a new
boolean flag `public_document: true` in the upload payload (see §5). This
flag is what tells the backend this specific document is allowed to be
served through a public, unauthenticated route — every other document type
stays private by default. Do not make any document publicly servable
implicitly; require this explicit flag so a company can never accidentally
expose a staff-onboarding or consumer-waiver PDF.

`Documents.jsx` / `DocumentCard.jsx` need no structural change — the
existing "Uses for" label already reads `trigger_action`, so a document
tagged `school_consent` shows up in the same list, filterable the same way
other trigger actions are.

### Step B — Assign the document as the active school consent policy

In `SchoolComplianceSettings.jsx`, replace the free-text
`required_consent_policy_version` input with a document picker:

- Fetch documents via the existing `GET /document/?company_id=...`,
  filtered client-side (or via a query param, if backend adds one) to
  `trigger_action === "school_consent"`.
- Render as a `SelectComponent` (internal UX dropdown, per the component
  rule) listing `title` values, storing the selected `document_id`.
- Keep `policyVersion` as a *derived* display value (e.g. document's
  `expiration_date`/upload date or an explicit `policy_version` field
  added to the document form in Step A), not a hand-typed string — this
  closes the gap where today's version number has no verified link to real
  content.
- `buildConsentEnforcementPayload` (`schoolComplianceUtils.js`) gains a
  `consent_document_id` field alongside the existing enforce flags.

### Step C — Send/resend the consent request

`StudentConsentPanel.jsx` reads the assigned `consent_document_id` from
`fetchSchoolSettings()` (already queried in this component) and includes it
in both mutation payloads:

```js
sendConsentMutation.mutate({
  company_id: companyId,
  member_id: memberId,
  guardian_id: null,
  policy_type: policyType,
  policy_version: effectivePolicyVersion || "1",
  document_id: settingsQuery.data?.settings?.consent_document_id ?? null,
});
```

If `consent_document_id` is missing, keep `canSendRequest` disabled and show
an inline hint ("Assign a School Consent document in Compliance Settings
before sending requests") — sending a consent request with no document to
show the guardian should be a hard block, not a silent gap.

### Step D — Public retrieval (guardian side)

`retrievePublicConsent(otc)` response needs a new nested object, e.g.:

```jsonc
{
  "consent": { "...": "unchanged" },
  "company": { "...": "unchanged" },
  "guardian": { "...": "unchanged" },
  "student": { "...": "unchanged" },
  "document": {
    "title": "Acceptable Use Policy 2026",
    "view_url": "https://.../signed-or-scoped-url",
    "content_type": "application/pdf"
  }
}
```

`view_url` **must** come from a **new public-scoped endpoint**, not
`/document/download/:id/:userId`. Two viable backend shapes (pick one,
call it out to backend explicitly):

1. `retrievePublicConsent` itself resolves and embeds a short-lived signed
   URL for the assigned document, scoped to that specific `otc` (expires
   with the consent link, or sooner) — simplest, one round trip.
2. A dedicated `GET /school/consent/public/document?otc=...` that mirrors
   `/document/download/:id/:userId` but authorizes via the OTC instead of a
   user id.

Either way: **no endpoint may accept a raw `document_id` from an
unauthenticated caller** — the only public-safe lookup key is the
guardian's `otc`, exactly like `retrievePublicConsent`/`respondPublicConsent`
already work. This avoids turning the public consent page into a way to
enumerate/download arbitrary company documents.

### Step E — Render the document on the guardian page

In `GuardianConsentResponsePage.jsx`, replace (or augment, if
`consent_text` stays as a legacy fallback) the current text block:

```jsx
{consentData?.document?.view_url && (
  <>
    <Divider />
    <Title level={5}>Consent document</Title>
    <iframe
      src={consentData.document.view_url}
      title={consentData.document.title || "Consent document"}
      style={{ width: "100%", height: 420, border: "1px solid #f0f0f0", borderRadius: 6 }}
    />
    <Paragraph type="secondary" style={{ marginTop: 8 }}>
      <a href={consentData.document.view_url} target="_blank" rel="noreferrer">
        Open in a new tab
      </a>
    </Paragraph>
  </>
)}
```

Fall back to the existing `consent.consent_text` block when no `document`
is present (keeps older/in-flight consent records — created before this
feature ships — working without a data migration).

---

## 3. Data model additions (frontend-visible)

| Field | Where | Purpose |
| --- | --- | --- |
| `trigger_action: "school_consent"` | document record | marks a document as a school-consent candidate |
| `public_document: true` | document record | explicit opt-in flag allowing the public retrieval path |
| `consent_document_id` | school settings | which document is the currently-assigned policy |
| `document: { title, view_url, content_type }` | `retrievePublicConsent` response | what the guardian page renders |

---

## 4. Security requirements (explicit — guardian is unauthenticated)

- The guardian page has **no session, no x-token, no company header** —
  confirmed by `guardianConsentPublicApi.js` using a bare `publicApi`
  instance. Any endpoint it calls is reachable by anyone with the link.
- Never reuse `/document/:id` or `/document/download/:id/:userId` for this
  flow — both are company-authenticated today and were not designed to be
  reachable without a session.
- The public document URL must be resolved **only** from a valid,
  unexpired `otc`, never from a `document_id` passed by the client — same
  authorization pattern as the existing `retrievePublicConsent`/
  `respondPublicConsent` calls.
- Prefer a short-lived signed URL (mirrors the existing 4.5-minute-refresh
  pattern in `ViewDocument.jsx`) over a permanent public link, so a leaked
  consent email doesn't grant indefinite access to the file.
- `public_document` must default to `false`/absent for every existing
  document type — this feature must not widen access to
  onboarding/consumer/event documents.

---

## 5. Frontend implementation steps

1. `DocumentUpload.jsx` — add `school_consent` trigger_action option +
   `public_document` flag sent when that option is selected.
2. `SchoolComplianceSettings.jsx` + `schoolComplianceUtils.js` — document
   picker replacing the free-text policy version input;
   `consent_document_id` added to the save payload and dirty-check.
3. `StudentConsentPanel.jsx` + `guardianConsentApi.js` — include
   `document_id` in send/resend payloads; block sending when no document is
   assigned.
4. `guardianConsentPublicApi.js` — no client change expected beyond reading
   the new `document` key from the existing response (unless backend
   chooses the dedicated-endpoint shape from §2 Step D option 2, in which
   case add a `fetchPublicConsentDocument(otc)` call here, on the same
   `publicApi` instance).
5. `GuardianConsentResponsePage.jsx` — render the document block (§2 Step
   E), keep `consent_text` as fallback.

## 6. Test plan (test → code → refactor, per repo convention)

- `consentPageUtils.test.js` / new util if the document-vs-text fallback
  logic gets extracted to a pure function (e.g. `resolveConsentDisplay
  (consentData)`).
- `GuardianConsentResponsePage.test.jsx` — new cases: renders document
  iframe when `document.view_url` present; falls back to `consent_text`
  when absent; renders neither gracefully (no crash) when both are missing.
- `StudentConsentPanel.test.jsx` — send button disabled + hint shown when
  `consent_document_id` is missing from settings.
- `schoolComplianceUtils.test.js` (if it exists) — payload includes
  `consent_document_id`; dirty-check accounts for it.

## 7. Open questions for backend

1. Which shape for Step D — embed `document.view_url` directly in
   `retrievePublicConsent`, or a separate OTC-scoped endpoint?
2. ✅ **Answered 2026-08-04** — Does `/document/upload` accept an arbitrary
   `public_document` boolean today, or does that need adding server-side? →
   Confirmed **not implemented**: `POST /school/settings/consent-enforcement`
   accepts `consent_document_id` in the payload, returns `ok:true`, but never
   persists it (verified by round-tripping through `GET /school/settings`).
   Needs a schema/persistence change server-side before Step D can work at
   all.
3. Should a company be limited to **one** active `school_consent` document
   at a time (matches "one required policy version" mental model), or can
   multiple exist and the settings picker just chooses which is active?
4. **New** — confirm the id convention for any new endpoint: `/document/*`
   uses the Mongo company id, `/school/settings*` uses the SQL `company_id`.
   Whichever endpoint ends up persisting `consent_document_id` needs to state
   which one it expects.
