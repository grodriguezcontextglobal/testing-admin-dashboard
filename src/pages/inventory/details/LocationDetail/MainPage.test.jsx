import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The location page must come to rest.
 *
 * Reported as an apparent infinite reload: the rows never settled, the item
 * images never arrived, and the arrow icon could not be clicked. These tests
 * mount the real page — StrictMode included, as the app runs it — and assert
 * that the request count stops climbing.
 */

const post = vi.fn();
const get = vi.fn();

vi.mock("../../../../api/devitrakApi", () => ({
  devitrakApi: { post: (...a) => post(...a), get: (...a) => get(...a) },
}));
vi.mock("../../../../components/animation/DevitrakLoading", () => ({
  default: () => <div>loading</div>,
}));
vi.mock("../../actions/DownloadXlsx", () => ({ default: () => <div>xlsx</div> }));
vi.mock("../../utils/HeaderInventaryComponent", () => ({
  default: () => <div>header</div>,
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

const MainPage = (await import("./MainPage")).default;

const settle = (ms) => new Promise((r) => setTimeout(r, ms));

const mount = () =>
  render(
    <StrictMode>
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <MemoryRouter initialEntries={["/inventory/location?IT%20office"]}>
          <MainPage />
        </MemoryRouter>
      </QueryClientProvider>
    </StrictMode>
  );

const countFor = (fragment) =>
  post.mock.calls.filter(([url]) => String(url).includes(fragment)).length;

beforeEach(() => {
  post.mockReset();
  get.mockReset();
  post.mockImplementation((url) => {
    if (String(url).includes("inventory-query"))
      return Promise.resolve({ data: { result: catalog } });
    if (String(url).includes("/image/images"))
      return Promise.resolve({ data: { item: [] } });
    return Promise.resolve({ data: { items: located } });
  });
  get.mockResolvedValue({ data: { data: {} } });
});

describe("the location page settles", () => {
  it("asks for each dataset once and then stops", async () => {
    mount();

    /* Waiting on the requests rather than on the rendered row: the table is a
       lazy chunk, and how long that takes to resolve says nothing about the
       behaviour under test. Table.test.jsx covers the rendering. */
    await waitFor(() => expect(countFor("inventory-query")).toBe(1), {
      timeout: 15000,
    });
    await settle(800);

    expect(countFor("inventory-query")).toBe(1);
    expect(countFor("/image/images")).toBe(1);
    expect(countFor("inventory-based-on-location")).toBe(1);
  }, 30000);

  it("stops asking when an endpoint keeps failing", async () => {
    // A query that never succeeds must not turn into a request storm — that
    // reads to the operator exactly like a page reloading in a loop.
    post.mockImplementation((url) =>
      String(url).includes("/image/images")
        ? Promise.reject(new Error("Network Error"))
        : Promise.resolve({
            data: String(url).includes("inventory-query")
              ? { result: catalog }
              : { items: located },
          })
    );

    mount();

    await settle(1500);
    const midway = countFor("/image/images");
    await settle(1500);

    expect(countFor("/image/images")).toBe(midway);
  }, 20000);
});
