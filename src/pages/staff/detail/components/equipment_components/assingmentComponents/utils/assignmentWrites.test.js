import { describe, expect, it } from "vitest";
import { assertWriteSucceeded, readWriteFailure } from "./assignmentWrites";

/**
 * Assigning inventory to a staff member is six writes in a row: the lease
 * event, taking the units out of the warehouse, the signed-document
 * verification, one lease per device, the NoSQL event, and the event links.
 *
 * Only the first checked its answer. The rest of these endpoints reply HTTP 200
 * with `{ ok: false, msg }` when they refuse a write, so a refusal read as
 * success: the chain carried on, and the modal announced the devices assigned
 * while, say, the units were still sitting in the warehouse.
 */

describe("readWriteFailure", () => {
  it("is null when the server accepted the write", () => {
    expect(readWriteFailure({ data: { ok: true } })).toBeNull();
    expect(readWriteFailure({ status: 200, data: { result: [] } })).toBeNull();
  });

  it("reports the server's own reason for a refusal", () => {
    expect(
      readWriteFailure({ data: { ok: false, msg: "serial already leased" } })
    ).toBe("serial already leased");
  });

  it("says something rather than nothing when the refusal carries no reason", () => {
    expect(readWriteFailure({ data: { ok: false } })).toBe(
      "the server refused it and gave no reason"
    );
  });

  it("reads the other spellings a refusal arrives under", () => {
    expect(readWriteFailure({ data: { ok: false, message: "nope" } })).toBe("nope");
    expect(readWriteFailure({ data: { ok: false, error: "nope" } })).toBe("nope");
  });

  it("treats a missing response as a failure, not as a pass", () => {
    // An awaited call that resolved to nothing has not written anything.
    expect(readWriteFailure(undefined)).toBe("the server did not answer");
    expect(readWriteFailure(null)).toBe("the server did not answer");
  });

  it("catches a non-2xx that did not throw", () => {
    expect(readWriteFailure({ status: 500, data: {} })).toBe(
      "the server answered 500"
    );
  });

  it("does not read `ok: false` out of an unrelated field", () => {
    expect(readWriteFailure({ data: { ok: true, result: { ok: false } } })).toBeNull();
  });
});

describe("assertWriteSucceeded", () => {
  it("passes a good answer straight through", () => {
    const response = { data: { ok: true, id: 4 } };
    expect(assertWriteSucceeded(response, "Taking the units out of the warehouse")).toBe(
      response
    );
  });

  it("throws, naming the step and the reason", () => {
    expect(() =>
      assertWriteSucceeded(
        { data: { ok: false, msg: "serial already leased" } },
        "Taking the units out of the warehouse"
      )
    ).toThrow(
      "Taking the units out of the warehouse failed: serial already leased. Nothing else was written."
    );
  });

  it("throws on a response that never arrived", () => {
    expect(() => assertWriteSucceeded(null, "Recording the lease")).toThrow(
      /Recording the lease failed/
    );
  });
});
