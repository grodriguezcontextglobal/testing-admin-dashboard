/**
 * The rules and the bodies behind "add a consumer".
 *
 * They were inline in CreateNewUser.jsx, split across two mechanisms: a yup
 * schema for the three text fields and a hand-rolled `phoneError` for the
 * fourth, so the phone was the one field whose message only appeared on the
 * submit after the others had already stopped it.
 *
 * The payload builders exist to pin what the three endpoints already accept.
 * Nothing here changes a request — the tests assert the exact keys, including
 * the null entry the patch has always sent when no event is picked.
 */

export const NO_EVENT_OPTION_ID = "__no_event__";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const blank = (value) => !String(value ?? "").trim();

/** A fresh object per read: the caller resets state with it. */
export const EMPTY_NEW_CONSUMER_FORM = Object.freeze({
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
});

/**
 * One message per field, keyed by field name so it can be rendered under the
 * input it is about rather than as a list of sentences under the form.
 */
export const newConsumerFieldErrors = (form = {}) => {
  const errors = {};
  if (blank(form.firstName)) errors.firstName = "First name is required";
  if (blank(form.lastName)) errors.lastName = "Last name is required";
  if (blank(form.email)) {
    errors.email = "Email is required";
  } else if (!EMAIL_PATTERN.test(String(form.email).trim())) {
    errors.email = "Email has an invalid format";
  }
  if (blank(form.phoneNumber)) errors.phoneNumber = "Phone number is required";
  return errors;
};

/** Body for POST /auth/new. */
export const buildNewConsumerProfile = ({ form, user, event }) => ({
  name: form.firstName,
  lastName: form.lastName,
  email: form.email,
  phoneNumber: form.phoneNumber,
  privacyPolicy: true,
  category: "Regular",
  provider: [user.company],
  eventSelected: event ? [event.eventInfoDetail.eventName] : [],
  company_providers: [user.companyData.id],
  event_providers: event ? [event.id] : [],
  groupName: [],
});

/** Body for POST /db_consumer/new_consumer. */
export const buildSqlConsumerPayload = (form) => ({
  first_name: form.firstName,
  last_name: form.lastName,
  email: form.email,
  phone_number: `${form.phoneNumber}`,
});

/**
 * Body for PATCH /auth/:id, when the email is already on record.
 *
 * `event && …` is deliberate rather than a filter: with no event picked the
 * arrays have always been sent carrying a trailing null, and correcting that
 * changes what the endpoint is asked to store. Pinned by a test instead.
 */
export const buildExistingConsumerPatch = ({ existing, form, user, event }) => ({
  id: existing.id,
  eventSelected: [
    ...new Set([...existing.eventSelected, event && event.eventInfoDetail.eventName]),
  ],
  provider: [...new Set([...existing.provider, user.company])],
  company_providers: [...new Set([...existing.company_providers, user.companyData.id])],
  event_providers: [...new Set([...existing.event_providers, event && event.id])],
  phoneNumber: form.phoneNumber,
});

/** Whether the record found by email is already attached to the chosen event. */
export const isAlreadyInEvent = (existing, event) =>
  Boolean(event) &&
  (existing?.event_providers ?? []).some((element) => element === event.id);

/**
 * Options for the event selector. Each carries its event so the caller never
 * has to JSON.stringify one through a DOM value to get it back.
 */
export const buildEventOptions = (events = []) => [
  ...(events ?? []).map((event) => ({
    id: event.id,
    label: event?.eventInfoDetail?.eventName || "Untitled event",
    event,
  })),
  { id: NO_EVENT_OPTION_ID, label: "No event", event: null },
];
