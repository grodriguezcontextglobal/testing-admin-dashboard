import { describe, expect, it } from "vitest";
import {
  EMPTY_NEW_CONSUMER_FORM,
  NO_EVENT_OPTION_ID,
  buildEventOptions,
  buildExistingConsumerPatch,
  buildNewConsumerProfile,
  buildSqlConsumerPayload,
  isAlreadyInEvent,
  newConsumerFieldErrors,
} from "./newConsumerForm";

const admin = {
  company: "Acme Rentals",
  companyData: { id: "co-1" },
};

const event = {
  id: "evt-1",
  eventInfoDetail: { eventName: "Science Fair" },
};

const filledForm = {
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@x.com",
  phoneNumber: "+15550000000",
};

describe("EMPTY_NEW_CONSUMER_FORM", () => {
  it("carries every field the form collects, all blank", () => {
    expect(EMPTY_NEW_CONSUMER_FORM).toEqual({
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
    });
  });

  it("is a fresh object per read, so clearing cannot mutate the default", () => {
    const first = { ...EMPTY_NEW_CONSUMER_FORM };
    first.firstName = "typed";
    expect(EMPTY_NEW_CONSUMER_FORM.firstName).toBe("");
  });
});

describe("newConsumerFieldErrors", () => {
  it("keys one message per empty required field", () => {
    expect(newConsumerFieldErrors(EMPTY_NEW_CONSUMER_FORM)).toEqual({
      firstName: "First name is required",
      lastName: "Last name is required",
      email: "Email is required",
      phoneNumber: "Phone number is required",
    });
  });

  it("returns nothing for a complete form", () => {
    expect(newConsumerFieldErrors(filledForm)).toEqual({});
  });

  it("treats whitespace as empty", () => {
    const errors = newConsumerFieldErrors({ ...filledForm, firstName: "   " });
    expect(errors.firstName).toBe("First name is required");
  });

  it("reports a malformed email under the email field, not as a sentence elsewhere", () => {
    expect(newConsumerFieldErrors({ ...filledForm, email: "ada@" })).toEqual({
      email: "Email has an invalid format",
    });
    expect(newConsumerFieldErrors({ ...filledForm, email: "ada" })).toEqual({
      email: "Email has an invalid format",
    });
    expect(newConsumerFieldErrors({ ...filledForm, email: "a b@x.com" })).toEqual({
      email: "Email has an invalid format",
    });
  });

  it("requires the phone the same way as the name and the email", () => {
    // It used to live outside the schema, so it was the one field whose
    // message appeared after a submit the others had already blocked.
    expect(newConsumerFieldErrors({ ...filledForm, phoneNumber: "" })).toEqual({
      phoneNumber: "Phone number is required",
    });
    expect(newConsumerFieldErrors({ ...filledForm, phoneNumber: undefined })).toEqual({
      phoneNumber: "Phone number is required",
    });
  });
});

describe("buildNewConsumerProfile", () => {
  it("pins the body POST /auth/new already accepts", () => {
    expect(buildNewConsumerProfile({ form: filledForm, user: admin, event })).toEqual({
      name: "Ada",
      lastName: "Lovelace",
      email: "ada@x.com",
      phoneNumber: "+15550000000",
      privacyPolicy: true,
      category: "Regular",
      provider: ["Acme Rentals"],
      eventSelected: ["Science Fair"],
      company_providers: ["co-1"],
      event_providers: ["evt-1"],
      groupName: [],
    });
  });

  it("sends empty event arrays when no event was picked", () => {
    const payload = buildNewConsumerProfile({
      form: filledForm,
      user: admin,
      event: null,
    });
    expect(payload.eventSelected).toEqual([]);
    expect(payload.event_providers).toEqual([]);
  });

  it("adds no field outside the contract", () => {
    const payload = buildNewConsumerProfile({ form: filledForm, user: admin, event });
    expect(Object.keys(payload).sort()).toEqual(
      [
        "category",
        "company_providers",
        "email",
        "eventSelected",
        "event_providers",
        "groupName",
        "lastName",
        "name",
        "phoneNumber",
        "privacyPolicy",
        "provider",
      ].sort()
    );
  });
});

