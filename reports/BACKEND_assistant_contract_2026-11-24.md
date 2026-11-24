# The assistant endpoint, built and merged — and it is not the shape you planned for (2026-11-24)

**From:** the backend. **Follows:** `BACKEND_assistant_three_questions_REPLY_2026-11-23.md`.

The assistant is built and merged to `release/observabilidad` (PR #105, plus #106
on top). **Not deployed yet** — we will tell you when it answers in production,
the way we did for `/summary` and `/companies`.

Read §1 first. Three things changed from the design you have been building
against, and one of them means a component you already wrote does not apply here.

---

## 1. Three changes from what you planned

**It is synchronous. There is no `202` and no job to poll.**

You built `BackgroundJobsTracker` polling for this, and we agreed to it, because
an agent with tool calls takes tens of seconds. This version has no agent and no
model: it matches your question against a closed catalogue of questions and runs
one query. It answers in the same request, in milliseconds.

So the chat window calls it like any ordinary endpoint and renders the reply.
**Keep the polling code for whatever comes next, do not wire it to this.**

**The path is `/api/assistant/ask`, not `/api/admin/assistant/ask`.**

Its own namespace. A new route inside an existing router can end up shadowed by a
parameter registered earlier, and in this repository that is not theoretical —
`router.post("/:id")` in `item.js` once covered fourteen routes. A fresh
namespace cannot shadow and cannot be shadowed.

**There is no model, and that was the point.**

A hosted model would take the text your staff member types outside our
authorization boundary, which is a new line in the SSP data-flow diagram.
`APP-2026-001` is our only High finding and it is due 2026-12-16. Building the
whole circuit — session, company, scope, catalogue, audit, your chat window —
without that lets all of it exist now and decides nothing.

The practical consequence for you: **matching is keyword-based, in Spanish and
English, and it will miss.** That is expected and it is instrumented. See §7.

---

## 2. The two endpoints

```
GET  /api/assistant/catalog     what it knows how to look up
POST /api/assistant/ask         ask one question
```

Both require a staff session. Headers:

| Header | Required | Notes |
|---|---|---|
| `x-token` | yes | the normal staff session |
| `s-company-lq` | **yes** | the company context |

**`s-company-lq`, not `x-company-id`.** Both headers exist in the API and both
are in the CORS allow-list, but this endpoint resolves the company through
`resolveCompanyContext`, which reads `s-company-lq`. Sending only `x-company-id`
gets you a `400`.

---

## 3. The request

```json
POST /api/assistant/ask
{ "question": "cuántos equipos tengo fuera" }
```

That is the whole body. **`company_id` and `staff_member_id` are ignored** — not
"validated and then ignored": the controller hands the company resolver a view of
the request with `body` and `query` emptied, so they are never read.

You can keep sending them and nothing breaks. But if you drop them, one fewer
copy of a fact that already arrives twice — the staff identity is inside the
signed JWT, the company is in the header — is one fewer place for the three to
disagree.

**Cap `question` at 1,000 characters on your side too.** The server returns `400`
past that, and a user who sees the limit before spending a request has a better
time than one who sees an error after.

---

## 4. The answer

```json
{
  "ok": true,
  "question_id": "company_devices_out",
  "answer": "Tienes **4** equipos fuera del almacen ahora mismo.",
  "data": { "devicesOut": 4 },
  "scope": { "scoped": false, "roleType": "admin" },
  "params": {}
}
```

**`data` is the source of truth. `answer` is a convenience.**

`answer` is markdown, composed by the server from the same numbers — it is
deterministic, not generated, so it cannot say anything `data` does not. It is
**in Spanish today**. If your UI needs English, say so and we will add language
negotiation; we did not guess.

Render from `data` where you can. It is language-neutral and it survives us
rewording a sentence.

---

## 5. The six questions and their `data`

| `question_id` | `data` | `params` it accepts |
|---|---|---|
| `company_inventory_summary` | `{ deviceCount, devicesOut, inWarehouse }` | — |
| `company_devices_out` | `{ devicesOut }` | — |
| `company_events_active` | `{ activeEvents, events: string[] }` | `limit` |
| `company_staff_list` | `{ staffCount, staff: [{ name, role }] }` | `limit` |
| `company_subscription_status` | `{ plan, subscriptionStatus, status }` | — |
| `company_activity_recent` | `{ range, count, activity: [{ summary, actor, at }] }` | `range`, `limit` |

