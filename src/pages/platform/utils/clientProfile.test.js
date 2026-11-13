import { describe, it, expect } from "vitest";
import {
  CLIENT_PROFILE_TABS,
  RECORD_FIELDS,
  SECTION_COLUMNS,
  buildSectionQuery,
  companyFactGroups,
  companyStatTiles,
  formatSectionValue,
  humanizeStatus,
  normalizeSectionResponse,
  resolveProfileTab,
  sectionStatusTone,
} from "./clientProfile";

describe("CLIENT_PROFILE_TABS", () => {
  it("lists the profile places in the designed order", () => {
    expect(CLIENT_PROFILE_TABS.map((tab) => tab.key)).toEqual([
      "overview",
      "activity",
      "transactions",
      "events",
      "merchant",
      "inventory",
      "members",
      "consumers",
      "staff",
      "subscription",
    ]);
  });

  it("gives every tab except Overview its own server resource", () => {
    for (const tab of CLIENT_PROFILE_TABS) {
      if (tab.key === "overview") expect(tab.resource).toBeNull();
      else expect(tab.resource).toBe(tab.key);
    }
  });

  it("has columns for every list tab and fields for every record tab", () => {
    for (const tab of CLIENT_PROFILE_TABS) {
      if (tab.kind === "list") expect(SECTION_COLUMNS[tab.key]?.length).toBeGreaterThan(0);
      if (tab.kind === "record") expect(RECORD_FIELDS[tab.key]?.length).toBeGreaterThan(0);
    }
  });

  it("keeps serial ranges as text, never as numbers", () => {
    const serial = SECTION_COLUMNS.inventory.find((column) => column.key === "serialRange");
    expect(serial.format).toBe("text");
  });
});

describe("resolveProfileTab", () => {
  it("returns a known tab as is", () => {
    expect(resolveProfileTab("merchant")).toBe("merchant");
  });

  it("falls back to overview for a missing or unknown tab", () => {
    expect(resolveProfileTab(null)).toBe("overview");
    expect(resolveProfileTab("billing")).toBe("overview");
  });
});

describe("buildSectionQuery", () => {
  it("sends page and limit, and leaves out a category of all", () => {
    expect(buildSectionQuery({ page: 3, category: "all" })).toEqual({ page: 3, limit: 25 });
  });

  it("sends a real category", () => {
    expect(buildSectionQuery({ category: "inventory" })).toEqual({
      page: 1,
      limit: 25,
      category: "inventory",
    });
  });
});

describe("normalizeSectionResponse", () => {
  it("reads a list body: rows, totals and total", () => {
    const body = { ok: true, data: [{ id: 1 }], totals: { amountCents: 500 }, page: 2, limit: 25, total: 26 };
    expect(normalizeSectionResponse(body)).toEqual({
      rows: [{ id: 1 }],
      record: null,
      totals: { amountCents: 500 },
      page: 2,
      limit: 25,
      total: 26,
    });
  });

  it("reads a record body (merchant, subscription) as record, rows empty", () => {
    const result = normalizeSectionResponse({ ok: true, data: { chargesEnabled: true } });
    expect(result.record).toEqual({ chargesEnabled: true });
    expect(result.rows).toEqual([]);
  });

  it("is safe while loading", () => {
    expect(normalizeSectionResponse(undefined)).toEqual({
      rows: [],
      record: null,
      totals: null,
      page: 1,
      limit: 25,
      total: 0,
    });
  });
});

