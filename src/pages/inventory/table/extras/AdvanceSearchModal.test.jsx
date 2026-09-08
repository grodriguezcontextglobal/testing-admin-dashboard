import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const navigate = vi.fn();
vi.mock("react-router-dom", () => ({ useNavigate: () => navigate }));

const dispatch = vi.fn();
vi.mock("react-redux", () => ({
  useDispatch: () => dispatch,
  useSelector: (fn) =>
    fn({
      admin: { user: { companyData: { id: "co-1" }, sqlInfo: { company_id: 7 } } },
    }),
}));

const get = vi.fn(() => Promise.resolve({ data: { ok: true } }));
vi.mock("../../../../api/devitrakApi", () => ({
  devitrakApi: { get: (...args) => get(...args) },
}));

const { AdvanceSearchContext } = await import("./RenderingFilters");
const { default: AdvanceSearchModal } = await import("./AdvanceSearchModal");

const setOpen = vi.fn();

const context = {
  category: [{ key: "Radios" }, { key: "Headsets" }],
  group: [{ key: "Group A" }],
  brand: [{ key: "Sennheiser" }],
  location: [{ key: "Warehouse" }],
};

const wrap = (props = {}, ctx = context) =>
  render(
    <AdvanceSearchContext.Provider value={ctx}>
      <AdvanceSearchModal
        openAdvanceSearchModal
        setOpenAdvanceSearchModal={setOpen}
        {...props}
      />
    </AdvanceSearchContext.Provider>
  );

/* The antd RangePicker is a calendar, not the subject of these tests. The
   period is set by handing the component the parameters it reopens with. */
const withPeriod = (extra = {}) => ({
  existingParameters: {
    category: "",
    group: "",
    brand: "",
    location: "",
    date_start: "2026-08-28",
    date_end: "2026-09-02",
    ...extra,
  },
});

const pick = (placeholder, label) => {
  fireEvent.click(screen.getByPlaceholderText(placeholder));
  fireEvent.click(screen.getByText(label));
};

beforeEach(() => {
  window.localStorage.clear();
  get.mockClear();
  get.mockImplementation(() => Promise.resolve({ data: { ok: true } }));
  dispatch.mockClear();
  navigate.mockClear();
  setOpen.mockClear();
});

describe("AdvanceSearchModal — layout", () => {
  it("leads with the period, which is the one required thing", () => {
    wrap();
    expect(screen.getByText("The period")).toBeInTheDocument();
    expect(screen.getByText("Narrow it down")).toBeInTheDocument();
  });

  it("says the filters are optional and what leaving them empty means", () => {
    wrap();
    expect(screen.getByText("Optional — everything is included")).toBeInTheDocument();
    expect(
      screen.getAllByText("Forecasting every item in your inventory.").length
    ).toBeGreaterThan(0);
  });

  it("renders the form rather than a full-screen loader while options resolve", () => {
    // It used to `return <DevitrakLoading />` from the middle of the component.
    wrap({}, undefined);
    expect(screen.getByText("The period")).toBeInTheDocument();
  });

  it("says a filter has nothing to offer instead of an empty dropdown", () => {
    wrap({}, { category: [], group: [], brand: [], location: [] });
    expect(
      screen.getByPlaceholderText("No categories in your inventory yet")
    ).toBeInTheDocument();
  });
});

describe("AdvanceSearchModal — the filter options", () => {
  it("offers what the live context holds", () => {
    wrap();
    fireEvent.click(screen.getByPlaceholderText("Any category"));
    expect(screen.getByText("Radios")).toBeInTheDocument();
    expect(screen.getByText("Headsets")).toBeInTheDocument();
  });

  it("prefers the live context over a stale cache", () => {
    // The cache used to win, so a category added later never appeared.
    window.localStorage.setItem(
      "searchParameters",
      JSON.stringify({ category: [{ key: "Stale" }], group: [], brand: [], location: [] })
    );
    wrap();
    fireEvent.click(screen.getByPlaceholderText("Any category"));
    expect(screen.getByText("Radios")).toBeInTheDocument();
    expect(screen.queryByText("Stale")).not.toBeInTheDocument();
  });

  it("falls back to the cache only while the context is still empty", () => {
    window.localStorage.setItem(
      "searchParameters",
      JSON.stringify({ category: [{ key: "Radios" }], group: [], brand: [], location: [] })
    );
    wrap({}, { category: [], group: [], brand: [], location: [] });
    fireEvent.click(screen.getByPlaceholderText("Any category"));
    expect(screen.getByText("Radios")).toBeInTheDocument();
  });

  it("never caches an empty set of options over a good one", () => {
    window.localStorage.setItem("searchParameters", JSON.stringify(context));
    wrap({}, { category: [], group: [], brand: [], location: [] });
    expect(JSON.parse(window.localStorage.getItem("searchParameters"))).toEqual(context);
  });
});

describe("AdvanceSearchModal — validation", () => {
  it("asks for the period and sends nothing", async () => {
    wrap();
    fireEvent.click(screen.getByText("Run forecast"));
    await waitFor(() =>
      expect(screen.getByText("Pick the period to forecast.")).toBeInTheDocument()
    );
    expect(get).not.toHaveBeenCalled();
  });

  it("says nothing before the first attempt", () => {
    wrap();
    expect(screen.queryByText("Pick the period to forecast.")).not.toBeInTheDocument();
  });
});

