# What is still open from the 2026-09-18 session with Fredrik

> **Source list:** `FRONTEND_pending_tasks_2026-09-18.md` — 28 items, each with
> the timestamp where it was raised. That file stays the record of *what was
> asked for*; this one is the shorter question of *what is left*, as of
> **2026-09-21**.
>
> Written in English for the same reason the source list is: everything quoted
> is a UI string.

---

## 0. Where it stands

**8 of 28 closed. 20 open.** Five of the eight were closed this week; three were
already true in the code when the list was written.

Two of the closed ones are only closed **on the client**. They are marked so,
and each names the one thing the backend still has to do.

| | |
|---|---|
| Closed | 1, 2*, 3*, 15, 18, 20, plus the three in §4 of the source list |
| Open, P1 | 21 |
| Open, P2 | 4, 5, 6, 7, 8, 9, 10, 11, 14, 22, 25, 26, 27 |
| Open, P3 | 12, 13, 16, 17, 19, 23, 24, 28 |

`*` client done, waiting on the backend.

---

## 1. Closed since the session

### 1 — "queued" is gone from the revoke modal
`Login.jsx` says *"We've sent you an email to revoke the active session. Check
your inbox."* Six other screens that also said "queued" followed
(`824a2c1c`, `dbee206f`, `7714e336`).

### 2 — MFA is mandatory *(client)*
Forced enrolment at the next sign-in, a matching step at the end of
registration, and the "Disable MFA" opt-out removed from the profile. The gate
sits between "credentials accepted" and the session, and the login resumes where
it stopped rather than asking for the password again.

**Still open on the backend:** the server will still issue a token to an account
with MFA off — only the client declines to use it. A caller posting straight to
`/api/admin/login` skips the gate. Making this a rule means refusing the session
server-side. Until then it should be described to Fredrik as a strong front
door, not as "MFA is now mandatory".

### 3 — the revoke page no longer needs a password *(client)*
`ForceLogout.jsx` reads a `token` from the link: with one it asks for nothing,
without one the password stays, which is what every link already in an inbox
needs.

**Still open on the backend:** the link has to carry that token —
`FRONTEND_force_logout_token_2026-09-21.md`. It is inert until then, and needs
no further client release. The same document flags that
`POST /nodemailer/forcing-revoking-active-session` is unauthenticated, so anyone
can make us mail that template to any address they can name.

### 15 and 18 — strict column names, no defaults
> P2 `5:51` — "delete for every single column here, also accepted as, all that,
> take it away."

Decided strict. `aliases` and `defaultNote` are gone from every column; matching
is the documented header, forgiving only case, space and the asterisk. The tour
lost both sections and gained **"Do not change the column names."**

The half that was not just deletion: a renamed column used to fail every row
individually, so a 500-row file reported 500 skipped rows and never named the
column. The header row is now checked once and the preview says which column is
missing and which unrecognised one took its place.

### 20 — the Image column no longer accepts a public URL
> P2 `9:38` — "absolutely no link outside Devitrak."

The column now takes a picture placed **inside** the cell (Insert > Picture >
Place in Cell). The importer reads it out of the workbook's rich data — which
neither SheetJS nor ExcelJS does, so those pictures were being dropped in
silence — uploads each distinct file once, and a URL typed into that column is
reported in the preview rather than used.

---

## 2. Open and blocking — P1

### 21 — import 10 units on ABC Interpreting and report back
> P2 `13:13`–`13:35`

Gustavo's, not the code's. Worth doing now rather than before: the importer it
would have tested has been rewritten since the session, and this is the first
run that would exercise the new preview, the in-cell pictures and the per-unit
values end to end. Nothing in the new path has been through a browser yet.

---

## 3. Open — the add-inventory wizard (P2/P3)

All still exactly as raised. Items 4 to 13, none started.

| # | Item | Where |
|---|---|---|
| 4 | Wizard buttons: "Continue to step N", not "Continue to location" | `12:50`, `29:11` |
| 5 | Step-1 notice must name step 5 explicitly | `10:16`–`10:30` |
| 6 | Validation error is too easy to miss | `13:27`–`13:55` |
| 7 | Copy-details filters must cascade | `10:33`–`12:46` |
| 8 | Pre-fill location in step 2 from the copied group | `13:55`–`14:55` |
| 9 | Rewrite the "One at a time" instructions | `16:17`–`19:21` |
| 10 | Rename the three unit-entry options | `18:25`–`19:21` |
| 11 | Rewrite the paste-a-list instructions | `19:26`–`26:30` |
| 12 | Align the paste placeholder's example columns | `20:50`–`21:32` |
| 13 | Delete the redundant scanner instructions | `27:07`–`27:38` |

**Two of these are cheaper than they look if done together.** 9 and 10 are the
same block of copy, and §5 of the source list found a real defect inside it: the
body text says *"use **Scan labels**"* while the control is labelled **"Scan
Serial Numbers"** (`SerialNumberAndMoreInfoComponentForm.jsx:230` vs `:202`).
That is a bug, not a preference, and it should not be left to ride along.

