# Meeting Walkthrough — Engineering Punch List

> Source: full 71-minute recording of Fredrik Starmark's walkthrough of the
> dashboard, with Cesar Caminero and Gustavo Rodriguez. Transcript reviewed
> 2026-08-31.
>
> **This is the meeting that produced commits `e0e1c1f9`, `97f9ac3a`,
> `846b2a44` and `46d14527` (2026-08-27/28).** Roughly half the list was
> already actioned from notes taken live. What follows separates what is
> genuinely closed from what is still open, so the same ground is not covered
> twice.
>
> Scope: engineering only. Sales follow-ups, the Bridges account, competitor
> research and the FedRAMP marketplace listing are deliberately excluded.
>
> Context that sets priority: at `58:44` Fredrik answered "can we present it?"
> with **"I think we're there."** Everything in P1 is pre-demo polish on a
> product about to be shown to a customer.

---

## Already closed by the 2026-08-27/28 commits

Listed so nobody re-opens them. Timestamp is where Fredrik raised it.

| # | Item | Where he said it | Commit |
|---|---|---|---|
| 1 | MFA field needs plain-language context | `0:31` | `e0e1c1f9`, **corrected** in `9235cb2d` — see note below |
| 2 | Inventory says "add", not "create" | `14:15` | `e0e1c1f9` |
| 3 | "Add new member" does not belong on a member's own page | `29:39` | `e0e1c1f9` |
| 4 | "Staff activity" is really an **audit trail** | `55:14` | `e0e1c1f9` |
| 5 | Audit trail must show first **and** last name, not last alone | `56:31` | `e0e1c1f9` |
| 6 | Company logo should print on receipts | `45:13` | `97f9ac3a` — **verify, see A2** |
| 7 | Receipt needs a "Signature (if applicable)" line, because a minor cannot sign | `38:03` | `97f9ac3a` |
| 8 | Receipt printed 4 identical pages | `37:24` | `97f9ac3a` (`@page` + `break-inside: avoid`) |
| 9 | Email should name who sent it and give someone to contact | `34:01` | `97f9ac3a` (`signOff`, `replyLine`) — **verify wording, see B14** |
| 10 | A failed write must not leave the device transferred | `26:30` | `846b2a44` — **staff path only, see A1** |

### Note on #1 — the ask was read backwards

`e0e1c1f9` labelled the field **"Multi Factor Authentication Code"**, reading
"we need more context" as "spell the acronym out". Fredrik asked for the
opposite at `0:44`: *"just say, you know, authentication app or code or
something like that."* Fixed 2026-08-31 in `9235cb2d` — the label is now
"Authentication code" with a hint naming the authenticator app, and a test pins
both strings so the jargon cannot come back a third time.

---

## P0 — Data integrity

### A1 — The failed-write guard never reached the member/student path

**This is the highest-priority item on the list.**

What Fredrik hit at `25:17`–`27:03`: assigning a device returned
`Request failed with status 400`, the modal stayed open — and the device had
**already been transferred anyway**. He caught it because the next screen said
*"These units are no longer available in this location."*

> `26:30` — *"it would not give me this, those are no longer at this location.
> That means that the transfer was probably executed on the first time when it
> returned an error message."*
>
> `26:48` — *"if you are going to give an error message, it should not be
> transferred. So you need to look into that."*
>
> `27:03` — *"if this was somebody else, they would just be confused here,
> couldn't click on anything, and then they would cancel, and then they wouldn't
> know that the unit was assigned already, and it would create problems."*

`846b2a44` built exactly the right fix — `assignmentWrites.js`
(`readWriteFailure` / `assertWriteSucceeded`, 10 tests) — for the six-write
chain in
`src/pages/staff/detail/components/equipment_components/assingmentComponents/AssignmentFromExistingInventory.jsx`.
That is the path Fredrik was on when he hit it: at `21:16` he says *"I want to
assign that to myself"*, so his 400 came from the staff chain, and that chain is
now guarded.

**The same defect class was still open on the member/student path.** Verified
before the fix: no reference to `assignmentWrites`, `assertWriteSucceeded` or
`readWriteFailure` existed anywhere under `src/pages/conditionalPage/` or
`src/pages/consumers/`.

