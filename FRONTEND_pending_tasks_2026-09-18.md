# Beta Testing Walkthrough — Engineering Task List

> **Source:** two recordings of the same 2026-09-18 beta-testing session,
> Fredrik Starmark with Gustavo Rodriguez:
> **Part 1** — `meeting_tasks/beta_testing_09_18_2026.txt`, 31 min (items 1-13).
> **Part 2** — `meeting_tasks/Devitrak Beta Testing.vtt`, 26 min, recorded after
> the break (items 14-28). Timestamps restart at zero in part 2, so every
> citation below says which part it comes from.
>
> **Scope:** part 1 covered login/session handling and the **add-inventory
> wizard**; part 2 covered the **XLSX import template** and the **bulk-update
> wizard**. The scanner was never exercised — nobody had one in the room
> (P1 `9:32`).
>
> Written in English because every string quoted below is a UI string, and
> because the previous punch list (`FRONTEND_pending_tasks_2026-08-31.md`) is.
>
> Each item cites the timestamp where it was raised, so the recording settles any
> dispute about what was actually asked for.

---

## 0. Summary

| # | Item | Where | Priority |
|---|---|---|---|
| 1 | Stop showing "queued" on the session-revoke modal | P1 `2:13`–`3:26` | **done** |
| 2 | Make MFA mandatory — remove the opt-out | P1 `6:14`–`6:48` | **done (client)** |
| 3 | Drop the password re-entry on session revoke | P1 `5:15`–`6:48` | **done (client)** — needs a token in the link |
| 4 | Wizard buttons: "Continue to step N", not "Continue to location" | P1 `12:50`, `29:11` | **done** |
| 5 | Step-1 notice must name step 5 explicitly | P1 `10:16`–`10:30` | P2 |
| 6 | Validation error is too easy to miss | P1 `13:27`–`13:55` | P2 |
| 7 | Copy-details filters must cascade | P1 `10:33`–`12:46` | **done** |
| 8 | Pre-fill location in step 2 from the copied group | P1 `13:55`–`14:55` | **done** |
| 9 | Rewrite the "One at a time" instructions | P1 `16:17`–`19:21` | **done** |
| 10 | Rename the three unit-entry options | P1 `18:25`–`19:21` | **done** |
| 11 | Rewrite the paste-a-list instructions | P1 `19:26`–`26:30` | **done** |
| 12 | Align the paste placeholder's example columns | P1 `20:50`–`21:32` | **done** |
| 13 | Delete the redundant scanner instructions | P1 `27:07`–`27:38` | **done** |
| 14 | XLSX template: rename "Group" to "Item Name" | P2 `1:02`–`2:47` | **done** |
| 15 | Delete every "also accepted as"; make column names strict | P2 `2:23`–`5:58` | **done** |
| 16 | "Taxable Location" description | P2 `2:54`–`3:58` | P3 |
| 17 | "Sub Locations" description — drop "outermost first" | P2 `5:58`–`7:49` | P3 |
| 18 | Delete every "Default: empty" | P2 `7:49`–`8:32` | **done** |
| 19 | Extra identifiers — approved, minor trim only | P2 `8:34`–`9:34` | P3 |
| 20 | **Image column must not accept public URLs** | P2 `9:38`–`12:18` | **done** |
| 21 | Gustavo imports 10 units on ABC Interpreting and reports back | P2 `13:13`–`13:35` | **P1** |
| 22 | Bulk update: pre-fill location when all items share one | P2 `13:35`–`16:45` | P2 |
| 23 | Bulk update: Location hint is wrong | P2 `16:48`–`17:17` | P3 |
| 24 | Review: "12 items **will be** updated" | P2 `17:49`–`18:41` | P3 |
| 25 | Review: "These are the changes that will be made" | P2 `18:41`–`19:46` | P2 |
| 26 | Review: explain the mid-wizard race properly | P2 `19:46`–`23:14` | P2 |
| 27 | Apply button must not promise a count | P2 `22:27`–`23:19` | P2 |
| 28 | Rewrite the no-bulk-undo sentence | P2 `24:48`–`25:31` | P3 |

Items 1-13 come from part 1, 14-28 from part 2.

Three items he raised are **already done in the code** — see §4 before touching them.

**Next session: Tuesday or Wednesday next week** (P2 `25:31`). He asked for a
faster cadence — *"I'd rather keep going like more, more, more now, because I
learn from it too, and it helps me being able to present the system."*

---

## 1. Authentication and sessions — P1

These are the only items outside the wizard, and they are the ones with security
weight. They also came first in the session, before he had even logged in.

### 1. Stop telling the visitor the email is queued — DECIDED 2026-09-18

He hit "active session already exists", asked for the revoke email, and got
*"is queued and will be sent out shortly"*.

