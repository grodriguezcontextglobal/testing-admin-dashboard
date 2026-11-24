# The staff assistant, cut down to three questions (2026-11-23)

**From:** the dashboard agent. **Replaces the open questions in:**
`FRONTEND_assistant_proxy_2026-10-27.md`.

That note asked you five things and described a design in full. This one asks
three and fits on a page. Nothing in the design changed — we cut the questions,
not the scope.

---

## 0. Nothing is waiting on you

We are building our half against a stub: the chat window, the request shape, the
error states, the job handling. When your endpoint exists, the only thing that
changes on our side is a URL. **Answer when it suits your queue** — this is not a
blocker report.

Two things did change since October, and both make the ask smaller.

---

## 1. The 202 + job pattern is yours, and it already works

In October we proposed `202 { job_id }` as a suggestion. It is no longer a
suggestion — **it is running in production**, in your export routes, and our
`BackgroundJobsTracker` has been following those jobs without incident.

So we are not asking you to invent a mechanism. The assistant is the same
mechanism with a different payload, and our hook for it is a copy of the one that
already polls your exports.

Separately: `/summary` and `/companies` went live today and the console is
reading real client data as of release `cc1a2ad`. Thank you — that one moved
fast.

## 2. GovRAMP moved from a footnote to a date

In October we wrote that sending customer data to n8n and to a model provider
leaves our boundary "unless both run inside it," and filed it as a decision for
Gustavo and Fredrik. That is still their decision and still not yours.

What changed is that we are now inside a certification with dated milestones, so
the answer has to be written down either way: self-hosted inside the boundary, or
an entry in the POA&M with a review date. **We mention it only so the endpoint is
not built on the assumption that it was settled.**

---

## 3. The three questions

**Q1 — The route.** Does
`POST /api/admin/assistant/ask`, behind `validateJWT`, staff sessions only, with
the existing `x-token` and `x-company-id` headers, answering `202 { job_id }` on
the job route you already expose, work for you? **No new header**, so the
production CORS allow-list does not change.

The body we send:

```json
{
  "question": "Which devices are overdue this week?",
  "conversation_id": "optional, from a previous answer",
  "company_id":      { "nosql": "65f0…", "sql": 12 },
  "staff_member_id": { "nosql": "65f0…", "sql": 34 }
}
```

**Both id forms, because Devitrak runs on two stores.** An agent handed only the
Mongo id has to spend its first step looking up the SQL one before it can read
anything, and an agent that guesses wrong answers confidently about the wrong
company. The ids are there so the answer is accurate, not so you can save a
lookup — see §4 for the rule that has to go with them.

Both envelopes are always present, with `null` where we do not have an id. The
agent should never have to branch on whether a key exists: a `null` says "we do
not know", a missing key is indistinguishable from a bug on our side.

If you want a different path or envelope, send the shape and we will follow it.

**Q2 — The short-lived token.** Can you issue a read-only token, scoped to one
`company_id` and the asking staff member's role, that expires in minutes, for the
agent to call the existing API with?

This is the question that matters most, and the reason is in §5. If you cannot,
tell us and we will design around it rather than guess — but something has to
stop the agent from reading across companies, and it cannot be us: **anything the
browser claims about who is asking can be forged**, including the four ids in
§3 Q1.

**Q3 — The limits.** A character cap on `question`, and the rate limit per staff
member and per company. Give us the numbers and we enforce the cap on our side
too, so a user sees the limit before spending a request on it.

---

## 4. The one rule that has to come with those ids: verify, do not trust

We send `company_id` and `staff_member_id` because the agent answers better
knowing them. **They arrive from a browser, so they can be edited before they
leave.** The rule that makes them safe is yours, and it is one line:

> Compare each of the four against the validated token. A mismatch is a 403 and
> an audit row — never a query.

Checked, the same field is useful twice. The agent gets its scope without a
lookup, **and a forged id stops being something nobody looks at and becomes a
tripwire that fires the moment anyone touches it.** Read instead of checked, it
is the opposite: one edited line in a console and a staff member is asking about
another company's data, with our own request body telling you it was fine.

So: route the agent's scope from what you verified, not from what we sent. We
send it to make the answer accurate and to give you something to compare
against.

## 5. Why Q2 is the one we would answer first

An assistant takes text from a person and turns it into API calls. That makes the
instructions driving those calls **untrusted input**, in the same way a web page
or an uploaded file is untrusted input. A question can be written to make an
agent try things nobody intended.

The defence is not clever prompting. It is that the credential the agent holds
**cannot** do the thing, no matter what it is asked. A token good for one company,
read-only, for a few minutes, means the worst outcome of a manipulated question is
a confusing answer about data that staff member could already see.

We are applying the same rule to what comes back: the model's answer is rendered
without raw HTML, and the links in `sources` are accepted only when they match our
own route table. A link the model invents is text, not something a staff member
can click. We mention it so you know the untrusted-content handling is on both
ends, not only yours.

---

## 6. The two questions we dropped

- **Streaming (SSE) instead of polling.** Not worth a proxy change while the job
  route works. If you would rather stream later, we will revisit it then.
- **Whether you store question and answer text, and for how long.** A real
  question, but a data-retention decision that belongs with the GovRAMP work in
  §2, not with building the endpoint. We will raise it there.

Still standing from October, unchanged: log every question in the staff activity
log (who, company, when, job id, outcome), whatever you decide about storing the
text itself.

---

## 7. What we will have ready

A chat window behind a feature flag that is off by default, calling only your
endpoint, polling the job like any other. Our side treats that polling as
background traffic, so it does not keep an idle session alive past the 15-minute
sign-out.

It will exist, tested, before we ask you for anything else.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
