import { canViewStaffActivity, resolveRoleType } from "../../../../config/roles";

// Per FRONTEND_staff_activity_log.md §1/§2: the free-text `action` values the
// register endpoint documents, plus FORCE_LOGOUT (the one auto-logged action
// mentioned there that isn't in the register list).
export const ACTIVITY_LOG_ACTIONS = [
  "LOGIN",
  "LOGOUT",
  "FORCE_LOGOUT",
  "CREATE",
  "UPDATE",
  "DELETE",
  "ASSIGN",
  "UNASSIGN",
  "IMPORT",
  "EXPORT",
];

const staffFullName = (staff) =>
  [staff?.name, staff?.lastName].filter(Boolean).join(" ").trim() || "Unknown staff";

/**
 * Adapts one raw `GET /api/admin/activity-logs` row into what Body.jsx renders.
 *
 * Who acted is separate from what they did. It used to be one string --
 * "Jane Doe LOGIN AdminUser" -- which read as a sentence but could not be laid
 * out: the trail is read to answer "who did this", and a name with no email
 * does not identify a person in a company with two Janes.
 */
export const mapLogToListItem = (log) => ({
  id: log?.id,
  /* A guardian answering an invitation is not staff: the row names them by
     what they are, rather than as "Unknown staff". */
  staffName: invitationResponder(log)?.name ?? staffFullName(log?.staff_member_id),
  /* The populated staff record is the source; `details.email` is the fallback,
     since the register endpoint stamps it on the login rows and it is the same
     person either way. */
  staffEmail:
    String(
      invitationResponder(log)?.email ??
        log?.staff_member_id?.email ??
        log?.details?.email ??
        ""
    ).trim() || null,
  actionTaken: [log?.action, log?.target_model].filter(Boolean).join(" "),
  time: log?.timestamp,

  /* Everything below arrives from the server's audit middleware (2026-10-05)
     and is absent on rows written before it — hence the nulls. */
  summary: describeLogAction(log),
  highlights: logHighlights(log),
  /* One sentence in plain words, or nothing. The route, the HTTP status and
     the request body are deliberately NOT carried here: this list is read by
     whoever has to answer "who touched this", and `{ "activity": false }`
     answers nothing. What it means is in `explanation`. */
  explanation: explainLogChange(log),
  target: log?.target_id ? `${log?.target_model ?? "Record"} ${log.target_id}` : null,
  ip: log?.ip_address ?? null,
  client: describeClient(log?.device_info),
  isInfrastructure: isInfrastructureLog(log),
});

/** On a log row, `staff_member_id` is the populated AdminUser record. */
const staffId = (staff) => staff?._id ?? staff?.id;

/**
 * The account id of an employee from `/company/search-company`.
 *
 * Those records carry two: `_id` is the employee's row inside the company
 * document, and `userId` is their AdminUser account. The log identifies who
 * acted by the account, so filtering by `_id` asked the server for an id that
 * appears in no row — and the Users filter came back empty every time
 * (reported 2026-10-05). The fallbacks keep records that only ever had one id
 * working.
 */
const employeeAccountId = (staff) => staff?.userId ?? staff?._id ?? staff?.id;

/**
 * B2 read hierarchy: keeps a log row if the viewer authored it (self is always
 * visible) or if canViewStaffActivity allows the viewer's role to see the
 * authoring staff's role. See roles.js for the rank rule.
 *
 * resolveRoleType normalizes the authoring staff's role: backend's populated
 * staff_member_id may carry either the legacy numeric `role` (0-5, same as
 * the /company/search-company employees list) or a `roleType` string.
 */
export const filterLogsByHierarchy = (logs, viewerRoleType, viewerId) => {
  if (!Array.isArray(logs)) return [];
  return logs.filter((log) => {
    const authorId = staffId(log?.staff_member_id);
    if (viewerId && authorId && String(authorId) === String(viewerId)) return true;
    return canViewStaffActivity(viewerRoleType, resolveRoleType(log?.staff_member_id));
  });
};

export const buildActionFilterOptions = () =>
  ACTIVITY_LOG_ACTIONS.map((action) => ({ label: action, value: action }));

/**
 * Same B2 hierarchy applied to the "Users" filter dropdown, so it never offers
 * a staff member whose activity the viewer isn't allowed to see. staffList
 * comes from the same /company/search-company employees array the rest of
 * the Staff pages use, where `role` is the legacy numeric value.
 */