> `2:13` — "That's not something that should be said. It should be sent out. I
> mean, there's no reason why an e-mail cannot be sent out right away."
>
> `3:01` — "if somebody does this, they are sitting here because they want to
> sign in… So queuing that e-mail is not what you want to do because you're
> basically saying, sorry, we don't have time to work with you."

**Decision taken 2026-09-18: the queue stays; the copy changes.** Taking this
one email off the queue was the original plan and would have needed backend
work. It was dropped in favour of the cheap half, because Fredrik's objection
has two halves and only one of them is about latency:

1. *Do not expose our queue to the visitor.* Whether we hold mail in a queue is
   our problem. **This half is now fixed** — `src/pages/authentication/Login.jsx`
   no longer says "queued and will be sent shortly"; it says *"We've sent you an
   email to revoke the active session. Check your inbox."*
2. *Send it faster.* Still true, still backend, **not scheduled**.

**Why the new wording stops where it does.** It claims the action we took, not
an inbox we cannot see. "Sent" plus "check your inbox" is true the moment the
request is accepted; "delivered", or any promise of a time, would not be — and
this is the worst possible place to be caught in one, because the visitor is
standing at a login they cannot pass and will go looking immediately. Replacing
an honest "queued" with a false "it's already there" would be a step backwards.

**The honest upgrade, if the queue turns out to lag.** The endpoint already
answers `202 { jobId }` — `handleSendForceLogoutEmail` currently discards the
response. Capturing the `jobId` and polling `GET /jobs/owned/:jobId` until
`done` would let the modal say "Sent" as a fact rather than an intention, with
no backend change at all; `DocumentUpload.jsx` has the local-poller pattern for
exactly this. It costs a spinner for however long the queue takes, which is the
honest trade: the visitor waits either way, and this way the screen does not lie
about it. **Not done** — worth doing only if someone measures the latency and it
is bad.

> **Open question this raises.** Six other screens say "queued" to the user:
> `EventLinkNotification.jsx`, `FeedbackEvent.jsx`, `ItemReportForClient.jsx`,
> `SingleEmail.jsx` and `EmailReturnRentalItems.jsx` (×3). That copy was written
> deliberately when the backend moved ~37 endpoints to `202 + jobId`
> (`FRONTEND_task_queue_changes.md` §2), so it is not an oversight. But if
> "queued" is the wrong word to show a visitor here, it is worth asking whether
> it is the right word anywhere. **Left alone on purpose** — none of those block
> anyone the way a login does, and reversing a deliberate decision across six
> screens needs its own conversation, not a drive-by.

### 2. Make MFA mandatory

> `6:14` — "we should actually not allow that. I think it is important that we
> have MFA as a rule because it's so much problems going on and we need to have a
> very high level of verification for access to Devitrak because it is people's
> inventory and one misstep with security, and you're gonna have a big problem."

**Task:** remove the option to run without multi-factor authentication. Decide
and write down what happens to accounts that already have it off — forced
enrolment on next login is the usual answer, but that is a product decision
nobody made in the room.

Agreed at `6:38`: *"let's force that you have to have the multi-factor
authentication activated."*

#### Decided and shipped on the client 2026-09-21

**The decision the room did not make:** forced enrolment on the next sign-in.
An account with MFA off is not locked out and is not emailed — it is stopped at
the point where it would have received a session, and enrols there.

**Why the check could not be a status code.** `loginUser` challenges for a code
only when the account *already* has `mfaEnabled` (`controller/admin.js`). An
account that never enrolled authenticates on a password alone and the server
says nothing about it. So the client reads `entire.mfaEnabled` off the login
response and refuses to build the session without it — a missing flag counts as
not enrolled, because accounts predating the field are exactly the ones this
rule exists for.

Three places, one component (`authentication/mfa/MfaEnrollmentModal.jsx`):

1. **The login gate.** `Login.jsx` stops between "credentials accepted" and
   everything that follows. Nothing is written to localStorage and nowhere is
   navigated. On success the flow *resumes* at `continueAfterAuthentication`
   with the token already in hand — it does not ask for the password again —
   and then goes on to the company picker or the single company exactly as
   before. Cancelling returns to the sign-in form with no session.
2. **Registration.** `/registration/new` answers with a JWT the app had been
   discarding; `/api/admin/mfa/*` only wants a valid JWT, so that token is what
   authenticates enrolment at the end of sign-up, before the account is ever
   used. Deferring there is allowed and says so — the login gate asks again and
   cannot be walked past. The existing-user path
   (`/registration/add-company`) returns no token and is covered by the gate.
3. **The opt-out is gone.** Profile → MFA Setup no longer offers "Disable MFA".
   `POST /mfa/disable` is left in place and unused: with login refusing a
   session to an account without MFA, that switch could only strand someone
   outside the app.

