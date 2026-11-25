// The console's one search box (design board Main): clients and serial
// numbers, in one place. Pure: no React, no I/O.

/**
 * One letter matches most of the database and makes every keystroke a
 * round trip per list for an answer nobody can use.
 */
export const MIN_SEARCH_LENGTH = 2;

export const isSearchable = (term) => String(term ?? "").trim().length >= MIN_SEARCH_LENGTH;

const clientPath = (companyId, tab) =>
  `/platform/clients/${encodeURIComponent(companyId ?? "")}${tab ? `?tab=${tab}` : ""}`;

const join = (...parts) => parts.filter(Boolean).join(" · ");

/**
 * The answer groups, in the order the box names them. A group with no hits is
 * left out: an empty heading reads as a broken search rather than as "nothing
 * here".
 *
 * Every hit leads to the client that holds it, because that is the question
 * being asked — "whose is this?" — and the client profile is where the rest
 * of the answer lives.
 *
 * There is no people group. It searched members and consumers by name and
 * email across every client, from a box present on every console screen;
 * members are school and club rosters. People are found inside a client's own
 * profile instead. Decided by Gustavo on 2026-11-19, option B.
 */
export const globalSearchGroups = ({ companies = [], devices = [] } = {}) =>
  [
    {
      key: "clients",
      label: "Clients",
      items: companies.map((company) => ({
        id: `client-${company.id}`,
        title: company.name ?? "Unnamed client",
        subtitle: company.ownerEmail ?? "",
        to: clientPath(company.id),
      })),
    },
    {
      key: "devices",
      label: "Devices",
      items: devices.map((device) => ({
        id: `device-${device.id}`,
        // Serials are text with a trailing counter: never Number() them.
        title: String(device.serial ?? ""),
        subtitle: join(device.group, device.companyName),
        to: clientPath(device.companyId, "inventory"),
      })),
    },
  ].filter((group) => group.items.length > 0);
