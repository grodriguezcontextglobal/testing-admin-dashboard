import { describe, expect, it } from "vitest";
import {
  COUNT_STATUS,
  MAX_SCANNED,
  buildCountRequest,
  countRows,
  readBulkRegisterOutcome,
  readCountResponse,
} from "./eventCountContract";

const response = {
  ok: true,
  summary: {
    expected: 5,
    scanned: 3,
    matched: 2,
    missing: 3,
    foreign: 1,
    unknown: 1,
    ambiguous: 1,
  },
  matched: [
    {
      item_id: 1,
      serial_number: "10001",
      category_name: "Receivers",
      item_group: "RX-100",
      epc: "3425E16CB4",
      matchedBy: "3425E16CB4",
      matchedVia: "epc",
    },
    {
      item_id: 2,
      serial_number: "10002",
      item_group: "RX-100",
      epc: null,
      matchedBy: "10002",
      matchedVia: "serial",
    },
  ],
  missing_tagged: [
    { item_id: 3, serial_number: "10003", epc: "3425E16CB6", item_group: "RX-100" },
  ],
  missing_untagged: [
    { item_id: 4, serial_number: "10004", epc: null, item_group: "RX-100" },
    { item_id: 5, serial_number: "10005", epc: null, item_group: "RX-100" },
  ],
  foreign: [{ id_value: "CCDD", item_id: 77 }],
  unknown: ["ZZZZ"],
  ambiguous: [{ value: "10004", item_ids: [4, 5] }],
};

describe("buildCountRequest", () => {
  it("puts company_id in the body, because the header alone gives a 400", () => {
    const { request } = buildCountRequest({
      eventId: 123,
      companyId: 45,
      codes: ["3425E16CB4"],
    });
    expect(request).toEqual({
      event_id: 123,
      company_id: 45,
      scanned: ["3425E16CB4"],
    });
  });

  it("normalises the way the server does, so our count is its count", () => {
    // §1.4: the server trims and uppercases before comparing. Sending the same
    // tag in two casings would spend two slots of the ceiling on one device.
    const { request } = buildCountRequest({
      eventId: 1,
      companyId: 1,
      codes: [" 3425e16cb4 ", "3425E16CB4", "10001"],
    });
    expect(request.scanned).toEqual(["3425E16CB4", "10001"]);
  });

  it("drops empties instead of sending them", () => {
    const { request } = buildCountRequest({
      eventId: 1,
      companyId: 1,
      codes: ["10001", "", "   ", null, undefined],
    });
    expect(request.scanned).toEqual(["10001"]);
  });

  it("refuses a sweep over the ceiling rather than slicing it", () => {
    // §1.3: reconcile derives `missing` from expected minus scanned, so a
    // partial batch reports devices as lost that are in the box. Chunking is
    // explicitly not supported, which makes this a refusal, not a retry.
    const codes = Array.from({ length: MAX_SCANNED + 1 }, (_, i) => `SN-${i}`);
    const { request, error } = buildCountRequest({
      eventId: 1,
      companyId: 1,
      codes,
    });
    expect(request).toBeNull();
    expect(error).toEqual({
      code: "too-many-scanned",
      count: MAX_SCANNED + 1,
      limit: MAX_SCANNED,
    });
  });

  it("counts the ceiling after deduplicating, not before", () => {
    // 4000 reads of 2 devices is a normal pass, not an oversized one.
    const codes = Array.from({ length: 4000 }, (_, i) =>
      i % 2 ? "AAAA" : "BBBB"
    );
    const { request, error } = buildCountRequest({
      eventId: 1,
      companyId: 1,
      codes,
    });
    expect(error).toBeNull();
    expect(request.scanned).toEqual(["BBBB", "AAAA"]);
  });

  it("will not build a request without an event or a company", () => {
    expect(buildCountRequest({ companyId: 1, codes: ["A"] }).error.code).toBe(
      "missing-context"
    );
    expect(buildCountRequest({ eventId: 1, codes: ["A"] }).error.code).toBe(
      "missing-context"
    );
  });

  it("will not send an empty sweep", () => {
    expect(
      buildCountRequest({ eventId: 1, companyId: 1, codes: [] }).error.code
    ).toBe("nothing-scanned");
  });
});

describe("readCountResponse", () => {
  it("reads the six buckets under names the screen can use", () => {
    const view = readCountResponse(response);
    expect(view.matched).toHaveLength(2);
    expect(view.missingTagged).toHaveLength(1);
    expect(view.missingUntagged).toHaveLength(2);
    expect(view.foreign).toHaveLength(1);
    expect(view.unknown).toEqual(["ZZZZ"]);
    expect(view.ambiguous).toHaveLength(1);
  });

  it("does NOT add ambiguous to any total", () => {
    // §4.2: an ambiguous device is already counted in missing_*. Adding it
    // again is how a screen reports six devices out of five.
    const view = readCountResponse(response);
    expect(view.summary.matched + view.summary.missing).toBe(
      view.summary.expected
    );
    expect(view.balanced).toBe(true);
  });

  it("flags a summary that does not add up instead of trusting it", () => {
    const view = readCountResponse({
      ...response,
      summary: { ...response.summary, matched: 1 },
    });
    expect(view.balanced).toBe(false);
    // Nothing may claim a finished count off numbers that disagree.
    expect(view.complete).toBe(false);
  });

  it("is complete only when nothing is missing and something was expected", () => {
    expect(
      readCountResponse({
        ...response,
        summary: { ...response.summary, matched: 5, missing: 0 },
        missing_tagged: [],
        missing_untagged: [],
      }).complete
    ).toBe(true);

    // An event with nothing assigned is a screen nobody used, not a count.
    expect(
      readCountResponse({
        ok: true,
        summary: { expected: 0, scanned: 0, matched: 0, missing: 0 },
      }).complete
    ).toBe(false);
  });

  it("says which devices an ambiguous value could be", () => {
    const view = readCountResponse(response);
    expect(view.ambiguousByItem[4]).toEqual({ value: "10004", item_ids: [4, 5] });
    expect(view.ambiguousByItem[5]).toEqual({ value: "10004", item_ids: [4, 5] });
    expect(view.ambiguousByItem[3]).toBeUndefined();
  });

  it("survives a malformed or empty payload", () => {
    [undefined, null, {}, { ok: false }, "nope"].forEach((payload) => {
      const view = readCountResponse(payload);
      expect(view.matched).toEqual([]);
      expect(view.summary.expected).toBe(0);
      expect(view.complete).toBe(false);
    });
  });
});