**One detail worth keeping in mind.** The login response is captured *before*
`/mfa/verify` runs, and it is what `onLogin` copies into the admin slice
(`state.mfaEnabled = payload.data?.mfaEnabled`). Handing it over unpatched
would tell the profile page MFA is off on the very session that turned it on —
hence `markEnrolled` in `utils/mfaEnrollment.js`.

**Still open, and it is the backend's half.** The server will still issue a
token to an account with MFA off; only the client declines to use it. A
determined caller can skip the gate entirely by posting to `/api/admin/login`
itself. Making this a real rule means refusing the session server-side — the
natural shape is a 403 carrying an enrolment token instead of a session token.
Until then this is a strong front-door lock on a door the back of which is
still open, and it should be said that way to Fredrik rather than reported as
"MFA is now mandatory".

### 3. Drop the password step when revoking a session

Today the emailed revoke link still asks for the password. Fredrik's argument:

> `5:15` — "So there you have a level of verification already. The only thing
> you're asking is to revoke a session. They get an e-mail and then they can
> click revoke it."
>
> `5:32` — "I'm logging in here with my credentials and I wouldn't get this
> e-mail here… had I not provided the right MFA authentication code."

Gustavo's counter (`5:25`) was the shared-mailbox case — a colleague with access
to your inbox. **That objection only dissolves once #2 is done**, which is
exactly the trade Fredrik proposed and Gustavo accepted:

> `6:38` — "let's force that you have to have the multi-factor authentication
> activated. And with that, we don't need to provide the password again."

**Task:** after MFA is mandatory, reduce the revoke flow to a single click from
the email. **Do not ship this before #2** — on its own it weakens the flow.

#### Client done 2026-09-21, waiting on one thing from the backend

Fredrik is right about the part he described: `loginUser` runs the MFA check
**before** it raises the 409 session conflict, so anyone who sees "an active
session already exists" has already passed both factors. A third password prompt
proves nothing new.

**But the password was doing a second job.** The emailed link is
`/force-logout?email=<address>&timestamp=<ms>` and carries no secret; the page
is public and `POST /staff/force-logout` has no `validateJWT`. Deleting the
field with the link unchanged turns the flow into "know an email address, end
that person's session, repeatedly". So the proof has to move from something the
visitor *knows* to something only the recipient of the mail *has*.

`ForceLogout.jsx` now reads a `token` from the link. **With one, no password is
asked** — a sentence and a button. Without one, the password field is exactly as
it was, which is what every link already in an inbox needs. The token is
stripped from the URL on arrival, like `cred` is.

It is inert until `forceLogoutNotificationHtmlTemplate` starts appending
`&token=`. The ask, with the suggested Redis shape and the back-compat rule, is
in `FRONTEND_force_logout_token_2026-09-21.md`. **No further client release is
needed** — the password step disappears the day the token shows up.

Found next door and written up in the same document:
`POST /nodemailer/forcing-revoking-active-session` takes `{ email }` and is
unauthenticated, so anyone can make us send that mail to any address they can
name. It grants them nothing, but it is an open relay for one of our templates.

---

## 2. Add-inventory wizard — flow and behaviour

### 4. "Continue to step N" on every wizard button

> `13:15` — "Continue to step 2, to continue to location, that's like I didn't
> pay attention to this… so I got confused. So I would say continue to step 2."
>
> `29:11` — "you have to have some same that continues step one, step two, step
> three, step 4, step 5."

| File | Line | Now | Should be |
|---|---|---|---|
| `src/pages/inventory/actions/add/ux/wizard/DetailsStep.jsx` | 83 | `Continue to location` | `Continue to step 2` |
| `src/pages/inventory/actions/add/ux/wizard/LocationStep.jsx` | 118 | `Continue to ownership` | `Continue to step 3` |
| `src/pages/inventory/actions/add/ux/wizard/OwnershipStep.jsx` | 97 | `Continue to units` | `Continue to step 4` |

The step-4 button is already right — see §4.

#### Done 2026-09-21

The number is read off `STEPS` rather than typed into each button:
`continueLabel("details")` returns "Continue to step 2". That is the only way
this label can go wrong — insert or reorder a step and three buttons start
counting something else, silently — and it is the same drift that put a Company
column in the import template.

`STEPS`, `stepNumber` and `continueLabel` moved to `wizardSteps.js`, a module
with no imports. Reading the label out of `useCreateGroupWizard` would have
dragged `useBulkActionLogic` — the API clients, the queries, all of it — into
three components that only wanted a string. The hook re-exports them, so
nothing else had to change.

