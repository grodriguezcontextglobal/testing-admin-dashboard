/**
 * The key a device type is counted under: the type with its whitespace
 * trimmed and collapsed. The requested quantities and the assigned ones are
 * both keyed this way, so a stray space never splits one type in two.
 */
export const deviceTypeKey = (type) =>
  String(type ?? "")
    .trim()
    .replace(/\s+/g, " ");

const addRequest = (map, type, needed) => {
  const quantity = Number(needed) || 0;
  if (quantity <= 0 || String(type ?? "").toLowerCase() === "undefined") return;
  const key = deviceTypeKey(type);
  if (key) map[key] = (map[key] || 0) + quantity;
};

/**
 * How many devices of each type the transaction asked for: { [type]: count }.
 * `record.device` holds entries that are either one request
 * ({ deviceType, deviceNeeded }) or a group of them under `device`.
 */
export const requestedDevicesByType = (record) => {
  const map = {};
  const entries = Array.isArray(record?.device) ? record.device : [];
  for (const entry of entries) {
    if (Array.isArray(entry?.device)) {
      for (const request of entry.device) {
        addRequest(map, request?.deviceType, request?.deviceNeeded);
      }
    }
    addRequest(map, entry?.deviceType, entry?.deviceNeeded);
  }
  return map;
};
