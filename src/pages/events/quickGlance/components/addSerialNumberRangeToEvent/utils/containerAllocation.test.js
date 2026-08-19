import { describe, expect, it } from "vitest";
import {
  CONTAINER_BATCH_SIZE,
  buildContainerAllocationPayload,
  summarizeContainerAllocation,
} from "./containerAllocation";

const event = () => ({
  id: "mongo-event-1",
  company_id: "company-mongo-1",
  company: "Invoxia",
  sql: { event_id: 42 },
  eventInfoDetail: { eventName: "Spring Expo" },
  deviceSetup: [
    { group: "Road Case", category: "Containers" },
    { group: "Receiver", category: "Audio" },
  ],
});

const user = () => ({ sqlInfo: { company_id: 137 } });

describe("CONTAINER_BATCH_SIZE", () => {
  // The endpoint expands each container into its children and writes the
  // UPDATE and the INSERT as one un-chunked statement per request, so the
  // placeholder count grows with children, not with the serials we send.
  // Backend asked for 100-200 containers per request until they add chunking.
  it("stays inside the 100-200 containers per request the endpoint can take", () => {
    expect(CONTAINER_BATCH_SIZE).toBeGreaterThanOrEqual(100);
    expect(CONTAINER_BATCH_SIZE).toBeLessThanOrEqual(200);
  });
});

describe("buildContainerAllocationPayload", () => {
  it("sends every key the endpoint reads, unchanged", () => {
    const payload = buildContainerAllocationPayload({
      event: event(),
      deviceTitle: "Road Case",
      user: user(),
      batch: ["RC-1", "RC-2"],
    });

    expect(payload).toEqual({
      category_name: "Containers",
      company_id: 137,
      company_id_nosql: "company-mongo-1",
      data: ["RC-1", "RC-2"],
      event_id: 42,
      eventName: "Spring Expo",
      item_group: "Road Case",
      logistic_status: "in-event",
      warehouse: 0,
    });
  });

  it("reads the category from the matching device-setup group, not the first one", () => {
    const payload = buildContainerAllocationPayload({
      event: event(),
      deviceTitle: "Receiver",
      user: user(),
      batch: ["R-1"],
    });
    expect(payload.category_name).toBe("Audio");
    expect(payload.item_group).toBe("Receiver");
  });

  // This used to be `event.deviceSetup.find(...).category`, which threw a
  // bare "Cannot read properties of undefined" that surfaced to the user as
  // "Batch 1 failed: ...". The group being absent is a state problem worth
  // naming.
  it("fails with a readable message when the group is not in the event setup", () => {
    expect(() =>
      buildContainerAllocationPayload({
        event: event(),
        deviceTitle: "Not In Setup",
        user: user(),
        batch: ["X-1"],
      }),
    ).toThrow(/Not In Setup/);
  });

  it("names the group even when the event carries no device setup at all", () => {
    expect(() =>
      buildContainerAllocationPayload({
        event: { ...event(), deviceSetup: undefined },
        deviceTitle: "Road Case",
        user: user(),
        batch: ["RC-1"],
      }),
    ).toThrow(/Road Case/);
  });
});

describe("summarizeContainerAllocation", () => {
  it("reads the counts and message the endpoint returns", () => {
    const summary = summarizeContainerAllocation({
      message: "3 items were processed.",
      result: { allItemsToProcess: [1, 2, 3] },
      props: [{ serial_number: "CH-1" }, { serial_number: "CH-2" }],
    });
    expect(summary).toEqual({
      message: "3 items were processed.",
      processedItemCount: 3,
      childCount: 2,
    });
  });

  it("reports nulls rather than zeros when the response carries no counts", () => {
    expect(summarizeContainerAllocation({ ok: true })).toEqual({
      message: null,
      processedItemCount: null,
      childCount: null,
    });
  });

  it("survives a missing or non-object response", () => {
    for (const value of [undefined, null, "", 0]) {
      expect(summarizeContainerAllocation(value)).toEqual({
        message: null,
        processedItemCount: null,
        childCount: null,
      });
    }
  });

  it("ignores counts that are not arrays instead of guessing a number", () => {
    const summary = summarizeContainerAllocation({
      result: { allItemsToProcess: 7 },
      props: "not-an-array",
    });
    expect(summary.processedItemCount).toBeNull();
    expect(summary.childCount).toBeNull();
  });

  it("surfaces the empty-containers message, which arrives as a success", () => {
    const summary = summarizeContainerAllocation({
      message: "The specified containers are empty.",
      result: { allItemsToProcess: [] },
    });
    expect(summary.message).toBe("The specified containers are empty.");
    expect(summary.processedItemCount).toBe(0);
  });

  it("keeps a blank message as null so callers do not render an empty line", () => {
    expect(summarizeContainerAllocation({ message: "   " }).message).toBeNull();
  });
});