**Step 4 left alone**, as §4 says: it reads "Review {n} units", which he
approved at `29:26`. Numbering it "Continue to step 5" would replace a label
that says what happens with one that says where you land.

### 5. The step-1 notice must name the last step

> `10:16` — "nothing will be added or completed until you have finished the
> review in step 5. That's what we probably should be saying."

Current copy stops at "until you have completed the last step". Name step 5.

### 6. The validation error is too easy to miss

He clicked continue, nothing happened, and he reported the button as broken
(`13:27`, *"it doesn't continue to step 2 when I click it"*). The error was on
screen, above the fold he was looking at.

> `13:40` — "Can we make this bold or somehow a little bit bigger because I
> missed it, that it was there."

**Task:** make the step's validation error unmissable — weight and size at
minimum, and scroll it into view when continue is blocked. A stakeholder
reporting a working button as broken is the strongest possible evidence here.

### 7. Copy-details filters must cascade

In "copy details from a device you already have", picking category **Laptops**
still offers group **disinfectant wipes** and brand **Ticonderoga**.

> `11:04` — "if I put laptops here, I should not be able to do disinfectant
> wipes."

Gustavo explained (`11:25`) that the filters are deliberately independent so any
one of them can be used alone. Fredrik still wants each selection to narrow the
next, and Gustavo agreed at `12:46` (*"Yeah, I'll do that"*).

**Task:** in `CopyFromExistingDevicePanel.jsx`, make each filter narrow the
options of the ones after it. Keep "use any single filter alone" working — that
was the reason the current behaviour exists, and it should not be lost.

#### Done 2026-09-21 — mutual, not a one-way cascade

"Narrow the ones after it" would have made the order of picking matter: choose
the brand first and the category list follows, choose it last and nothing
happens. Each list is narrowed by **the other two** instead, so picking Dell
cuts category and group down to Dell's, picking Laptops cuts group and brand,
and the order is irrelevant.

**No list is narrowed by its own value.** That is what keeps the panel usable:
filter the brand field by the chosen brand and Dell becomes the only brand on
offer, with no way to switch to HP without clearing it first. Excluding itself
is also what keeps "use one filter alone" working, which was the reason the
lists were independent in the first place.

`narrowReferenceOptions(items, criteria)` holds the rule, and
`matchesReferenceCriteria` is now shared with `findReferenceMatches` — the
dropdowns and the search have to agree on what "matches" means, or the options
offer a combination the search then finds nothing for.

**A combination with nothing in it shows an empty list**, and a value that the
other filters have since made impossible is left where it is rather than
cleared. Silently deleting what someone typed is its own surprise; the search
already says no device matches.

**Found on the way:** `retrieveItemOptions` existed four times, byte for byte —
`useInventoryData`, `useBulkActionLogic`, `AddNewItem`, `edit/useLogic` — so the
cascade would have had to be written four times. It is now one function,
`itemOptionsFrom`. The old copies read their values back out of `groupBy` keys,
which turns a unit with no category into the string `"undefined"` and offered it
in the dropdown as though it were one; that is gone with them.

### 8. Pre-fill the location in step 2

> `13:55` — "Why can't we, if I selected a group there that only had one location
> in step one, it can pre-fill it here. Wouldn't you think that would be a good
> idea?"

Gustavo agreed twice (`14:25`, `14:37` — *"that's a really good idea"*).

**Task:** when the group chosen in step 1 exists in exactly **one** location,
pre-fill step 2 with it. The single-location condition is the whole safeguard —
with two or more, guessing would silently file stock in the wrong place. Leave it
editable; Gustavo's framing at `14:30` was "if the staff member wants that".

> Note: this is the same shape as the bug fixed today in `655f58a4` — pre-fill
> only when exactly one candidate matches, otherwise leave it to the operator.
> `findOptionForDevice` already implements that rule and is worth reusing.

#### Done 2026-09-21, wider than asked

He asked for the location. The copy was skipping **five** fields for the same
reason — `location`, `sub_location`, `enableAssignFeature`, `container` and,
through a name mismatch, the taxable location — all of them because they came
from `matches[0]`, and one unit's location is not the group's. So they were left
blank and retyped every time, including for a group that sits in exactly one
place. All five are now filled from what the group agrees on.

**The rule was already written twice.** `summarizeInventoryMatches` computes
`{value, mixed, distinctCount}` per field for the bulk-update wizard, and
`findReferenceMatches` has its own three lines of it for the image. The
primitive is now extracted as `agreedValue(items, field)` and both the new
pre-fill and the summary read it. (The image's copy is left as it is —
three tested lines — with a pointer in each direction. That is the one
duplication still standing.)

Two details that fall out of the rule rather than being special cases:

- **A group of one agrees with itself**, so "copy from a single unit" fills
  everything without a branch for it.
