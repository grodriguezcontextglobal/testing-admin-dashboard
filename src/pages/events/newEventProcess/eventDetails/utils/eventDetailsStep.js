/**
 * Step 1 of the new-event wizard, for an event that already exists — the
 * second visit to the step, or a draft being resumed (reported 2026-09-30:
 * "Save" gave no response after editing).
 */

/** The event exists on the server once both ids are in Redux. */
const eventExists = (event) => Boolean(event?.idNoSQl && event?.idSql);

/**
 * It used to test `String(eventName).length === 0`; String(undefined) is
 * "undefined", so a brand-new event said "Save changes" too.
 */
export const stepOneSubmitLabel = (event) =>
  eventExists(event) ? "Save and continue" : "Next step";

/**
 * Step 1 edits only its own fields. Replacing eventInfoDetail wholesale dropped
 * the rest — `legal_documents_list` among them — so the documents step
 * reopened empty and its Next would have saved that empty list over the event.
 */
export const mergeEventInfoDetail = (previous, format) => ({ ...(previous ?? {}), ...format });

/**
 * Both records of the event, Mongo then SQL. Throws on failure: the caller
 * shows it — swallowing it is what looked like "no response".
 */
export const saveExistingEventDetails = async ({ api, event, format, contactInfo, address }) => {
  await api.patch(`/event/edit-event/${event.idNoSQl}`, {
    eventInfoDetail: format,
    contactInfo,
  });
  await api.post(`/db_event/update-event/${event.idSql}`, {
    event_id: event.idSql,
    event_name: format.eventName,
    venue_name: format.floor,
    street_address: address.street,
    city_address: address.city,
    state_address: address.state,
    zip_address: address.zipCode,
    email_company: contactInfo.email,
    phone_number: contactInfo.phone?.[0],
    contact_name: contactInfo.name,
  });
};

export { eventExists };
