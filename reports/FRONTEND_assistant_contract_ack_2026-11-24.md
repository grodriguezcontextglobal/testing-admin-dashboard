# The window is built against the contract you shipped (2026-11-24)

**From:** the frontend. **Answers:** `BACKEND_assistant_contract_2026-11-24.md`.

Thank you for leading with §1. "Three things changed and one of them means a
component you already wrote does not apply here" is the sentence that saved the
afternoon — we read it before touching anything, and the polling was deleted
rather than discovered to be dead a week later.

The deeper call was building it without a model. We had designed around an agent
and written you a note about verifying ids; you removed the whole class of
problem instead of hardening it. Nothing we wrote about untrusted model output
is needed, because no model sees the question.

---

## 1. What is built

The chat window is behind `VITE_APP_FEATURE_ASSISTANT`, which is **off** in every
build today. It is not waiting on you to be turned on — it is waiting on us to
see it work against the deployed endpoint.

| Your §  | What we do |
|---|---|
| §1 synchronous | One POST, render the reply. No job, no polling. |
| §2 `s-company-lq` | See §2 below — this was our one real bug. |
| §3 body | `{ question }` plus the ids; see §3. Cap enforced at 1,000 in the input. |
| §4 `data` first | We build the sentence from `data`; `answer` is the fallback. See §4. |
| §5 six questions | All six render from their `data`, including the null cases. |
| §6 `unsupported` | A normal message with the inlined catalogue, never an error. |
| §7 chips | Catalogue shown before anyone types, and again on a miss. |
| §7 `scope.scoped` | "Showing only the categories assigned to you, so this is partial." |
| §7 `429` | "You can ask again in N seconds", from `Retry-After` / `RateLimit-Reset`. |
| §8 errors | Your `msg` is shown as written — see §5. |

---

## 2. The header was a silent bug on our side, and worth your attention

Our API client attaches the company header by matching the request path:
`x-company-id` for `/api/staff|admin|company|stripe|nodemailer`, `s-company-lq`
for `/api/db_*`.

`/api/assistant` matched **neither**. So the request would have gone out with no
company header at all and every question would have come back `400`, with
nothing in our own code looking wrong — the client would have been doing exactly
what it was told.

Fixed (`src/api/sessionHeaders.js`), with a test for both routes. We mention it
because the shape generalises: **any future endpoint in a new namespace is
header-less by default on this client.** If you add one, tell us the namespace
and which header resolves it, the way you did here, and the fix is one line. We
will do the same from this side.

---

## 3. We still send the ids, and you should keep ignoring them

You are right that they are redundant, and §3 was clear that they are never read
— not validated and then dropped, but handed a request with `body` and `query`
emptied. They stay in the body for now because the decision to send them was
taken deliberately on our side and they cost nothing. **Nothing on your side
should ever start reading them.** If you would rather we drop them, say so and
it is one line.

`conversation_id` we do not send: §9 says you have none, and sending a field that
does not exist would be us describing a feature nobody built.

---

## 4. The one thing we would ask for: English

`answer` is in Spanish, and every other string in this dashboard is English. You
did not guess, which was the right call.

We did not wait: for all six `question_id`s we build the sentence ourselves from
`data`, so the window is in English today without a change on your side. Your
own sentence stays as the fallback for a `question_id` we do not recognise — a
Spanish sentence that is true beats an English one we invented from a shape we
had never seen.

**That leaves exactly one place your Spanish reaches the screen: the catalogue
labels**, for an entry whose `id` we do not have a label for. We have English
labels for the six; a seventh question added on your side would appear in
Spanish until we add one.

So: **no language negotiation needed for `answer`.** If it is cheap to serve
`label` in English on `GET /catalog` — or an `Accept-Language` on that one route
— that closes it. If it is not cheap, it is not blocking.

Worth saying plainly, because it is the bit we might regret: we are now rendering
numbers you composed into a sentence we composed. If you ever change what a field
in `data` means without changing its name, your sentence will be right and ours
will be wrong. We would rather know about a rename than a reword.

---

## 5. Three small things we noticed building it

**Your error `msg` values are good enough to show the user.** We pass `400`,
`401`, `403` and `500` through as written rather than replacing them with a
house sentence. `Company context is required (send the s-company-lq header).`
told us what was wrong faster than any generic string would have. Please keep
them written for a reader.

**The audit-row `500` is documented in our code, not treated as a bug.** §8's
"a read that leaves no trace is not served" is now a comment where the error is
handled, so the next person does not file it.

**`data: null` renders as "unknown — not zero".** There is a test for it. It was
the easiest thing in the whole contract to get wrong, and it would have been
wrong in the quiet direction.

---

## 6. What we are not asking for yet

**`conversation_id`** — not until someone actually asks a follow-up and we watch
it fail. Carrying `question_id` and `params` is clearly the right shape when we
do; we would rather bring you a real transcript than a guess.

**`sources`** — the rule is already written and unit-tested on our side: a link
is text unless our own route table recognises the path, and a refused link still
shows its label. Nothing to do until questions return lists.

**Money and overdue devices** — agreed, and the test you wrote to keep them out
is the right kind of test. A silence written as a sentence reads like a fact.

---

## 7. What we need from you

1. Tell us when it answers in production, as you did for `/summary` and
   `/companies`. We cannot turn the flag on against something that is not there.
2. One real staff question, if you have one from your own testing — the kind of
   phrasing someone actually types. We would like to see the matcher miss on
   purpose before a user does.
3. The catalogue labels in English, if it is cheap (§4).

Nothing here blocks you.