- **A blank is "not recorded", not a second variant** — a group where half the
  units have no sub-location still agrees on the one the others have. Same rule
  the image already followed.

The taxable location was not a policy decision, it was a bug: the item's field
is `main_warehouse` and the form's is `tax_location`, so `setValue` was writing
a key no field reads and the column was silently never filled.

When the group does disagree, the field is left alone and the panel says which
ones and why, instead of leaving unexplained blanks.

---

## 3. Add-inventory wizard — the instructional copy

This took ten minutes of the thirty and is the part he was most direct about:

> `17:28` — "This whole thing here is not good. You need to, if you are going to
> do instructions like this, run it through Claude and make sure it's done
> correctly. Because I don't even understand what this means at all."
>
> `25:06` — "You need to be able to articulate this in a way that it makes sense
> to people."

### 9. Rewrite the "One at a time" block

`src/pages/inventory/actions/utils/uxForm/SerialNumberAndMoreInfoComponentForm.jsx:227`

Current:

> "For a handful of units, or one that carries identifiers the others do not.
> Tick the identifier that holds the serial number; the first one is used if you
> tick none. For serial numbers alone, in volume, use **Scan labels**. A scanner
> works here too — it types the code and presses Enter, which adds the unit."

He read the first sentence aloud three times and could not parse it (`16:59`,
`17:01`, `17:28`). What Gustavo meant (`17:04`) is: *use this when different
units carry different identifiers, so each has to be entered on its own.*

**Task:** rewrite the block from that intent. It also carries a real defect — see
§5.

### 10. Rename the three unit-entry options

`SerialNumberAndMoreInfoComponentForm.jsx:201`–`203`

| Now | Should be | Source |
|---|---|---|
| `One at a time` | `Enter one at a time` | `18:25` |
| `Scan Serial Numbers` | `Use scanner to scan serial numbers ONLY` | `19:13` |
| `Paste a list` | *unchanged* — but see #11 | `19:26` |

"ONLY" in caps is explicit: `19:13` — *"Then use scanner to scan serial numbers
only and put only in caps."* It exists to answer Gustavo's objection at `19:04`
that the scanner path cannot carry extra identifiers.

### 11. Rewrite the paste-a-list instructions

`src/pages/inventory/actions/utils/uxForm/PasteUnitsPanel.jsx:81`–`88`

Current:

> "Copy the rows straight out of your spreadsheet and paste them here. The column
> named **serial_number** is used as each unit's serial; if there is no such
> column, the first one is used. Every other column becomes an extra identifier,
> and units do not have to carry the same ones. Up to 2,000 lines per paste,
> header row included — paste again for the next batch."

He dictated the replacement almost line by line:

| Current phrase | Replacement | Source |
|---|---|---|
| "is used as each unit's serial" | "will be used as the primary key and labeled serial number in the system" | `22:38` |
| "if there is no such column, the first one is used" | rework — he rejected the fallback as written (`22:47`, *"No, I think we need to have a serial number"*) | `22:47` |
| "Every other column becomes an extra identifier" | "Every column in addition to serial_number becomes an extra identifier for that item" | `25:29`–`26:23` |
| "Up to 2,000 lines per paste… paste again for the next batch" | "You can only paste up to 2000 lines. If you have more, run the operation again." | `26:30` |

**On the fallback sentence** — this needs a decision, not just wording. Gustavo
explained (`23:08`, `24:07`) that the first column is *always* taken as the
primary key whatever it is named, and its original name is kept as an extra
identifier. Fredrik first pushed back, then accepted the behaviour once explained
(`23:47`). So the behaviour stays; the sentence has to express it. Something
closer to: *"If there is no serial_number column, the first column is used as the
primary key and keeps its own name as an extra identifier."*

### 12. Align the placeholder's example columns

> `21:01` — "If possible, if they can be underneath each other."
> `21:14` — "If you can format it a little bit there… it's not a big deal."

The placeholder shows `serial_number SDFFAF1`, `IMEI KDHF1HK` and `device_id`
inline. Line them up as columns. He explicitly called this low priority.

### 13. Delete the redundant scanner instructions

> `27:07` — "point the scanner at each label, pull a trigger. Every grid is
> recorded… You can take this away, because that's understood."

Remove that paragraph from the scan panel.

---

#### 9, 10, 11 and 13 done 2026-09-21

Written to one standard, set by Gustavo: it has to be readable by a ten-year
old. Which is what `25:06` was already asking for — *"You need to be able to
articulate this in a way that it makes sense to people."*

**The three options say what they are for.** "Enter one at a time" for units
whose extra details differ; scanner for serial numbers and nothing else; paste
for many units with many details, out of a spreadsheet.

