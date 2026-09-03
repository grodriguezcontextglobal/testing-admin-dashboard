/**
 * Reads a pasted dump of scanner reads into a list of codes.
 *
 * Written for the bulk RFID reader, and deliberately knowing nothing about it.
 * The reader is not a keyboard — it does not type into a focused field the way
 * the hand scanner does — so its reads reach the app one of four ways: a local
 * bridge over a socket, WebSerial/WebHID, the reader's own utility exporting a
 * file, or someone pasting that export in. Whichever it turns out to be, what
 * arrives is a list of codes, and this is where that list becomes data.
 *
 * That is the point of keeping it here as a pure function: the transport is
 * still undecided, and this does not have to wait for it.
 *
 * What a dump looks like in the wild, all of which this reads:
 *
 *   3425E16CB4A1…                     one code per line
 *   3425E16CB4A1…  -62  1699999999    the tag, how loudly it was heard, when
 *   SN-001         3425E16CB4A1…      a serial paired with its tag
 *   SN-001 SN-002 SN-003              a whole session on one line
 *
 * Everything ambiguous is reported rather than guessed, the same rule
 * parsePastedInventoryRows follows: a row that cannot become a code lands in
 * `skipped` with its line number and a reason. A count that quietly lost three
 * devices is worse than one that refuses to finish, because the only way to
 * find them again is to diff against the reader's own log.
 */

import { decodeSerialFromEpc } from "./epcSerial";

/**
 * Most lines a single paste may carry.
 *
 * Higher than the 2000 of parsePastedInventoryRows on purpose: there, a line is
 * a unit. Here a line is a *read*, and a bulk reader hears the same tag dozens
 * of times in one pass, so a 400-device pallet can dump several thousand lines
 * and still be a perfectly ordinary count.
 */
export const MAX_DUMP_LINES = 5000;

export const CODE_KIND = { EPC: "epc", SERIAL: "serial" };

/**
 * What the server's `item_identifier.id_type` calls each kind.
 *
 * The two vocabularies disagree on one word: we read a code off a label and
 * call it a `serial`, the table calls the scannable form of it a `barcode`.
 * That mismatch is silent and expensive if it reaches a request — `id_type` is
 * a `VARCHAR(16)` with no ENUM and the table's UNIQUE is *per type*, so
 * registering `'serial'` creates a third type nothing reads: the row saves, the
 * reconciliation never sees it, and the device reports as missing with no error
 * anywhere. Every register call takes its `id_type` from here.
 */
export const ID_TYPE = Object.freeze({
  [CODE_KIND.EPC]: "epc",
  [CODE_KIND.SERIAL]: "barcode",
});

/**
 * A prefix is the device telling us what it read, so it outranks the shape
 * test below. The bridge can mark its output; the hand scanner cannot.
 */
const PREFIXES = [
  { pattern: /^(?:epc|rfid|tag)\s*:\s*/i, kind: CODE_KIND.EPC },
  { pattern: /^(?:cod|code|serial|sn|barcode)\s*:\s*/i, kind: CODE_KIND.SERIAL },
];

/**
 * An EPC-96 in hex is 24 characters of `[0-9A-F]`.
 *
 * Only a guess, and it has a known blind spot: a 24-digit numeric serial
 * satisfies it. Nothing downstream may treat the kind as certain unless a
 * prefix said so.
 */
const EPC_SHAPE = /^[0-9A-F]{24}$/i;

/** Ordered by how much they imply a real table: a tab is never incidental. */
const DELIMITERS = ["\t", ";", ","];

/** Column titles, so a pasted header row is not filed as a device. */
const HEADER_WORDS = new Set([
  "epc",
  "epccode",
  "rfid",
  "tag",
  "tagid",
  "serial",
  "serialnumber",
  "serialno",
  "sn",
  "barcode",
  "code",
  "rssi",
  "signal",
  "timestamp",
  "time",
  "date",
  "count",
  "reads",
  "antenna",
  "item",
  "device",
  "numerodeserie",
  "nmerodeserie",
  "serie",
]);

