import { EVENT_CONFIGURATION, eventLifecycle } from "./eventLifecycle";

/**
 * Events whose setup was started and never finished (meeting 2026-09-29
 * `38:42`–`40:16`: "It was never done… you add a new one that is called
 * draft").
 *
 * Step 1 of the new-event wizard creates the event inactive, as a draft; the
 * review step activates it. Every screen used to read only `active`, so an
 * unfinished event was listed with the closed ones as "Closed".
 *
 * What counts as a draft — `configuration` "draft" or the older "in-progress",
 * on an event that is not active — lives in eventLifecycle.js. Events from
 * before the field existed carry no `configuration`, and they are not drafts.
 */
export const isDraftEvent = (event) => eventLifecycle(event) === EVENT_CONFIGURATION.DRAFT;

/** @returns {{ drafts: object[], others: object[] }} in the original order */
export const splitDraftEvents = (events = []) => {
  const drafts = [];
  const others = [];
  for (const event of events ?? []) (isDraftEvent(event) ? drafts : others).push(event);
  return { drafts, others };
};

/**
 * The Redux state the wizard reads, rebuilt from the saved event, so it opens
 * where it was left. Both ids matter: with `idNoSQl` and `idSql` present,
 * step 1 updates the existing event instead of creating a second one
 * (eventDetails/Form.jsx, `handleEventInfo`).
 *
 * @param {object} event the Mongo event from the events list
 * @param {number|string} sqlEventId its row in the SQL events table
 */
export const draftResumeState = (event, sqlEventId) => {
  const eventInfoDetail = {
    ...(event?.eventInfoDetail ?? {}),
    legal_documents_list: event?.legal_documents_list ?? [],
  };
  return {
    eventData: { ...eventInfoDetail, idNoSQl: event?.id, idSql: sqlEventId },
    eventInfoDetail,
    contactInfo: event?.contactInfo,
    staff: event?.staff ?? { adminUser: [], headsetAttendees: [] },
    deviceSetup: event?.deviceSetup ?? [],
  };
};

/**
 * The body for `/db_event/events_information` that finds a draft's SQL row —
 * the same name + zip lookup PastEventsTable uses to open an event.
 */
export const sqlLookupFor = (event) => ({
  event_name: event?.eventInfoDetail?.eventName,
  zip_address: `${event?.eventInfoDetail?.address ?? ""}`.trim().split(" ").at(-1),
});

/**
 * This company's row among the matches, the newest if the name repeats. Null
 * when there is none, and the caller must not resume then: without the SQL id,
 * step 1 creates a second event.
 */
export const pickSqlEventId = (rows = [], companyId) => {
  const own = (rows ?? []).filter(
    (row) => String(row?.company_assigned_event_id) === String(companyId)
  );
  return own.at(-1)?.event_id ?? null;
};
