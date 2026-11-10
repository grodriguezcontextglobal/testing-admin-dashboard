# Platform console: a Devitrak-only dashboard across every client (design plan)

**Status:** plan, not started · **Task:** #16 in `fedRAMP/FRONTEND_govramp_pending_2026-11-10.md` · **Asked by:** Gustavo, 2026-11-10 · **Repos:** this one (client) and `server-testing` (read only while writing this)

**The ask:** a dashboard where Devitrak staff see every client (companies, inventory, transactions, everything), and that only accepts `@devitrak.com` accounts.

**In one paragraph:** build it as a **separate, read-only console on its own host**. It reads from new `/api/platform/*` routes behind the read-only flag the server already has (`platform_observer`), plus an exact `@devitrak.com` check and required MFA, all enforced on the server. Every read is recorded in the audit log, and it never goes through the customer routes. Phase 1 shows aggregates and company detail; customer and student personal data stay out until a later, separately approved phase.

---

## 1. Naming: this is not `super_user`

There are already three different "super" notions, and the console must not add a fourth under the same name:

| Flag | Where | What it does today |
|---|---|---|
| `Company.employees[].super_user` | each client company | The **owner of that client company**, set at registration (`server-testing/controller/registration.js`). The dashboard uses it in `SuperUserGuard.jsx` and `checkStaffRoleAndLocations.jsx` |
| `AdminUser.super_user` | platform | **Total bypass** of `authorizeMongoPermission`, read **and write** in every company (`middlewares/authorizeMongoPermission.js:40`) |
| `AdminUser.platform_observer` | platform | **Read-only** platform access, used today by `/api/metrics` and `/api/jobs/stats` (`middlewares/requirePlatformRead.js`) |

In this document:
- the product is the **platform console**;
- the people who use it are **Devitrak operators**;
- the permission is **platform read** (`platform_observer`).

Neither the API (`controller/admin.js:601`) nor the dashboard can set the two platform flags; they are set directly in the database.

---

## 2. Principles

