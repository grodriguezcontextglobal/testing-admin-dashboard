/**
 * The single codec for `extra_serial_number` — the per-unit identifiers that
 * are not the serial number itself (IMEI, MAC, asset tag, device id...).
 *
 * The column had grown three writers and one reader that only understood one of
 * them:
 *
 *   [{ "SN-1": [...] }, { "SN-2": [...] }]   the per-device form and the item
 *                                            edit modal
 *   { "SN-1": [...], "SN-2": [...] }         the XLSX importer
 *   [{ keyObject, valueObject }, ...]        older single-item records
 *
 * The edit modal's reader bailed on anything that was not an array, so the
 * identifiers of an item created by spreadsheet import were invisible when you
 * edited it — and since the modal then wrote its own idea of the field back,
 * they were lost.
 *
 * The first shape is canonical: it is what the majority of live rows already
 * use, and it preserves insertion order. The reader accepts all three, because
 * every existing row stays as it is on disk until something rewrites it.
 */

const INTERNAL_KEYS = new Set(["item_id"]);

const isEntry = (value) =>
  value && typeof value === "object" && "keyObject" in value;

const cleanEntries = (entries) =>
  Array.isArray(entries)
    ? entries.filter((entry) => isEntry(entry) && !INTERNAL_KEYS.has(entry.keyObject))
    : [];

/**
 * @param {Array<[string, Array]>|Map|undefined} bySerial - serial -> identifier
 *   entries. Serials with no entries are dropped rather than stored empty.
 * @returns {string} JSON, ready for the `extra_serial_number` column.
 */
export const encodeExtraIdentifiers = (bySerial) => {
  const pairs = bySerial instanceof Map ? [...bySerial] : (bySerial ?? []);
  const buckets = [];
  for (const [serial, entries] of pairs) {
    const kept = cleanEntries(entries);
    if (kept.length > 0) buckets.push({ [String(serial)]: kept });
  }
  return JSON.stringify(buckets);
};

/**
 * Identifiers stored for one serial number.
 *
 * @param {string|object|Array|null} raw - the column value, parsed or not.
 * @param {string|number} serialNumber - compared as a string; SQL hands these
 *   back numeric often enough that a strict compare silently finds nothing.
 * @returns {Array<{keyObject: string, valueObject: string}>} always an array —
 *   a malformed value is missing data, not a reason to break the page that
 *   renders it.
 */
export const parseExtraIdentifiers = (raw, serialNumber) => {
  if (!raw) return [];
  let parsed = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!parsed || typeof parsed !== "object") return [];

  const serial = String(serialNumber ?? "");

  if (!Array.isArray(parsed)) {
    // { "SN-1": [...] } — the XLSX importer's shape.
    return cleanEntries(parsed[serial]);
  }

  // A flat [{keyObject, valueObject}] list belongs to whichever item it was
  // read from; there is no serial to match against.
  if (parsed.some(isEntry)) return cleanEntries(parsed);

  // [{ "SN-1": [...] }, { "SN-2": [...] }] — canonical.
  for (const bucket of parsed) {
    if (bucket && typeof bucket === "object" && serial in bucket) {
      return cleanEntries(bucket[serial]);
    }
  }
  return [];
};
