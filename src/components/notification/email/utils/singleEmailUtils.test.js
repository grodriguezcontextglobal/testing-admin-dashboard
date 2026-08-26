import { describe, expect, it } from "vitest";
import {
  MESSAGE_MAX_LENGTH,
  buildSingleEmailPayload,
  describeEventContext,
  describeRecipient,
  singleEmailFieldErrors,
} from "./singleEmailUtils";

const customer = { name: "Ada", lastName: "Lovelace", email: "ada@x.com" };
const event = {
  company: "Acme Rentals",
  eventInfoDetail: { eventName: "Science Fair" },
};

describe("singleEmailFieldErrors", () => {
  it("names both empty fields at once", () => {
    expect(singleEmailFieldErrors({ subject: "", message: "" })).toEqual({
      subject: "The email needs a subject.",
      message: "Write the message you want to send.",
    });
  });

  it("accepts nothing at all as both fields empty rather than throwing", () => {
    expect(Object.keys(singleEmailFieldErrors())).toEqual(["subject", "message"]);
  });

  it("treats whitespace as empty in both fields", () => {
    expect(singleEmailFieldErrors({ subject: "  ", message: "\n\t " })).toEqual({
      subject: "The email needs a subject.",
      message: "Write the message you want to send.",
    });
  });

  it("returns nothing for a complete email", () => {
    expect(
      singleEmailFieldErrors({ subject: "Your devices", message: "Please collect them." })
    ).toEqual({});
  });

  it("says how far over the limit a long message is", () => {
    const message = "x".repeat(MESSAGE_MAX_LENGTH + 12);
    expect(singleEmailFieldErrors({ subject: "Hi", message })).toEqual({
      message: `12 characters over the ${MESSAGE_MAX_LENGTH}-character limit.`,
    });
  });

  it("accepts a message exactly at the limit", () => {
    const message = "x".repeat(MESSAGE_MAX_LENGTH);
    expect(singleEmailFieldErrors({ subject: "Hi", message })).toEqual({});
  });
});

describe("buildSingleEmailPayload", () => {
  it("pins the body the endpoint already accepts", () => {
    expect(
      buildSingleEmailPayload({
        customer,
        event,
        subject: "Your devices",
        message: "Please collect them.",
      })
    ).toEqual({
      consumer: "ada@x.com",
      subject: "Your devices",
      message: "Please collect them.",
      eventSelected: "Science Fair",
      company: "Acme Rentals",
    });
  });

  it("adds no field outside the contract", () => {
    const payload = buildSingleEmailPayload({
      customer,
      event,
      subject: "s",
      message: "m",
    });
    expect(Object.keys(payload).sort()).toEqual([
      "company",
      "consumer",
      "eventSelected",
      "message",
      "subject",
    ]);
  });

  it("builds a body with no event instead of throwing on the consumer list", () => {
    // `event.eventInfoDetail.eventName` used to be read straight through, so
    // opening this from /consumers with no event in context threw before the
    // request could be made.
    const payload = buildSingleEmailPayload({
      customer,
      event: {},
      subject: "s",
      message: "m",
    });
    expect(payload.eventSelected).toBeUndefined();
    expect(payload.company).toBeUndefined();
    expect(payload.consumer).toBe("ada@x.com");
  });
});

describe("describeRecipient", () => {
  it("carries the name and the address it will go to", () => {
    expect(describeRecipient(customer)).toEqual({
      name: "Ada Lovelace",
      email: "ada@x.com",
      canSend: true,
    });
  });

  it("cannot send to a consumer with no address on record", () => {
    // The old screen printed "This email will be sent to undefined." and let
    // you write the whole thing anyway.
    expect(describeRecipient({ name: "Ada" }).canSend).toBe(false);
    expect(describeRecipient(undefined).canSend).toBe(false);
    expect(describeRecipient({ email: "  " }).canSend).toBe(false);
  });

  it("has an empty name rather than the word undefined when one is missing", () => {
    expect(describeRecipient({ email: "ada@x.com" }).name).toBe("");
    expect(describeRecipient({ name: "Ada", email: "ada@x.com" }).name).toBe("Ada");
  });
});

describe("describeEventContext", () => {
  it("names the event the email will reference", () => {
    expect(describeEventContext(event)).toEqual({
      name: "Science Fair",
      company: "Acme Rentals",
    });
  });

  it("is null when there is no event in context", () => {
    expect(describeEventContext({})).toBeNull();
    expect(describeEventContext(undefined)).toBeNull();
    expect(describeEventContext({ eventInfoDetail: { eventName: "  " } })).toBeNull();
  });
});
