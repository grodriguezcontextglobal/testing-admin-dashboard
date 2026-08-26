import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const admin = { company: "Acme Rentals", companyData: { id: "co-1" } };

const activeEvent = {
  id: "evt-1",
  eventInfoDetail: { eventName: "Science Fair" },
};

const otherEvent = {
  id: "evt-2",
  eventInfoDetail: { eventName: "Robotics Expo" },
};

let pathname = "/consumers";
const navigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useLocation: () => ({ pathname, key: pathname }),
  useNavigate: () => navigate,
}));

const dispatch = vi.fn();
vi.mock("react-redux", () => ({
  useDispatch: () => dispatch,
  useSelector: (fn) =>
    fn({
      admin: { user: admin },
      event: {
        event: activeEvent,
        eventsPerAdmin: { active: [activeEvent, otherEvent] },
      },
    }),
}));

/* The country-code widget is not what these tests are about; a plain input
   keeps them on the form's own behaviour. */
vi.mock("react-phone-number-input", () => ({
  default: ({ id, placeholder, value, onChange, disabled }) => (
    <input
      id={id}
      placeholder={placeholder}
      disabled={disabled}
      value={value ?? ""}
      onChange={(domEvent) => onChange(domEvent.target.value)}
    />
  ),
}));

const post = vi.fn(() => Promise.resolve({ data: { ok: true } }));
const patch = vi.fn(() => Promise.resolve({ data: { ok: true } }));
vi.mock("../../../api/devitrakApi", () => ({
  devitrakApi: {
    post: (...args) => post(...args),
    patch: (...args) => patch(...args),
  },
}));

const { CreateNewConsumer } = await import("./CreateNewUser");

const setCreateUserButton = vi.fn();

const wrap = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <CreateNewConsumer
        createUserButton
        setCreateUserButton={setCreateUserButton}
      />
    </QueryClientProvider>
  );
};

const fillDetails = () => {
  fireEvent.change(screen.getByLabelText("First name *"), {
    target: { value: "Ada" },
  });
  fireEvent.change(screen.getByLabelText("Last name *"), {
    target: { value: "Lovelace" },
  });
  fireEvent.change(screen.getByLabelText("Email *"), {
    target: { value: "ada@x.com" },
  });
  fireEvent.change(screen.getByPlaceholderText("(555) 000-0000"), {
    target: { value: "+15550000000" },
  });
};

const lookupAnswers = (users) => {
  post.mockImplementation((url) => {
    if (url === "/auth/user-query") {
      return Promise.resolve({ data: { ok: true, users } });
    }
    if (url === "/auth/new") return Promise.resolve({ data: { id: "usr-new" } });
    return Promise.resolve({ data: { ok: true } });
  });
};

beforeEach(() => {
  pathname = "/consumers";
  post.mockClear();
  patch.mockClear();
  navigate.mockClear();
  dispatch.mockClear();
  setCreateUserButton.mockClear();
  post.mockImplementation(() => Promise.resolve({ data: { ok: true, users: [] } }));
});

describe("CreateNewConsumer — layout", () => {
  it("states its two steps rather than presenting one flat grid", () => {
    wrap();
    expect(screen.getByText("Who they are")).toBeInTheDocument();
    expect(screen.getByText("Which event")).toBeInTheDocument();
  });

  it("associates every label with its field, so clicking one focuses it", () => {
    wrap();
    expect(screen.getByLabelText("First name *")).toBeInTheDocument();
    expect(screen.getByLabelText("Last name *")).toBeInTheDocument();
    expect(screen.getByLabelText("Email *")).toBeInTheDocument();
  });

  it("says what saving will do before you press it", () => {
    wrap();
    expect(
      screen.getByText("Saving adds them to the consumer list.")
    ).toBeInTheDocument();
  });

  it("offers a way out that is not the close cross", () => {
    wrap();
    fireEvent.click(screen.getByText("Cancel"));
    expect(setCreateUserButton).toHaveBeenCalledWith(false);
  });
});

describe("CreateNewConsumer — the event step", () => {
  it("offers the admin's active events plus an explicit No event on the consumer list", () => {
    wrap();
    fireEvent.click(screen.getByPlaceholderText("Search an active event"));
    expect(screen.getByText("Science Fair")).toBeInTheDocument();
    expect(screen.getByText("Robotics Expo")).toBeInTheDocument();
    expect(screen.getByText("No event")).toBeInTheDocument();
  });

  it("states the event instead of a disabled control when opened inside one", () => {
    pathname = "/events/event-quickglance";
    wrap();
    expect(
      screen.queryByPlaceholderText("Search an active event")
    ).not.toBeInTheDocument();
    expect(screen.getByText("Science Fair")).toBeInTheDocument();
  });
});