**The "Scan labels" reference is gone, not corrected.** It named a control that
has never existed under that name (§5). The three radios sit right above the
text and now each says what it does, so the cross-reference had nothing left to
do — and one fewer reference is one fewer thing that can drift.

**Two of his dictated phrases were not used verbatim**, and this is worth
raising with him rather than burying:

- `22:38` "will be used as the primary key and labeled serial number in the
  system" → *"becomes each unit's serial number — the one the system uses to
  tell your units apart."* "Primary key" is developer language; the replacement
  says what it does.
- `26:30` "run the operation again" → *"paste the rest afterwards."* Same
  instruction, fewer abstractions.

Everything else follows his wording closely, including **ONLY** in caps, which
he asked for in those words.

**"Paste a list" was left unrenamed.** He said explicitly it stays (`19:26`).

---

## 4. Already done — do not re-open

Verified in the code while writing this list.

| Item he raised | Status |
|---|---|
| Last step should just say "Review" (`29:26`) | **Done.** `UnitsStep.jsx:35` already renders `Review {n} units` / `Review`. |
| Spreadsheet column should be written `serial_number` with the underscore (`20:36`) | **Done.** `PasteUnitsPanel.jsx:83` already renders `serial_number` in bold. He was reading it correctly and asking it be kept. |
| Paste limit of 2000 lines (`26:30`) | **Matches.** `MAX_PASTED_LINES = 2000` in `parsePastedInventoryRows.js:35`, with a pinning test. The transcript's "up to 200" at `26:13` is a transcription error — the UI and the code both say 2,000. |

**Decision he made, requiring no work:** leave the **Add** button on the scan
panel as it is — `28:05`, *"leave the ad as is there, because it's obviously
clear that if you scan, you will see how it adds itself."*

---

## 5. Found while verifying — not raised in the meeting

**The instructions point at a control that does not exist.** The "One at a time"
body copy tells the user to *"use **Scan labels**"* (`SerialNumberAndMoreInfoComponentForm.jsx:230`),
but the radio button next to it is labelled **"Scan Serial Numbers"**
(line 202). The file's own header comment calls it "Scan labels" too, so the
label was renamed at some point and the prose was not.

It sits inside the block item #9 already rewrites, so fold it in — but it is a
genuine defect on its own, not a wording preference.

---

## 6. Not covered — worth scheduling

Part 2 resumed after the break and covered the template and the bulk-update
wizard, so the original gap is smaller than it looked. What is still untested:

- **The scanner path was never exercised** — no scanner in the room (P1 `9:32`).
  Every scan-mode item above is reasoned from the copy, not from use.
- **Steps 3, 4 and 5 of the add wizard** were only passed through. The review
  step got *"let's see what it says down here… all right, great"* (P1 `29:45`)
  and no scrutiny.
- **Adding inventory to the Context Global account**, the stated goal at P1
  `9:35`, never happened — and item 21 now supersedes it with a concrete test on
  ABC Interpreting.

---

## 7. XLSX import template

All of these live in one file: `src/pages/inventory/utils/inventoryImportTemplate.js`.
Each column is `{ header, field, required|recommended, aliases, notes[], defaultNote, samples[] }`,
so most of what follows is edits to `header`, `notes` and `defaultNote`.

### 14. Rename "Group" to "Item Name"

> P2 `1:43` — "when I say group, I can think about group of the devices, which is
> kind of maybe interpretation receivers is a group of devices. So it's open up
> for confusion. So I think it is better to call this device name or item name."
>
> P2 `2:07` — "you can have many items and then they become a group of items. The
> word group is confusing. So let's just call it for what it is, item name."

Field `item_group`, currently headed **Group**. Change the header to **Item Name**
and the note to *"The name of the device or item."* (P2 `2:47`).

Leave the `field` key alone — it is the wire name, and renaming it would ripple
through the importer for no gain.

### 15. Delete every "also accepted as", and make column names strict — P1

This is the largest item in part 2 and the only one that changes **behaviour**,
not just words.

> P2 `5:22` — "just accept the columns for what they are. This is the way you have
> to put it in. And the only thing we need to do is to describe what the column is
> and then tell them do not change the column names."
>
> P2 `5:35` — "if they change the column names, let's say they misspell something…
> the system doesn't recognize it. No, they need to stick to what they are."
>
> P2 `5:51` — "Do not change the column names and delete for every single column
> here, also accepted as, all that, take it away."

Gustavo defended the aliases (P2 `4:24`) — they exist so customers need not rename
columns in their own spreadsheet — then conceded: *"yeah, we are more strict with
that. No, that's fine."* (P2 `5:49`).

**Two separate changes, and the second one needs a decision:**

1. **Copy** — strip the "also accepted as" lists from what the template shows, and
   add one explicit instruction: **do not change the column names.**