The member path was not unprotected — earlier work had given it a
`rollbackWarehouseAssignment` that puts devices back when the lease is refused.
Three holes remained, all the same root cause: these endpoints answer **HTTP 200
with `{ ok: false, msg }`** when they refuse a write, and axios does not treat
that as an error.

1. **The warehouse move was never checked.** It is the first write in the chain;
   a refusal read as success and the lease was written against a move that had
   not happened.
2. **The rollback reported success it did not have.** It only caught throws, so
   a *refused* restock returned "nothing stranded" — the worst outcome
   available, because the device is off the shelf and no longer on anyone's list
   to look for.
3. **Closing a lease on return fell through as `undefined`** instead of
   throwing. react-query still counts that as resolved, so `onSuccess` ran:
   list invalidated, `UNASSIGN` logged, and the member emailed about a return
   the server had just declined to record.

**Fixed 2026-08-31.** `assignmentWrites.js` promoted to `src/utils/` so both
domains share it, new tested `strandedAfterRollback` (5 tests) for hole 2, and
`assertWriteSucceeded` wired into all five unguarded writes across:
- `.../assignmentComponents/assignment/AssignmentDevicesToMember.jsx`
- `.../detailTableComponents/acions/return/Return.jsx`

Each guard names its step, so the notice says *which* write failed rather than
"the assignment did not complete".

### A2 — The receipt logo — root cause found in the session, not the renderer

Fredrik at `45:13`: *"That did not transfer over the logo for the receipts. May
want to investigate that."*

`97f9ac3a` added `resolveReceiptLogo` (absolute `http(s)` only, silent drop on
error) and both the handover and return receipts pass
`user?.companyData?.company_logo`. That path is correct. The problem was one
level up: **`companyData` in Redux was only ever refreshed by logging in again.**

`Body.jsx` (Company Info) saved the company and then dispatched **`onLogout()`**
on success. That is the whole mechanism — a re-login was the only thing that
put the new record into the session, so:

- editing anything in Company Info threw the user out of the app, and
- until they signed back in, every receipt printed the stale company record —
  with no letterhead, if the logo was exactly what had just been uploaded.

`removeLogoMutation` was worse in the other direction: it dispatched nothing at
all, so a logo *taken off* the company kept printing until the next login.

**Fixed 2026-08-31.** New `onUpdateCompanyData` reducer in `adminSlice.js`
(5 tests) folds the saved record into `user.companyData` by **merging**, not
replacing — the payload is the update and does not carry `id`. Both mutations
now dispatch it, and the forced logout is gone.

**Still open — payment receipts have no letterhead at all.**
`mapAssignmentToReceipt` and `mapReturnToReceipt` both take `companyLogo`;
`mapTransactionToReceipt` (`receiptUtils.js:168`) never sets `logoUrl`. It
cannot simply be added: `/receipt` is registered in **both** `AuthRoutes` and
`NoAuthRoutes`, so the page is opened by people outside the company from a QR
scan, where there is no Redux session to read a logo from. The logo would have
to arrive on the transaction response — raised with the backend in
`FRONTEND_backend_ask_write_refusal_semantics.md` §5.

---

## P1 — Pre-demo polish

### B1 — Rewrite the scan-to-add panel copy

`src/pages/inventory/actions/utils/uxForm/ScanUnitsPanel.jsx:64-69`. Current
text, verified still in place:

> Point the scanner at each label and pull the trigger. Every read is recorded
> and the field clears itself, ready for the next one — you never have to touch
> the keyboard. Units added this way carry a serial number and nothing else; use
> **One at a time** if a unit needs extra identifiers.

Fredrik went through this line by line between `6:37` and `9:23`:

- `7:06` — the sentence about which units carry identifiers *"is not a correct
  sentence. Let's start with that."*
- `7:40` — *"you can take that away. You don't have to put that there. Never
  have to touch the keyboard."* → **delete the clause.**
- `8:49` — *"you end the sentence here, units added this way carry a serial
  number only. That's the only thing you need to say there."*
- `9:05` — *"Use, and then quotation mark, one at a time, end quotation mark,
  because you're referring to the menu item."*
- `9:23` — *"if a unit needs **additional** identifiers, that's what you would
  say."*

**Target:**
> Point the scanner at each label and pull the trigger. Every read is recorded
> and the field clears itself, ready for the next one. Units added this way
> carry a serial number only. Use "One at a time" if a unit needs additional
> identifiers.