describe("formatSectionValue", () => {
  it("shows a dash for empty values", () => {
    expect(formatSectionValue("text", null)).toBe("—");
    expect(formatSectionValue("number", undefined)).toBe("—");
    expect(formatSectionValue("date", "")).toBe("—");
  });

  it("keeps text as written, including serials with leading zeros", () => {
    expect(formatSectionValue("text", "000120-000180")).toBe("000120-000180");
  });

  it("formats numbers, cents and booleans", () => {
    expect(formatSectionValue("number", 1234)).toBe("1,234");
    expect(formatSectionValue("cents", 151000, { currency: "USD" })).toBe("$1,510.00");
    expect(formatSectionValue("bool", true)).toBe("Yes");
    expect(formatSectionValue("bool", false)).toBe("No");
  });

  it("formats dates in UTC", () => {
    expect(formatSectionValue("date", "2026-11-11T02:00:00Z")).toBe("Nov 11, 2026");
    expect(formatSectionValue("date", "not a date")).toBe("—");
  });

  it("joins lists, and says None for an empty one", () => {
    expect(formatSectionValue("list", ["Bank account", "Tax ID"])).toBe("Bank account, Tax ID");
    expect(formatSectionValue("list", [])).toBe("None");
  });

  it("humanizes statuses", () => {
    expect(formatSectionValue("status", "past_due")).toBe("Past due");
  });
});

describe("statuses", () => {
  it("humanizes snake case", () => {
    expect(humanizeStatus("not_returned")).toBe("Not returned");
    expect(humanizeStatus("")).toBe("—");
  });

  it("maps statuses to the semantic tones only", () => {
    expect(sectionStatusTone("active")).toBe("success");
    expect(sectionStatusTone("Paid")).toBe("success");
    expect(sectionStatusTone("past_due")).toBe("critical");
    expect(sectionStatusTone("lost")).toBe("critical");
    expect(sectionStatusTone("pending")).toBe("warning");
    expect(sectionStatusTone("archived")).toBe("neutral");
    expect(sectionStatusTone(undefined)).toBe("neutral");
  });
});

describe("companyFactGroups", () => {
  it("shows owner and account facts", () => {
    const groups = companyFactGroups({
      ownerName: "Ana Ruiz",
      ownerEmail: "ana@client.example",
      phone: "+1 305 555 0100",
      createdAt: "2024-03-02T00:00:00Z",
      mongoId: "65f0c0ffee",
      sqlId: 42,
    });
    expect(groups[0]).toEqual({
      label: "Owner",
      items: [
        { value: "Ana Ruiz" },
        { value: "ana@client.example", href: "mailto:ana@client.example" },
        { value: "+1 305 555 0100" },
      ],
    });
    expect(groups[1]).toEqual({
      label: "Account",
      items: [
        { value: "Client since Mar 2, 2024" },
        { value: "Mongo ID 65f0c0ffee", muted: true },
        { value: "SQL ID 42", muted: true },
      ],
    });
  });

  it("leaves out what the server did not send", () => {
    const groups = companyFactGroups({ ownerEmail: "ana@client.example" });
    expect(groups[0].items).toEqual([
      { value: "ana@client.example", href: "mailto:ana@client.example" },
    ]);
    expect(groups[1].items).toEqual([]);
  });

  it("is safe with no company", () => {
    expect(companyFactGroups(undefined)).toEqual([
      { label: "Owner", items: [] },
      { label: "Account", items: [] },
    ]);
  });
});

describe("companyStatTiles", () => {
  const company = {
    staffCount: 12,
    deviceCount: 900,
    devicesOut: 140,
    devicesOverdue: 3,
    revenue30dCents: 1510000,
    currency: "USD",
  };

  it("shows staff, devices out, overdue and revenue", () => {
    const tiles = companyStatTiles(company);
    expect(tiles.map((tile) => tile.label)).toEqual([
      "Devices out",
      "Overdue",
      "Revenue 30d",
      "Staff",
    ]);
    expect(tiles[0]).toMatchObject({ value: "140", sub: "of 900 devices" });
    expect(tiles[2].value).toBe("$15,100.00");
  });

  it("marks overdue critical only when there is any, and nothing else", () => {
    expect(companyStatTiles(company).filter((tile) => tile.tone === "critical")).toHaveLength(1);
    const none = companyStatTiles({ ...company, devicesOverdue: 0 });
    expect(none.filter((tile) => tile.tone === "critical")).toHaveLength(0);
  });

  it("shows dashes while there is no company", () => {
    const tiles = companyStatTiles(undefined);
    expect(tiles.every((tile) => tile.value === "—")).toBe(true);
  });
});