**And 8 is now the third sighting of one pattern.** "Pre-fill only when there is
exactly one candidate" appears in 8, in 22, and once more earlier in the week.
It should be extracted to a helper the next time rather than written a fourth
time.

---

## 4. Open — the XLSX template (P2/P3)

| # | Item | Where | Note |
|---|---|---|---|
| 14 | Rename "Group" to "Item Name" | `1:02`–`2:47` | **In conflict with the naming decision — see below** |
| 16 | "Taxable Location" description | `2:54`–`3:58` | |
| 17 | "Sub Locations" — drop "outermost first" | `5:58`–`7:49` | |
| 19 | Extra identifiers — approved, minor trim | `8:34`–`9:34` | |

### 14 pulls against the decision that columns are field names

> P2 `1:43` — "when I say group, I can think about group of the devices… The word
> group is confusing. So let's just call it for what it is, item name."

He is right about the word. But the columns are now named after the fields the
request carries — the column *is* `item_group`, the same string the server
reads — and that identity is the point: no table of translations for anyone to
get wrong. Renaming the column to "Item Name" puts the translation back.

Three ways out, and the choice is a product one:

1. **Leave the column `item_group` and answer the confusion in its description**
   — the tour step is where "what this column means" belongs, and it can say
   plainly that this is the device's name, not a grouping of devices. Cheapest,
   keeps the identity, and addresses what actually confused him.
2. **Rename the field everywhere**, front and back, so the column can read
   `item_name` and still be the wire name. Honest but expensive, and it touches
   `item_inv` and every writer of it.
3. **Break the identity for this one column.** Not recommended: one exception is
   how the alias table grew the first time.

Recommendation: (1), and close 14 as answered rather than done.

16, 17 and 19 are edits to `header` and `notes` in one file,
`src/pages/inventory/utils/inventoryImportTemplate.js`, and that file has a test
pinning the guide, the downloadable template and the parser's headers to each
other. They are an hour's work as a batch and a week of drift one at a time.
14 is the one to keep separate now that it breaks existing spreadsheets.

---

## 5. Open — the bulk-update wizard (P2/P3)

| # | Item | Where |
|---|---|---|
| 22 | Pre-fill location when all items share one | `13:35`–`16:45` |
| 23 | Location hint is wrong | `16:48`–`17:17` |
| 24 | Review: "12 items **will be** updated" | `17:49`–`18:41` |
| 25 | Review: "These are the changes that will be made" | `18:41`–`19:46` |
| 26 | Review: explain the mid-wizard race properly | `19:46`–`23:14` |
| 27 | Apply button must not promise a count | `22:27`–`23:19` |
| 28 | Rewrite the no-bulk-undo sentence | `24:48`–`25:31` |

24, 25, 26 and 27 are all the same Review screen. 26 is the only one with any
thinking in it — the others follow from getting 26 right, because once the race
is described honestly the other three sentences have to stop promising a number
the app cannot guarantee.

---

## 6. Not on his list, found while working

These were not asked for. They are here so they are not re-discovered from
scratch.

- **The inventory importer was overwriting per-unit values.** Measured against a
  500-row file: 482 of 500 units would have been written with another row's
  cost, 394 with another row's location. Fixed on the client; the payload change
  that makes it cheap is asked for in
  `FRONTEND_inventory_import_per_serial_2026-09-21.md`. Until that lands, a file
  like that one costs 499 requests instead of 18, and the preview says so before
  anything is sent.
- **`Input` draws its label across the field's border.** `label={label}` is
  commented out on the `OutlinedInput` inside
  `src/components/UX/inputs/Input.jsx`, so the outlined variant never cuts the
  gap the floating label needs and the text sits on the line. Every caller that
  passes `label` has it — at least eight files. Uncommenting that one line is
  the fix, and it changes the look of all of them at once, so it wants a browser
  pass rather than a drive-by.
- **Nothing shipped this week has been through a browser.** The MFA enrolment
  flow, the revoke page and the whole import path are covered by tests and by
  nothing else. Item 21 would exercise the third of those.

---

## 7. Suggested order for the next session

He asked for a faster cadence (P2 `25:31`) — *"I'd rather keep going like more,
more, more now, because I learn from it too."* So the next session is worth
arriving at with the cheap batches already done.

1. **The template batch — 16, 17, 19** — one file, one test, one pass. Then
   **14** on its own, because it now breaks every spreadsheet in the wild and
   deserves to be announced rather than slipped in.
2. **The Review screen — 26 first, then 24, 25, 27.**
3. **The wizard copy — 9, 10, 11, 12, 13**, folding in the "Scan labels"
   mismatch.
4. **21**, as the thing that proves the import rewrite in a browser.
5. **8 and 22 last**, together, extracting the pre-fill helper instead of
   writing it a third time.
