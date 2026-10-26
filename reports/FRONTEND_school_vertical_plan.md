# Frontend Action Plan — School / Education Vertical

> **Goal:** strengthen the Devitrak admin dashboard for the primary school-client
> use case — managing **inventory**, **staff**, and **students** — based on a
> Graphify-grounded review of the members module, industry profiles, asset
> assignment/return, and this week's scoped-roles work.
>
> **Date:** 2026-07-21 · **Author:** Gustavo Rodríguez
>
> Legend: 🟢 built · 🟡 partial/inconsistent · 🔴 gap · 🧱 foundational

---

## 0. What already exists (confirmed in code)

The members/students module is substantial — the vertical does **not** need to be
built from scratch. Confirmed:

- 🟢 **Industry-adaptive members module** — `src/config/industryProfiles.js`.
  `Education` profile: icon `school`, hides the `consumers` tab (students *are*
  the consumers), representative = **Parent / Guardian**, `fields: {grade,
  homeroom, minor}`. `getIndustryProfile(industry)` is consumed by the navbar,
  footer, home KPIs, command menu, `IndustryTabGuard`, and member assignment.
- 🟢 **Member CRUD** — `conditionalPage/components/modals/addNewMember/Single.jsx`
  (grade, homeroom, minor → required guardian block), `MultipleFromXLSX.jsx`
  (bulk roster import), `UpdateMemberInformation.jsx`, `DeleteMember.jsx`.
  Endpoint: `POST /db_member/new-member`.
- 🟢 **Device → student assignment** — `AssignmentDevicesToMember.jsx`:
  - **Expected return date** (due date) on the lease.
  - **Guardian gate**: assignment is blocked for a minor without a complete
    parent/guardian on file (banner + disabled submit).
  - **Liability contract**: verification + email to the responsible party
    (guardian for minors, self for adults).
  - **Lease lifecycle**: `POST /db_member/new-member-assigned-device-lease`
    (assigned_date, expected_return_date, returned flag).
  - Serial-number entry (scanner-friendly); inventory pull scoped by location
    (`locationsAssignPermission`).
- 🟢 **Return flow** — `Return.jsx`: outcomes **returned / damaged / lost**,
  required condition note for damaged/lost, history-preserving lease close
  (`/db_member/update-member-assigned-device-lease`), return email.
- 🟢 **Overdue tracking** — `OverdueDevicesTable.jsx`.
- 🟢 **Event registration** — `RegisterMembersToEvent.jsx`; **reminders** —
  `Remainders.jsx`.
- 🟢 **Scoped inventory roles** (this week, behind `VITE_APP_FEATURE_SCOPED_ROLES`)
  — location & category scoping for inventory access.

---

## 1. Confirmed gaps

| # | Sev | Gap | Evidence |
|---|-----|-----|----------|
| G1 | ✅ FIXED | **Members forms not fully profile-driven.** `Single.jsx` + `UpdateMemberInformation.jsx` hardcoded grade/homeroom and "Guardian", ignoring the profile. Fixed 2026-07-21 (commits f6a083d8, abc09632). NOTE: the display layer was **already** adaptive — `MainTable.jsx` gates the Grade column by `industryProfile.fields.grade`, `Header.jsx` hides empty grade/homeroom; only the two forms needed fixing. | `Single.jsx`, `UpdateMemberInformation.jsx` |
| G2 | 🔴 | **No financial accountability for lost/damaged student devices.** `Return.jsx` records outcome + condition note but **charges no fee**; the placeholder even reads "charged to account" while charging nothing. Fee logic (`ChargeLostFee`) exists **only** in `consumers/`, which Education hides. | `Return.jsx` L107-123; `consumers/action/ChargeLostFee.jsx` |
| G3 | 🔴 | **No real audit log.** `staffActivitySlice` is a placeholder (one payload field, no writers/readers in the graph). No trail of who assigned/returned devices or edited student records — a near-requirement for minors' data. | `store/slices/staffActivitySlice.js` |
| G4 | 🟡 | **Dead code.** `conditionalPage/.../return/Lost.jsx` is a stub (`<div>Lost</div>`); the real lost path is the `Return.jsx` "lost" outcome. | `return/Lost.jsx` |
| G5 | 🔴 | **No academic structure.** grade/homeroom are free-text; no term/year, catalogs, promotion, or year-end rollover/graduation. | `Single.jsx` (free-text inputs) |
| G6 | 🔴 | **Scoped roles don't cover the student dimension.** Inventory scope is location/category only; a homeroom teacher can't be limited to their own students. | `config/roles.js` `ROLE_SCOPE` |
| G7 | 🧱 | **Data-integrity foundations** surfaced this week: SQL↔NoSQL desync (login roleType), duplicate SQL staff rows, `roleLabels` not persisting across sessions. | this week's fixes + open items |