**Done 2026-08-31**, with `ScanUnitsPanel.test.jsx` (3 tests) pinning it — the
paragraph has now been rewritten more than once, so the negative clause and
"extra identifiers" are both asserted absent, not just the new wording present.

### B2 — Destructive confirmations use the standard sentence — **done**

`14:51`–`15:14`, and `14:35`: it adds N new items **to** the inventory, not
*in* the inventory.

The confirmation lives in
`src/pages/inventory/actions/add/ux/wizard/ReviewStep.jsx`, on the checkbox the
user has to tick before the batch is written. It now reads:

> I understand this adds N new items **to the** inventory.
> **This operation cannot be undone.** …

The `14:06` note — drop the line saying the items will be added to the database —
did not apply to this screen; nothing here states it. Watch for it in the bulk
range panel (`BulkComponents.jsx:33`), whose copy was not part of this pass.

### B3 — The "removing them afterwards" sentence says nothing — **done**

`15:18`–`15:39`. It said "Removing them afterwards means deleting the units one
group at a time", which Fredrik could not parse. Now:

> If you need to remove them after adding them, you have to do that one at a
> time.

B2 and B3 are one paragraph and shipped together, with `ReviewStep.test.jsx`
(4 tests) covering both plus the singular/plural count.

### B4 — Assigning from a device does not carry the device with it — **done**

`22:36`. Clicking assign on a device navigates to the person's profile and
starts from an empty form.

> *"What should happen here is… it should pre-populate, because I came from the
> device location. So it should already know the location and the serial number
> and whatever else it is."*

