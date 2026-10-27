# Customer assistant: a server endpoint between the dashboard and n8n (2026-10-27)

> **To:** backend agent · **From:** dashboard agent
> **Status:** proposal. Nothing is built on either side yet. The route, field
> names and job mechanics below are suggestions; change them and tell us.

## 1. What is being built

Gustavo is building an **n8n workflow** that takes a question from Devitrak,
hands it to an AI agent, and returns the answer. The dashboard will have a
chat window. It needs a server endpoint in between, because:

- **Anything in the dashboard bundle is public.** The n8n webhook URL and any
  secret it needs would be readable and callable by anyone (same problem as
  the old shared `auth-token`, F0.2).
- **The browser cannot be trusted to say which company or role it is.** If
  n8n takes `company_id` from the request, anyone can ask about another
  company's data.

```
Dashboard ──x-token──▶ server ──signed request──▶ n8n webhook ──▶ agent
                         │                                     │
                         │◀──── tenant-scoped API calls ───────┘
```

## 2. What we need from the server

### 2.1 One authenticated endpoint

Suggested: `POST /api/admin/assistant/ask`, behind `validateJWT`, with the
normal staff session headers (`x-token`, `x-company-id`). **No new header**,
so nothing changes in the production CORS allow-list.

Request from the dashboard:

```json
{ "question": "Which devices are overdue this week?", "conversation_id": "optional, from a previous answer" }
```

### 2.2 The server, not the client, decides who is asking

From the validated token and session, the server adds:

- `company_id`;
- `staff_id`;
- the resolved role, plus scoped-role location limits if any.

It then forwards to n8n. Any `company_id`/role fields in the request body are
ignored.

### 2.3 Server → n8n is authenticated

The webhook URL and a shared secret live in server env vars only. We suggest
an HMAC signature over body + timestamp, with n8n rejecting stale timestamps,
so a leaked URL alone is not enough. Your call on the mechanism.

### 2.4 The agent reads data only through tenant-scoped endpoints

When the agent needs data, it must not run its own SQL or use a key that sees
all companies. Our suggestion: for each question, the server issues a
short-lived, read-only token limited to that `company_id` + role (minutes,
not hours). n8n uses that token to call the existing API. The agent then
inherits the permission checks that already exist, and gets nothing more.

If the agent should ever **act** (assign, return, send email), that is a
separate decision. Start read-only.

### 2.5 Long answers: 202 + polling

An agent with tool calls can take tens of seconds, which is past what the
proxy tolerates. Please return `202 { job_id }` and expose it through the
same job-status route `BackgroundJobsTracker` already polls. If you prefer
streaming (SSE), tell us; it needs proxy changes.

Final result shape we would render:

```json
{ "answer": "markdown text", "conversation_id": "…", "sources": [{ "label": "Device ABC-001", "path": "/inventory/item?…" }] }
```

`sources` is optional. If present, we turn it into in-app links.

### 2.6 Limits and logging

- **Rate limit** per staff and per company (LLM calls cost money and can be
  abused).
- **Length cap** on `question` (we will enforce the same cap on our side;
  tell us the number).
- **Audit:** log every question in the staff activity log (who, company,
  when, job id, outcome). Whether to store the question and answer text is
  a data-retention decision; it may contain personal data.

## 3. FedRAMP note

Customer data sent to n8n and to the model provider leaves our boundary
unless both run inside it. Self-hosted n8n inside our infrastructure fits
better than n8n Cloud. The model provider needs to be FedRAMP-authorized, or
the model must run in our infrastructure. This is a decision for
Gustavo/Fredrik; it does not block building the endpoint.

## 4. Our side

A chat window in the dashboard behind a feature flag, off by default. It
calls only your endpoint and polls the job like other background jobs. The
idle sign-out (15 min) still applies, so we will treat polling as background
traffic and not as user activity.

## 5. Questions

1. Do you agree with the route and the 202 + job polling, or do you prefer
   another shape?
2. Can you issue the short-lived, company-scoped, read-only token for the
   agent (§2.4)? If not, how do you want the agent to reach data safely?
3. Who will use it first: company staff in the dashboard, or end consumers?
   If consumers, it needs the consumer token instead and a separate endpoint.
4. The `question` length cap and the rate limits you want.
5. Do you store the question/answer text, and for how long?
