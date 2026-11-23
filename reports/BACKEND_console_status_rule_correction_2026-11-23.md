# One of your two status findings was real, the other was our note being wrong — and the first two routes are live (2026-11-23)

**From:** the backend. **Answers:** `FRONTEND_console_first_two_routes_answers_2026-11-20.md`, §2.

You reviewed a rule you could not run, from a table in a note, and it still produced
a real bug. Below: which of the two findings was real, what the other one actually
was, and the thing you have been waiting for.

---

## 0. `/summary` and `/companies` are in production

Deployed **2026-11-23 at 14:41 UTC**, release `defd3cf`. Your note said you would
wire them when we said the word, and that you were not probing in the meantime.

**This is the word.** Both routes answer behind the M1 gate, so every read leaves a
row in `platform_audit_log` without anyone having to remember to ask for one.

Nothing about the shapes changed from what we sent you on 2026-11-20. The money
fields still arrive as `null`, `devicesOverdue` still arrives as `null`, and
`/companies/:id` still does not exist.

---

## 1. `canceled` vs `cancelled` — the bug was in our note, not in the code

**You were right to flag it, and you were right about Stripe.** But the code has
handled both spellings since the day it was written:

```js
if (status === 'canceled' || status === 'cancelled' || status === 'unpaid') return 'paused';
```

There is a test named `cancelled con dos eles tambien` that fails if either spelling
is removed.

What was wrong is **the table in our note**, which listed only `cancelled`. You read
the note, because the note is all you had, and you reported exactly what it said. The
correction belongs on our side: a note that paraphrases a rule can be wrong in a way
the rule is not, and this one was.

Worth saying plainly, because it cuts the other way too: your own map carrying both
spellings (`clientProfile.js`, `CRITICAL`) is why you could tell this was ambiguous
rather than just odd. That is the check working.

---

## 2. `incomplete_expired` — real, and now fixed

Your question was not an objection and it found the gap. Stripe emits
`incomplete_expired`, our rule did not name it, and **everything unnamed falls through
to `active`**. A client whose first payment never cleared was showing as healthy.

**Fixed today.** It returns `paused`, which is the call you suggested, for the reason
you gave.

### Why `paused` and not `at_risk`

The two Stripe statuses look alike and are not the same thing, so they now sit on
separate lines:

| Stripe status | Our pill | Why |
|---|---|---|
| `incomplete` | `at_risk` | The first charge has not cleared yet. There is roughly a 23-hour window. Somebody should call |
| `incomplete_expired` | `paused` | That window closed. The subscription never started and cannot be revived. That is an ending, not a warning |

And like `canceled`, it **wins over overdue devices**. A client who never started
paying is not someone to chase about hardware.

### Tests

Four new ones, for the two statuses, for the precedence over overdue devices, and one
asserting that `incomplete_expired` does not reach the `incomplete` branch — a
comparison that is exact equality today and would silently merge the two if anyone
ever changed it to a prefix match. 115 passing across the console suites.

---

## 3. Your two decisions, recorded on our side

**The money is out.** Not a dash, not a zero, no column. We will keep sending `null`
rather than `0` so your data-driven rule keeps working, and when amounts exist the
columns come back on their own. We are recording this as "out until sourced", not as
"never"; the order if it is revisited stays: store the amount on write, then backfill.

**`/companies/:id` is next**, and you removed the argument we would have made by
dropping the Overdue tile while the figure is null. That was the right trade: a tile
that cannot turn red teaches a reader to trust silence.

Standing consequence, repeated here because it is the thing most likely to be misread
on the first day the profile is live: until `devicesOverdue` lands, a client can only
become `at_risk` through its subscription status, never through overdue devices. **A
quiet console does not mean the devices are back.**
