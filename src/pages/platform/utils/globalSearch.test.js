import { describe, it, expect } from "vitest";
import { MIN_SEARCH_LENGTH, globalSearchGroups, isSearchable } from "./globalSearch";

describe("isSearchable", () => {
  it("waits for enough to search on", () => {
    expect(isSearchable("")).toBe(false);
    expect(isSearchable(" a ")).toBe(false);
    expect(isSearchable("RX")).toBe(true);
    expect(isSearchable(undefined)).toBe(false);
  });

  it("agrees with the length it publishes", () => {
    expect(isSearchable("x".repeat(MIN_SEARCH_LENGTH))).toBe(true);
    expect(isSearchable("x".repeat(MIN_SEARCH_LENGTH - 1))).toBe(false);
  });
});

describe("globalSearchGroups", () => {
  const companies = [{ id: "cmp_1", name: "Harbor Point Events", ownerEmail: "ana@harbor.example" }];
  const devices = [
    { id: "d1", serial: "RX-000007", deviceName: "Receiver", companyId: "cmp_1", companyName: "Harbor Point Events" },
  ];
  const people = [
    { id: "p1", name: "Ana Ortiz", email: "ana@family.example", companyId: "cmp_1", companyName: "Harbor Point Events" },
  ];

  it("groups the three things the box says it searches", () => {
    const groups = globalSearchGroups({ companies, devices, people });
    expect(groups.map((g) => g.key)).toEqual(["clients", "devices", "people"]);
    expect(groups.map((g) => g.label)).toEqual(["Clients", "Devices", "Members & consumers"]);
  });

  it("sends a client to its profile", () => {
    const [clients] = globalSearchGroups({ companies, devices: [], people: [] });
    expect(clients.items[0]).toMatchObject({
      title: "Harbor Point Events",
      subtitle: "ana@harbor.example",
      to: "/platform/clients/cmp_1",
    });
  });

  // A serial is the question "where is this device?", and the answer is the
  // client that holds it.
  it("sends a device to the client that holds it, and keeps the serial as text", () => {
    const groups = globalSearchGroups({ companies: [], devices, people: [] });
    const found = groups.find((g) => g.key === "devices");
    expect(found.items[0]).toMatchObject({
      title: "RX-000007",
      subtitle: "Receiver · Harbor Point Events",
      to: "/platform/clients/cmp_1?tab=inventory",
    });
  });

  it("sends a person to their client's people tab", () => {
    const groups = globalSearchGroups({ companies: [], devices: [], people });
    const found = groups.find((g) => g.key === "people");
    expect(found.items[0]).toMatchObject({
      title: "Ana Ortiz",
      subtitle: "ana@family.example · Harbor Point Events",
      to: "/platform/clients/cmp_1?tab=members",
    });
  });

  it("drops a group with nothing in it rather than showing an empty heading", () => {
    expect(globalSearchGroups({ companies, devices: [], people: [] })).toHaveLength(1);
    expect(globalSearchGroups({})).toEqual([]);
  });

  it("escapes an id with a slash in it", () => {
    const groups = globalSearchGroups({ companies: [{ id: "a/b", name: "Odd" }] });
    expect(groups[0].items[0].to).toBe("/platform/clients/a%2Fb");
  });
});