const nameKeys = (staff) => [
  String(staff?.lastName ?? "").trim().toLowerCase(),
  String(staff?.name ?? "").trim().toLowerCase(),
];

/**
 * Last name, then first.
 *
 * The trail is read to answer "who did this", in a company big enough to have
 * two of them: "you have to assume that if you have a school and you have 200
 * employees, that at least two of them is going to have the same last name.
 * Maybe they're related even." Sorting this way puts those two next to each
 * other, where the first name beside the surname is what tells them apart.
 *
 * Someone with no last name recorded sorts under the empty string rather than
 * being dropped — they are still somebody who did something.
 */
const byLastNameThenFirst = (a, b) => {
  const [aLast, aFirst] = nameKeys(a);
  const [bLast, bFirst] = nameKeys(b);
  return aLast === bLast ? aFirst.localeCompare(bFirst) : aLast.localeCompare(bLast);
};

/**
 * Who this is, in a dropdown where the name alone may not say.
 *
 * "What if you have two say the same last name? (...) if you have a school and
 * you have 200 employees, at least two of them is going to have the same last
 * name. Maybe they're related even." — and the answer in the room was the
 * email, because it is the one field that cannot repeat.
 *
 * Deliberately a plain string rather than a two-line node: `filterOption` in
 * Header.jsx lowercases `option.label` to match what is typed, so a node would
 * break the search — and building it this way makes the email searchable for
 * free, which is how you find the right John Smith when you know his address
 * and not which one he is.
 *
 * The address is read from `email` OR `user`, because the employees array
 * stores it under `user` (Login.jsx queries `"employees.user"` with an email,
 * and useInventoryData matches `emp.user === user.email`) while other records
 * of the same person use `email`. Reading only one of the two would have made
 * this a no-op against the real payload.
 *
 * It has to look like an address to be shown: `user` holds an id in some
 * records, and printing that next to a name would be worse than printing
 * nothing. No email recorded leaves the name alone, with no dangling dash.
 */
