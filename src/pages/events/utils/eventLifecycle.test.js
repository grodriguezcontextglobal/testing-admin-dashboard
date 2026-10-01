import { describe, expect, it, vi } from "vitest";
import {
  EVENT_CONFIGURATION,
  draftStatusLabel,
  eventLifecycle,
  writeEventConfiguration,
} from "./eventLifecycle";

/**
 * One vocabulary for where an event is in its life (2026-09-30):
 *
 *   draft   — created at step 1 of the wizard, setup not finished
 *   created — the wizard finished; the event exists for real
 *   closed  — closed with "Close event"
 *
 * It replaces "in-progress" / "completed", which said nothing about closing —
 * a closed event kept "completed" and only `active: false` told it apart.
 * Events already stored keep their old values, so both are read.
 */

describe("EVENT_CONFIGURATION", () => {
  it("names the three stages", () => {
    expect(EVENT_CONFIGURATION).toEqual({
      DRAFT: "draft",
      CREATED: "created",
      CLOSED: "closed",
    });
  });
});

describe("eventLifecycle", () => {
  it("reads the new values", () => {
    expect(eventLifecycle({ configuration: "draft", active: false })).toBe("draft");
    expect(eventLifecycle({ configuration: "created", active: true })).toBe("created");
    expect(eventLifecycle({ configuration: "closed", active: false })).toBe("closed");
  });

  it("reads the values events were stored with before", () => {
    expect(eventLifecycle({ configuration: "in-progress", active: false })).toBe("draft");
    expect(eventLifecycle({ configuration: "completed", active: true })).toBe("created");
  });

  /* Closing never wrote configuration: an old closed event says "completed"
     (or nothing) and active: false. */
  it("reads an old closed event from active: false", () => {
    expect(eventLifecycle({ configuration: "completed", active: false })).toBe("closed");
    expect(eventLifecycle({ active: false })).toBe("closed");
  });

  it("reads an old event with no configuration at all as created", () => {
    expect(eventLifecycle({ active: true })).toBe("created");
  });

  /* The new values are written tolerantly (the backend may not accept them
     yet), so an activated event can still carry "in-progress" / "draft". It is
     not a draft: it was activated. */
  it("never calls an active event a draft, whatever configuration still says", () => {
    expect(eventLifecycle({ configuration: "in-progress", active: true })).toBe("created");
    expect(eventLifecycle({ configuration: "draft", active: true })).toBe("created");
  });

  it("tolerates nothing", () => {
    expect(eventLifecycle(undefined)).toBe("closed");
  });
});

describe("writeEventConfiguration", () => {
  const api = () => ({ patch: vi.fn(async () => ({ data: { ok: true } })), post: vi.fn(async () => ({ data: { ok: true } })) });

  it("writes the stage on both records", async () => {
    const client = api();
    const result = await writeEventConfiguration({
      api: client,
      mongoId: "m1",
      sqlId: 8,
      value: "created",
    });
    expect(client.patch).toHaveBeenCalledWith("/event/edit-event/m1", { configuration: "created" });
    expect(client.post).toHaveBeenCalledWith("/db_event/update-event/8", { configuration: "created" });
    expect(result).toEqual({ mongo: true, sql: true });
  });

  /* Until the backend is known to accept the new words, refusing one must not
     stop creating or closing an event. */
  it("never throws when a record refuses the value", async () => {
    const client = api();
    client.patch.mockRejectedValueOnce(new Error("enum"));
    client.post.mockResolvedValueOnce({ data: { ok: false, msg: "Invalid value" } });
    await expect(
      writeEventConfiguration({ api: client, mongoId: "m1", sqlId: 8, value: "closed" })
    ).resolves.toEqual({ mongo: false, sql: false });
  });

  it("skips a record it has no id for", async () => {
    const client = api();
    const result = await writeEventConfiguration({ api: client, mongoId: "m1", value: "draft" });
    expect(client.post).not.toHaveBeenCalled();
    expect(result).toEqual({ mongo: true, sql: false });
  });
});

/* Meeting 2026-09-29 `40:00`: "if it stays in draft and then event ended, then
   the event hasn't ended, you would just say move it to inactive." Still a
   draft — it can be finished or deleted — but labelled for what it has become. */
describe("draftStatusLabel", () => {
  const now = new Date("2026-10-01T12:00:00Z");
  const draftEnding = (dateEnd) => ({
    active: false,
    configuration: "draft",
    eventInfoDetail: { dateEnd },
  });

  it("is Draft while the event's end date is still ahead", () => {
    expect(draftStatusLabel(draftEnding("2026-10-05T20:00:00Z"), now)).toBe("Draft");
  });

  it("is Inactive once the end date has passed", () => {
    expect(draftStatusLabel(draftEnding("2026-09-20T20:00:00Z"), now)).toBe("Inactive");
  });

  it("stays Draft when there is no end date to compare", () => {
    expect(draftStatusLabel(draftEnding(undefined), now)).toBe("Draft");
  });
});
