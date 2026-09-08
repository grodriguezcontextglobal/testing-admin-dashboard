import { describe, expect, it } from "vitest";
import {
  CODE_KIND,
  ID_TYPE,
  MAX_DUMP_LINES,
  parsePastedScanDump,
  serialsFromCodes,
} from "./parsePastedScanDump";
import { addScannedSerials, countSummary } from "./checkInFromEvent";

/** Twenty-four hex characters, which is what an EPC-96 looks like. */
const EPC_A = "3425E16CB4A10000000004D2";
const EPC_B = "3425E16CB4A10000000004D3";

const values = (result) => result.codes.map((code) => code.value);

describe("parsePastedScanDump — one code per line", () => {
  it("reads the plainest dump there is", () => {
    const result = parsePastedScanDump(`SN-001\nSN-002\nSN-003`);
    expect(values(result)).toEqual(["SN-001", "SN-002", "SN-003"]);
    expect(result.uniqueCount).toBe(3);
    expect(result.totalReads).toBe(3);
    expect(result.skipped).toEqual([]);
    expect(result.error).toBeNull();
  });

  it("ignores blank lines, padding and Windows line endings", () => {
    const result = parsePastedScanDump("  SN-001  \r\n\r\n\tSN-002\r\n   \r\n");
    expect(values(result)).toEqual(["SN-001", "SN-002"]);
  });

  it("answers empty input with an empty result rather than throwing", () => {
    [undefined, null, "", "   \n\n"].forEach((input) => {
      const result = parsePastedScanDump(input);
      expect(result.codes).toEqual([]);
      expect(result.totalReads).toBe(0);
      expect(result.error).toBeNull();
    });
  });
});

describe("parsePastedScanDump — the shapes a reader actually dumps", () => {
  it("takes the first cell of a tab-delimited dump with RSSI and a timestamp", () => {
    // What a bulk reader's own utility exports: the tag, how strongly it was
    // heard, and when. Only the tag is inventory.
    const result = parsePastedScanDump(
      `${EPC_A}\t-62\t1699999999\n${EPC_B}\t-58\t1699999999`
    );
    expect(values(result)).toEqual([EPC_A, EPC_B]);
  });

  it("reads a chosen column, for a dump that pairs a serial with its tag", () => {
    const result = parsePastedScanDump(
      `SN-001\t${EPC_A}\nSN-002\t${EPC_B}`,
      { column: 1 }
    );
    expect(values(result)).toEqual([EPC_A, EPC_B]);
  });

  it("handles commas and semicolons, not just tabs", () => {
    expect(values(parsePastedScanDump(`SN-001,-62\nSN-002,-58`))).toEqual([
      "SN-001",
      "SN-002",
    ]);
    expect(values(parsePastedScanDump(`SN-001;-62\nSN-002;-58`))).toEqual([
      "SN-001",
      "SN-002",
    ]);
  });

  it("splits one long line of codes, which is how some utilities export", () => {
    // No newlines at all: the whole read session on a single line.
    expect(values(parsePastedScanDump(`SN-001 SN-002 SN-003`))).toEqual([
      "SN-001",
      "SN-002",
      "SN-003",
    ]);
    expect(values(parsePastedScanDump(`${EPC_A}, ${EPC_B}`))).toEqual([
      EPC_A,
      EPC_B,
    ]);
  });

  it("drops a header row without counting it as a read", () => {
    const result = parsePastedScanDump(`EPC\tRSSI\n${EPC_A}\t-62`);
    expect(values(result)).toEqual([EPC_A]);
    expect(result.totalReads).toBe(1);
    expect(result.skipped).toEqual([
      { line: 1, raw: "EPC\tRSSI", reason: "header" },
    ]);
  });

  it("keeps a first line that is real data", () => {
    // "Serial" as a header is a guess; SN-001 on line one is not.
    const result = parsePastedScanDump(`SN-001\nSN-002`);
    expect(values(result)).toEqual(["SN-001", "SN-002"]);
    expect(result.skipped).toEqual([]);
  });
});