describe("buildSqlConsumerPayload", () => {
  it("pins the body POST /db_consumer/new_consumer already accepts", () => {
    expect(buildSqlConsumerPayload(filledForm)).toEqual({
      first_name: "Ada",
      last_name: "Lovelace",
      email: "ada@x.com",
      phone_number: "+15550000000",
    });
  });

  it("sends the phone as a string even when the input hands back nothing", () => {
    expect(buildSqlConsumerPayload({ ...filledForm, phoneNumber: undefined })).toEqual({
      first_name: "Ada",
      last_name: "Lovelace",
      email: "ada@x.com",
      phone_number: "undefined",
    });
  });
});

describe("buildExistingConsumerPatch", () => {
  const existing = {
    id: "usr-9",
    eventSelected: ["Old Expo"],
    provider: ["Acme Rentals"],
    company_providers: ["co-1"],
    event_providers: ["evt-old"],
  };

  it("pins the body PATCH /auth/:id already accepts, unioned with what is on record", () => {
    expect(
      buildExistingConsumerPatch({ existing, form: filledForm, user: admin, event })
    ).toEqual({
      id: "usr-9",
      eventSelected: ["Old Expo", "Science Fair"],
      provider: ["Acme Rentals"],
      company_providers: ["co-1"],
      event_providers: ["evt-old", "evt-1"],
      phoneNumber: "+15550000000",
    });
  });

  it("does not duplicate an event, company or provider already on the record", () => {
    const patch = buildExistingConsumerPatch({
      existing: {
        ...existing,
        eventSelected: ["Science Fair"],
        event_providers: ["evt-1"],
      },
      form: filledForm,
      user: admin,
      event,
    });
    expect(patch.eventSelected).toEqual(["Science Fair"]);
    expect(patch.event_providers).toEqual(["evt-1"]);
    expect(patch.provider).toEqual(["Acme Rentals"]);
    expect(patch.company_providers).toEqual(["co-1"]);
  });

  it("keeps sending a null entry when no event was picked — existing behaviour, pinned", () => {
    // The screen let you save a consumer with "No event" selected and the patch
    // spread `event && event.id` into the arrays regardless, so a null landed in
    // both. Left exactly as it was: the task is the layout, and correcting the
    // body is a change to what the endpoint is asked to store.
    const patch = buildExistingConsumerPatch({
      existing,
      form: filledForm,
      user: admin,
      event: null,
    });
    expect(patch.eventSelected).toEqual(["Old Expo", null]);
    expect(patch.event_providers).toEqual(["evt-old", null]);
  });

  it("adds no field outside the contract", () => {
    const patch = buildExistingConsumerPatch({
      existing,
      form: filledForm,
      user: admin,
      event,
    });
    expect(Object.keys(patch).sort()).toEqual(
      [
        "company_providers",
        "eventSelected",
        "event_providers",
        "id",
        "phoneNumber",
        "provider",
      ].sort()
    );
  });
});

describe("isAlreadyInEvent", () => {
  it("is true when the record already carries the event id", () => {
    expect(isAlreadyInEvent({ event_providers: ["evt-1"] }, event)).toBe(true);
  });

  it("is false for a different event", () => {
    expect(isAlreadyInEvent({ event_providers: ["evt-2"] }, event)).toBe(false);
  });

  it("is false when no event was picked — there is nothing to be already in", () => {
    expect(isAlreadyInEvent({ event_providers: ["evt-1"] }, null)).toBe(false);
  });

  it("does not throw on a record with no event_providers at all", () => {
    expect(isAlreadyInEvent({}, event)).toBe(false);
  });
});

describe("buildEventOptions", () => {
  it("labels each event by its name and carries the event on the option", () => {
    const [first] = buildEventOptions([event]);
    expect(first).toEqual({
      id: "evt-1",
      label: "Science Fair",
      event,
    });
  });

  it("ends with an explicit No event choice, so leaving it out is a decision", () => {
    const options = buildEventOptions([event]);
    expect(options.at(-1)).toEqual({ id: NO_EVENT_OPTION_ID, label: "No event", event: null });
  });

  it("survives an event with no detail block instead of rendering an empty row", () => {
    const options = buildEventOptions([{ id: "evt-2" }, event]);
    expect(options.map((option) => option.label)).toEqual([
      "Untitled event",
      "Science Fair",
      "No event",
    ]);
  });

  it("offers only the No event choice when the admin has no active events", () => {
    expect(buildEventOptions([])).toEqual([
      { id: NO_EVENT_OPTION_ID, label: "No event", event: null },
    ]);
    expect(buildEventOptions(undefined)).toEqual([
      { id: NO_EVENT_OPTION_ID, label: "No event", event: null },
    ]);
  });
});