The member path was already right — `AssignDeviceDrawer` assigns in place. The
**staff** path, which is the one he was on (`21:16`, *"I want to assign that to
myself"*), hands off to `/staff/:id/assignment` — and the drawer's own notice
says *"We'll take you there with {serial} in hand"*, **a promise the code did
not keep**. It hydrated the staff profile and navigated, carrying nothing.

**Fixed 2026-08-31.** The hand-off passes the serial, group, category and
location in route state. The staff form selects the group and picks the unit on
arrival, in two steps because the serials load asynchronously.

New tested `findOptionForDevice` (4 tests) resolves which inventory group holds
the device. It **refuses to guess**: category and group alone are accepted only
when exactly one group matches, because the same model sits in several
locations and loading the wrong shelf would hand over a different unit with the
same name. The pick is routed through the existing `resolveSerialScan`, so a
device that moved between the drawer reading it and the form opening is refused
with the same message a mistyped scan gets, rather than silently assigning
something else.

### B5 — The assign screen named a location the device was not in — **done**

`21:40`, standing on a device in the IT office: *"So it's not from the warehouse
here."* Then `21:46`:

> *"You don't have to say the actual location where it's currently at, meaning
> the IT office, but that has to be dynamically assigned… Or you can just say
> assign. Assign device."*

`Assignment.jsx:28` read **"Assign a device from the warehouse"**, and both
assignment forms labelled the picker **"Pick from the warehouse"**. Neither is
true: `warehouse: 1` on that query is a flag meaning *in company stock*, and the
location column beside it says IT office, Main office, HR office. The header is
now **"Assign device"** and the picker says **"Pick a unit"**.

### B6 — Address must be optional, and its validation is theatre

Two findings on the same field.

**Optional** — `24:43`–`25:15`: *"could you make that non-mandatory? … most of
these answers are going to be the school address, and in terms of parents where
they're using the computer is probably at the home. But do you really need to
have that in this database? Probably not. So let's make it voluntary."*

That is a **data-minimisation** decision, and it is the same instinct FedRAMP
formalises — worth noting when A3/FedRAMP gap analysis happens.

**Validation** — `36:23`–`36:55`: he typed `F` into the zip, `F` into state, `F`
into city and the form accepted it. *"So it's just requires something in the
field, right?"*

**Both done 2026-08-31.** New tested `isAddressUsable` (6 tests) replaces
`isAddressComplete` at all four gates across the member and staff flows:

- **Blank is accepted** — answering is voluntary, which was the ask.
- **A half-typed address is not.** Optional is not the same as unchecked: a
  partial address looks like a record and cannot be delivered to. All four
  fields or none.
- **The ZIP must contain a digit**, which is the narrowest thing that stops
  `F` without inventing a format policy. He did not ask for stricter shape
  validation — he observed the gap and moved on — so nothing beyond this was
  added.

Note (`23:50`): for school members the address already prefills from the
student's record. That behaviour stays.

### B7 — Return condition dropdown — **done**

`39:18`–`40:51`. All three parts shipped 2026-08-31.

- **`None` is gone.** `40:17` — *"definitely not none, should not be an option
  here. Oh, so it's blank then."* It was worse than cosmetic: the submit button
  only renders while `reason !== ""`, so picking "None" made the button vanish
  with no explanation. The field now starts blank with a *Select a condition*
  placeholder, which is what "None" was pretending to be.
- **Network and Hardware describe themselves.** `39:33` — *"Network, I don't
  know what that means in terms of condition."* Each option now reads
  `value — what it means` (*Network — will not connect*, *Hardware — a part has
  failed*, *Battery — will not hold a charge*).
- **Clear (✗) added** — Cesar at `40:39`. Nothing could return the field to
  blank once a value was picked, which is the state the form starts in.

The list moved to a tested `src/pages/conditionalPage/utils/returnConditions.js`
(5 tests). **The values are a server contract** — `reason` is sent verbatim as
`status` to `/db_event/returning-item` — so a test pins the five exact strings
and another pins that no option is ever empty. `conditionLabel` hands an
unrecognised value straight back rather than blanking it, because rows written
before this list existed are still history.

Note the old `clearable={true}` on the MUI `Select` was a no-op — MUI has no
such prop. That is presumably why nothing cleared.

### B8 — The legal-document button does not change its label — **done**

`25:31`, Gustavo live: *"Just click add legal document again. I have to just
change the label."*

`LegalDocumentModal.jsx:293` — the button toggles `addContracts`, but its title
was the constant `"Add legal document"`. So the way out of the state was to
press a button that said you were entering it, which is why the only person who
knew how to undo it was the one who wrote it. Now reads **"Remove legal
document"** while the section is open.

This was also what put Fredrik into the 400 in **A1**.

### B9 — One word for a person, not two

`29:39`–`30:10`. The screen is titled "Students" and the button says "Add new
member".

> Cesar, `29:52` — *"we have to also clean up the terminology… if it's new
> students that we're adding, it's just like new students, not new members. We
> have to only stick to one term."*

**The button he pointed at no longer exists.** `e0e1c1f9` removed it; the only
remaining occurrence of that string under `src` is a code comment explaining why
it went.

Cesar's wider point is still open, and the machinery for it already exists:
`getIndustryProfile(industry).audience` in `src/config/industryProfiles.js`
returns the company's own word — "Students" for Education — and four files in
the members module already read it. The rest of the module says "member" in
hardcoded strings.

**Done 2026-08-31**, on Gustavo's decision: *use the directory that titles the
navbar button, based on the client's industry.*

New tested `audienceWords(industry)` in `src/config/industryProfiles.js`
(6 tests) reads that same `industriesList` entry and returns the word in all
four forms a sentence needs — `singular`, `plural`, `Singular`, `Plural`. Every
one of the 23 audience words the directory currently serves is a regular `-s`
plural, so `singularizeAudience` drops the final `s` — but only when it really
is one: "Staff" and "Press" and anything ending in a double `s` are left alone
so the directory can grow without producing "Staf".

Swept the member detail page's user-facing strings through it. A school now
reads *Delete student*, *Student data exported*, *Couldn't load this student*; a
clinic reads *patient*; a rental company reads *renter*.

**Identifiers were deliberately left as `member`** — routes (`/member/:id`),
permissions (`member:delete`), API paths (`/db_member/*`), query keys and test
ids. Nobody reads those, and renaming them would break the server contract for
a cosmetic gain.

`Header.test.jsx`'s fixture company is an Education one, so its assertions now
read "student" — which is the assertion worth having: the word comes from the
directory, not from the component, and swapping the fixture's industry would
change every label without touching the component.

### B10 — Staff and student detail pages should feel like one product

`42:14`: *"I think you should compare the two menus here… the look and feel
should be exactly the same. So the menu items should be similar to each
other."*

**Looked at both; this needs a decision, not a fix.** `StaffDetail.jsx` and the
`memberDetailsDashboard` tree were rebuilt on `ProfileShell` at different times
and grew different action sets — some of it accidental drift, some of it
legitimate, since guardian consent has no staff equivalent and staff have
events.

So "make them the same" has no single correct answer. It needs a side-by-side of
the two action lists and a call on which items are genuinely per-audience and
which are drift. **Not guessed at**; worth its own task with both screens open.

Positive finding worth keeping: at `42:38` he checked that **Delete member is
disabled while inventory is out** and confirmed *"That logic is good."* Do not
regress it.

### B11 — The required-field asterisk moves around

`16:57`: *"You may want to move this asterisk to the beginning here. Well, you
have it after here too."*

The real defect is the **inconsistency** — the same form places it on both
sides.

**Root cause found, not fixed.** The shared `Label`
(`src/components/UX/inputs/Label.jsx`) has **no required marker at all**, so
every screen that needs one writes its own. That is precisely why they disagree:
MUI's `InputLabel required` appends the asterisk *after* the text, and a
hand-written one lands wherever the author typed it.

**Done 2026-08-31**, on Gustavo's decision: *after the title, marked mandatory,
in a colour that says so.*

`Label` grows a `required` prop (5 tests) that renders the asterisk after the
children in `.form-label__required` — `--danger-action` red, because the one
mark that has to read as "you must" was previously drawn in whatever each screen
felt like. The rule lives in `index.css`, not `Label.css`: the auth screens mark
required fields with a bare `<span>` and never import Label's stylesheet.

**33 hand-written markers swept** across 19 files — `<span style={{fontWeight:
800}}>*</span>` in the auth and registration screens, `<strong>*</strong>` in
the add-inventory wizard (`FieldGrid.jsx`, which is the form he was looking at
at `16:57`), `<InputLabel>X *</InputLabel>` in the event staff form, and two
one-off `<label style>` cases. `MultiSelectComponent`'s `.required-asterisk`
class is gone: it painted the asterisk the **brand colour**, which is the
clearest illustration of the problem — the mark that means "mandatory" looked
exactly like decoration.

The asterisk is `aria-hidden`, since the input's own `required` attribute
already tells assistive technology and hearing "star" before every field is
noise.

One thing worth knowing for the next person: `Label` renders `{required && " "}`
before the span. That space is **content, not styling** — without it the label's
text is `"PDF file*"`, which no text query for that field matches. Four existing
test files query these labels by their full text including the asterisk, and
they pass unchanged because of that space.

### B12 — Sort the audit trail by last name — **done**

`56:31`. `e0e1c1f9` added name **and** email, which handles the collision. The
ordering half was still open: *"you may want to have first name, last name, or
at least sort them by last name, but then put first name as well."*

`buildStaffFilterOptions` did not sort at all — the picker was in whatever order
the company record happened to hold. Now sorted by last name, then first, both
case- and whitespace-insensitive, with a record missing a last name kept in the
list rather than dropped: it is still somebody who did something. 4 tests.

He framed it as scale, not tidiness: *"you have to assume that if you have a
school and you have 200 employees, that at least two of them is going to have
the same last name. Maybe they're related even."*

### B13 — "Custody history" should be called "Audit trail"

`57:44`–`58:09`. He was explicit that the word itself is worth something:

> *"if you are gonna put it in, call it audit trail because people like to hear
> that audit trail… it lends credibility. If you say that to somebody, they will
> not question what it says."*

**Done 2026-08-31.** In `DeviceProfilePage.jsx` the tab and the heading both say
**Audit trail**; they said `Custody` and `Custody history`.

The larger idea behind it (`55:48`–`56:31`) is that in QuickBooks and Bill.com
an audit trail is **scoped to the record you are looking at** — open an invoice,
see who entered, approved and paid it, all timestamped. Our per-device custody
timeline already is that. Renaming it is the cheap half; offering the same
per-record view elsewhere is the expensive half, and it is also a genuine
FedRAMP control rather than only a naming preference.

### B14 — Email footer — **client half done, the wrapper is server-side**

`33:47`–`35:40`. What he dictated:

> Message from **[Company name]'s inventory system**.
> …
> This email was sent by the user from an unmonitored account, do not reply to
> this email. Should you have any questions, please contact **[the user]**.

**Checked, and it splits in two.**

The message *body* is built client-side in `reminderTemplates.js`. The framing
he read out — "sent from X's inventory system", "unmonitored account" — is **not
in this repo**. It comes from the server's nodemailer wrapper, so that half is a
backend ask and has been added to
`FRONTEND_backend_ask_write_refusal_semantics.md`.

The client half was wrong in a way worth fixing regardless. `replyLine` said
*"reply to {email}"*. Reminders go out through the company's notification
account rather than the sender's mailbox, so replying to what arrives reaches an
account nobody reads — which is the point he was making. It now says **"write to
{email}"**, an instruction that holds whichever way the mail was sent, and
**"contact the person who sent this"** when no address is known. Two existing
tests pinned the old wording and were updated with the reason written next to
them.

Shared components live in `src/components/notification/email/`, so any further
change there reaches every screen that sends mail — check each caller first.

### B15 — Duplicate serial scan — **no work needed, already covered**

`10:29`: *"what happens if I put in the same serial number here, mistakenly scan
the thing again?"* Gustavo said it was handled and the recording cut before the
demonstration. Verified: it is.

`acceptScan` in `src/pages/inventory/actions/utils/scanQueue.js` returns a
`DUPLICATE` status, and `scanQueue.test.js` pins that it matches
**case-insensitively** (`ab1` against `AB1`) and **ignores surrounding
whitespace** (`A1` against `" A1 "`) — the two ways the same label comes back
looking different. `ScanUnitsPanel` announces it, clears the field and keeps
scanning, which is the right behaviour for a flow driven by a trigger: anything
needing a click to dismiss would cost more than the duplicate.

### B16 — "Send a reminder" is below the fold

`31:35`–`31:54`. He looked for it, could not find it, and needed to be told to
scroll. Minor, but it is on the member page he will demo.

---

## P2 — Larger work

### C1 — Custom roles with a permission matrix

The single biggest feature ask in the meeting. `43:51`–`55:05`.

He first confirmed what exists: per-company **role renaming** — *"Okay, I love
it. This is great. Perfect."* (`44:01`). That validates the shipped work.

Then he spent ten minutes screen-sharing two reference implementations, and was
explicit about what he wanted from each:

**QuickBooks** (`46:29`–`48:52`) — his preferred model:
- Roles live in their **own tab** next to Users
- Predefined roles listed, plus **"Add a role"** to define a custom one
- Per-area permissions with **view / create / edit / delete**
- **Expandable menus**, which is what keeps the page short
- *"fairly intuitive actually"*

**Bill.com** (`53:42`–`54:54`):
- Every operation listed with a **red ✗ or a ✓** per role — very legible
- An Edit button flips it to checkboxes, then Save
- His objection: *"the problem with this one is that if you have a lot, the page
  gets really long."*

His synthesis (`49:28`–`50:21`):

> *"our next step is like, how do we customize that, if you want to add a
> particular role and then customize a role. We have predefined roles here and
> that's it… you have all these items that you have predefined, which kind of
> basically acts like a **keychain**."*

And the reason the timing works (`49:53`):

> *"Once we have — and I think we're there now — where we're not really going to
> add many functionalities to it."*

That is the important engineering signal: the feature surface is stabilising, so
freezing a permission matrix into a user-facing product is now viable rather
than a moving target.

**Where it lands:** `PERMISSIONS` in `src/config/roles.js` is already exactly
the `domain:action` → allowed-roles matrix this UI would edit. The work is
turning a compile-time constant into per-company data without losing
`hasPermission`/`resolveRoleType` as the single source of truth, and without
regressing the frozen `ALL_ROLES` pinning test. It also has to reconcile with
the scoped-roles work already in flight.

**Known trap to design around:** several `PERMISSIONS` entries are empty arrays
(`transaction:stripe_*`, `event:quickGlance_*`), which today hide gated UI from
every role. A matrix editor would surface those as rows nobody can check —
either fix them first or the first thing Fredrik sees is a wall of unusable
toggles.

Recommend the QuickBooks layout: grouped, expandable, view/create/edit/delete
columns. It is the one he called intuitive, and it is the one that survives our
permission count.

### C2 — RFID bulk reader (OR2505) does not reach the app

`58:44`–`1:05:21`. Two devices, and only one works:

| Device | Behaviour | Status |
|---|---|---|
| **OR2508** (small gun) | Acts as an HID keyboard wedge — types into the focused field | **Works today.** This is the demo scanner |
| **OR2505 RFID** | Wave over a whole box, reads everything at once. **Not an HID device** | **Not compatible.** Nothing reaches our inputs |

Gustavo, `1:00:55`: *"that's the way the device handles the information and it's
transferred to our system. So it's not compatible. The other one does, because
it works like a regular scanner."*

Fredrik, `1:03:43`: **"Please work a little bit on this."** His reason is a
sales demo, and he was specific about it (`1:02:47`, `1:03:07`): walk in with a
cart of 100 receivers, wave the reader once, watch the whole cart appear. He has
**already relabelled 100 receivers with RFID labels** and they are ready to load
as ContextGlobal or a demo company.

**Engineering shape:** every scan path we have assumes a keyboard wedge — a
focused input that receives characters and an Enter. A non-HID reader needs a
different ingestion path entirely (WebHID / WebSerial / WebUSB, or a vendor SDK
with a local bridge), and it is **many-reads-at-once** rather than one-read-one-
field. That is a new input mode in the scan UI, not a driver swap.

**Blocked:** the vendor is sending the spec for what the integration requires
(`1:04:03`). Do not design against guesses — but it is worth deciding now
whether the bulk path reuses `ScanUnitsPanel` with a different source or becomes
its own screen.

### C3 — FedRAMP as a design constraint

`1:06:52`–`1:11:04`. Fredrik was clear this is not a certification project yet:

> *"I don't think we're ready to go through a certification yet, but that doesn't
> mean that…"* — and then, `1:09:37`: *"you can spend a day on this… just
> understand the specifications involved, what is required, so that when we
> develop something, we create it with this in mind so that down the line, maybe
> we don't have to change it."*

**The engineering deliverable is one day of reading and a short written gap
analysis**, not a compliance programme.

Already in our favour: MFA at login, the audit trail, per-company scoping in
`sessionHeaders.js`, a single permission source, JWT validation with automatic
session expiry.

Concrete gaps worth listing on day one:
- **The audit-log endpoint has no server-side rank filter.** The hierarchy is
  enforced client-side only, so a lower-rank browser still receives the whole
  company log over the wire. This was already flagged as a backend ask; under a
  security review it stops being optional.
- **113 dependency vulnerabilities** reported by GitHub on the default branch
  (45 high, 59 moderate, 9 low). Vulnerability management is an explicit control,
  not housekeeping.
- Log retention, and whether any log line carries personal data.
- Password and session-expiry policy.
- Whether MFA is enforced or optional per role.
- B6's data-minimisation instinct, generalised: stop collecting fields nobody
  reads.

---

## Cross-cutting rules Fredrik gave

These are style rules, not one-off fixes. They apply to every string written
from here on, and they are the reason several items above exist at all.

1. **Never phrase an instruction in the negative.** `7:40` — *"whenever you do
   descriptions, you do not ever put in a negative, meaning like 'oh, you don't
   have to do this'. Just stick to what you have to do when you're doing
   instructions to people."*
2. **Do not state the obvious.** `14:06` — telling the user that adding items
   adds them to the database explains nothing.
3. **"Add", not "create"** — and things are added **to** the inventory.
4. **Quote menu items when you refer to them**, so the reader knows it is a
   thing on screen and not a manner of doing something.
5. **Destructive actions get the standard confirmation sentence** (B2).
6. **Prefer the word with weight.** "Audit trail" over "activity" — his point at
   `55:38` was that the term itself buys credibility with a buyer.

---

## Suggested order

1. **A1** — the partial write on the member path. Same bug he caught live, on
   the vertical being demoed, with the fix already written and tested next door.
2. **A2** — five minutes of looking at `company_logo` before assuming a bug.
3. **B1, B2, B3** — the scan panel, one file, all copy, all quoted verbatim above.
4. **B7, B8** — return dropdown and the document button; both small, both on
   the demo path.
5. **B4, B5, B6** — the assign flow. B4 is the only one with real logic in it.
6. **B13, B12** — audit trail naming and ordering, cheap and he will look for them.
7. **B9, B10, B11, B14, B15, B16** — sweep together.
8. **C3** — the FedRAMP day, once the demo is out of the way.
9. **C1** — custom roles. Design first; this one deserves a written plan before
   any code.
10. **C2** — RFID, when the vendor spec lands.