describe("parsePastedScanDump — repeated reads", () => {
  it("collapses a tag read many times and keeps the count", () => {
    // A bulk reader hears the same tag dozens of times per pass. That is the
    // hardware working, not the operator making a mistake, so it is counted
    // rather than warned about.
    const result = parsePastedScanDump(
      [EPC_A, EPC_A, EPC_B, EPC_A].join("\n")
    );
    expect(values(result)).toEqual([EPC_A, EPC_B]);
    expect(result.codes[0].reads).toBe(3);
    expect(result.codes[1].reads).toBe(1);
    expect(result.uniqueCount).toBe(2);
    expect(result.totalReads).toBe(4);
  });

  it("treats one tag read in two casings as one tag", () => {
    const result = parsePastedScanDump(
      `${EPC_A}\n${EPC_A.toLowerCase()}`
    );
    expect(result.uniqueCount).toBe(1);
    expect(result.codes[0].reads).toBe(2);
  });

  it("keeps first-seen order, so the list reads like the pass went", () => {
    const result = parsePastedScanDump(`SN-003\nSN-001\nSN-003\nSN-002`);
    expect(values(result)).toEqual(["SN-003", "SN-001", "SN-002"]);
  });
});

describe("parsePastedScanDump — normalising a value", () => {
  it("uppercases an EPC, because hex has no case", () => {
    const result = parsePastedScanDump(EPC_A.toLowerCase());
    expect(result.codes[0].value).toBe(EPC_A);
    expect(result.codes[0].kind).toBe(CODE_KIND.EPC);
  });

  it("leaves a serial exactly as it was read", () => {
    // The event reconciliation matches serials exactly against what the server
    // stores; "fixing" the casing here would file a device the server cannot
    // find. checkInFromEvent's nearMiss exists for that reason.
    const result = parsePastedScanDump("sn-001");
    expect(result.codes[0].value).toBe("sn-001");
    expect(result.codes[0].kind).toBe(CODE_KIND.SERIAL);
  });

  it("strips a source prefix the reader or bridge may add", () => {
    expect(values(parsePastedScanDump(`EPC:${EPC_A}`))).toEqual([EPC_A]);
    expect(values(parsePastedScanDump(`RFID:${EPC_A}`))).toEqual([EPC_A]);
    expect(values(parsePastedScanDump("COD:SN-001"))).toEqual(["SN-001"]);
  });

  it("calls a prefixed value by its prefix, not by its shape", () => {
    // A prefix is a statement from the device; the 24-hex rule is only a guess
    // for when nothing said so.
    expect(parsePastedScanDump("EPC:ABC123").codes[0].kind).toBe(CODE_KIND.EPC);
    expect(parsePastedScanDump(`COD:${EPC_A}`).codes[0].kind).toBe(
      CODE_KIND.SERIAL
    );
  });

  it("guesses EPC only for 24 hex characters", () => {
    expect(parsePastedScanDump(EPC_A).codes[0].kind).toBe(CODE_KIND.EPC);
    // 23 and 25 characters, and 24 with a non-hex letter: all serials.
    expect(parsePastedScanDump(EPC_A.slice(1)).codes[0].kind).toBe(
      CODE_KIND.SERIAL
    );
    expect(parsePastedScanDump(`${EPC_A}0`).codes[0].kind).toBe(
      CODE_KIND.SERIAL
    );
    expect(parsePastedScanDump("3425E16CB4A10000000004DZ").codes[0].kind).toBe(
      CODE_KIND.SERIAL
    );
    // Twenty-four digits are valid hex, so they read as an EPC. That is the
    // known blind spot of judging by shape, and the reason a prefix from the
    // device wins over it: a long numeric serial is indistinguishable here.
    expect(parsePastedScanDump("100000000000000000000001").codes[0].kind).toBe(
      CODE_KIND.EPC
    );
    expect(parsePastedScanDump("COD:100000000000000000000001").codes[0].kind).toBe(
      CODE_KIND.SERIAL
    );
  });

  it("reports a mixed dump as the two kinds it is", () => {
    const result = parsePastedScanDump(`${EPC_A}\nSN-001`);
    expect(result.codes.map((code) => code.kind)).toEqual([
      CODE_KIND.EPC,
      CODE_KIND.SERIAL,
    ]);
    expect(result.kinds).toEqual({ epc: 1, serial: 1 });
  });
});