describe("CreateNewConsumer — validation", () => {
  it("names every empty field on its own field and sends nothing", async () => {
    wrap();
    fireEvent.click(screen.getByText("Add consumer"));
    await waitFor(() =>
      expect(screen.getByText("First name is required")).toBeInTheDocument()
    );
    expect(screen.getByText("Last name is required")).toBeInTheDocument();
    expect(screen.getByText("Email is required")).toBeInTheDocument();
    expect(screen.getByText("Phone number is required")).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it("keeps the phone in the same pass as the rest, not on a later submit", async () => {
    wrap();
    fireEvent.change(screen.getByLabelText("First name *"), {
      target: { value: "Ada" },
    });
    fireEvent.change(screen.getByLabelText("Last name *"), {
      target: { value: "Lovelace" },
    });
    fireEvent.change(screen.getByLabelText("Email *"), {
      target: { value: "ada@x.com" },
    });
    fireEvent.click(screen.getByText("Add consumer"));
    await waitFor(() =>
      expect(screen.getByText("Phone number is required")).toBeInTheDocument()
    );
    expect(post).not.toHaveBeenCalled();
  });

  it("says nothing before the first submit", () => {
    wrap();
    expect(screen.queryByText("First name is required")).not.toBeInTheDocument();
  });
});

describe("CreateNewConsumer — what it sends", () => {
  it("creates an unknown consumer with the body the endpoint already accepts", async () => {
    lookupAnswers([]);
    wrap();
    fillDetails();
    fireEvent.click(screen.getByText("Add consumer"));

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith("/auth/new", {
        name: "Ada",
        lastName: "Lovelace",
        email: "ada@x.com",
        phoneNumber: "+15550000000",
        privacyPolicy: true,
        category: "Regular",
        provider: ["Acme Rentals"],
        eventSelected: [],
        company_providers: ["co-1"],
        event_providers: [],
        groupName: [],
      })
    );
    expect(post).toHaveBeenCalledWith("/db_consumer/new_consumer", {
      first_name: "Ada",
      last_name: "Lovelace",
      email: "ada@x.com",
      phone_number: "+15550000000",
    });
  });

  it("patches the record instead of creating a second one when the email is known", async () => {
    lookupAnswers([
      {
        id: "usr-9",
        eventSelected: ["Old Expo"],
        provider: ["Acme Rentals"],
        company_providers: ["co-1"],
        event_providers: ["evt-old"],
      },
    ]);
    wrap();
    fillDetails();
    fireEvent.click(screen.getByText("Add consumer"));

    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    expect(patch).toHaveBeenCalledWith("/auth/usr-9", {
      id: "usr-9",
      eventSelected: ["Old Expo", null],
      provider: ["Acme Rentals"],
      company_providers: ["co-1"],
      event_providers: ["evt-old", null],
      phoneNumber: "+15550000000",
    });
    expect(post).not.toHaveBeenCalledWith("/auth/new", expect.anything());
  });

  it("attaches the event it is opened inside without asking", async () => {
    pathname = "/events/event-quickglance";
    lookupAnswers([]);
    wrap();
    fillDetails();
    fireEvent.click(screen.getByText("Add consumer"));

    await waitFor(() => expect(post).toHaveBeenCalledWith("/auth/new", expect.anything()));
    const [, profile] = post.mock.calls.find(([url]) => url === "/auth/new");
    expect(profile.eventSelected).toEqual(["Science Fair"]);
    expect(profile.event_providers).toEqual(["evt-1"]);
  });

  it("opens the new consumer's transactions when it was created from an event", async () => {
    pathname = "/events/event-quickglance";
    lookupAnswers([]);
    wrap();
    fillDetails();
    fireEvent.click(screen.getByText("Add consumer"));

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith(
        "/events/event-attendees/usr-new/transactions-details"
      )
    );
  });
});

describe("CreateNewConsumer — failures", () => {
  it("says the lookup failed instead of closing on a silent no-op", async () => {
    post.mockImplementation((url) => {
      if (url === "/auth/user-query") return Promise.resolve({ data: { ok: false } });
      return Promise.resolve({ data: { ok: true } });
    });
    wrap();
    fillDetails();
    fireEvent.click(screen.getByText("Add consumer"));

    await waitFor(() =>
      expect(
        screen.getByText(
          "The consumer record could not be checked, so nothing was created. Try again."
        )
      ).toBeInTheDocument()
    );
    expect(setCreateUserButton).not.toHaveBeenCalledWith(false);
  });

  it("reports a rejected request on the form and leaves it open", async () => {
    post.mockImplementation((url) => {
      if (url === "/auth/user-query") return Promise.reject(new Error("Network Error"));
      return Promise.resolve({ data: { ok: true } });
    });
    wrap();
    fillDetails();
    fireEvent.click(screen.getByText("Add consumer"));

    await waitFor(() =>
      expect(screen.getByText("Network Error")).toBeInTheDocument()
    );
    expect(setCreateUserButton).not.toHaveBeenCalledWith(false);
  });

  it("does not report the created consumer as saved when /auth/new answers nothing", async () => {
    post.mockImplementation((url) => {
      if (url === "/auth/user-query") {
        return Promise.resolve({ data: { ok: true, users: [] } });
      }
      if (url === "/auth/new") return Promise.resolve({ data: null });
      return Promise.resolve({ data: { ok: true } });
    });
    wrap();
    fillDetails();
    fireEvent.click(screen.getByText("Add consumer"));

    await waitFor(() =>
      expect(
        screen.getByText(
          "The consumer could not be created. Nothing was saved — try again."
        )
      ).toBeInTheDocument()
    );
    expect(post).not.toHaveBeenCalledWith(
      "/db_consumer/new_consumer",
      expect.anything()
    );
  });
});
