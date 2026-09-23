# What is still open from the 2026-09-18 session with Fredrik

> **Source list:** `FRONTEND_pending_tasks_2026-09-18.md` — 28 items, each with
> the timestamp where it was raised. That file stays the record of *what was
> asked for*; this one is the shorter question of *what is left*, as of
> **2026-09-23**.
>
> Written in English for the same reason the source list is: everything quoted
> is a UI string.

---

## 0. Where it stands

**28 of 28 closed. Nothing on his list is open.**

> Corrected 2026-09-22. Earlier versions of this line counted the three items of
> §4 of the source list — the ones already true in the code when the list was
> written — inside the 28. They are not among them, so the closed figure was two
> too high. Those three remain done and remain outside the count.
>
> Closed 2026-09-23 with item 21, which was run several times on 09-22.

What is left is not on his list. Three kinds, and none of them blocks him:

| | |
|---|---|
| Closed (28) | all of them |
| Client done, backend owes something (§2) | 2, 3 |
| Waiting on a decision of his, not on work (§3) | the `serial_number` fallback |
| Found while working, never asked for (§4) | two, one of them a browser pass |

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

**The backend has not made this a rule yet** — see §2.

### 3 — the revoke page no longer asks for a password *(client)*
`ForceLogout.jsx` posts the revoke as it opens, on nothing but a valid email in
the link. It sends `{ email }`, or `{ email, token }` when the link carries a
token; a legacy `?cred=` password is read only to be stripped out of the URL.

**The link does not carry that token yet** — see §2.

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

### 14 — the column is `device_name`
> P2 `1:43` — "when I say group, I can think about group of the devices… The
> word group is confusing. So let's just call it for what it is, item name."

Done as a column rename only. The header is `device_name`; the field it carries,
and what the request sends, is still `item_group` — renaming that reaches
`item_inv` and every writer of it, which is a migration and not a copy edit.

It is the one column whose name is not its field. Everywhere else the two are
the same string, which is what removed the translation table in the first place.

### 20 — the Image column no longer accepts a public URL
> P2 `9:38` — "absolutely no link outside Devitrak."

The column now takes a picture placed **inside** the cell (Insert > Picture >
Place in Cell). The importer reads it out of the workbook's rich data — which
neither SheetJS nor ExcelJS does, so those pictures were being dropped in
silence — uploads each distinct file once, and a URL typed into that column is
reported in the preview rather than used.

### 21 — the ABC Interpreting import, run and reported
> P2 `13:13` — "You should try it yourself to import. If you use that on ABC
> interpreting, put like 10 units or something, and try the images and all that,
> and then come back and then we can review it."

Run on **2026-09-22**, several times, and the client and the server were both
adjusted between runs rather than after them. That is the half of the item that
matters: it was not a pass/fail check at the end, it was the loop that found the
last defects.

Two of them are in yesterday's commits, and neither was on his list nor
reachable from a test:

- **`Sale` and `Resale` were the same value written by two halves of the app**
  (`fda62fdd`). Six writers split between the two spellings, five dictionaries
  mapping both to the same text and hiding it, and underneath that a real
  filter bug: the table offered them as two options compared by exact equality,
  so filtering by one hid every row the other half had written. `Resale` is now
  canonical and the rows already stored as `Sale` still read.
- **An unknown ownership value rendered as an empty cell** (`ee980b60`). The
  two tables looked the value up in a dictionary with no fallback, so anything
  unexpected in that column disappeared silently. They go through
  `ownershipLabel` now, which normalises first and otherwise prints the value
  as it is. A cell with an odd word in it is information; an empty cell is not.

**What is left of 21 is his half:** reviewing the result with him. That is the
next session, not a task.

### 4 to 13, 16, 17, 19, 22 to 28 — closed 09-21 and 09-22

The add-inventory wizard copy, the XLSX template notes, the bulk-update Review
screen and the two pre-fill items. This document listed them as open until
2026-09-23; that was the body lagging behind its own count, not work
outstanding. The commits are between `f99a721a` and `80fe3c36`.

Two of them are worth remembering as patterns rather than as items:

- **The pre-fill rule is one helper.** `agreedValue(items, field)` in
  `updateInventoryMatchSummary.js` — pre-fill only when the group agrees, leave
  it alone when it does not. Both 8 and 22 are built on it, which is what kept
  22 from being a second implementation of the same idea.
- **The validation error was not a missing error, it was an invisible one**
  (`80fe3c36`). The button was not broken; the reason it refused was drawn
  where nobody looks.

---

## 2. What the backend still owes