describe("parsePastedScanDump — what it refuses", () => {
  it("names the line and the reason, instead of dropping it quietly", () => {
    // A paired dump where one row lost its tag. Silently keeping the other two
    // would report a link job that is short a device, with nothing saying so.
    const result = parsePastedScanDump(
      `SN-001\t${EPC_A}\nSN-002\nSN-003\t${EPC_B}`,
      { column: 1 }
    );
    expect(values(result)).toEqual([EPC_A, EPC_B]);
    expect(result.skipped).toEqual([
      { line: 2, raw: "SN-002", reason: "no code in this line" },
    ]);
  });

  it("ignores an empty line without calling it a problem", () => {
    // Trailing newlines and a blank row between passes are not errors, so they
    // do not belong in a list the operator is asked to read.
    const result = parsePastedScanDump("SN-001\n\t\t\n \nSN-002");
    expect(values(result)).toEqual(["SN-001", "SN-002"]);
    expect(result.skipped).toEqual([]);
  });

  it("refuses a paste past the ceiling whole, rather than truncating it", () => {
    // Half a count that looks complete is worse than no count: the only way to
    // find the dropped tags would be to diff against the reader's own log.
    const tooMany = Array.from(
      { length: MAX_DUMP_LINES + 1 },
      (_, index) => `SN-${index}`
    ).join("\n");
    const result = parsePastedScanDump(tooMany);
    expect(result.codes).toEqual([]);
    expect(result.error).toEqual({
      code: "too-many-lines",
      lines: MAX_DUMP_LINES + 1,
      limit: MAX_DUMP_LINES,
    });
  });

  it("leaves room for repeats, which is why the ceiling is not the unit count", () => {
    // A bulk pass produces far more lines than devices; a 500-device pallet can
    // dump thousands of reads.
    expect(MAX_DUMP_LINES).toBeGreaterThanOrEqual(5000);
  });
});

describe("parsePastedScanDump — the count an operator reports", () => {
  it("separates how much was heard from how much is there", () => {
    const result = parsePastedScanDump(
      [EPC_A, EPC_A, EPC_A, EPC_B, EPC_B].join("\n")
    );
    expect(result.totalReads).toBe(5);
    expect(result.uniqueCount).toBe(2);
  });

  it("holds up on a pallet-sized dump", () => {
    // 400 devices heard ten times each. The realistic input, and the one an
    // array-scan dedup cannot survive.
    const devices = Array.from({ length: 400 }, (_, i) => `SN-${i}`);
    const dump = Array.from({ length: 10 }, () => devices.join("\n")).join("\n");
    const result = parsePastedScanDump(dump);
    expect(result.uniqueCount).toBe(400);
    expect(result.totalReads).toBe(4000);
    expect(result.codes.every((code) => code.reads === 10)).toBe(true);
  });
});

/* ───────────── from a pasted pass to the serials the check-in compares ── */

describe("serialsFromCodes", () => {
  it("decodes an encoded tag into the serial printed on it", () => {
    const { codes } = parsePastedScanDump("525252525230303100000000");
    expect(serialsFromCodes(codes)).toEqual({
      serials: ["RRRRR001"],
      undecodable: [],
    });
  });

  it("passes a serial that arrived as a serial straight through", () => {
    const { codes } = parsePastedScanDump("SN-001");
    expect(serialsFromCodes(codes).serials).toEqual(["SN-001"]);
  });

  it("takes a pass that mixed the RFID reader and the hand scanner", () => {
    // Both readers on the same pallet: the bulk one gives tags, the gun gives
    // serials. The check-in only ever sees serials.
    const { codes } = parsePastedScanDump(
      `525252525230303100000000\nSN-001\n525252525230303200000000`
    );
    expect(serialsFromCodes(codes).serials).toEqual([
      "RRRRR001",
      "SN-001",
      "RRRRR002",
    ]);
  });

  it("reports a tag it cannot read instead of dropping it", () => {
    // A factory EPC on the pallet: something is there, and the operator has to
    // know it was not counted rather than have it vanish.
    const { codes } = parsePastedScanDump(
      `525252525230303100000000\n3425E16CB4A10000000004D2`
    );
    const result = serialsFromCodes(codes);
    expect(result.serials).toEqual(["RRRRR001"]);
    expect(result.undecodable).toHaveLength(1);
    expect(result.undecodable[0].value).toBe("3425E16CB4A10000000004D2");
  });

  it("survives an empty or missing list", () => {
    expect(serialsFromCodes([])).toEqual({ serials: [], undecodable: [] });
    expect(serialsFromCodes(undefined)).toEqual({
      serials: [],
      undecodable: [],
    });
  });

  it("closes the loop: a pasted pass reconciles against an event", () => {
    // The whole point, in one test. Two tags read off the pallet, one of the
    // event's three devices still missing.
    const { codes } = parsePastedScanDump(
      [
        "525252525230303100000000",
        "525252525230303100000000",
        "525252525230303200000000",
      ].join("\n")
    );
    const { serials } = serialsFromCodes(codes);
    expect(serials).toEqual(["RRRRR001", "RRRRR002"]);

    const eventInventory = [
      { device: "RRRRR001", type: "Receiver" },
      { device: "RRRRR002", type: "Receiver" },
      { device: "RRRRR003", type: "Receiver" },
    ];
    const { list } = addScannedSerials([], serials);
    expect(countSummary(eventInventory, list)).toEqual({
      expected: 3,
      counted: 2,
      matched: 2,
      missing: 1,
      extra: 0,
      complete: false,
    });
  });
});

