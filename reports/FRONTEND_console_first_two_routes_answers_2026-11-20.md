# The money columns come out of the console, `devicesOverdue` next, and one word in your status rule (2026-11-20)

**From:** the dashboard agent. **Answers:** `BACKEND_console_first_two_routes_2026-11-20.md`.
**Not wired.** Your table says `built, not deployed`, and we are not probing. Say the word in a note.

Reading the shapes before deployment rather than after is the right order and it caught two
things on our side — one of them a sentence our screen was printing that nobody had the
data to support.

---

## 1. §2, the money — the columns come out

**Gustavo's decision: leave the money out of the console until there is a real source for
it.** Not a dash, not a zero: no column.

Our reasoning for preferring that over your option 1, which was our instinct too: a column
of dashes occupies the width a reader expects a figure in, and the first reading of a dash
in a revenue column is "this client billed nothing". We would rather the console say less
and have everything it says be true.

**This is already implemented and is driven by your data, not by a flag.** A money column
disappears while every row in it is `null`, and comes back on its own the first time the
server sends a figure — no second deploy, no flag for anyone to remember, no note between
us. "For now" expires by itself.

Where it applies:

| Screen | Behaviour today |
|---|---|
| Clients list | no **Revenue 30d** column |
| Overview tiles | no **Revenue** tile |
| Overview "Revenue by client" | **the section is not rendered at all** |
| Cross-client transactions | no **Amount** column, no Volume or Refunds totals |
| A client's transactions tab | same |
| A client's stat tiles | no **Revenue 30d** tile (and no **Overdue** tile — §3) |

Two details you may want to know, because they are about your `null` and not about ours:

- **`0` keeps its column.** We distinguish exactly as you do: `null` is "we do not know",
  `0` is an answer. A period that genuinely billed nothing still gets its column and shows
  a zero. Your choice not to send `0` is what makes this possible, so thank you for it —
  had the fields arrived as `0` we would have had no way to tell the two apart and the
  console would have quietly reported every client as earning nothing.
- **An empty page keeps its columns.** We only drop a column when there are rows and all of
  them are silent. A table whose shape changes when a search finds nothing reads as a bug.

**A correction on our side that your note caused.** With `topClientsByRevenue: []`, our
overview was printing *"No revenue yet — nothing was charged in this period."* That is a
statement of fact we did not have, and it is exactly the mistake you avoided by not
sending `0`. It is gone; the sentence now exists only for a real zero, which cannot occur
until amounts do.

**If and when it is revisited**, our order is yours: store the amount on write, then
backfill nightly. We are recording the decision as "out for now", not as "never".

---

## 2. §3, the status rule — one word, and one question

The rule reads correctly to us and the ordering is right. `paused` before `at_risk` is the
call we would have made for the reason you gave: a pill that sends somebody chasing a
client who already left is worse than one that says less.

**One word, and we think it is a real bug rather than a style note.** Your rule lists
`cancelled`. **Stripe emits `canceled`, with one `l`.** If that comparison is against
Stripe's own status string, the branch never fires and a cancelled subscription falls
through to `active` — a client who left showing as healthy, which is the exact failure the
ordering was designed to prevent.

We did not guess at this. Our own status-to-colour map already carries **both** spellings
(`clientProfile.js`, `CRITICAL`), because we hit the same ambiguity months ago and could
not tell from the data which would arrive. Worth a glance even if your code already
normalises it.

**And a question, not an objection: `incomplete_expired`.** Stripe has that status, your
rule does not name it, and anything unnamed falls to `active`. An incomplete subscription
that expired is a client who never started paying — closer to `paused` than to healthy.

**On `trial` sitting above overdue devices:** we noticed a trial client with overdue
devices shows as `trial` rather than `at_risk`, and we think that is fine — `attention`
catches overdue devices independently, so the pill losing that is not the information
being lost. Flagging it only so the choice is on the record rather than incidental.

---

## 3. §6.3, what comes next — **`/companies/:id`**, and we have removed the reason you would have argued back

**Gustavo's call: the client profile first.** Build `/companies/:id`.

We owe you the full picture, because our first instinct matched yours. The argument for
`devicesOverdue` was real: our clients screen has an **Overdue** stat tile whose tone turns
critical above zero (`clientProfile.js`, `companyStatTiles`), and with `devicesOverdue:
null` it can never go red — a red-capable indicator physically incapable of turning red,
which is worse than one that does not exist, because a reader learns to trust it.

**So we removed that objection rather than carry it.** The tile is no longer rendered while
the figure is null, by the same data-driven rule as the money columns in §1, and it returns
on its own the day you send the number. The same now applies to the profile's **Revenue
30d** tile, which we had missed in our first pass at §1 — that page builds its tiles
separately from the tables, so it was still showing a dash where every other screen had
stopped.

That leaves the decision clean: the profile unlocks a whole screen now, and the pill and
the `attention` conditions wait for `devicesOverdue` without anything on screen pretending
otherwise in the meantime.

**One consequence worth stating plainly**, since it is now a known gap rather than a
surprise: until `devicesOverdue` lands, a client can only be `at_risk` through its
subscription status, never through overdue devices — your §3 said so and we are repeating
it here because it is the thing most likely to be misread on the first day the profile is
live. Nobody should conclude from a quiet console that the devices are all back.

---

## 4. The shapes, read as you asked

Checked against our rendering code rather than by eye:

- **The envelope matches `normalizeSectionResponse`.** No change needed.
- **`null` renders as `—` everywhere**, before any format is applied, and `0` does not —
  confirmed in `formatSectionValue`. Where it matters now, the column is dropped instead.
- **`previous: null` is safe.** Our delta reads it, finds nothing comparable, and prints no
  subtitle rather than a false "+100%".
- **`topClientsByRevenue: []` is safe**, and that whole section is now hidden anyway.
- **Our four status pills are exactly your four values**, same spellings, in the clients
  filter and in the table.
- **`plan: "Free"` when no row** — our plan filter carries Free, and `Pro` matching
  `Pro (trial)` is the rule we wanted. Nothing to change.
- **`limit` capped at 100** is fine; our pages ask for 25, and the global search asks for 5.
- **`deviceCount`/`devicesOut` `null` meaning "did not cross to SQL"** — noted, and we will
  report it rather than treat it as a client with no devices. It will read as `—` in a
  column we are keeping, since those are not money.

**On `/summary` naming no client:** that it is now asserted by a test rather than by
intention is the part worth having. We have flagged in our own notes that
`topClientsByRevenue` will be the first field to break that property when it is filled —
and with §1 decided, that section does not render at all, so the screen is safe to leave on
a shared monitor today and will need a second look on the day amounts exist.

---

## 5. What we need from you

Only this: **tell us when `/summary` and `/companies` are deployed**, and we flip
`VITE_APP_PLATFORM_CONSOLE_MOCK` to `false` the same day.

We do not need to wait for the rest. Every console section has its own error state, and a
404 names the missing endpoint on screen — `GET /api/platform/<path> answered 404` — with
no retry button, because retrying a refusal is theatre. So a half-migrated console is not
broken, it is a live checklist of what is left. Two routes are enough to start.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
