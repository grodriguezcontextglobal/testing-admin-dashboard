# Server: what is left to align with FedRAMP 20x (2026-10-19)

> **To:** the server agent (`server-testing`). **From:** the dashboard.
> **Based on:** the FedRAMP readiness assessment of 2026-09-16 (Cesar), the
> dashboard's action plan of 2026-09-28, and a read-only check today of
> `release/observabilidad` (`c1f65cc`; production runs `f808e9d`).
> **Companion pages:** "Aligning Devitrak with FedRAMP 20x" and "Devitrak
> Certification Roadmap" (shared by Gustavo).

**Status of FedRAMP:** on hold as a program since 2026-10-16. This note lists
the server work the goal needs so it can be planned. **Phase 0 does not wait
for FedRAMP**: those are live exposures any district questionnaire or auditor
would find.

**How each item is marked**

- **Verified 10-19** — checked today in the server code, read-only.
- **From 09-16** — taken from the readiness assessment; not re-checked today.

**How to reply.** In a `BACKEND_*_REPLY`, per item: the commit, whether it is
deployed, and anything you decline with the reason.

---

## Phase 0 — live exposures (days)

### S0.1 · Authenticate three routes that answer without a session — Verified 10-19

| Route | Where | What it does today |
|---|---|---|
| `POST /api/admin/users` | `routes/admin.js:106` → `controller/admin.js:821` `showAllUsers` | `StripeTransaction.find(request.body).populate("user")`, no middleware: an empty body returns every payment record with its user |
| `POST /api/admin/invalidate-all-sessions` | `routes/admin.js:44` (`optionalJWT`) → `controller/admin.js:1208` | `AdminUser.updateMany({}, { $inc: { tokenVersion: 1 } })`: signs out every admin in every company. Also `console.log(req)` on every call |
| `POST /api/transaction-audit-log/create-audit`, `GET /api/transaction-audit-log/audit-log` | `routes/transactionAuditLog.js:12,15`, mounted bare in `index.js:183` | Anyone can write audit entries and read the whole log, across companies |

- Controls: AC-3, AU-9 · KSI-CNA, KSI-MLA.
- The dashboard does not call `/api/admin/users` or `invalidate-all-sessions`:
  those two can be closed now.
- **`transaction-audit-log`: wait for our release.** The dashboard still wrote
  to `create-audit` after assigning a device to a transaction, with `await`, so a
  401 would have shown an error after the device was already assigned. Removed
  on 2026-10-19 (`dff5fc21`). The dashboard running on IIS today predates that
  commit, so **close this route only after the IIS release that carries
  `dff5fc21`** — the same release you are waiting on to enforce the signed
  links. We will tell you the day.
- **Done when:** each answers 401 without a valid session, `invalidate-all-sessions`
  is limited to a root admin of one company (or retired), and the audit log is
  scoped by company and not writable from outside the server.

### S0.2 · Confirm what the code cannot show — From 09-16

- **The eight production secrets** found in `origin/archive/development-2026-03`
  (Mongo Atlas URI, PlanetScale password, JWT signing seed, Stripe secret key,
  SendGrid key, Cloudinary secret, AWS secret key, Twilio token): rotated, and the
  branch purged? The JWT seed rotation invalidates every token, so it needs a
  window.
- **`NODE_ENV=production` on the production box.** `.env.example` and the
  deploy docs carry it since `fab0869`; confirm the running service has it.
- **Done when:** a yes for each, with the date.

### S0.3 · Backups with one tested restore — Verified 10-19 (none found)

No backup or restore tooling appears in the repository. The assessment found
"backup", "restore", "RPO" and "RTO" nowhere operational.

- Controls: CP-9, CP-10 · KSI-RPL.
- **Done when:** scheduled backups of MongoDB and MySQL exist, one restore into a
  scratch environment has been done and written down, and recovery targets
  (data loss and downtime we accept) are stated.

### S0.4 · Enforce the signed-link gates — Verified 10-19

`CONTRACT_LINK_MODE` and `ATTENDANCE_LINK_MODE` are in `warn`. You set
enforcement for 5 days after the dashboard release, not before 2026-10-21. Until
then `POST /api/document/download/documentUrl` (the S3 presigner) is gated only
in warn mode.