const emailLike = (value) => {
  const text = String(value ?? "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text) ? text : "";
};

const staffFilterLabel = (staff) => {
  const name = staffFullName(staff);
  const email = emailLike(staff?.email) || emailLike(staff?.user);
  return email ? `${name} — ${email}` : name;
};

export const buildStaffFilterOptions = (staffList, viewerRoleType, viewerId) => {
  if (!Array.isArray(staffList)) return [];
  return staffList
    .filter((staff) => {
      const id = employeeAccountId(staff);
      if (viewerId && id && String(id) === String(viewerId)) return true;
      return canViewStaffActivity(viewerRoleType, resolveRoleType(staff));
    })
    /* Sorted on the records rather than on the built options, so no ordering
       key has to be carried on the option and stripped off again. */
    .sort(byLastNameThenFirst)
    .map((staff) => ({
      label: staffFilterLabel(staff),
      value: employeeAccountId(staff),
    }));
};

/**
 * Since 2026-10-05 the server audits every route it serves, and each row
 * carries far more than the pair this list used to print: the route, the HTTP
 * status, the request body, the caller's IP and browser, and a `context` the
 * server already worked out (event, serials, recipients).
 *
 * What follows turns one of those rows into something a person reads.
 */

/* Login and logout are whole sentences; everything else is verb + object. */
const SELF_CONTAINED = {
  LOGIN: "Signed in",
  LOGOUT: "Signed out",
  FORCE_LOGOUT: "Revoked a session",
};

const VERBS = {
  CREATE: "Created",
  UPDATE: "Updated",
  DELETE: "Deleted",
  ASSIGN: "Assigned",
  UNASSIGN: "Unassigned",
  SEND: "Sent",
  CLEAR: "Cleared",
  IMPORT: "Imported",
  EXPORT: "Exported",
};

/* The article belongs to the noun: "an email", "cached data". */
const OBJECTS = {
  AdminUser: "a staff account",
  Cache: "cached data",
  Company: "the company",
  Device: "a device",
  Email: "an email",
  Event: "an event",
  Item: "an item",
  Lease: "an equipment loan",
  Member: "a member",
  Staff: "a staff record",
  StripeLink: "a Stripe link",
};

/**
 * What happened, in words.
 *
 * A verb or an object we have no name for is printed raw rather than dropped:
 * it is the only sign that the server started logging something new.
 */
export const describeLogAction = (log) => {
  const action = String(log?.action ?? "").trim();
  const model = String(log?.target_model ?? "").trim();
  if (SELF_CONTAINED[action]) return SELF_CONTAINED[action];

  /* The route knows things the CRUD pair cannot: the same "UPDATE Device" is
     a handover or a return depending on one boolean. */
  const byRoute = HEADLINES[routePath(log)];
  const headline = typeof byRoute === "function" ? byRoute(requestOf(log)) : byRoute;
  if (headline) return headline;

  const verb = VERBS[action];
  const object = OBJECTS[model];
  if (verb && object) return `${verb} ${object}`;
  return [action, model].filter(Boolean).join(" ") || "Unknown action";
};

const MAX_SERIALS = 3;

const listed = (values) => {
  const items = (Array.isArray(values) ? values : []).filter(Boolean).map(String);
  if (items.length === 0) return null;
  const shown = items.slice(0, MAX_SERIALS).join(", ");
  return items.length > MAX_SERIALS ? `${shown} +${items.length - MAX_SERIALS}` : shown;
};

/**
 * The few words that say which event, which device, which person — the ones
 * that turn "Updated a device" into a row somebody can recognise.
 *
 * Rows written before the middleware carry no `context`, so the same facts are
 * read from the loose fields the old register calls left in `details`.
 */
export const logHighlights = (log) => {
  const context = log?.context ?? {};
  const details = log?.details ?? {};
  const serials = listed(context.serial_numbers);
  const recipients = listed(context.recipients);
  const fullName = [details.first_name, details.last_name].filter(Boolean).join(" ").trim();

  /* The response route is public, so the server has no event context to add;
     the page sends the name itself. */
  const eventName =
    context.event_name ?? (isInvitationResponse(log) ? requestOf(log).event_name : null);

  return [
    eventName,
    serials,
    recipients ? `to ${recipients}` : null,
    details.outcome,
    fullName || null,
  ].filter(Boolean);
};

const CLIENTS = [
  // Edge and Opera also say "Chrome", so they are tested first.
  [/Edg\//, "Edge"],
  [/OPR\/|Opera/, "Opera"],
  [/Chrome\//, "Chrome"],
  [/Firefox\//, "Firefox"],
  [/Safari\//, "Safari"],
];

const PLATFORMS = [
  [/Windows/, "Windows"],
  [/Macintosh|Mac OS X/, "macOS"],
  [/Android/, "Android"],
  [/iPhone|iPad/, "iOS"],
  [/Linux/, "Linux"],
];

const matched = (table, text) => table.find(([pattern]) => pattern.test(text))?.[1] ?? null;

/**
 * "Edge on Windows" out of a 120-character user agent. Null when neither half
 * is recognised, so the row does not print "Unknown on Unknown".
 */
export const describeClient = (userAgent) => {
  const text = String(userAgent ?? "");
  if (!text) return null;
  const browser = matched(CLIENTS, text);
  const platform = matched(PLATFORMS, text);
  if (browser && platform) return `${browser} on ${platform}`;
  return browser ?? platform ?? null;
};

/**
 * Rows the machine wrote about itself. Eight of one afternoon's forty-five
 * entries are cache clears, and they bury what a person came to read.
 */
export const isInfrastructureLog = (log) =>
  String(log?.target_model ?? "") === "Cache" || routePath(log).startsWith("/api/cache_update/");

/** The trail without the rows the machine wrote about itself. */
export const visibleLogs = (logs) =>
  (Array.isArray(logs) ? logs : []).filter((log) => !isInfrastructureLog(log));

/**
 * Plain language, because this is read by whoever has to answer "who touched
 * this student's laptop", not by whoever wrote the endpoint (2026-10-05).
 *
 * `PATCH /api/receiver/receivers-pool-update/:id` with `{ activity: false }`
 * is a device coming back. Nobody outside this repository can know that, so
 * the route and the field names stay here and never reach the screen.
 *
 * A route with no rule falls back to the verb-and-object phrase. It is vague,
 * never wrong, and never technical.
 */

const requestOf = (log) => log?.details?.request ?? {};

/** "PATCH /api/x/y" → "/api/x/y"; the method adds nothing for a reader. */
const routePath = (log) => String(log?.details?.route ?? "").split(" ").at(-1) ?? "";

const handedOrReturned = (out, back) => (request) => {
  const activity = request?.activity ?? request?.device?.status;
  if (activity === true) return out;
  if (activity === false) return back;
  return null;
};

/* The public attendance page records each step a guardian or attendee takes
   (AttendanceConfirmationLanding.jsx). Nobody is signed in there, so the row
   carries no staff record and the request says who answered. */
const INVITATION_RESPONSE_ROUTE = "/api/school/event-invitations/response";

const isInvitationResponse = (log) => routePath(log) === INVITATION_RESPONSE_ROUTE;

const INVITATION_HEADLINES = {
  opened: "Opened an event invitation",
  already_confirmed: "Opened an invitation already confirmed",
  failed: "Tried to confirm attendance, and it failed",
};

const invitationResponder = (log) => {
  if (!isInvitationResponse(log)) return null;
  const request = requestOf(log);
  return {
    name: RESPONDER_LABELS[request?.responder_role] ?? "Invitation link",
    email: request?.responder_email ?? null,
  };
};

const invitationHeadline = (request) => {
  if (request?.response === "confirmed") {
    return request?.responder_role === "guardian"
      ? "Confirmed their child's attendance"
      : "Confirmed attendance";
  }
  return INVITATION_HEADLINES[request?.response] ?? null;
};

const RESPONDER_LABELS = { guardian: "Parent / guardian", member: "Attendee" };

/* The invitation email links to the confirmation page; the same route also
   carries any other custom message, which keeps the generic headline. */
const invitationEmail = (request) =>
  String(request?.message ?? "").includes("/attendance-confirmation")
    ? "Emailed an event invitation"
    : null;

/* The headline for the routes whose meaning the CRUD pair loses. */
const HEADLINES = {
  [INVITATION_RESPONSE_ROUTE]: invitationHeadline,
  "/api/nodemailer/customize-message-notification": invitationEmail,
  "/api/receiver/receivers-pool-update/:id": handedOrReturned(
    "Handed out a device",
    "Returned a device"
  ),
  "/api/receiver/receiver-update/:id": handedOrReturned(
    "Handed out a device",
    "Returned a device"
  ),
  "/api/nodemailer/assignig-device-notification": "Emailed an equipment handover",
  "/api/nodemailer/confirm-returned-device-notification": "Emailed a return confirmation",
  "/api/nodemailer/lost-device-fee-notification": "Emailed a lost equipment charge",
  "/api/nodemailer/deposit-collected-notification": "Emailed a deposit receipt",
  "/api/nodemailer/deposit-return-notification": "Emailed a deposit return",
  "/api/nodemailer/refund-notification": "Emailed a refund",
  "/api/nodemailer/invoice-notification": "Emailed an invoice",
  "/api/nodemailer/new_invitation": "Invited someone to the company",
  "/api/nodemailer/reset-admin-password": "Sent a password reset",
  "/api/stripe/account_sessions": "Opened the payments dashboard",
  "/api/staff/edit-admin/:id": (request) =>
    request?.online === false ? "Signed out" : null,
};

/* What a field means, for the handful whose name says nothing to a reader. */
const EVENT_CHANGES = {
  deviceSetup: "The equipment set up for the event changed.",
  staff: "The staff working the event changed.",
  qrCodeLink: "The event's QR code was set.",
  extraServices: "The event's extra services changed.",
  extraServicesNeeded: "The event's extra services were turned on or off.",
  legal_documents_list: "The documents attached to the event changed.",
  active: "The event was opened or closed.",
};

const readableRole = (value) => String(value ?? "").replace(/_/g, " ").trim();

/**
 * One sentence saying what changed, or null when there is nothing certain to
 * say. Null is on purpose: a vague headline beats a confident invention.
 */
export const explainLogChange = (log) => {
  const request = requestOf(log);
  const path = routePath(log);

  if (isInvitationResponse(log)) {
    const reason = String(request?.reason ?? "").trim();
    return request?.response === "failed" && reason
      ? `The confirmation was not saved: ${reason}`
      : null;
  }

  const movement = handedOrReturned(
    "The device went out with a consumer.",
    "The device went back into the event's inventory."
  )(request);
  if (movement && path.startsWith("/api/receiver/")) return movement;

  const role = readableRole(request?.role_type);
  if (role) return `Their role changed to ${role}.`;

  const updates = log?.details?.updates;
  if (updates) {
    const named = Object.keys(updates).find((key) => EVENT_CHANGES[key]);
    if (named) return EVENT_CHANGES[named];
  }

  if (Array.isArray(request?.employees)) return "The company's staff list changed.";

  return null;
};
