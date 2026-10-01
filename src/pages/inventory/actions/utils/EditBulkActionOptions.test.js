import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../utils/actions/clearCacheMemory", () => ({ default: vi.fn(async () => {}) }));
vi.mock("../../../../api/devitrakApi", () => ({ devitrakApi: { post: vi.fn() } }));

import {
  bulkItemUpdateAlphanumeric,
  updateAllItemsBasedOnParameters,
} from "./EditBulkActionOptions";

/**
 * The edit-group wizard saved `sub_location: JSON.stringify(subLocationsSubmitted)`
 * — the chips alone (2026-10-01). A sub-location typed and not added was
 * dropped, where the add wizard keeps it (buildSubLocationPath), and a chip
 * list carrying "null" was written back as-is. Both now go through
 * buildSubLocationPath.
 */
const base = (overrides = {}) => ({
  data: {
    category_name: "Laptops",
    item_group: "Chromebook",
    location: "Washington, DC",
    tax_location: "Washington, DC",
    ownership: "Permanent",
    container: "No",
    sub_location: "",
  },
  user: { company: "Beaver", companyData: { id: "c1" }, sqlInfo: { company_id: 7 } },
  navigate: vi.fn(),
  dispatch: vi.fn(),
  openNotificationWithIcon: vi.fn(),
  openSuccessNotification: vi.fn(),
  setLoadingStatus: vi.fn(),
  setValue: vi.fn(),
  img_url: null,
  moreInfo: [],
  formatDate: () => "2026-10-01",
  returningDate: null,
  dicSuppliers: [],
  scannedSerialNumbers: ["SN-1"],
  setScannedSerialNumbers: vi.fn(),
  ...overrides,
});

const sentSubLocation = async (run, overrides) => {
  const mutation = {
    mutateAsync: vi.fn(async () => ({ data: { jobId: "j1" } })),
    mutate: vi.fn(async () => ({})),
  };
  await run(
    base({
      alphaNumericUpdateItemMutation: mutation,
      updateAllItemsMutation: mutation,
      ...overrides,
    })
  );
  const call = mutation.mutateAsync.mock.calls[0]?.[0]?.template ?? mutation.mutate.mock.calls[0]?.[0];
  return JSON.parse(call.sub_location);
};

describe("the edit wizard's sub-location on save", () => {
  for (const [name, run] of [
    ["by serial", bulkItemUpdateAlphanumeric],
    ["the whole group", updateAllItemsBasedOnParameters],
  ]) {
    it(`keeps a sub-location typed and not added (${name})`, async () => {
      expect(
        await sentSubLocation(run, {
          subLocationsSubmitted: ["Building A"],
          data: { ...base().data, sub_location: "Supply room" },
        })
      ).toEqual(["Building A", "Supply room"]);
    });

    it(`does not write "null" segments back (${name})`, async () => {
      expect(
        await sentSubLocation(run, { subLocationsSubmitted: ["null", null, "Building A"] })
      ).toEqual(["Building A"]);
    });
  }
});
