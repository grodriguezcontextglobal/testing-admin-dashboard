import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const post = vi.fn();

vi.mock("../../../../../api/devitrakApi", () => ({
  devitrakApi: { post: (...args) => post(...args), get: vi.fn() },
}));

vi.mock("../../../../../components/animation/DevitrakLoading", () => ({
  default: () => <div>loading</div>,
}));

vi.mock("../../../actions/DownloadXlsx", () => ({
  default: () => <div>xlsx</div>,
}));

vi.mock("react-redux", () => ({
  useSelector: (fn) =>
    fn({
      admin: {
        user: { companyData: { id: "co-1" }, sqlInfo: { company_id: 7 } },
      },
    }),
}));

const catalog = [
  { item_id: 200602, serial_number: "SN-100016", item_group: "Chromebook", cost: "300" },
];
const located = [
  { item_id: 200602, serial_number: "SN-100016", location: "IT office", warehouse: 1 },
];
const images = [{ item_group: "Chromebook", source: "group.png" }];

const respond = (url) => {
  if (String(url).includes("inventory-query")) return { data: { result: catalog } };
  if (String(url).includes("/image/images")) return { data: { item: images } };
  return { data: { items: located } };
};

const TableDeviceLocation = (await import("./Table")).default;

const mount = (referenceData = vi.fn()) =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter initialEntries={["/inventory/location?IT%20office"]}>
        <TableDeviceLocation searchItem={null} referenceData={referenceData} />
      </MemoryRouter>
    </QueryClientProvider>
  );

const settle = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

beforeEach(() => {
  post.mockReset();
  post.mockImplementation((url) => Promise.resolve(respond(url)));
});

describe("the location table settles", () => {
  it("stops fetching once the data has arrived", async () => {
    mount();

    await waitFor(() => expect(screen.getByText("SN-100016")).toBeInTheDocument());

    const afterFirstPaint = post.mock.calls.length;
    await settle(400);

    /* Three queries, plus the three the mount effect refetches. Anything that
       keeps climbing is the table refetching itself in a loop — which is what
       stops the row images from ever arriving and destroys the arrow icon
       between mousedown and mouseup. */
    expect(post.mock.calls.length).toBe(afterFirstPaint);
    expect(post.mock.calls.length).toBeLessThanOrEqual(6);
  });

  it("reports its totals upward a bounded number of times", async () => {
    const referenceData = vi.fn();
    mount(referenceData);

    await waitFor(() => expect(screen.getByText("SN-100016")).toBeInTheDocument());
    await settle(400);

    expect(referenceData.mock.calls.length).toBeLessThanOrEqual(4);
  });
});
