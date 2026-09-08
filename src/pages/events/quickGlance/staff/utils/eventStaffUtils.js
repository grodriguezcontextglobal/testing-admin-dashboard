/**
 * Who is on an event's staff, and what it takes to add or remove someone.
 *
 * Extracted from EditingStaff.jsx, where all of this lived inside the render
 * body: an `async` function called without `await` that wrote into a `Map`
 * declared alongside it, recomputed on every render, with the administrator and
 * assistant branches written out twice verbatim.
 */

const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const key = (value) => String(value ?? "").trim().toLowerCase();

export const isValidEmail = (email) => EMAIL_PATTERN.test(String(email ?? "").trim());

/**
 * The two roles an event actually distinguishes.
 *
 * There used to be three options. The third — "Event assistant/staff (remove
 * when event finishes)" — was only ever compared against "administrator", so it
 * behaved identically to the plain assistant option: it promised an automatic
 * clean-up that nothing implemented. A control that does nothing is worse than
 * one that is absent, so it is absent.
 */
export const EVENT_STAFF_ROLES = [
  {
    value: "administrator",
    label: "Event administrator",
    description:
      "Runs this event: can write off lost devices, capture deposits and manage staff.",
    bucket: "adminUser",
    listLabel: "Administrator",
  },
  {
    value: "assistant",
    label: "Event assistant",
    description: "Hands out and checks in devices at this event.",
    bucket: "headsetAttendees",
    listLabel: "Assistant",
  },
];

const bucketForRole = (role) => {
  const wanted = key(role);
  const match = EVENT_STAFF_ROLES.find(
    (entry) => entry.value === wanted || key(entry.listLabel) === wanted
  );
  return match?.bucket ?? "headsetAttendees";
};

/**
 * The event's staff, joined against registered accounts so a member who has an
 * account shows their real name and online state.
 *
 * Administrators are listed first and win a duplicate email, matching the
 * previous behaviour: the admin list was iterated first and the `Map` kept the
 * first write.
 */
export function mergeEventStaff({ event, adminUsers }) {
  const accounts = new Map();
  (Array.isArray(adminUsers) ? adminUsers : []).forEach((account) => {
    const email = key(account?.email);
    // Later records win: the list arrives oldest-first.
    if (email) accounts.set(email, account);
  });

  const members = new Map();

  EVENT_STAFF_ROLES.forEach((role) => {
    const entries = event?.staff?.[role.bucket];
    (Array.isArray(entries) ? entries : []).forEach((entry) => {
      const email = key(entry?.email);
      // A staff entry with no email cannot be matched, removed or emailed.
      if (!email || members.has(email)) return;

      const account = accounts.get(email);
      members.set(email, {
        // Keyed on the email, not on the account id: the no-account branch never
        // set an id, so every pending member used to share `key={undefined}`.
        key: email,
        id: account?.id ?? null,
        hasAccount: Boolean(account),
        name: account
          ? `${account.name ?? ""} ${account.lastName ?? ""}`.trim()
          : `${entry.firstName ?? ""} ${entry.lastName ?? ""}`.trim(),
        email: account?.email ?? entry.email,
        role: role.listLabel,
        online: Boolean(account?.online),
      });
    });
  });

  return Array.from(members.values());
}

/**
 * The `{ staff: { adminUser, headsetAttendees } }` body `/event/edit-event/:id`
 * expects. Both buckets are always sent whole: the endpoint replaces the object,
 * so omitting one would wipe it.
 *
 * This was four near-identical inline blocks — add-admin, add-assistant,
 * remove-admin, remove-assistant — each rebuilding the same shape by hand.
 */
export function buildStaffPayload({ event, action, role, member }) {
  const bucket = bucketForRole(role);
  const current = {
    adminUser: Array.isArray(event?.staff?.adminUser) ? event.staff.adminUser : [],
    headsetAttendees: Array.isArray(event?.staff?.headsetAttendees)
      ? event.staff.headsetAttendees
      : [],
  };

  const next =
    action === "remove"
      ? current[bucket].filter((entry) => key(entry?.email) !== key(member?.email))
      : [...current[bucket], member];

  return { staff: { ...current, [bucket]: next } };
}