---

## 2. Action plan

### Phase 1 — Hygiene & quick wins
- **A1 · Make the members module fully profile-driven** 🟡
  Drive field visibility and labels from `getIndustryProfile(industry)` instead
  of hardcoding. Show grade/homeroom only when `fields.grade/homeroom`; use
  `representative.label` for the guardian section.
  *Files:* `Single.jsx`, `MultipleFromXLSX.jsx`, `MainTable.jsx`,
  `tables/detailTableComponents/columns.jsx`, `utils/singleMemberUtils.js`.
  *Done when:* a non-Education company shows no school fields; guardian label
  matches the profile; tests in `singleMemberUtils` cover field gating.
- **A2 · Delete dead `Lost.jsx`** 🟡 and confirm `Return.jsx` "lost" is the only path.
- **A3 · Foundational quick wins** 🧱 — fix `roleLabels` persistence (pending
  backend confirm on `/company/update-company`); staff **upsert-by-email** to stop
  new duplicate SQL rows.

### Phase 2 — Accountability (highest school value)
- **B1 · Fees for lost/damaged in the members return flow** 🔴
  Extend `Return.jsx` so damaged/lost can record a **chargeable amount** tied to
  the student (and billed to the guardian for minors), surfaced in member detail
  and the overdue/fees report. Reuse the fee mechanism from
  `consumers/action/ChargeLostFee.jsx` adapted to the member lease.
  *Done when:* a lost/damaged return can attach a fee visible on the member and
  in reporting; the misleading "charged to account" copy becomes real.
- **B2 · Real audit log** 🔴
  Populate an activity trail (repurpose `staffActivitySlice` or a dedicated
  endpoint) on assign / return / member-edit / role-change, with actor +
  timestamp, plus a viewable feed in member/staff detail.
- **B3 · Year-end bulk return** 🟢 **ALREADY EXISTS** (found on review) —
  `OverdueDevicesTable.jsx` ("school track") already provides an overdue-leases
  dashboard with a grade filter, per-row + bulk guardian reminders, and an
  end-of-term **bulk return** via `POST /db_member/bulk-return`
  (+ `POST /db_member/overdue-leases`). No work needed beyond optional polish.

### Phase 3 — School structure & scoped access
- **C1 · Academic period / year** 🔴 — first-class term/year; grade & homeroom as
  catalogs (not free text); promotion / graduation / archive rollover.
- **C2 · Student-dimension scoped roles** 🔴 — add a `homeroom`/`grade` scope
  dimension reusing the Phase B/C scope infra so a teacher sees only their own
  students.
- **C3 · Reporting** 🔴 — per grade/homeroom/period reports (asset inventory,
  overdue, fees owed, roster) built on the existing xlsx export.

### Foundational track (parallel)
- **D1 · SQL ↔ NoSQL single source of truth** 🧱 — the root of this week's
  login-roleType, duplicate-staff, and roleLabels issues. Highest long-term risk
  given minors' data. Includes the R3 reconciliation (location scope: legacy
  Mongo `managerLocation` vs SQL scope).

---

## 3. Suggested sequencing

| Horizon | Items |
|---------|-------|
| **Now** | A1 · A2 · A3 (roleLabels + staff upsert) |
| **Next sprint** | B1 (fees) · B2 (audit log) · B3 (bulk return) |
| **Roadmap** | C1 (academic year) · C2 (student scope) · C3 (reports) · D1 (source of truth) |

---

## 4. Notes / precedents
- All Node/test/lint commands run inside the Docker toolchain; keep the
  test-first loop and the documented unit-test scope (`config/**`, `hooks/**`,
  `store/**`, `pages/**/utils/**`).
- Reuse internal UX components and the existing API clients; do not add ad-hoc
  Axios instances.
- Keep any user-facing changes behind the appropriate flag until the backend
  contract is confirmed, per the scoped-roles precedent.