const normalizeName = (value) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const splitLines = (text) =>
  String(text ?? "")
    .split(/\r?\n/)
    .map((raw, index) => ({ raw, line: index + 1 }))
    /* A line that is only whitespace is not a problem worth reporting: it is a
       trailing newline or a gap between passes, and putting it in `skipped`
       would bury the rows that do need looking at. */
    .filter(({ raw }) => raw.trim() !== "");

const detectDelimiter = (headerLine) =>
  DELIMITERS.find((delimiter) => headerLine.includes(delimiter)) ?? "\t";

/**
 * The cell this dump's codes live in.
 *
 * With no column asked for, the first cell that has anything in it — which
 * makes an indented or tab-led line read the same as a bare one. With an
 * explicit column, that column exactly: the caller is describing a layout, and
 * sliding to a neighbouring cell would file the wrong value.
 */
const cellAt = (cells, column) => {
  if (column > 0) return cells[column] ?? "";
  return cells.find((cell) => cell !== "") ?? "";
};

/**
 * A byte-spaced hex value put back together: `34 25 E1 6C` → `3425E16C`.
 *
 * Some readers space their bytes and some do not, and which one the OR2505 does
 * is still open (§7.1 of the endpoint contract). It has to be handled either
 * way because the failure is silent: a spaced value goes out as typed, the
 * server never matches it, and every device reports as missing with nothing
 * saying why.
 *
 * Only fires when **every** piece is a two-character hex byte, which is the
 * whole safety of it — real serials and unspaced EPCs are longer than two
 * characters, so a list of separate codes is never glued together.
 *
 * @returns {string|null} the joined value, or null when this is not that
 */
const joinSpacedHex = (value) => {
  const pieces = value.split(/\s+/).filter(Boolean);
  if (pieces.length < 4) return null;
  if (!pieces.every((piece) => /^[0-9a-f]{2}$/i.test(piece))) return null;
  return pieces.join("");
};

/** The prefix's verdict, or the shape's guess. */
const readCode = (raw) => {
  const spacedOut = String(raw ?? "").trim();
  const trimmed = joinSpacedHex(spacedOut) ?? spacedOut;
  const prefixed = PREFIXES.find(({ pattern }) => pattern.test(trimmed));
  if (prefixed) {
    const value = trimmed.replace(prefixed.pattern, "").trim();
    return { value, kind: prefixed.kind };
  }
  return {
    value: trimmed,
    kind: EPC_SHAPE.test(trimmed) ? CODE_KIND.EPC : CODE_KIND.SERIAL,
  };
};

/**
 * An EPC is hex, so its case carries no information and it is stored upper.
 *
 * A serial is left exactly as it was read. The event check-in matches serials
 * against the server's own strings exactly — see `reconcile` in
 * checkInFromEvent — so "correcting" the casing here would file a device the
 * server cannot find. `nearMiss` is what turns that into a question for the
 * operator instead of a silent miss.
 */
const normalizeValue = ({ value, kind }) =>
  kind === CODE_KIND.EPC ? value.toUpperCase() : value;

/**
 * @param {string} text - pasted clipboard content, or an export read into one.
 * @param {{column?: number}} [options] - which cell holds the code, when the
 *   dump has more than one. Defaults to the first cell with content.
 * @returns {{codes: Array<{value: string, kind: string, reads: number}>,
 *   kinds: {epc: number, serial: number}, uniqueCount: number,
 *   totalReads: number, skipped: Array<{line: number, raw: string, reason: string}>,
 *   error: {code: string, lines: number, limit: number}|null}}
 *   `codes` is unique and in first-seen order, each carrying how many times it
 *   was heard. `error` is set only when the paste is refused whole; `skipped`
 *   covers lines refused one at a time. Both are always present, so a caller
 *   can read either without checking the shape first.
 */
