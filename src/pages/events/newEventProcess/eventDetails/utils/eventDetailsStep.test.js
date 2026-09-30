import { describe, expect, it, vi } from "vitest";
import {
  mergeEventInfoDetail,
  saveExistingEventDetails,
  stepOneSubmitLabel,
} from "./eventDetailsStep";

/**
 * Reported 2026-09-30: resuming a draft opened step 1 with a "Save" button
 * that, after editing, gave no response at all. The save path for an event
 * that already exists awaited two requests with no try/catch and no loading
 * state — a failure was swallowed, and a slow success looked the same.
 */

describe("stepOneSubmitLabel", () => {
  it("says Next step while the event does not exist yet", () => {
    expect(stepOneSubmitLabel({})).toBe("Next step");
    expect(stepOneSubmitLabel(undefined)).toBe("Next step");
  });

  /* It used to test String(eventName).length === 0, and String(undefined) is
     "undefined" — so it said "Save changes" on a brand-new event too. */
  it("says Save and continue once the event exists", () => {
    expect(stepOneSubmitLabel({ idNoSQl: "m1", idSql: 8 })).toBe("Save and continue");
  });
});

describe("mergeEventInfoDetail", () => {
  /* Replacing the object dropped legal_documents_list, so the documents step
     reopened empty — and its Next would have saved that empty list over the
     documents already on the event. */
  it("keeps what step 1 does not edit, like the assigned documents", () => {
    const previous = { eventName: "BBQ", legal_documents_list: [{ id: "d1" }] };
    expect(mergeEventInfoDetail(previous, { eventName: "BBQ 2" })).toEqual({
      eventName: "BBQ 2",
      legal_documents_list: [{ id: "d1" }],
    });
  });

  it("works for a new event with nothing before it", () => {
    expect(mergeEventInfoDetail(undefined, { eventName: "BBQ" })).toEqual({ eventName: "BBQ" });
  });
});

describe("saveExistingEventDetails", () => {
  const event = { idNoSQl: "m1", idSql: 8 };
  const format = { eventName: "BBQ", floor: "Hall A" };
  const contactInfo = { name: "F S", email: "f@x.com", phone: ["555"] };
  const address = { street: "1 Main St", city: "Washington", state: "DC", zipCode: "20001" };
  const api = () => ({ patch: vi.fn(async () => ({})), post: vi.fn(async () => ({})) });

  it("updates the Mongo event and the SQL row of the same event", async () => {
    const client = api();
    await saveExistingEventDetails({ api: client, event, format, contactInfo, address });

    expect(client.patch).toHaveBeenCalledWith("/event/edit-event/m1", {
      eventInfoDetail: format,
      contactInfo,
    });
    expect(client.post).toHaveBeenCalledWith("/db_event/update-event/8", {
      event_id: 8,
      event_name: "BBQ",
      venue_name: "Hall A",
      street_address: "1 Main St",
      city_address: "Washington",
      state_address: "DC",
      zip_address: "20001",
      email_company: "f@x.com",
      phone_number: "555",
      contact_name: "F S",
    });
  });

  /* The caller shows this. Swallowing it is what produced "no response". */
  it("lets a failure reach the caller instead of vanishing", async () => {
    const client = api();
    client.post.mockRejectedValueOnce(new Error("SQL update failed"));
    await expect(
      saveExistingEventDetails({ api: client, event, format, contactInfo, address })
    ).rejects.toThrow("SQL update failed");
  });
});
