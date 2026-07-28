# Pending Frontend Tasks — as of 2026-07-27

> Context: the student-consent/FERPA-COPPA feature (guardian storage, consent
> panel, assignment gate, public guardian response page, compliance settings
> toggle) is now **committed on `main`** (commits `1ca8597e`, `366573f1`,
> `01a7a9c0`) with the `GuardianConsentResponsePage` test/contract mismatch
> fixed. What's left is unrelated to that feature — it's the **scoped-roles**
> (location/category RBAC) work plus two smaller items.

---

## 1. Push the 3 held scoped-roles commits — **do this first**

Local commits, not yet pushed to `origin/main`:

```text
66fd1feb  feat(roles): scoped-roles Phase B — category + location scope assignment
0563aaf3  feat(roles): scoped-roles Phase C — consume category scope + inventory filtering
0db88893  fix(documents): handle 202 job-queue response on PDF upload
```

Plus 3 already-pushed smoke-test fixes on top of them:
`1a52b73f`, `e789c9e9`, `d6c95048` (all already `git log` history, safe).

**Before pushing:** confirm the backend branch `feat/category-scoped-roles` is
actually deployed to the environment `origin/main` will point at — the prod
route-existence probe (2026-07-21) only proved routing exists (401, not 404),
not that role_type acceptance/scope filtering fully work end-to-end. If
backend confirms, this is a plain `git push`, no code change needed.

## 2. Root-cause Issue #1 — category dropdown empty when assigning a category-scoped role

`ScopeAssignmentSelect` shows no options for `category_manager`/
`category_assistant`. Hooks (`useCompanyCategories`, dedupe logic) look
correct and already use `sqlInfo.company_id` (fixed in `1a52b73f`).
**Leading hypothesis:** `POST /db_company/categories {company_id}` returns an
empty `result` for the test company (Invoxia, SQL company_id 137) — i.e. no
categories registered in that SQL table even though inventory items carry a
`category_name` string.

**Next step:** get the actual response body from
`POST /db_company/categories` for company_id 137 before touching any code —
this is a data-vs-code question, not yet a confirmed bug.

## 3. R3 location-scope reconciliation gap

`saveScopedRole` writes location scope to SQL (`PUT /scope`, numeric ids) but
does **not** set the legacy Mongo `preference.managerLocation`, which is what
the server-side inventory location filter still reads. A location-scoped role
assigned through the new UI may not get location-filtered inventory until this
is reconciled.

**Next step:** confirm with backend whether reconciliation should happen
server-side (preferred — keeps frontend out of dual-write duty) or whether
frontend needs to write both stores on role/scope save.

## 4. Optional — consume `POST /db_lease/status` in a dashboard

Unified lease-status endpoint (staff + consumer + member, overdue
classification) has been available since the July 2026 server update
(`FRONTEND_server_updates_2026-07.md` §4) and is not consumed anywhere yet.
No urgency — nothing depends on it; pick up when there's dashboard/reporting
bandwidth.

## 5. Role-label customization follow-ups

Queued UI follow-ups from the per-company role-renaming feature (see engram
memory `project_role_label_customization`) — lower priority, no deadline
attached.

---

## Housekeeping (not urgent, flagged for awareness)

- `.claude/`, `.atl/`, `graphify-out/` are untracked but **not** in
  `.gitignore` — they show up in `git status` every session. Worth adding to
  `.gitignore` at some point so they stop appearing as noise (never decided
  either way so far).

## Recommended order

1. Confirm backend deploy status → push the 3 held scoped-roles commits (§1)
2. Get the real `/db_company/categories` response for company 137 → root-cause
   Issue #1 (§2)
3. Decide reconciliation ownership for R3 (§3) with backend
4. §4 and §5 whenever there's spare bandwidth — no blocking dependency on
   anything else
