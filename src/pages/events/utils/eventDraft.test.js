import { describe, expect, it } from "vitest";
import {
  draftResumeState,
  isDraftEvent,
  pickSqlEventId,
  splitDraftEvents,
  sqlLookupFor,
} from "./eventDraft";
import { getEventStatus } from "./getEventStatus";
import { getCountdownLabel } from "./eventStatusHelpers";

/**
 * Meeting 2026-09-29 `38:42`–`40:16`. He left the new-event wizard half way to
 * create a document, came back, and the event read "closed / ended":
 *
 * > "We should not do that because it's not ended… It was never done."
 * > "Or you add a new one that is called draft. Everybody knows what that means."
 *
 * An event is created on the server at step 1 with `active: false` and
 * `configuration: "in-progress"`; the review step sets `active: true` and
 * `configuration: "completed"`. Every screen read only `active`, so an
 * unfinished event looked exactly like a closed one.
 */

const draft = {
  id: "mongo-1",
  active: false,
  configuration: "in-progress",
  company: "Beaver Bridges",
  eventInfoDetail: {
    eventName: "BBQ",
    address: "1 Main St, Washington DC, 20001",
    dateBegin: "2099-10-02T15:00:00.000Z",
    dateEnd: "2099-10-02T20:00:00.000Z",
  },
  contactInfo: { name: "Fredrik Starmark", email: "f@x.com", phone: ["555"] },
  staff: { adminUser: [{ email: "f@x.com" }], headsetAttendees: [] },
  deviceSetup: [{ group: "Chromebooks", quantity: 2 }],
  legal_documents_list: [{ id: "d1", title: "Waiver form" }],
};

const closed = { ...draft, id: "mongo-2", configuration: "completed" };
const live = { ...draft, id: "mongo-3", active: true, configuration: "completed" };

describe("isDraftEvent", () => {
  it("is an event whose setup was never finished", () => {
    expect(isDraftEvent(draft)).toBe(true);
  });

  it("is not a finished event, open or closed", () => {
    expect(isDraftEvent(closed)).toBe(false);
    expect(isDraftEvent(live)).toBe(false);
  });

  /* Events created before the field existed have no `configuration`. They are
     finished events; reading them as drafts would relabel the whole history. */
  it("is not an older event that carries no configuration at all", () => {
    const legacy = { ...closed };
    delete legacy.configuration;
    expect(isDraftEvent(legacy)).toBe(false);
  });
});

describe("splitDraftEvents", () => {
  it("separates drafts from everything else, keeping the order", () => {
    expect(splitDraftEvents([live, draft, closed])).toEqual({
      drafts: [draft],
      others: [live, closed],
    });
  });

  it("tolerates a missing list", () => {
    expect(splitDraftEvents(undefined)).toEqual({ drafts: [], others: [] });
  });
});

describe("the status a draft shows", () => {
  it("reads Draft, not Closed, on the status chip", () => {
    expect(getEventStatus(draft)).toMatchObject({ key: "draft", label: "Draft" });
    expect(getEventStatus(closed)).toMatchObject({ key: "closed", label: "Closed" });
  });

  it("reads Draft, not Closed, on the event card", () => {
    expect(getCountdownLabel(draft)).toEqual({ text: "Draft", tone: "draft" });
  });
});

describe("draftResumeState — what the wizard needs to pick up where it stopped", () => {
  const state = draftResumeState(draft, 88);

  /* With both ids present, step 1 PATCHes the existing event instead of
     creating a second one (eventDetails/Form.jsx, handleEventInfo). */
  it("carries both database ids, so step 1 updates instead of creating", () => {
    expect(state.eventData).toMatchObject({ idNoSQl: "mongo-1", idSql: 88, eventName: "BBQ" });
  });

  it("restores the details the form pre-fills from", () => {
    expect(state.eventInfoDetail).toMatchObject({
      eventName: "BBQ",
      address: "1 Main St, Washington DC, 20001",
    });
  });

  it("brings back the documents already assigned", () => {
    expect(state.eventInfoDetail.legal_documents_list).toEqual([
      { id: "d1", title: "Waiver form" },
    ]);
  });

  it("restores contact, staff and devices", () => {
    expect(state.contactInfo).toEqual(draft.contactInfo);
    expect(state.staff).toEqual(draft.staff);
    expect(state.deviceSetup).toEqual(draft.deviceSetup);
  });

  it("falls back to empty shapes the wizard already expects", () => {
    const bare = draftResumeState({ id: "m", configuration: "in-progress", eventInfoDetail: {} }, 1);
    expect(bare.staff).toEqual({ adminUser: [], headsetAttendees: [] });
    expect(bare.deviceSetup).toEqual([]);
    expect(bare.eventInfoDetail.legal_documents_list).toEqual([]);
  });
});

/* The Mongo event does not carry its SQL id, and resuming needs it (without it
   step 1 would create a second event). The same lookup the Past table uses to
   open an event: name + zip. */
describe("finding the draft's SQL row", () => {
  it("looks it up by event name and the zip at the end of the address", () => {
    expect(sqlLookupFor(draft)).toEqual({ event_name: "BBQ", zip_address: "20001" });
  });

  it("takes this company's row, the newest one if the name repeats", () => {
    const rows = [
      { event_id: 10, company_assigned_event_id: 7 },
      { event_id: 11, company_assigned_event_id: 99 },
      { event_id: 12, company_assigned_event_id: 7 },
    ];
    expect(pickSqlEventId(rows, 7)).toBe(12);
  });

  it("is null when no row belongs to this company", () => {
    expect(pickSqlEventId([{ event_id: 11, company_assigned_event_id: 99 }], 7)).toBeNull();
    expect(pickSqlEventId(undefined, 7)).toBeNull();
  });
});
