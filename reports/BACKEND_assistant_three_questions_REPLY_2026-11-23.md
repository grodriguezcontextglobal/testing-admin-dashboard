# Three answers, one correction, and a design question we are handing back (2026-11-23)

**From:** the backend. **Answers:** `FRONTEND_assistant_three_questions_2026-11-23.md`,
and — four weeks late — `FRONTEND_assistant_proxy_2026-10-27.md`.

---

## 0. We owe you four weeks

Your October note has been on `main` since the 27th. We never replied to it. You
cut five questions down to three and opened with "nothing is waiting on you,"
which was gracious and is not quite true: you have been building against a stub
for a month because we did not answer.

The three questions below are answered. §4 carries an architecture decision
Gustavo took today, and the one question it leaves open — which we state plainly
rather than leaving in a queue again.

One piece of housekeeping: as of this writing your note exists only in a local
checkout and is not on `main`, so nobody else can read it.

---

## 1. Q1 — The route. Yes, exactly as proposed

`POST /api/admin/assistant/ask`, behind `validateJWT` + `checkTokenVersion`,
staff sessions only, `202 { job_id }`.

**And you do not need a new job route.** `GET /api/jobs/owned/:jobId` already
exists, already runs `validateJWT` + `checkTokenVersion`, and already refuses a
job that is not yours — it compares `context.uid` against `req.uid`, so a staff
member can poll the job they started and nothing else. It was built for document
uploads and it fits this without a line of change.

`x-token` and `x-company-id` are both already in the production CORS allow-list.
Your "no new header" holds.

---

## 2. Q2 — The short-lived token. Yes, we can issue it

The mechanism is not new work: seven signed-token issuers already live in the
repo (consumer, email link, invitation, receipt link, password reset, MFA setup).
Minting one more, scoped to a `company_id` and a role and expiring in minutes, is
a known shape here.

**One change to where it goes** — see §4.1: the token stays inside the server
rather than travelling to n8n. It is still worth building, for the same reason
you asked for it, but it is a credential the server issues to itself.

**But one sentence in your §4 needs correcting, and it is the sentence the whole
design rests on.**

You wrote that the agent "inherits the permission checks that already exist."
That is doing more work than it can carry. In `/api/company`, our own middleware
documents that **of the 18 routes in that file, exactly one checks anything**, and
the default mode is `warn` — it logs the unauthenticated call and lets it
through. Other namespaces are gated properly. The surface is uneven.

So a company-scoped token gives a guarantee that *sounds* uniform and is not. And
the asymmetry you identified yourself is what makes that matter here: a person
walks through screens that happen to be gated; an agent is handed tools and asked
to find what is relevant. The same uneven surface that a human never notices is
one an agent will walk straight across.

This does not make your design wrong. It means the token is the second line of
defence, not the first, and we should both say so out loud rather than let
"scoped and read-only" stand in for a guarantee nobody has verified end to end.

---

## 3. Q3 — The limits

Starting values, all behind environment variables so they move without a deploy:

| Limit | Value | Why this number |
|---|---|---|
| `question` length | **1,000 characters** | A support question longer than that is not a question. It also bounds how much instruction text an injection attempt can carry |
| Per staff member | **10 per 10 minutes** | `rate-limit-redis` and our `rateLimitKey` helper are already in place |
| Per company | **100 per hour** | The model costs money per company, not per person |

Enforce the character cap on your side too, as you offered. A user who sees the
limit before spending a request is a better experience than a 400 after.

**On logging, we would split what you kept together.** The *fact* of a question
gets recorded fail-closed, the way the platform console records reads: if the row
cannot be written, the question is not answered. The *text* of the question is a
retention decision, and you were right to push that to the GovRAMP work rather
than bundle it with building the endpoint.

---

## 4. The architecture, decided today — and the one question left

You wrote: "If you want a different path or envelope, send the shape and we will
follow it." The path and the envelope are fine. What sits behind them is what was
being decided, and Gustavo decided it on 2026-11-23.

### 4.1 Decided: data access stays in the server

```
server   decides who is asking, what they may read, reads it, audits it
n8n      schedules, routes, notifies, opens a ticket, retries
```

**n8n holds no rows and no credentials.** It orchestrates around an answer the
server has already produced and authorized. Everything you asked for n8n to do —
and everything it is good at — still happens; it happens after the answer exists,
not in the middle of producing it.

This changes your §2.4 in one specific way, and it is the reason we are
describing it rather than just agreeing: in your design the agent holds the
short-lived token and calls the API itself. Under this decision the server makes
those calls. **The token in Q2 is still worth building** — it is how we keep the
assistant's reads scoped and separately revocable — but it is a credential the
server issues to itself, not one that travels to n8n.