2. **Behaviour** — stop accepting aliases. Every column today carries an `aliases`
   array (e.g. `item_group` accepts `"Device Name"`, `"device name"`,
   `"device_name"`, `"Group"`; `main_warehouse` accepts `"Taxable Location"`).

> **Flagged for a decision before anyone writes code.** Dropping alias matching
> makes spreadsheets that import cleanly today start failing — which is exactly
> what Fredrik wants (fail loudly rather than mis-map silently), but it is a
> breaking change for anyone mid-onboarding. It also needs a good error message:
> *"the column X is not recognised — download the template and do not rename its
> columns"* beats a silent skip. Recommendation: keep case-insensitive matching on
> the **exact** header name. That is not an alias, it is tolerance for Excel.

#### Decided and done 2026-09-21 — both halves

Gustavo took the decision: strict. The `aliases` array is gone from every
column, and so is `defaultNote` (item 18, same pass — the asterisk already
carries it).

Matching is now the documented `header` and nothing else, forgiving only case,
surrounding space and the mandatory asterisk. That is tolerance for Excel, not
an alias: `" serial number* "` is the Serial Number column, `"Serial No"` is
not.

**The error message was the other half of the work.** Strictness on its own
reads as silence: rename Category to Type and every row fails its mandatory
check, so a 500-row file reports 500 skipped rows and never says which column
was renamed. The header row is now read once, before any row is judged, and the
preview says *"This file has no **Category** column, but it does have **Type**.
Column names cannot be changed — download the template and type into it."*

The tour lost the "Also accepted as" and "Default:" lines and gained the
instruction he asked for in so many words: **Do not change the column names.**

**What this does to item 14.** Renaming "Group" to "Item Name" was safe only
because the old spelling survived as an alias. It no longer does, so 14 is now
a breaking rename: every customer holding a spreadsheet with a Group column has
to download the template again. Still worth doing — he is right that "group" is
confusing — but it is a release note, not a copy edit.

### 16. "Taxable Location" description

> P2 `2:54` — "you would say here where the device is located for tax purposes."
>
> P2 `3:50` — "leave out talking about jurisdiction, Miami, Florida, etc."

Currently: *"Where the device is deductible for taxes, e.g. 'Miami, FL'."*
Becomes: *"Where the device is located for tax purposes."* — drop the example.

### 17. "Sub Locations" description

> P2 `7:03` — "Delete the outermost first because outermost, what does that mean?
> Outermost out, you know, far the farthest away."
>
> P2 `7:28` — "you can just say warehouse 2 and then room 65 and then shelf 42."

Currently: *"Comma-separated path inside the location, outermost first."* plus
*"e.g. 'Section A, Locker A105'."*

Becomes: *"A comma-separated path inside the location."* with the example
**`Warehouse 2, Room 65, Shelf 42`** — three levels, because two did not make the
idea of a path obvious to him.

### 18. Delete every "Default: empty"

> P2 `7:49` — "you don't have to say default empty… The ones that cannot be left
> empty are the one that you have the asterisk next by. Everybody understands
> that."
>
> P2 `8:12` — "Red headers are the only mandatory ones. Perfect. You have that
> communicated already."

Remove the `defaultNote` from every column. The required marker already carries
the information, and he confirmed the existing legend reads correctly.

### 19. Extra identifiers — approved as written

> P2 `8:34` — "I think this is good… key equals value pair separated by
> semicolons. For example, material equals silicon or MAC equals this. I think
> that that's good."

No rewrite. The existing notes already say *"A value without an '=' is
discarded."*, which he read back approvingly. Only the `defaultNote` goes, per #18.

### 20. The Image column must not accept public URLs — P1, security

The column's note today reads, verbatim: **"A public URL to a picture of the
device."** That is precisely what he objected to.

> P2 `9:38` — "we should not do any public URLs that they can put in here. We
> don't want to have the system query outside of Devitrak."
>
> P2 `10:12` — "**Absolutely no links to anything outside of Devitrak within
> Devitrak. That goes everywhere.** Be careful with that because a hacker, this
> is a great way of exploiting it. I'll put a thing in here, a dormant link to a
> Russian server that runs some type of commands."

**The column stays.** Gustavo twice proposed deleting it and sending people
through the UI instead (P2 `10:37`, `11:36`); Fredrik overruled him on volume
grounds:

> P2 `11:46` — "if you have 1000 devices in a spreadsheet, you want to import a
> lot, are you going to sit there and put in thousand of the same images then? No.
> You have to come up with a workaround."

**Settled design** (Gustavo at P2 `12:01`, accepted): the image is supplied as a
**file at import time**, converted to base64 and stored by Devitrak. No public
URL is ever fetched. Accepted formats are **JPEG, GIF and PNG only** (P2 `9:59`);
everything else is rejected.

