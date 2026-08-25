import { describe, expect, it } from "vitest";
import {
  SHIPMENT_FIELDS,
  buildShipmentPayload,
  describeShippingStatus,
  eventsFromItems,
  filterShipments,
  formatShipmentDateTime,
  missingShipmentFields,
  trackingUrl,
} from "./shipping";

describe("describeShippingStatus", () => {
  it("labels the status both ship-out queries actually search for", () => {
    // The old label map knew delivered / in-reserved / shipped only, while both
    // queries ask for `locked_in_warehouse` — so every row in the packing list
    // rendered its status as an em dash.
    expect(describeShippingStatus("locked_in_warehouse").label).toBe("Ready to ship");
  });

  it("labels the status the ship-out writes", () => {
    expect(describeShippingStatus("in-transit").label).toBe("In transit");
  });

  it("echoes an unknown status instead of hiding it", () => {
    expect(describeShippingStatus("something_new")).toEqual({
      label: "something_new",
      tone: "neutral",
    });
  });

  it("survives nothing", () => {
    expect(describeShippingStatus(undefined).label).toBe("—");
  });
});

describe("trackingUrl", () => {
  it("knows the four carriers the app supports", () => {
    expect(trackingUrl("UPS", "1Z999")).toContain("ups.com");
    expect(trackingUrl("usps", "94001")).toContain("usps.com");
    expect(trackingUrl("FedEx", "7712")).toContain("fedex.com");
    expect(trackingUrl("dhl", "JD01")).toContain("dhl.com");
  });

  it("puts the number in the query string, escaped", () => {
    expect(trackingUrl("ups", "1Z 999")).toContain("1Z%20999");
  });

  it("returns null for a carrier it does not know, so the caller can fall back", () => {
    expect(trackingUrl("Estafeta", "123")).toBeNull();
  });

  it("returns null when either half is missing", () => {
    expect(trackingUrl("ups", "")).toBeNull();
    expect(trackingUrl("", "1Z999")).toBeNull();
    expect(trackingUrl(undefined, undefined)).toBeNull();
  });
});

describe("eventsFromItems", () => {
  const items = [
    { event_id: 7, event_name: "Expo", event_address: "Miami", event_date: "2026-06-01" },
    { event_id: 7, event_name: "Expo", event_address: "Miami" },
    { event_id: 3, event_name: "Summit", event_address: "Austin" },
  ];

  it("collapses one row per item into one row per event", () => {
    expect(eventsFromItems(items)).toHaveLength(2);
  });

  it("counts the items, which the selector never showed", () => {
    const expo = eventsFromItems(items).find((event) => event.id === 7);
    expect(expo.itemCount).toBe(2);
  });

  it("sorts by name so the list is scannable", () => {
    expect(eventsFromItems(items).map((event) => event.label)).toEqual([
      "Expo",
      "Summit",
    ]);
  });

  it("keeps the first row as rawData and names an event with no name", () => {
    const [only] = eventsFromItems([{ event_id: 9 }]);
    expect(only.label).toBe("Event 9");
    expect(only.rawData).toEqual({ event_id: 9 });
  });

  it("skips rows with no event and survives a missing list", () => {
    expect(eventsFromItems([{ event_name: "orphan" }])).toEqual([]);
    expect(eventsFromItems(undefined)).toEqual([]);
  });
});

describe("missingShipmentFields", () => {
  const complete = {
    destination: "Miami Convention Center",
    courier: "FedEx",
    trackingNumber: "7712",
    authorizer: "Ada",
    receiver: "Grace",
  };

  it("is empty when every required field is filled", () => {
    expect(missingShipmentFields(complete)).toEqual([]);
  });

  it("names each field that is still empty", () => {
    // The old form answered every incomplete submit with one toast:
    // "Please complete all required fields."
    expect(missingShipmentFields({ ...complete, courier: "", receiver: "  " })).toEqual([
      "courier",
      "receiver",
    ]);
  });

  it("covers exactly the fields the endpoint requires from the form", () => {
    expect(SHIPMENT_FIELDS.map((field) => field.key)).toEqual([
      "destination",
      "courier",
      "trackingNumber",
      "authorizer",
      "receiver",
    ]);
  });

  it("survives being handed nothing", () => {
    expect(missingShipmentFields(undefined)).toHaveLength(SHIPMENT_FIELDS.length);
  });
});

describe("buildShipmentPayload", () => {
  it("keeps the exact body POST /api/db_shipment accepts", () => {
    expect(
      buildShipmentPayload({
        authorizer: " Ada ",
        companyId: 7,
        courier: "FedEx",
        destination: "Miami",
        eventId: 3,
        packageList: [1, 2],
        receiver: "Grace",
        trackingNumber: "7712",
      })
    ).toEqual({
      authorizer_name: "Ada",
      company_id: 7,
      courier: "FedEx",
      destination: "Miami",
      event_id: 3,
      package_list: [1, 2],
      recipient_name: "Grace",
      status: "pending",
      tracking_number: "7712",
    });
  });

  it("does not invent a ship-out date field", () => {
    // The form asks for one and prints it on the report, but the endpoint has
    // no field for it. Adding one here would be a server change.
    const payload = buildShipmentPayload({ companyId: 1, eventId: 2 });
    expect(Object.keys(payload)).not.toContain("ship_out_date");
    expect(Object.keys(payload)).not.toContain("shipOutDate");
  });

  it("normalizes a missing package list to an array", () => {
    expect(buildShipmentPayload({ companyId: 1, eventId: 2 }).package_list).toEqual([]);
  });
});

describe("formatShipmentDateTime", () => {
  it("reads as a date and a time", () => {
    const formatted = formatShipmentDateTime("2026-06-01T14:30:00");
    expect(formatted).toMatch(/Jun/);
    expect(formatted).toMatch(/2026/);
  });

  it("returns a dash rather than 'Invalid Date'", () => {
    expect(formatShipmentDateTime("not a date")).toBe("—");
    expect(formatShipmentDateTime(null)).toBe("—");
  });
});

describe("filterShipments", () => {
  const rows = [
    {
      destination: "Miami Convention Center",
      recipient_name: "Grace",
      authorizer_name: "Ada",
      courier: "FedEx",
      tracking_number: "7712",
    },
    {
      destination: "Austin Center",
      recipient_name: "Bob",
      authorizer_name: "Ada",
      courier: "UPS",
      tracking_number: "1Z999",
    },
  ];

  it("matches any of the columns the table shows", () => {
    expect(filterShipments(rows, "miami")).toHaveLength(1);
    expect(filterShipments(rows, "1Z999")).toHaveLength(1);
    expect(filterShipments(rows, "ada")).toHaveLength(2);
  });

  it("returns everything for an empty search", () => {
    expect(filterShipments(rows, "  ")).toHaveLength(2);
    expect(filterShipments(rows, undefined)).toHaveLength(2);
  });

  it("survives a missing list and rows with holes", () => {
    expect(filterShipments(undefined, "x")).toEqual([]);
    expect(filterShipments([{}], "x")).toEqual([]);
  });
});
