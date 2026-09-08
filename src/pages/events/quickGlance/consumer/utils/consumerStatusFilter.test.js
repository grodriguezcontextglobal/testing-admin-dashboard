import { describe, expect, it } from "vitest";
import {
  CONSUMER_STATUSES,
  consumerStatus,
  matchesStatusFilter,
  normalizeConsumerStatus,
  statusColumnFilterValue,
  statusFilterFromTableChange,
  toggleStatusFilter,
} from "./consumerStatusFilter";

describe("CONSUMER_STATUSES", () => {
  it("is the four buckets the legend and the column both read", () => {
    expect(CONSUMER_STATUSES.map((status) => status.value)).toEqual([0, 1, 2, 3]);
    expect(CONSUMER_STATUSES.map((status) => status.label)).toEqual([
      "No devices",
      "Devices pending to return",
      "Devices in use",
      "Devices returned",
    ]);
  });

  it("gives every bucket a description and a colour pair", () => {
    CONSUMER_STATUSES.forEach((status) => {
      expect(status.description).toBeTruthy();
      expect(status.backgroundColor).toBeTruthy();
      expect(status.color).toBeTruthy();
    });
  });
});

describe("normalizeConsumerStatus", () => {
  it("keeps the four known values", () => {
    expect([0, 1, 2, 3].map(normalizeConsumerStatus)).toEqual([0, 1, 2, 3]);
  });

  it("reads a numeric string, which is how a query string comes back", () => {
    expect(normalizeConsumerStatus("2")).toBe(2);
  });

  it("falls back to 'No devices' for anything else", () => {
    [undefined, null, "", "lost", NaN, 7, -1, 1.5, {}].forEach((value) =>
      expect(normalizeConsumerStatus(value)).toBe(0),
    );
  });
});

describe("consumerStatus", () => {
  it("resolves the bucket a row is rendered with", () => {
    expect(consumerStatus(3).label).toBe("Devices returned");
  });

  it("never returns undefined, so the cell always has a colour", () => {
    expect(consumerStatus(undefined).label).toBe("No devices");
  });
});

describe("toggleStatusFilter", () => {
  it("selects a bucket when nothing is filtered", () => {
    expect(toggleStatusFilter(null, 2)).toBe(2);
  });

  it("clears when the active pill is clicked again", () => {
    expect(toggleStatusFilter(2, 2)).toBeNull();
  });

  it("moves straight from one bucket to another", () => {
    expect(toggleStatusFilter(1, 3)).toBe(3);
  });

  it("treats 0 as a real bucket rather than as 'nothing selected'", () => {
    expect(toggleStatusFilter(null, 0)).toBe(0);
    expect(toggleStatusFilter(0, 0)).toBeNull();
  });
});

describe("matchesStatusFilter", () => {
  it("keeps every row when nothing is filtered", () => {
    expect(matchesStatusFilter(null, 3)).toBe(true);
  });

  it("keeps only the rows in the selected bucket", () => {
    expect(matchesStatusFilter(2, 2)).toBe(true);
    expect(matchesStatusFilter(2, 3)).toBe(false);
  });

  it("puts a row with no status in the 'No devices' bucket, where it renders", () => {
    expect(matchesStatusFilter(0, undefined)).toBe(true);
  });
});

describe("statusFilterFromTableChange", () => {
  it("reads the column dropdown's selection", () => {
    expect(statusFilterFromTableChange({ status: [1] })).toBe(1);
  });

  it("reads a cleared column filter as no filter", () => {
    expect(statusFilterFromTableChange({ status: null })).toBeNull();
    expect(statusFilterFromTableChange({ status: [] })).toBeNull();
    expect(statusFilterFromTableChange({})).toBeNull();
    expect(statusFilterFromTableChange(undefined)).toBeNull();
  });

  it("keeps 0 selected — antd hands it back as a value, not as empty", () => {
    expect(statusFilterFromTableChange({ status: [0] })).toBe(0);
  });
});

describe("statusColumnFilterValue", () => {
  it("controls the column with the pill's selection", () => {
    expect(statusColumnFilterValue(2)).toEqual([2]);
    expect(statusColumnFilterValue(0)).toEqual([0]);
  });

  it("hands antd null, not an empty array, when nothing is filtered", () => {
    expect(statusColumnFilterValue(null)).toBeNull();
    expect(statusColumnFilterValue(undefined)).toBeNull();
  });
});
