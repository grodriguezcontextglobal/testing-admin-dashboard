import { describe, expect, it } from "vitest";
import { buildConsumerRows, countConsumersByStatus } from "./consumerRows";

const consumer = (over = {}) => ({
  user: {
    id: over.id ?? "u1",
    name: over.name ?? "Ada",
    lastName: over.lastName ?? "Lovelace",
    email: over.email ?? "ada@example.com",
    phoneNumber: over.phoneNumber ?? "555-0100",
  },
  transactions: over.transactions ?? 2,
});

describe("buildConsumerRows", () => {
  it("shapes one row per consumer, the way the table's columns read it", () => {
    const rows = buildConsumerRows([consumer()]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      user: ["Ada", "Lovelace"],
      email: "ada@example.com",
      phone: "555-0100",
      status: 2,
      key: "u1",
    });
    expect(rows[0].entireData).toMatchObject({ id: "u1", name: "Ada" });
  });

  it("parses a response that arrives as a JSON string", () => {
    const rows = buildConsumerRows(JSON.stringify([consumer()]));
    expect(rows).toHaveLength(1);
    expect(rows[0].email).toBe("ada@example.com");
  });

  it("returns nothing rather than throwing when there is no data yet", () => {
    expect(buildConsumerRows(undefined)).toEqual([]);
    expect(buildConsumerRows(null)).toEqual([]);
    expect(buildConsumerRows({})).toEqual([]);
    expect(buildConsumerRows("not json")).toEqual([]);
  });

  it("skips an entry with no user attached", () => {
    expect(buildConsumerRows([{ transactions: 1 }])).toEqual([]);
  });

  it("searches the whole record, case-insensitively", () => {
    const list = [
      consumer(),
      consumer({ id: "u2", name: "Grace", lastName: "Hopper", email: "grace@navy.mil" }),
    ];
    expect(buildConsumerRows(list, { search: "HOPPER" })).toHaveLength(1);
    expect(buildConsumerRows(list, { search: "navy" })[0].user).toEqual([
      "Grace",
      "Hopper",
    ]);
    expect(buildConsumerRows(list, { search: "555-0100" })).toHaveLength(2);
  });

  it("treats an empty or blank search as no search", () => {
    const list = [consumer(), consumer({ id: "u2" })];
    expect(buildConsumerRows(list, { search: "" })).toHaveLength(2);
    expect(buildConsumerRows(list, { search: "   " })).toHaveLength(2);
    expect(buildConsumerRows(list, {})).toHaveLength(2);
  });

  it("finds nobody when the search matches nobody", () => {
    expect(buildConsumerRows([consumer()], { search: "zzz" })).toEqual([]);
  });
});

describe("countConsumersByStatus", () => {
  it("counts each bucket", () => {
    const rows = buildConsumerRows([
      consumer({ id: "a", transactions: 0 }),
      consumer({ id: "b", transactions: 2 }),
      consumer({ id: "c", transactions: 2 }),
      consumer({ id: "d", transactions: 3 }),
    ]);
    expect(countConsumersByStatus(rows)).toEqual({ 0: 1, 1: 0, 2: 2, 3: 1 });
  });

  it("reports every bucket at zero rather than an empty object", () => {
    expect(countConsumersByStatus([])).toEqual({ 0: 0, 1: 0, 2: 0, 3: 0 });
    expect(countConsumersByStatus(undefined)).toEqual({ 0: 0, 1: 0, 2: 0, 3: 0 });
  });

  it("counts an unreadable status in the bucket it renders as", () => {
    expect(countConsumersByStatus([{ status: undefined }, { status: 9 }])).toEqual({
      0: 2,
      1: 0,
      2: 0,
      3: 0,
    });
  });
});