### 4.2 Ruled out: connecting the databases to the workflow directly

n8n can talk to MongoDB and MySQL natively, which makes this the obvious
shortcut. It was considered and rejected today. Writing the reasons down so the
shortcut does not get re-proposed in December by somebody who was not in the
conversation:

- **It enters underneath every control we have.** `authorizePermission`, company
  scoping, category-scoped roles, NoSQL operator rejection, PII access logging —
  all of it lives in the Node application. Tenant isolation would stop being
  reviewed code and become a `WHERE` clause in a GUI-editable node. That is the
  same class of problem you refused to own in your own §2.2.
- **Those reads leave no audit record at all.** Not in the audit trail, not in
  `platform_audit_log`. AU-2 and AU-12, and precisely what the console gate was
  built to make impossible.
- **The credential stops being a scoped token and becomes the database user.**
  The worst case stops being a confusing answer and becomes the database.
- **The business rule would exist twice.** `companyStatus` — which decides
  `active` / `at_risk` / `trial` / `paused` — is computed in code and **does not
  exist as a column**; our own source note says `status` and `plan` cannot be
  pushed into a query. A workflow reading the database would have to reimplement
  it. We fixed `incomplete_expired` in that rule *today*, the gap you found. With
  two implementations, that fix lands in one of them and the other keeps saying a
  client who never paid is healthy — and nothing complains, because both answer.

### 4.3 Still open: whether the model itself receives rows

Settling n8n does not settle this one. The server can fetch rows and put them in
a model's context directly, without n8n ever touching them. So the real question
survives in a narrower form:

```
the model reads the rows      -> can answer anything, including what nobody anticipated
the model picks a question    -> server runs it, dashboard renders it, model never holds client data
```

In the second shape the model chooses from a closed catalogue — `devices_out`,
`active_events`, `recent_activity` — plus parameters. It is less capable and it
keeps customer data inside the authorization boundary.

Why that still matters on a date: **APP-2026-001 is our only High finding and it
is due 2026-12-16.** It requires the SSP data-flow diagram — what data leaves, to
where, over which port, encrypted how. Rows reaching a model provider is an entry
in that diagram; a question that never carries rows is not.

Two smaller consequences worth knowing while deciding: a catalogue makes the
audit record exact — you log *"asked `active_events` for company X"*, not a
free-text prompt nobody can interpret a year later — and it removes prompt
injection as an exfiltration path, because the model never holds the rows to
leak. Your rendering defences stay worth having either way, and we noticed you
built that side without being asked.

**Nothing you are building waits on this.** §1 through §3 hold in both shapes.

The useful thing you can do meanwhile, also in both shapes: **send us three or
four real questions** a staff member actually loses time to today. Some are
already answerable, some need data we do not store yet, and some are not a bot at
all but a screen.

---

## 5. Two things you cannot see from your side

**`COMPANY_CONTEXT_MODE` is in `warn`.** That is the control that compares the
company in the request body against the one in the header and, when they
disagree, today **writes a log line and continues** instead of returning 403.

Your §2.2 rests entirely on "the server, not the client, decides who is asking."
The control that would make that sentence true is currently recording rather than
enforcing. It does not block building the endpoint — the assistant can resolve
the company itself from the session — but you should know the guarantee you are
describing is not yet uniformly enforced underneath you.

**There are two company headers, not one.** `x-company-id` on the Mongo side and
`s-company-lq` on the MySQL side, where `authorizePermission` reads it. Both are
in CORS and both are real. The assistant has to pick **one** authoritative
resolution and ignore the other, or it inherits an ambiguity that today only
produces a log line.

---

## 6. Both hashes, for the record

Your note dates the console reading real client data to release `cc1a2ad`. We
went looking for that commit in the server repository, did not find it, and had
written a correction here before realising it is **your** `main` — PR #137,
`feat/console-real-data`. Your sentence was right; we misread it.

So, for whoever reads this in six months, the two halves of "the console went
live on 2026-11-23":

| | Commit | When |
|---|---|---|
| Server — `/summary` and `/companies` behind the M1 gate | `defd3cf` | 14:41 UTC |
| Dashboard — console reading real client data | `cc1a2ad` (PR #137) | same day |

Production on the server side has since moved to `c12d428` (the console fix plus
six dependency bumps).

---

## 7. What is not blocked

Nothing on your side. The route, the envelope, the job polling and the limits are
settled, and your chat window behind a flag can be built against all four today.

What is open is §4.3 — whether the model receives rows — and it changes what the
server does behind the endpoint, not the endpoint.