export const parsePastedScanDump = (text, { column = 0 } = {}) => {
  const empty = {
    codes: [],
    kinds: { epc: 0, serial: 0 },
    uniqueCount: 0,
    totalReads: 0,
    skipped: [],
    error: null,
  };

  const lines = splitLines(text);
  if (lines.length === 0) return empty;

  if (lines.length > MAX_DUMP_LINES) {
    return {
      ...empty,
      error: {
        code: "too-many-lines",
        lines: lines.length,
        limit: MAX_DUMP_LINES,
      },
    };
  }

  /* One line with no tab in it is a session on a single line, not a row of
     columns — some reader utilities export that way. A tab means columns even
     when there is only one row, which is why it is not simply "no newlines". */
  const soleLine =
    lines.length === 1 && !lines[0].raw.includes("\t")
      ? lines[0].raw.trim()
      : null;

  /* ...unless that line is one value with its bytes spaced out. Checked before
     splitting, or every byte of a single EPC becomes its own device. */
  const spacedSingle = soleLine ? joinSpacedHex(soleLine) : null;

  const rawValues = spacedSingle
    ? [{ value: spacedSingle, line: 1, raw: lines[0].raw }]
    : soleLine !== null
    ? soleLine
        .split(/[\s,;]+/)
        .filter(Boolean)
        .map((value) => ({ value, line: 1, raw: lines[0].raw }))
    : (() => {
        const delimiter = detectDelimiter(lines[0].raw);
        return lines.map(({ raw, line }) => ({
          value: cellAt(
            raw.split(delimiter).map((cell) => cell.trim()),
            column
          ),
          line,
          raw,
        }));
      })();

  const skipped = [];

  /* Only worth suspecting a header when there is a body under it: on a
     one-line paste, "SN" is the only thing there and dropping it would leave
     nothing at all. */
  const body =
    rawValues.length > 1 && HEADER_WORDS.has(normalizeName(rawValues[0].value))
      ? (skipped.push({
          line: rawValues[0].line,
          raw: rawValues[0].raw,
          reason: "header",
        }),
        rawValues.slice(1))
      : rawValues;

  const byFingerprint = new Map();
  let totalReads = 0;

  body.forEach(({ value, line, raw }) => {
    const code = readCode(value);
    if (!code.value) {
      skipped.push({ line, raw, reason: "no code in this line" });
      return;
    }

    const normalized = normalizeValue(code);
    /* Case folds for an EPC and does not for a serial, for the same reason
       normalizeValue does: two casings of one tag are one tag, two casings of
       one serial are a near miss the operator has to see. */
    const fingerprint =
      code.kind === CODE_KIND.EPC ? normalized : `${code.kind}:${normalized}`;

    totalReads += 1;
    const existing = byFingerprint.get(fingerprint);
    if (existing) {
      existing.reads += 1;
      return;
    }
    byFingerprint.set(fingerprint, {
      value: normalized,
      kind: code.kind,
      reads: 1,
    });
  });

  const codes = Array.from(byFingerprint.values());

  return {
    codes,
    kinds: {
      epc: codes.filter((code) => code.kind === CODE_KIND.EPC).length,
      serial: codes.filter((code) => code.kind === CODE_KIND.SERIAL).length,
    },
    uniqueCount: codes.length,
    totalReads,
    skipped,
    error: null,
  };
};

/**
 * The serials a pass produced, ready for the event check-in.
 *
 * The labels carry the serial inside the tag, so a read decodes back into the
 * string printed on the face — no lookup, no link table, nothing from the
 * server. A code that arrived as a serial already (the hand scanner, a pasted
 * spreadsheet) passes straight through, which is what lets one pallet be
 * counted with both readers at once.
 *
 * A tag that cannot be decoded is returned rather than dropped: something was
 * physically there and was not counted, and the operator has to be told that
 * instead of finding out at the end that the numbers do not add up.
 *
 * @param {Array<{value: string, kind: string}>} codes - from parsePastedScanDump
 * @returns {{serials: string[], undecodable: Array<{value: string, kind: string}>}}
 */
export const serialsFromCodes = (codes) => {
  const list = Array.isArray(codes) ? codes : [];
  const serials = [];
  const undecodable = [];

  list.forEach((code) => {
    if (code?.kind === CODE_KIND.SERIAL) {
      serials.push(code.value);
      return;
    }
    const decoded = decodeSerialFromEpc(code?.value);
    if (decoded) serials.push(decoded);
    else undecodable.push(code);
  });

  return { serials, undecodable };
};