> Note the scope of `10:12` — "that goes everywhere". Read strictly this is a
> product-wide policy, not a rule for one column, and it is worth auditing
> anywhere else the app renders or fetches a user-supplied URL.

### 21. Import 10 units on ABC Interpreting and report back — P1

Not a code task; an action item he assigned directly.

> P2 `13:13` — "I would encourage you to work on that, particularly on the image
> column here… You should try it yourself to import. If you use that on ABC
> interpreting, put like 10 units or something, and try the images and all that,
> and then come back and then we can review it."

Gustavo accepted at P2 `13:31`. This gates the next session.

---

## 8. Bulk-update wizard ("More options → Update inventory")

### 22. Pre-fill the location when every selected item shares one

> P2 `15:22` — "it's one location since it is one location and I continue with
> those items and I want to work with a whole group and I only wanted to update
> the replacement cost. I don't see why we can't have this pre-populated."
>
> P2 `16:22` — "if all of them have the same location, pre-populate."

Today the location is required and always blank (P2 `14:47`). Pre-fill it when
the selected items resolve to exactly **one** location; with more than one, leave
it empty — Fredrik was explicit: *"Then you have to leave it"* (P2 `16:01`).

> **Third occurrence of the same rule this week.** Item 8 asks for it in the add
> wizard, this asks for it in the edit wizard, and `655f58a4` shipped it today for
> the device handoff. `findOptionForDevice` in `src/utils/assignmentSelection.js`
> already implements "pre-fill only when exactly one candidate matches, otherwise
> leave it to the operator". Worth lifting into one shared helper rather than
> writing it a third time.

### 23. The Location step's hint is wrong

`src/pages/inventory/actions/edit/ux/wizard/EditFieldsStep.jsx:27`

Currently: *"Where the units live and where they are taxed"*

> P2 `16:48` — "they don't live, but where the units are located."
>
> P2 `17:09` — "Where units are located, period."

Becomes: **"Where units are located."** Note he also cut the tax half of the
sentence — taxable location is its own field.

### 24. "12 items will be updated"

> P2 `17:49` — "12 items will… **be updated**, you should say. Will be, will be
> updated."

Missing auxiliary verb in the review summary.

### 25. "These are the changes that will be made"

`src/pages/inventory/actions/edit/ux/wizard/ReviewStep.jsx:75`

Currently: `The {n} field{s} that change`

> P2 `19:00` — "it says the one field that will change and 10 other fields that
> keep today's value. I think it's really good what you're having here. But you
> should say **these are the changes that will be made**."

The panel itself he liked; only its heading changes. He repeated the general note
here — P2 `18:41`: *"you have to run every piece through Claude because you cannot
just say this."* That is the second time in one day (P1 `17:28`), and it is aimed
at the instructional copy as a body of work, not at any single string.

### 26. Explain the mid-wizard race properly

`ReviewStep.jsx:111`

Currently: *"Every item in this group, whatever its serial number. There were {n}
when you started this wizard — if one was added since, it is included too."*

He spent three minutes interrogating this (P2 `19:46`–`21:41`), built the worst
case himself — an accountant updating 2,000 Chromebooks across 50 warehouses
while warehouse managers keep adding stock — and had Gustavo confirm twice that
those new units **are** swept into the update. He then established the boundary:
items added *after* the update completes are **not** affected (P2 `22:20`).

The behaviour is correct and stays. The sentence has to say it outright:

> P2 `22:49` — "if items were added during this process and those items match the
> initial search criteria, all those items will also be updated per this request."

### 27. The Apply button must not promise a count

`ReviewStep.jsx:154` — currently `Apply to {count} item{s}`

> P2 `22:27` — "don't say apply to 12 items because that may not be true. If
> somebody added more items, then there will be more items. You will just say
> apply at the bottom."
>
> P2 `22:49` — "we cannot confirm it is 12 items, because it could be more or
> less."

**But the count stays in the summary at the top** — he was explicit when Gustavo
offered to remove both:

> P2 `23:19` — "it's nice to have 12 items will change at the top. We may change
> that later on, but keep that for now."

So: the **button** becomes plain **Apply**; the **heading** keeps its count. The
distinction is the point — a heading describes what was found, a button promises
what it will do, and only the second one can still be wrong by the time it is
clicked.

### 28. Rewrite the no-bulk-undo sentence

`ReviewStep.jsx:145`

Currently: *"There is no bulk undo. Reverting means running this update again with
the old values."*

> P2 `24:48` — "There is no bulk undo. **If additional changes are needed, please
> run another update.**"
>
> P2 `25:31` — "Yeah, that's better."