Both are closed on the client and neither needs another release from us.

### 2 — MFA is mandatory, on the client only

Forced enrolment at the next sign-in, a matching step at the end of
registration, and the "Disable MFA" opt-out removed from the profile.

**The server will still issue a token to an account with MFA off** — only the
client declines to use it. A caller posting straight to `/api/admin/login`
skips the gate. Making this a rule means refusing the session server-side.
Until then it should be described to Fredrik as a strong front door, not as
"MFA is now mandatory".

### 3 — the revoke link has to carry a token

**The password is gone from the page entirely** (2026-09-23, at Fredrik's
reading of his own point: MFA is mandatory, so the sign-in already proved both
factors). A valid email in the link is the whole trigger — `ForceLogout.jsx`
posts the revoke as it opens, and a legacy `?cred=` is read only to be stripped
out of the URL. The controller now accepts `{ email }` with no password, so the
flow works end to end.

**What is still open is hardening, not the feature.** The link is
`?email=<address>` with no secret in it, so possession of the mail is not what
authorises the revoke — an address anyone can type is. A single-use token
closes that: `FRONTEND_force_logout_token_2026-09-21.md` §1 and §2. The page
already posts one when the link carries it, so it needs no release from us.

The same document flags that `POST /nodemailer/forcing-revoking-active-session`
is unauthenticated, so anyone can make us mail that template to any address
they can name. That one is worth raising again on its own.

---

## 3. Waiting on a decision, not on work

### The paste panel says `serial_number` is mandatory. The parser does not.

The instructions read *"Your spreadsheet needs a serial_number column."*
`parsePastedInventoryRows.js:140` disagrees: with no such column it takes the
first one and carries on
(`const primaryIndex = namedPrimary >= 0 ? namedPrimary : 0`).

Left as it is on purpose — there is a decision of his underneath it. He pushed
against the fallback at `22:47` (*"No, I think we need to have a serial
number"*) and accepted it at `23:47` once it was explained. And a paste with no
header row has no column names at all, so a blanket requirement would break that
path outright.

Three ways to close it:

1. **Require it only when the paste has a header row.** A paste with column
   names and no `serial_number` is refused, with the reason. The no-header path
   keeps using the first column. Makes the sentence true without breaking
   anything. *Recommended.*
2. **Keep the fallback and soften the sentence** — "uses a serial_number
   column" rather than "needs one".
3. **Leave both as they are.** Not recommended: it is the class of mismatch this
   week has otherwise been spent removing.

---

## 4. Not on his list, found while working

- **`Input` draws its label across the field's border.** `label={label}` is
  commented out on the `OutlinedInput` inside
  `src/components/UX/inputs/Input.jsx:91`, so the outlined variant never cuts
  the gap the floating label needs and the text sits on the line. Every caller
  that passes `label` has it — at least eight files. Uncommenting that one line
  is the fix, and it changes the look of all of them at once, so it wants a
  browser pass rather than a drive-by.
- **The MFA enrolment flow and the revoke page have never been through a
  browser.** They are covered by tests and by nothing else. The import path was
  the third of these and item 21 settled it; these two are what is left of that
  worry, and the revoke page cannot be exercised end to end until the backend
  puts the token in the link.

### Closed since the last revision of this section

- **The spreadsheet import endpoint.** `bulk-item-from-spreadsheet` was
  specified, implemented, deployed, and the client migrated the same day: the
  one-request-per-group fallback, `IMPORT_MODES.COMPATIBLE`, the 499-request
  chunking, our `verifyAndCreateLocation` loop and `inventoryImportPayload.js`
  are gone — 928 lines out, 93 in. `spreadsheetRowFor` stays on purpose, for
  environments that are not updated yet.
- **The importer was overwriting per-unit values.** Measured against a 500-row
  file: 482 of 500 units would have been written with another row's cost, 394
  with another row's location. Fixed on the client, and the payload now carries
  the per-serial fields.

---

## 5. The next session

He asked for a faster cadence (P2 `25:31`) — *"I'd rather keep going like more,
more, more now, because I learn from it too."* His list is empty, so the session
is his to fill. What we owe it:

1. **The result of the ABC Interpreting import**, which is the half of 21 that
   is his — with the two defects it surfaced, because those are the argument for
   running it that way again.
2. **The `serial_number` decision** (§3). One question, three options, a
   recommendation.
3. **An honest sentence about MFA** (§2): strong front door, not a rule, and
   what it would take to make it one.
4. Before any of that, **the browser pass on MFA enrolment** (§4), so what we
   describe to him is something we have seen work.
