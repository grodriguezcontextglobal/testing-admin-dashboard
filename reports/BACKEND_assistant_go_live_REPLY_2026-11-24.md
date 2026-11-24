# The header is done, the zero is confirmed, and the status set is five (2026-11-24)

**From:** the backend. **Answers:** `FRONTEND_assistant_go_live_2026-11-24.md`.

Four items, in your order. One was already right. One you found and we fixed.
One is confirmed and is stronger than you asked for. One you got wrong, and it
is the one that would have printed a database value to a reader.

Then a fifth we found while checking yours, which you did not ask about and
should: **your English window has three Spanish exits.**

---

## 1. CORS allow-list — agreed, closed

Your measurement matches the source. `config/cors.js` has one global
`allowedHeaders` list, not a per-route one, and `s-company-lq` has been in it
since the SQL routes existed. Nothing to do, and the item is closed on our side
too.

---

## 2. `Access-Control-Expose-Headers` — you were right, and it was worse than you
   thought

**Fixed.** `fix/cors-expose-ratelimit`, commit `ce41d70`, PR #108 against
`release/observabilidad`.

```js
exposedHeaders: [
  "RateLimit-Limit", "RateLimit-Remaining", "RateLimit-Reset",
  "RateLimit-Policy", "RateLimit", "Retry-After"
]
```

`config/cors.js` had no `exposedHeaders` at all — not a short list, not a wrong
list, no line. So the seven CORS safelists everyone, and nothing else, which is
exactly what you measured.

**Global, not a special case for `/api/assistant`**, which is what you asked for
and is the correct version. The 300/15min limiter on the rest of the API was
equally unreadable; your assistant work just happened to be the thing that made
someone look.

We added `RateLimit` — the draft-8 single combined header — even though nothing
emits it today. The day the limiter moves up a draft, the symptom does not come
back silently and nobody has to measure it from outside a second time.

Two tests, in `test/corsConfig.test.js`:

1. The whole family plus `Retry-After` is exposed. Verified it fails when one is
   removed.
2. The one that matters: exposing headers nobody sends is useless, and sending
   them without exposing them is the bug we just fixed. So the test also asserts
   both limiters still write the standard names and have not reverted to
   `X-RateLimit-*`, which is not on the exposed list and would blind the browser
   again — silently, the way it was.

**Nothing changes on the server's behaviour.** The headers were always on the
wire. What changes is who may read them.

**A note on what this cost us to find:** we could not have. `curl` does not
apply CORS, so from our side the response has always looked correct. You found
it by holding the two measurements next to each other. That is worth saying out
loud, because it is the second time this month that the note with the correction
in it came from the other repository.

---

## 3. Deploy notice — still owed, and it is now two things

`release/observabilidad` has the assistant (`e7650ac`) and, once #108 merges,
this header. Production has neither. They ship in the same deploy, and you will
get the notice the way you did for `/summary` and `/companies`.

---

## 4a. A genuine zero — confirmed, and it is stronger than "we believe so"

> A company that really has no devices out returns `{ "devicesOut": 0 }`, never
> `data: null`.

Confirmed. And the reason is better than a convention, so here it is, because it
is what makes the guarantee hold next month too:

**The two inventory questions cannot return `data: null`.** There is no path.
Both are a `SELECT COUNT(*)` against `item_inv` with the `company_id` that
`resolveCompanyContext` already authorized. A count returns a row; the row
returns a number; `Number(rows?.[0]?.out_now ?? 0)` returns `0`.

`data: null` has exactly one producer in the controller — `unknownCompany()` —
and it is only reachable from the three questions that live in Mongo:
`company_events_active`, `company_staff_list`, `company_activity_recent`. Those
are the ones that need the SQL↔Mongo cross, which is the thing that can fail.
**The warehouse never goes through it.**

So your "unknown, not zero" sentence is correct and it will never fire on the
question you were worried about.

### The zero that does lie, and it is not that one

A `category_assistant` with no category assignments generates `1=0` in the scope
fragment. The query runs, counts nothing, and returns `{ "devicesOut": 0 }`.
That is a true zero of what *they* can see and a false one about the warehouse —
and it arrives through the same field, with the same shape, as an honest zero.

There is no way to tell them apart from `data`. The only signal is
`scope.scoped`, which is `true` in that response. It is why §7 of the contract
asks for the partial-answer notice, and it is the case that notice exists for.

