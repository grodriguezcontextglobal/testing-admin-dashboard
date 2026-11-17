// The console's one search box (design board Main): clients, serial numbers
// and people, in one place. Pure: no React, no I/O.

/**
 * One letter matches most of the database and makes every keystroke a
 * three-request round trip for an answer nobody can use.
 */
export const MIN_SEARCH_LENGTH = 2;

export const isSearchable = (term) => String(term ?? "").trim().length >= MIN_SEARCH_LENGTH;

const clientPath = (companyId, tab) =>
  `/platform/clients/${encodeURIComponent(companyId ?? "")}${tab ? `?tab=${tab}` : ""}`;

const join = (...parts) => parts.filter(Boolean).join(" · ");

/**
 * The three answer groups, in the order the box names them. A group with no
 * hits is left out: an empty heading reads as a broken search rather than as
 * "nothing here".
 *
 * Every hit leads to the client that holds it, because that is the question
 * being asked — "whose is this?" — and the client profile is where the rest
 * of the answer lives.
 */
export const globalSearchGroups = ({ companies = [], devices = [], people = [] } = {}) =>
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
        subtitle: join(device.deviceName, device.companyName),
        to: clientPath(device.companyId, "inventory"),
      })),
    },
    {
      key: "people",
      label: "Members & consumers",
      items: people.map((person) => ({
        id: `person-${person.id}`,
        title: person.name ?? "Unnamed",
        subtitle: join(person.email, person.companyName),
        to: clientPath(person.companyId, "members"),
      })),
    },
  ].filter((group) => group.items.length > 0);