`params` comes back in the response so you can show what was assumed — "last 30
days" — and let the user change it.

`range` is `7d` / `30d` / `90d`; anything else falls back to `30d`. `limit` is
clamped to 100, default 25. Same vocabulary as the platform console, on purpose.

**`company_subscription_status.status` is one of `active` / `at_risk` / `trial` /
`paused`** — computed by the same `companyStatus` function the console uses, the
one we fixed `incomplete_expired` in yesterday. Your existing pill component
should take it unchanged.

`at` is ISO UTC with `Z`. `role` and `summary` can be `null`.

### When the company cannot be resolved

A company registered in SQL inventory but whose Mongo record we cannot cross
comes back as `data: null` with an `answer` saying so. **Do not render that as
zero.** It means unknown, and the two are different sentences.

---

## 6. When it does not understand

```json
{
  "ok": true,
  "question_id": "unsupported",
  "answer": "No se contestar eso todavia. Esto es lo que si puedo mirar:",
  "data": null,
  "catalog": [ { "id": "company_devices_out", "label": "Equipos fuera del almacen ahora mismo" } ]
}
```

Status is **`200`**, not an error. Not understanding is a normal outcome here, not
a failure.

`catalog` is the same list `GET /api/assistant/catalog` returns, inlined so you do
not need a second call to render the fallback.

---

## 7. What to put on the screen

**Render the catalogue as chips or suggested questions from the first frame**,
before anyone types. With keyword matching, a user who guesses the phrasing gets
an answer and a user who does not gets `unsupported`. Showing the questions turns
that from a guessing game into a menu, and the free-text box becomes the shortcut
rather than the only door.

**On `unsupported`, show the chips again.** "I don't know" and silence are
different; the first teaches the user what the tool is for.

**When `scope.scoped` is `true`, say the answer is partial.** Something like
*"showing only your assigned categories"*. This matters more than it looks: a
`category_assistant` sees a lower number than the real one, and with no notice
they read their own blind spot as a fact. It is the same reasoning that made you
drop the Overdue tile — except a calm sentence hides it better than an empty tile
does.

**On `429`, show when they can ask again.** The limiter sends standard
`RateLimit-*` headers. Default budget is 10 questions per 10 minutes **per staff
member** — not per IP, so an office behind one address does not share one.

---

## 8. Errors

| Status | Body `msg` | When |
|---|---|---|
| `400` | `The question is empty.` / `The question exceeds 1000 characters.` | bad `question` |
| `400` | `Company context is required (send the s-company-lq header).` | header missing |
| `401` | from `validateJWT` / `No staff identity on this request.` | no or stale session |
| `403` | `Not an active staff member of this company.` | not a member of that company |
| `429` | `Too many questions in a short time…` | rate limit |
| `500` | `The assistant could not answer this question.` | anything else |

All of them are `{ ok: false, msg }`.

**One `500` is worth knowing about:** every answered question writes an audit row
**before** the reply is sent, and if that write fails the question is not answered.
A read that leaves no trace is not served — the same rule the platform console
runs under. It will be rare. It is not a bug when it happens.

---

## 9. What is not there yet

**No `conversation_id`.** Every question is matched on its own, so *"¿y la semana
pasada?"* will not resolve — it has no idea what "that" was. Carrying the previous
turns' `question_id` and `params` is a small addition and does not weaken
anything, because it carries question identifiers rather than rows. Tell us when
your chat window needs it.

**No `sources`.** Once questions return lists rather than counts, those will be
in-app links built from our route table.

**No money and no overdue devices, deliberately, and there is a test that keeps
them out.** Neither transaction model stores the amount — it lives in Stripe —
and `devicesOverdue` is still not computed. A catalogue entry for either would
answer with silence, and a silence written as a sentence reads like a fact. They
go in the day the data exists.

**The question text is not stored.** Only which question was asked, by whom, for
which company, and whether it was answered. If you want the user to scroll back
through their own conversation, that history lives on your side; retention of the
text is a GovRAMP decision we have not taken.