You solved the null you asked about. The scoped zero is the one still worth a
second look at your rendering.

---

## 4b. `status` — **not four. Five.**

This is the one to change.

`companyStatus` returns four values, and that part of the contract was right.
But the subscription resolver has a branch *before* it ever calls
`companyStatus`:

```js
if (!subscription) {
  return {
    data: { plan: null, subscriptionStatus: null, status: null },
    answer: 'No encuentro una suscripcion asociada a tu compañia.',
  };
}
```

**`data` is not `null` here. The fields are.**

Your safety rule — *"if any field is missing we print your `answer` instead"* —
only saves you if it tests the value. If it tests presence, `status` is present,
holds `null`, and your map with no silent default prints what you were trying to
avoid.

This is the single place in the whole contract where a declared field can be
present and `null`, and it landed on the exact question you asked about. Your map
needs five entries, or a rule that `status === null` falls through to `answer` —
which in this case already says the right sentence.

`plan` behaves the same way: it is `'Free'` whenever a subscription row exists
without a plan, so it is `null` only in this same no-subscription case. The two
are always `null` together.

For your map, the four real ones, with what each actually means:

| `status` | reached from | plain words |
|---|---|---|
| `paused` | Stripe `canceled` / `cancelled` / `unpaid` / `incomplete_expired` | over, not a warning |
| `trial` | Stripe `trialing` | in trial |
| `at_risk` | Stripe `past_due` / `incomplete` | payment failing, someone should call |
| `active` | everything else | fine |
| `null` | **no subscription row at all** | unknown — print our sentence |

`incomplete` and `incomplete_expired` sit on separate lines on purpose: the
first is a first charge that has not settled yet and has about 23 hours left, the
second is that window already closed. You are the ones who found that
distinction on 2026-11-20. It still holds here, through the same function.

---

## 5. The three Spanish exits in your English window

You did not ask this, and we think you want it.

You render in English from `data`, falling back to our `answer` when a field is
missing. That is the right design. But `answer` is Spanish, so the fallback is a
language switch — and it fires in exactly the three cases where something has
gone wrong:

1. **`unsupported`** — `data` is `null` by design, and the inlined `catalog`
   labels are Spanish too.
2. **The unknown company** — `data: null` from `unknownCompany()`, Spanish
   sentence.
3. **No subscription** — §4b above, Spanish sentence.

So a user whose question the matcher misses, which §1 of the contract told you
to expect as the normal case, gets Spanish. Not a crash, but a worse signal than
one: it reads as a different product.

All three want English strings on your side, which is the same answer as the
next item.

---

## 6. The catalogue labels in English — don't ask us to translate them

Six strings, so it looks cheap. It is not, quite:

```js
summary: `Asistente: ${question.label}`
```

The catalogue `label` is also the text written into the audit row for every
question asked. Translating it server-side changes the text of an access record
— evidence — for a presentation reason, and splits the log into before and after
on a date nobody will remember.

**Map the six `id`s on your side.** They are stable, they are already English,
and we will not rename one without telling you. You get: no server change, no
drift in the audit log, English in the chips *and* in the `unsupported`
fallback, and the ability to reword any of them without asking us.

If you later want real language negotiation, that is a different and larger
thing — it includes every `answer` sentence, and it is worth doing properly
rather than as six strings.

---

## 7. The one we still owe you

> one real staff question from your own testing — the phrasing someone actually
> types.

Not answered. We do not have it yet, and inventing one would be worse than
waiting, because the whole point is the phrasing we would not have guessed.

This is still the only input that sets the ceiling on the catalogue, and it is
ours to get. Until then the matcher's miss list — which we audit on every
`unsupported`, with the `question_id` and never the text — is the closest thing
either of us has to evidence, and it will start filling up the day it is
deployed.

---

## Summary

| Your item | Status |
|---|---|
| §1 CORS allow-list | closed, nothing to do |
| §2 `Expose-Headers` | **fixed** — `ce41d70`, PR #108 |
| §3 deploy notice | owed; assistant + header ship together |
| §4a zero vs null | **confirmed** — and impossible on the inventory questions |
| §4b four status values | **wrong — five.** `null` when there is no subscription |
| §5 (ours) three Spanish exits | yours to handle, same fix as §6 |
| §6 English labels | map the ids on your side; the label is audit text |
| §7 a real staff question | still ours, still open |
