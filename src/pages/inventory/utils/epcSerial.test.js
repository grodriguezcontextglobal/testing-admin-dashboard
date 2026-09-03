import { describe, expect, it } from "vitest";
import {
  EPC_BANK_BITS,
  decodeSerialFromEpc,
  encodeSerialToEpc,
  serialCapacity,
} from "./epcSerial";

/*
 * "RRRRR001" is the shape a serial has in this app: a letter prefix and a
 * zero-padded counter. In ASCII that is 52 52 52 52 52 30 30 31.
 */
const SERIAL = "RRRRR001";
const ASCII = "5252525252303031";

describe("encodeSerialToEpc", () => {
  it("writes the serial as ASCII, padded to the bank", () => {
    expect(encodeSerialToEpc(SERIAL)).toBe(`${ASCII}00000000`);
  });

  it("fills a 96-bit bank exactly with a twelve-character serial", () => {
    // A=41 B=42 … H=48, then 1=31 2=32 3=33 4=34.
    expect(encodeSerialToEpc("ABCDEFGH1234")).toBe("414243444546474831323334");
    expect(encodeSerialToEpc("ABCDEFGH1234")).toHaveLength(24);
  });

  it("refuses a serial the bank cannot hold, rather than truncating it", () => {
    // Truncating would produce a tag that reads as a different device.
    expect(serialCapacity(EPC_BANK_BITS)).toBe(12);
    expect(encodeSerialToEpc("ABCDEFGH12345")).toBeNull();
    expect(encodeSerialToEpc("ABCDEFGH12345", { bits: 128 })).not.toBeNull();
  });

  it("refuses anything that is not printable ASCII", () => {
    expect(encodeSerialToEpc("RRRRR00é")).toBeNull();
    expect(encodeSerialToEpc("")).toBeNull();
    expect(encodeSerialToEpc(null)).toBeNull();
  });
});

describe("decodeSerialFromEpc — the padding conventions a printer may use", () => {
  it("reads a right-padded tag", () => {
    expect(decodeSerialFromEpc(`${ASCII}00000000`)).toBe(SERIAL);
  });

  it("reads a left-padded tag", () => {
    expect(decodeSerialFromEpc(`00000000${ASCII}`)).toBe(SERIAL);
  });

  it("reads a space-padded tag", () => {
    // Some label templates pad with 0x20 instead of 0x00.
    expect(decodeSerialFromEpc(`${ASCII}20202020`)).toBe(SERIAL);
    expect(decodeSerialFromEpc(`20202020${ASCII}`)).toBe(SERIAL);
  });

  it("reads a tag with no padding at all", () => {
    // A 64-bit EPC bank, or a serial that fills the bank exactly.
    expect(decodeSerialFromEpc(ASCII)).toBe(SERIAL);
    expect(decodeSerialFromEpc("414243444546474831323334")).toBe("ABCDEFGH1234");
  });

  it("does not care about the case of the hex", () => {
    expect(decodeSerialFromEpc(`${ASCII.toLowerCase()}00000000`)).toBe(SERIAL);
  });

  it("ignores spacing a reader may put between bytes", () => {
    expect(decodeSerialFromEpc("52 52 52 52 52 30 30 31")).toBe(SERIAL);
  });

  it("round-trips every serial shape this app produces", () => {
    ["RRRRR001", "SN-001", "A1", "ABCDEFGH1234", "0001"].forEach((serial) => {
      expect(decodeSerialFromEpc(encodeSerialToEpc(serial))).toBe(serial);
    });
  });

  it("keeps the leading zeros of the counter", () => {
    // The whole reason the encoding is ASCII and not numeric: as a number,
    // "0001" and "1" are the same value and the tag stops naming one device.
    expect(decodeSerialFromEpc(encodeSerialToEpc("0001"))).toBe("0001");
    expect(decodeSerialFromEpc(encodeSerialToEpc("1"))).toBe("1");
  });
});

describe("decodeSerialFromEpc — when the tag is not one of ours", () => {
  it("returns null for a factory EPC", () => {
    // 34 25 E1 … — 0xE1 is not a character, so this was never a serial.
    expect(decodeSerialFromEpc("3425E16CB4A10000000004D2")).toBeNull();
  });

  it("returns null for a blank tag instead of an empty serial", () => {
    // An unwritten bank reads as zeros. Decoding that to "" and filing it
    // would check in a device that does not exist.
    expect(decodeSerialFromEpc("000000000000000000000000")).toBeNull();
    expect(decodeSerialFromEpc("20202020202020202020202020")).toBeNull();
  });

  it("returns null when a padding byte sits inside the value", () => {
    // Padding lives at the edges. A null byte in the middle means this is not
    // our ASCII layout, and joining across it would invent a serial.
    expect(decodeSerialFromEpc("52520052")).toBeNull();
  });

  it("returns null for malformed hex", () => {
    expect(decodeSerialFromEpc("525")).toBeNull();
    expect(decodeSerialFromEpc("ZZZZ")).toBeNull();
    expect(decodeSerialFromEpc("")).toBeNull();
    expect(decodeSerialFromEpc(null)).toBeNull();
    expect(decodeSerialFromEpc(undefined)).toBeNull();
  });

  it("is a candidate, not a verdict", () => {
    // A factory EPC whose bytes all happen to be printable decodes to
    // something that looks like a serial. Nothing here can tell the
    // difference, which is why the caller hands the result to reconcile():
    // a serial the event never held lands as "not in this event", it does not
    // become data.
    expect(decodeSerialFromEpc("303132333435363738394142")).toBe("0123456789AB");
  });
});