describe("countRows", () => {
  const rows = countRows(readCountResponse(response));

  it("gives one row per device, plus what was scanned and did not belong", () => {
    // 5 expected + 1 foreign + 1 unknown
    expect(rows).toHaveLength(7);
  });

  it("puts what the operator is still looking for first", () => {
    // Tagged-and-silent is the real alarm, so it leads; untagged is a manual
    // check, not an alarm; matched is done and can sit at the bottom.
    expect(rows.map((row) => row.status)).toEqual([
      COUNT_STATUS.MISSING_TAGGED,
      COUNT_STATUS.MISSING_UNTAGGED,
      COUNT_STATUS.MISSING_UNTAGGED,
      COUNT_STATUS.FOREIGN,
      COUNT_STATUS.UNKNOWN,
      COUNT_STATUS.MATCHED,
      COUNT_STATUS.MATCHED,
    ]);
  });

  it("never labels a row `ambiguous`, it annotates it", () => {
    // Ambiguous is not a sixth state a device can be in — it is the reason a
    // missing device stayed missing.
    expect(rows.some((row) => row.status === "ambiguous")).toBe(false);
    const annotated = rows.find((row) => row.itemId === 4);
    expect(annotated.status).toBe(COUNT_STATUS.MISSING_UNTAGGED);
    expect(annotated.ambiguousWith).toEqual([5]);
    expect(annotated.ambiguousValue).toBe("10004");
  });

  it("carries how each match came in", () => {
    const byEpc = rows.find((row) => row.itemId === 1);
    const byGun = rows.find((row) => row.itemId === 2);
    expect(byEpc.matchedVia).toBe("epc");
    expect(byGun.matchedVia).toBe("serial");
  });

  it("gives a foreign row its item and an unknown row only its value", () => {
    const foreign = rows.find((row) => row.status === COUNT_STATUS.FOREIGN);
    expect(foreign.itemId).toBe(77);
    expect(foreign.value).toBe("CCDD");

    const unknown = rows.find((row) => row.status === COUNT_STATUS.UNKNOWN);
    expect(unknown.itemId).toBeNull();
    expect(unknown.value).toBe("ZZZZ");
  });

  it("gives every row a stable key", () => {
    const keys = rows.map((row) => row.key);
    expect(new Set(keys).size).toBe(rows.length);
  });

  it("survives an empty view", () => {
    expect(countRows(readCountResponse(null))).toEqual([]);
  });
});

describe("readBulkRegisterOutcome", () => {
  it("reads a clean batch", () => {
    const outcome = readBulkRegisterOutcome({
      ok: true,
      registered: 2,
      conflicts: [],
      rejected: [],
    });
    expect(outcome).toEqual({
      registered: 2,
      conflicts: [],
      rejected: [],
      failed: 0,
      allFailed: false,
      partial: false,
    });
  });

  it("does not read `ok: true` as everything worked", () => {
    // §2.2: register-bulk answers 200 with ok:true even when every entry
    // conflicted. Gating on data.ok would report a finished labelling run that
    // labelled nothing — the same class of bug as a refused write passing for a
    // completed handover.
    const outcome = readBulkRegisterOutcome({
      ok: true,
      registered: 0,
      conflicts: [
        {
          item_id: 101,
          id_type: "epc",
          id_value: "AAAA",
          reason: "already assigned",
          conflict_item_id: 555,
        },
      ],
      rejected: [],
    });
    expect(outcome.allFailed).toBe(true);
    expect(outcome.failed).toBe(1);
  });

  it("names a partial batch as partial", () => {
    const outcome = readBulkRegisterOutcome({
      ok: true,
      registered: 3,
      conflicts: [{ item_id: 4, reason: "already assigned", conflict_item_id: 9 }],
      rejected: [{ item_id: null, reason: "invalid entry" }],
    });
    expect(outcome.partial).toBe(true);
    expect(outcome.allFailed).toBe(false);
    expect(outcome.failed).toBe(2);
  });

  it("survives a payload without the optional arrays", () => {
    const outcome = readBulkRegisterOutcome({ ok: true, registered: 1 });
    expect(outcome).toEqual({
      registered: 1,
      conflicts: [],
      rejected: [],
      failed: 0,
      allFailed: false,
      partial: false,
    });
  });

  it("reads nothing at all as nothing registered", () => {
    [undefined, null, {}, "nope"].forEach((payload) => {
      const outcome = readBulkRegisterOutcome(payload);
      expect(outcome.registered).toBe(0);
      expect(outcome.allFailed).toBe(false);
    });
  });
});