/* ────────────── the word the server uses for the same kind of thing ── */

describe("ID_TYPE", () => {
  it("calls a scanned code what item_identifier calls it", () => {
    expect(ID_TYPE[CODE_KIND.EPC]).toBe("epc");
    expect(ID_TYPE[CODE_KIND.SERIAL]).toBe("barcode");
  });

  it("translates every kind this module can produce", () => {
    // A kind with no id_type would register as a type nothing reads: the row
    // saves, reconcile never sees it, and the device reports as missing with
    // no error anywhere. The UNIQUE on item_identifier is per type, so a
    // vocabulary slip does not even collide with the right row.
    Object.values(CODE_KIND).forEach((kind) => {
      expect(ID_TYPE[kind]).toBeTruthy();
    });
  });

  it("only ever produces a type the server's table accepts", () => {
    expect(Object.values(ID_TYPE).sort()).toEqual(["barcode", "epc"]);
  });
});

/* ──────────────── an EPC the reader spaced out between its bytes ── */

describe("parsePastedScanDump — byte-spaced hex", () => {
  const spaced = "34 25 E1 6C B4 A1 00 00 00 00 04 D2";

  it("puts a spaced EPC back together instead of filing it as a serial", () => {
    // Open question §7.1 of the contract: nobody knows yet whether the OR2505
    // emits raw hex or spaces its bytes. Both have to work, because the failure
    // is silent — a spaced value is sent as-is, the server never matches it,
    // and every device reports as missing with no error anywhere.
    const result = parsePastedScanDump(spaced);
    expect(values(result)).toEqual([EPC_A]);
    expect(result.codes[0].kind).toBe(CODE_KIND.EPC);
    expect(result.uniqueCount).toBe(1);
  });

  it("reads a spaced EPC as the same tag as its unspaced form", () => {
    const result = parsePastedScanDump(`${spaced}\n${EPC_A}`);
    expect(result.uniqueCount).toBe(1);
    expect(result.codes[0].reads).toBe(2);
  });

  it("takes a spaced EPC out of a column beside other fields", () => {
    const result = parsePastedScanDump(`${spaced}\t-62\n${spaced}\t-58`);
    expect(values(result)).toEqual([EPC_A]);
  });

  it("does not glue together a line of separate codes", () => {
    // The rule only fires when every piece is a two-character hex byte. Real
    // serials are longer than that, so a session on one line is untouched.
    expect(values(parsePastedScanDump("SN-001 SN-002 SN-003"))).toEqual([
      "SN-001",
      "SN-002",
      "SN-003",
    ]);
    expect(values(parsePastedScanDump(`${EPC_A} ${EPC_B}`))).toEqual([
      EPC_A,
      EPC_B,
    ]);
  });

  it("leaves a value alone when removing the spaces would not make it hex", () => {
    expect(values(parsePastedScanDump("LOT A 12"))).toEqual(["LOT", "A", "12"]);
    expect(values(parsePastedScanDump("AB CD ZZ"))).toEqual(["AB", "CD", "ZZ"]);
  });
});