describe("AdvanceSearchModal — reopening an existing search", () => {
  it("shows the period it was run for", () => {
    // `setValue` used to push these into a form whose controls were
    // uncontrolled, so the fields looked empty.
    wrap(withPeriod());
    expect(screen.getByText(/Aug 28, 2026 – Sep 2, 2026/)).toBeInTheDocument();
  });

  it("shows the filters it was run with", () => {
    wrap(withPeriod({ category: "Radios" }));
    expect(screen.getByDisplayValue("Radios")).toBeInTheDocument();
    expect(screen.getByText("1 of 4 set")).toBeInTheDocument();
  });
});

describe("AdvanceSearchModal — what it sends", () => {
  it("asks the endpoint for the eight documented parameters", async () => {
    wrap(withPeriod());
    fireEvent.click(screen.getByText("Run forecast"));

    await waitFor(() => expect(get).toHaveBeenCalledTimes(1));
    const url = get.mock.calls[0][0];
    const query = new URLSearchParams(url.split("?")[1]);
    expect(url.startsWith("/search/advance_searching_query?")).toBe(true);
    expect(query.get("date_start")).toBe("2026-8-28");
    expect(query.get("date_end")).toBe("2026-9-2");
    expect(query.get("company_id")).toBe("co-1");
    expect(query.get("company_sql_id")).toBe("7");
  });

  it("never asks for the word undefined", async () => {
    // Every unfiltered forecast used to send `category=undefined`.
    wrap(withPeriod());
    fireEvent.click(screen.getByText("Run forecast"));

    await waitFor(() => expect(get).toHaveBeenCalledTimes(1));
    expect(get.mock.calls[0][0]).not.toContain("undefined");
  });

  it("carries a filter that was picked", async () => {
    wrap(withPeriod());
    pick("Any category", "Radios");
    fireEvent.click(screen.getByText("Run forecast"));

    await waitFor(() => expect(get).toHaveBeenCalledTimes(1));
    expect(
      new URLSearchParams(get.mock.calls[0][0].split("?")[1]).get("category")
    ).toBe("Radios");
  });

  it("goes to the result page without an artificial pause", async () => {
    // A successful search used to sit in setTimeout(…, 2000) first.
    wrap(withPeriod());
    fireEvent.click(screen.getByText("Run forecast"));
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith("/inventory/advance_search_result")
    );
  });

  it("runs once however many times the button is pressed", async () => {
    let release;
    get.mockImplementation(
      () => new Promise((resolve) => { release = () => resolve({ data: { ok: true } }); })
    );
    wrap(withPeriod());
    const button = screen.getByText("Run forecast");
    fireEvent.click(button);
    fireEvent.click(button);

    await waitFor(() => expect(get).toHaveBeenCalledTimes(1));
    release();
  });
});

describe("AdvanceSearchModal — period-only mode", () => {
  it("states the filters instead of leaving them editable under a label that says otherwise", () => {
    wrap({ ...withPeriod({ category: "Radios" }), periodUpdateOnly: true });
    expect(screen.getByText("Change the period")).toBeInTheDocument();
    expect(screen.queryByText("Narrow it down")).not.toBeInTheDocument();
    expect(
      screen.getAllByText("Forecasting only category Radios.").length
    ).toBeGreaterThan(0);
  });

  it("closes rather than navigating away", async () => {
    wrap({ ...withPeriod(), periodUpdateOnly: true });
    fireEvent.click(screen.getByText("Update period"));

    await waitFor(() => expect(setOpen).toHaveBeenCalledWith(false));
    expect(navigate).not.toHaveBeenCalled();
  });
});

describe("AdvanceSearchModal — failures", () => {
  it("shows an empty result on the form instead of closing the modal it renders in", async () => {
    // The old branch closed the modal and *then* set the message.
    get.mockImplementation(() => Promise.resolve({ data: { ok: false } }));
    wrap(withPeriod());
    fireEvent.click(screen.getByText("Run forecast"));

    await waitFor(() =>
      expect(
        screen.getByText(
          "No inventory matches those parameters. Try a wider period, or fewer filters."
        )
      ).toBeInTheDocument()
    );
    expect(setOpen).not.toHaveBeenCalledWith(false);
    expect(navigate).not.toHaveBeenCalled();
  });

  it("translates the handler's TypeError into what it means", async () => {
    get.mockImplementation(() =>
      Promise.reject({
        response: {
          data: { msg: "Cannot read properties of undefined (reading 'length')" },
        },
      })
    );
    wrap(withPeriod());
    fireEvent.click(screen.getByText("Run forecast"));

    await waitFor(() =>
      expect(
        screen.getByText("There is no inventory available for the period selected.")
      ).toBeInTheDocument()
    );
  });

  it("reports a rejected request and stays open", async () => {
    get.mockImplementation(() => Promise.reject(new Error("Network Error")));
    wrap(withPeriod());
    fireEvent.click(screen.getByText("Run forecast"));

    await waitFor(() => expect(screen.getByText("Network Error")).toBeInTheDocument());
    expect(navigate).not.toHaveBeenCalled();
  });
});