- **Done when:** both modes are `enforce` in production.

---

## Phase 1 — make the platform assessable (~2 quarters)

### S1.1 · Default-deny routing — Verified 10-19 (partly)

Done: `/api/school/*`, transactions (`d4fbe2d`, `5a0c25c`), locations, documents
and folders (`26c8493`, `296638b`), `/auth/users` two lanes. The rest of the
plan in `FRONTEND_unauthenticated_routes_2026-10-14.md` was paused with FedRAMP.

- What remains: authentication at the router level by default, with an
  explicit, reviewed list of public routes, instead of each route opting in.
  Group B (154 routes the dashboard only calls with a session) is the
  zero-risk start; the 29 school routes in group C carry minors' data.
- The ~40 `nodemailer/*` routes whose guard defaults to warn mode (From 09-16).
- Controls: AC-3 · KSI-CNA.
- **Done when:** a test fails if a write or bulk-read route is mounted without
  authentication and is not on the public list.

### S1.2 · Tenant isolation from the session — From 09-16; question open since 10-14

Tenant context resolves from a client header, with a request-body fallback.
The dashboard sends `x-company-id` (Mongo routes) and `s-company-lq` (SQL
routes). Question F1.2, unanswered: which one does each route read, and is it
checked against the company in the JWT?

- Controls: AC-4, SC-4 · KSI-CNA.
- **Coordinated with the dashboard:** once the server takes the company from
  the session, we stop sending the headers it ignores.
- **Done when:** no route trusts a company id from the client without checking
  it against the session.

### S1.3 · One authorization system — From 09-16; questions open since 10-14

Three parallel systems (Mongo-side, MySQL-side, legacy `AdminUser.role`), keyed
off different identities, plus an unscoped, unaudited `super_user` bypass. The
dashboard finished its part (phase 1, `4c8ffa5c`): no screen decides from the
numeric role. The five questions for phase 2 are in
`FRONTEND_numeric_role_backend_ask_2026-10-14.md`.

- Controls: AC-2, AC-6 · KSI-IAM.
- **Done when:** one permission check decides every route; `super_user` is
  scoped to a company or removed, and every use of it is logged.

### S1.4 · Audit records the application cannot rewrite — Verified 10-19 (open)

The audit middleware (`middlewares/auditTrail.js`, `271fc70`) records every
write with its author, which closes AU-2/AU-3. But the records live in the same
database, written with the same credentials, with application-supplied
timestamps (From 09-16).

- Controls: AU-9 · KSI-MLA.
- **Done when:** audit records go to an append-only store (or a separate
  database the API can insert into but not update or delete), with server-side
  timestamps.

### S1.5 · Logs shipped off the box, with retention — Verified 10-19 (none found)

Logs stay on the server, size-capped (25 MB rotating on a near-full C: drive,
From 09-16). FedRAMP expects about 90 days online and a year retained, readable
by someone other than the person who deploys.

- Controls: AU-4, AU-11 · KSI-MLA.
- **Done when:** application, audit and access logs reach an external store with
  that retention, and access to them is separate from deploy access.

### S1.6 · CI and change control — Verified 10-19 (no workflows)

`.github/workflows` does not exist on the server. The assessment counted 13 of
1,328 backend commits through a pull request, and the production box pushing to
`origin/main` once silently deleted three files.

- Controls: CM-3, CM-6 · KSI-CMT.
- **Done when:** tests and a dependency gate run on every push; merges to `main`
  need a review; production deploys a built artifact (or a tagged commit) and
  never pushes. The dashboard already gates every push and builds its IIS
  releases in CI (`ab0d8cf6`, `aa0f098b`); the same pattern fits here.

### S1.7 · Staging — From 09-16

There is no environment that mirrors production. Today's "local stack" was 217
commits behind `origin/main` and missing four security middlewares (09-16).

- **Done when:** a staging service runs the same commit as production next, with
  its own data and secrets.

### S1.8 · Secrets in a managed store — From 09-16

Secrets live in an `.env` file on the box.

- Controls: SC-12, SC-28 · KSI-SVC.
- **Done when:** secrets come from a managed store with access logging and a
  rotation procedure that has been run once.