1. **The server decides; the client only presents.** The domain check, the flag and MFA are enforced on every `/api/platform/*` request. A check in the browser only hides the door.
2. **Read-only in every phase covered here.** Any write action for support (for example resetting a client's MFA) is a separate design with its own permission, and never uses `AdminUser.super_user`.
3. **No customer routes with a forged company header.** Pointing `x-company-id` at any client through the `super_user` bypass would be invisible cross-tenant access. Platform reads go through their own routes, so that they are named, limited and audited.
4. **Every read is recorded.** Who, which company, which screen or query, when, and the result.
5. **Aggregates before records.** Counts and totals first. Lists of people (staff, consumers, students) only where an operator task needs them, and minors' data not at all in Phase 1.
6. **Separate from the customer app.** An XSS in the customer dashboard must not be able to read every client through an operator who happens to be signed in.

---

## 3. Who gets in

All of these, checked by the server on every request:

| Check | Rule |
|---|---|
| Session | A valid session (`validateJWT`, `checkTokenVersion`), the same as the dashboard |
| Domain | `AdminUser.email`, lowercased and trimmed, **ends with `@devitrak.com`**. An exact suffix: `devitrak.com.evil.io`, `x@devitrak.co` and `x@sub.devitrak.com` are rejected |
| Flag | `AdminUser.platform_observer === true`, and `active !== false` |
| MFA | `AdminUser.mfaEnabled === true`. Without it the answer is 403, not a prompt to enrol from the console |
| Not a client member *(recommended)* | Operator accounts are dedicated accounts and belong to no client company. Someone at Devitrak who also works inside a client company uses a different account for that |

**Implementation on the server:** extend `requirePlatformRead`, or add a `requirePlatformConsole` beside it, with the domain and MFA checks.

**Known gap to close first:** today `requirePlatformRead` also lets `AdminUser.super_user` through, on purpose. For the console, require `platform_observer` plus the domain whether or not someone is `super_user`, so a `super_user` on another domain cannot read the console.

**Provisioning:**
- Gustavo names the operators.
- The backend sets the flag in the database, and records who was added, when and why.
- The list is reviewed every quarter (AC-2).
- Deprovisioning: clearing the flag, or deactivating the account, ends access on the next request, because the flag is read on every request and not from the token.

**Option (D-P5):** sign in through Devitrak's Google Workspace, restricted to `hd=devitrak.com`, instead of a password. It is stronger, because the domain is proven by the identity provider, and offboarding follows the company account. It is more work than the checks above, so it is not Phase 1.

---

## 4. Where it runs

| Option | For | Against |
|---|---|---|
| **A. A section of this app** (`/platform/*`) | Cheapest; reuses everything | Same origin as the customer app: its CSP, its XSS surface and its stored session cover the operator too. A dashboard bug can expose every client |
| **B. A second entry point in this repo, on its own host** *(recommended)* | Reuses the UX components, `devitrakApi`, the CSP builder and the CI. Separate origin (for example `ops.devitrak.net`), so it has its own storage, session and CSP. The host can have an IP allow-list at IIS or Cloudflare | A second build and deploy target |
| **C. A separate repository** | The cleanest separation | Duplicates components, CI, the CSP and security headers |

**Recommendation: B.**
- Vite builds a second page (`platform.html`) into `dist-platform/`.
- The release ships it as a second package, to its own IIS site.
- It uses the same security headers as the customer app, with `connect-src` limited to the API.

The customer bundle does not include the console's code; a static guard test keeps it that way.

---

## 5. What it shows (Phase 1 and 2)

The UI text is in English, and screens are built on the internal UX components (`ProfileShell`, `BaseTable`, the buttons and filters already used in the dashboard).

### Phase 1
1. **Overview**
   - active companies, new this month;
   - staff accounts, and how many have MFA;
   - live events today;
   - devices in use and devices overdue;
   - transaction volume over 30 days;
   - subscriptions by plan.
2. **Companies:** a list with name, plan, creation date, staff count, live events, devices and last activity, with search and sort.
3. **Company detail**, read-only:
   - profile and plan;
   - staff (name, role, MFA on or off, last sign-in; no other personal data);
   - events (counts and statuses);
   - inventory summary by category and status;
   - transactions (totals, last 20, failures);
   - the company's recent activity from `StaffActivityLog`.
4. **Platform health:** `/api/metrics`, `/api/jobs/stats`, recent error logs, and the CSP report summary.
5. **My access log:** what the signed-in operator has opened, from the audit in §6.

### Phase 2
6. **Inventory across clients:** totals per company and status, and a serial-number search across all clients (the usual support question "whose device is this?"). The result shows the company, item and status; the search term is recorded.
7. **Transactions across clients:**
   - Stripe and cash transactions with filters (company, date, status, amount);
   - totals;
   - failed payments and disputes.
   - Card details never appear; only what `StripeTransaction` already stores (amount, status, last four if present).
8. **Security events:** failed sign-ins, MFA resets, sessions ended, and `company context` warnings, across clients.

### Out of Phase 1 and 2
- **Consumers' personal data, and anything from the school vertical (students, guardians):** aggregates only, for example "312 consumers". Showing records needs D-P3. Student records fall under FERPA/COPPA (`server-testing/DESIGN_ferpa_coppa_compliance.md`); an operator opening them is an access that has to appear in the student's access history (its Phase C).
- **Any write.**

---

## 6. Audit

Today `auditTrail` records **writes** only, and `auditPiiAccess` records school PII access within one company. The console needs **read** auditing across companies:

- A middleware on every `/api/platform/*` route records, on `finish`:
  - the operator (`req.uid`, email);
  - the route and its parameters (company id, search term, filters);
  - the status;
  - the number of records returned;
  - the time;
  - the request id.
- **Where it goes:** `StaffActivityLog` with `action: "PLATFORM_READ"` and the target `company_id` when there is one. The company then sees it in its own audit trail, which is transparency the clients can be told about (D-P4). Searches across companies have no target company and are recorded without one.
- Operators cannot delete or edit these entries, and the console does not offer to.
- **Retention:** the same as `StaffActivityLog`; to confirm against the audit retention in the SSP.

---

## 7. Server API (the backend's part)

A new namespace, `/api/platform/*`, mounted with:

```
validateJWT → checkTokenVersion → requirePlatformConsole → auditPlatformRead → handler
```

| Route | Phase | Returns |
|---|---|---|
| `GET /platform/overview` | 1 | The overview counts in one answer |
| `GET /platform/companies?search=&sort=&page=` | 1 | The company list, paginated |
| `GET /platform/companies/:companyId` | 1 | Company detail: profile, plan, and the aggregates in §5 |
| `GET /platform/companies/:companyId/staff` | 1 | Staff: name, role, MFA, last sign-in |
| `GET /platform/companies/:companyId/activity?page=` | 1 | `StaffActivityLog` for that company |
| `GET /platform/health` | 1 | `/api/metrics`, job stats and recent errors together |
| `GET /platform/me/access-log?page=` | 1 | The operator's own audit entries |
| `GET /platform/inventory/search?serial=` | 2 | Serial search across companies |
| `GET /platform/inventory/summary` | 2 | Totals per company and status |
| `GET /platform/transactions?company=&from=&to=&status=&page=` | 2 | Transactions across companies |
| `GET /platform/security-events?from=&to=&type=&page=` | 2 | Security events across companies |

Rules:
- Every route paginates. Page size is capped on the server (for example 100), and the totals are computed on the server.
- Answers carry only the fields the screens in §5 use, never the stored documents as they are (no `password`, `mfaSecret` or tokens; the same `toJSON` rules as today).
- Heavy aggregations can run on a read replica, following `DESIGN_read_write_split.md`, once the metrics show they need it.
- Rate limit per operator, so a runaway screen cannot load every client's data in a loop.
- The Mongo company and the SQL company are joined by id on the server. This is the same link the dashboard already asked for (the Mongo↔SQL company id, AC-4).

---

## 8. Client design

- **Entry:** `platform.html` → `src/platform/main.jsx`, with its own router, layout and React Query client. It shares `src/components/UX`, `src/api/devitrakApi.jsx` (session headers via `sessionCredential.js`) and the design tokens.
- **Sign-in:** the same `/admin/login` with MFA. Afterwards the console calls `GET /platform/overview`; a 403 shows "This console is for Devitrak operators only" and signs out. No client-side domain check decides anything; at most it shows that message early.
- **Session:**
  - a shorter idle timeout than the customer app (for example 15 minutes, through `hooks/idleSession.js`);
  - no "remember me";
  - with the cookie session (#12) on, the token is never stored.
- **Data:** React Query, one query per screen, with no cache across sign-outs (`clearSessionStorage` and a cache clear on logout).
- **Screens in English;** dates in the operator's time zone.
- **Tests:**
  - unit tests for the guards and the formatting utilities (`src/platform/**/utils/**`);
  - the CSP E2E check (#9) extended to the console build;
  - a static guard that the customer bundle does not include `src/platform`.

---

## 9. Phases

| Phase | Backend | Dashboard | Done when |
|---|---|---|---|
| **0. Decisions and inventory** | Lists the accounts that have `AdminUser.super_user` or `platform_observer` today | D-P1 to D-P5 decided (§10) | The operator list is named and each one has MFA |
| **1. Read-only console** | `requirePlatformConsole`, `auditPlatformRead`, and the Phase 1 routes | Second entry point and host; overview, companies, company detail, health, access log | An operator can answer "how is client X doing?" without asking the backend, and each look shows in the audit log |
| **2. Inventory and transactions** | The Phase 2 routes | Inventory search and summary; transactions; security events | Serial search and transaction review across clients |
| **3. Later, separately designed** | — | — | Personal data of consumers (D-P3) and support writes, each with its own approval |

**Rough size:** Phase 1 is medium on both sides (about one to two weeks each); Phase 2 is medium.

---

## 10. Decisions for Gustavo

| # | Decision | Recommendation |
|---|---|---|
| D-P1 | Where it runs (§4) | **B:** a second entry point in this repo, on its own host |
| D-P2 | Who the operators are, and who approves adding one | Name them now; Gustavo approves, the backend sets the flag, quarterly review |
| D-P3 | Consumer and student personal data in the console | **Not in Phase 1 or 2.** Aggregates only. If needed later: a reason per access, shown in the student access history (FERPA) |
| D-P4 | Do clients see Devitrak's reads in their audit trail? | **Yes.** It costs nothing extra and it is what a client's security team will ask |
| D-P5 | Password + MFA, or Google Workspace sign-in for `devitrak.com` | Password + MFA in Phase 1; Workspace sign-in as a follow-up |
| D-P6 | What happens to `AdminUser.super_user`, the total write bypass | **Recommend reviewing who has it, and removing it where nobody needs it.** It is outside the console, but the console makes it visible: it is the broadest permission in the system |

---

## 11. Compliance notes (GovRAMP)

| Control | What this design does |
|---|---|
| AC-2 | Named operator accounts, approval, quarterly review, deprovisioning by flag |
| AC-3, AC-4 | Only through `/api/platform/*`; company scoping on customer routes stays intact |
| AC-5, AC-6 | Read-only; separate from the `super_user` write bypass; dedicated accounts |
| AC-6(9), AU-2, AU-12 | Every platform read recorded, with the target company |
| IA-2(1) | MFA required, checked by the server |
| AC-11, AC-12 | A shorter idle timeout; the cookie session when #12 is on |
| SC-7 | Its own host, with an optional IP allow-list; its own CSP |
| PL-2 | The SSP has to describe vendor access to customer data: who, why, how it is logged |

---

## 12. What to ask the backend

1. The list of accounts with `AdminUser.super_user` and with `platform_observer` today.
2. Whether they agree with `requirePlatformConsole`: exact domain, the flag, MFA, and no `super_user` shortcut.
3. `PLATFORM_READ` entries in `StaffActivityLog`: schema, and whether clients' audit view shows them.
4. The Phase 1 routes in §7, and an estimate.
5. Whether `/api/metrics` and `/api/jobs/stats` should move under `/api/platform/` so the console has one gate.