/** Everything wrong with the form, all at once. */
export function validateNewStaff({
  email,
  role,
  needsCreation,
  name,
  lastName,
  existingEmails,
}) {
  const problems = [];
  const address = String(email ?? "").trim();

  if (!address) {
    problems.push("Enter the person's email address.");
  } else if (!isValidEmail(address)) {
    problems.push("That email address is not valid.");
  } else if (
    (Array.isArray(existingEmails) ? existingEmails : []).some(
      (existing) => key(existing) === key(address)
    )
  ) {
    // Was a browser alert() fired in the middle of the submit handler.
    problems.push(`${address} is already on this event.`);
  }

  if (!role) {
    // Names the field, so the reader can find the control the problem is about.
    problems.push("Choose a role for this person on the event.");
  }

  // Only asked for when the person has to be created. The old form marked both
  // name fields `required` unconditionally, so adding an existing colleague
  // meant retyping a name the company already had on file.
  if (needsCreation) {
    if (!String(name ?? "").trim()) problems.push("Enter a first name.");
    if (!String(lastName ?? "").trim()) problems.push("Enter a last name.");
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The hint under the email field: whether this person already belongs to the
 * company, and therefore whether a name is needed.
 *
 * The old version rendered one fixed sentence in danger red, with
 * `cursor: pointer` on a paragraph that was not clickable, toggled by a
 * `display` computed from two different pieces of state.
 */
export function describeEmailLookup({ email, isChecking, found, companyName }) {
  if (!isValidEmail(email)) return null;

  if (isChecking) {
    return {
      tone: "neutral",
      needsCreation: false,
      message: "Checking whether they already have an account…",
    };
  }

  if (found) {
    return {
      tone: "success",
      needsCreation: false,
      message: `Already part of ${companyName}. Just pick a role.`,
    };
  }

  return {
    tone: "warning",
    needsCreation: true,
    message: `New to ${companyName}. They will be invited to the company as an assistant, and added to this event.`,
  };
}

/* ------------------------------------------------------- The staff table --- */

/**
 * The role somebody holds *on this event*, read off the event's own staff
 * lists.
 *
 * `buildStaffPayload` writes an entry as `{ firstName, lastName, email }` and
 * nothing else — which bucket it sits in *is* the role. The table was instead
 * testing `staff.role !== "Administrator"` on a row that carries no role, so
 * every event administrator was displayed as an assistant.
 */
export function eventRoleFor({ event, email }) {
  const wanted = key(email);
  if (!wanted) return null;
  const match = EVENT_STAFF_ROLES.find((role) =>
    (Array.isArray(event?.staff?.[role.bucket]) ? event.staff[role.bucket] : []).some(
      (entry) => key(entry?.email) === wanted
    )
  );
  return match?.listLabel ?? null;
}

/**
 * Two letters for the avatar.
 *
 * Was `String(name).toUpperCase().split(" ")` indexed at `[0][0]` and `[1][0]`:
 * a one-word name threw a TypeError that took the table down, and a name saved
 * as empty strings produced `["", ""]`, whose `[0]` is undefined — the avatar
 * read "undefinedundefined".
 */
export function staffInitials(name) {
  const parts = String(name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts.at(-1)[0]}`.toUpperCase();
}

/* Three shapes for one person are in circulation: an event staff entry
   (`firstName`/`lastName`), a registered account (`name`/`lastName`) and the SQL
   record (`first_name`/`last_name`). */
const nameFrom = (source) => {
  if (!source) return "";
  const first = source.firstName ?? source.first_name ?? source.name ?? "";
  const last = source.lastName ?? source.last_name ?? "";
  return `${first} ${last}`.trim();
};

/**
 * Rows for the event's staff table, from `/event/event-staff-detail/:id`.
 *
 * The bug this fixes: adding somebody who already works at the company stores
 * `{ firstName: "", lastName: "", email }` — the modal does not ask for a name
 * it already has on file — and the table read `staff.firstName` straight out of
 * that entry, so the new row appeared with no name. The registered account is
 * what carries the name in that case, which is how the modal's own list
 * (`mergeEventStaff`) has always resolved it.
 *
 * Online state is deliberately not here: it is a request per member, and this
 * has to stay synchronous to be the single source of what the table shows.
 */
export function buildStaffRows({ rows, event, accounts }) {
  const byEmail = new Map();
  (Array.isArray(accounts) ? accounts : []).forEach((account) => {
    const email = key(account?.email);
    if (email) byEmail.set(email, account);
  });

  return (Array.isArray(rows) ? rows : []).map((row, index) => {
    const entry = row?.staff ?? {};
    const email = String(entry.email ?? row?.email ?? "").trim();
    const account = byEmail.get(key(email));
    return {
      key: key(email) || `row-${index}`,
      id: row?.admin_id ?? account?.id ?? null,
      // The email is a worse label than a name and a far better one than blank.
      name: nameFrom(entry) || nameFrom(account) || email,
      email,
      role: eventRoleFor({ event, email }) ?? entry.role ?? "Assistant",
      phone: row?.phone ?? "000-000-0000",
      photo: row?.photo ?? "",
    };
  });
}