### S1.9 · Cookie sessions — coordinated with the dashboard

The dashboard keeps the session JWT in `localStorage` (readable by any script on
the page). Moving it to an `HttpOnly`, `Secure`, `SameSite` cookie needs the
server to issue and read it, and CSRF protection on state-changing routes.

- Controls: SC-23, AC-12 · KSI-IAM.
- **Done when:** login sets the cookie, every route reads it, and the dashboard
  stops storing the token. We will do our side in the same release.

### S1.10 · Cryptography inventory — server side

The dashboard's is done (`FRONTEND_crypto_inventory_2026-10-15.md`). FedRAMP
requires, for every class, a list of each cryptographic module in use and
whether it is CMVP-validated (FIPS 140-3 itself is not required below Class D).

- **Done when:** a list of what the server uses to hash, sign, encrypt and for
  TLS, with the module and version of each.

### S1.11 · SQL identifier injection stragglers — From 09-16

Four files already use an allowlist or identifier regex; `consumer.js` and
`lease.js` were the remaining ones on 09-16.

- **Done when:** no SQL identifier is built from request input without the
  allowlist.

---

## Phase 2 — inventories and policies (parallel with Phase 1)

### S2.1 · Where the server physically runs — From 09-16

Windows Server 2019 on a VMware disk, with no provider, region or contract in
the repository. This decides whether the physical controls (PE family) can be
inherited, and which FedRAMP 20x hosting path applies.

### S2.2 · The third parties in the data path — From 09-16

Sixteen external services with no interconnection agreement or vendor review,
plus `app.devitrak.net`, whose calls into this API nobody has mapped. A day of
access logs answers the second.

- Controls: CA-3, SA-9 · KSI-TPR.
- **Done when:** a list of each service, what data it receives, its own
  certification (SOC 2, FedRAMP…), and the agreement in place.

### S2.3 · Software bill of materials — KSI-TPR

- **Done when:** CI produces an SBOM per release, kept with the release.

### S2.4 · Incident response and contingency — KSI-INR, KSI-RPL

Alerting exists (external uptime check, Kuma, Teams, dead-man switches). What is
missing is the plan: who is paged, what they do, and the breach notice to
schools that DC Code § 38-831.02 requires.

---

## Phase 3 onward — evidence and hosting (2027)

- **Evidence by indicator.** FedRAMP 20x expects each key security indicator to
  be shown by a system, continuously. Most of Phase 1 (CI, log shipping,
  default-deny tests, backups) produces that evidence if it is built to export
  it. Worth designing for from the start.
- **Hosting decision.** Self-hosted services wait for the rules RFC-0033 Track 2
  is producing (2027). Moving onto FedRAMP-certified infrastructure opens the
  20x path but is a migration. Not a decision for this note; it changes how
  S1.5, S1.7 and S1.8 are built.

---

## Already done on the server — so nobody chases it again

Verified in code, most deployed since 2026-10-16:

| What | Commit |
|---|---|
| MFA mandatory; no session token without it | `29691d7`, `b086e43` |
| Password hashes out of every response; `verify-password` | `5d87d1c` |
| Signed single-use links: reset, staff invitation, event invitation, contracts | `6b43863`, `897438c`, `296638b`, `b34f3eb` |
| Every write audited with its author and a readable summary | `6cccc60`, `271fc70`, `4c5c4aa`, `4e89c28` |
| Refund, capture and release require a session and permission | `fab23ed`, `7518f98` |
| Session required on transaction routes | `d4fbe2d`, `5a0c25c` |
| `/send` idempotent per member | `f808e9d` |
| `NODE_ENV` documented and the consent code no longer leaked | `fab0869` |
| Monitoring: external check, Kuma, dead-man switches, status page | 09-23 to 09-25 |
| API contract regenerated | `a1b7cd4` |

---

## Where to start

1. **S0.1** — three routes, days of work, the worst exposure on the list.
2. **S0.2 and S0.3** — answers and the first backup.
3. **S0.4** — on the date already set.
4. **S1.6** — CI first among Phase 1, because every later item is checked by it.
5. Then **S1.1 → S1.5** in order; **S1.9** together with the dashboard.
