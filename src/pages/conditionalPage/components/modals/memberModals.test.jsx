import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const admin = {
  company: "Acme School",
  companyData: { id: "co-1", industry: "Education" },
  sqlInfo: { company_id: 7 },
};

vi.mock("react-redux", () => ({
  useDispatch: () => vi.fn(),
  useSelector: (fn) => fn({ admin: { user: admin } }),
}));

vi.mock("../../../../api/activityLog", () => ({ registerStaffActivity: vi.fn() }));

const searchGuardians = vi.fn(() => Promise.resolve({ guardians: [] }));
const saveGuardian = vi.fn(() => Promise.resolve({ ok: true }));
vi.mock("../../utils/guardianConsentApi", () => ({
  searchGuardians: (...args) => searchGuardians(...args),
  saveGuardian: (...args) => saveGuardian(...args),
}));

const members = [
  {
    member_id: 1,
    first_name: "Ada",
    last_name: "Lovelace",
    email: "ada@x.com",
    date_of_birth: "1990-01-01",
  },
  {
    member_id: 2,
    first_name: "Grace",
    last_name: "Hopper",
    email: "grace@x.com",
    date_of_birth: "2015-01-01",
    minor: true,
    parent_guardian_email: "mum@x.com",
  },
  {
    member_id: 3,
    first_name: "Alan",
    last_name: "Turing",
    email: "alan@x.com",
    date_of_birth: "2015-01-01",
    minor: true,
  },
];

const activeEvent = { id: "evt-1", eventInfoDetail: { eventName: "Science Fair" } };

const post = vi.fn((url) => {
  if (url === "/event/event-list") return Promise.resolve({ data: { list: [activeEvent] } });
  if (url === "/db_member/consulting-member") {
    return Promise.resolve({ data: { members } });
  }
  if (url === "/db_member/new-member") {
    // extractCreatedMemberId reads response.data.member_id for the axios shape.
    return Promise.resolve({ data: { ok: true, member_id: 99 } });
  }
  return Promise.resolve({ data: { ok: true } });
});

vi.mock("../../../../api/devitrakApi", () => ({
  devitrakApi: { post: (...args) => post(...args) },
}));

const { default: AddNewMember } = await import("./AddNewMember");
const { default: RegisterMembersToEvent } = await import("./RegisterMembersToEvent");

const wrap = (node) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{node}</QueryClientProvider>);
};

beforeEach(() => {
  post.mockClear();
  searchGuardians.mockClear();
  saveGuardian.mockClear();
  saveGuardian.mockImplementation(() => Promise.resolve({ ok: true }));
});

describe("AddNewMember", () => {
  it("switches between the two ways in without either looking like a submit", async () => {
    // They used to be a blue button beside a grey one, which reads as
    // "do this" / "do that" rather than as a pair of tabs.
    wrap(<AddNewMember openModal setOpenModal={vi.fn()} />);

    expect(await screen.findByText("Who they are")).toBeTruthy();

    fireEvent.click(screen.getByText("Import a spreadsheet"));
    expect(await screen.findByText("Pick the spreadsheet")).toBeTruthy();
    expect(screen.queryByText("Who they are")).toBeNull();
  });

  it("keeps the column reference inside the import pane", async () => {
    // It used to be a Tour rendered *instead of* this modal, so opening it
    // unmounted the import pane along with the file already loaded into it.
    wrap(<AddNewMember openModal setOpenModal={vi.fn()} />);
    fireEvent.click(await screen.findByText("Import a spreadsheet"));

    fireEvent.click(await screen.findByText("What the file needs"));
    expect(await screen.findByText("first_name")).toBeTruthy();
    // The importer is still on screen behind it.
    expect(screen.getByText("Pick the spreadsheet")).toBeTruthy();
  });
});

describe("Single, through AddNewMember", () => {
  const fill = async (label, value) => {
    const field = await screen.findByLabelText(label, { exact: false });
    fireEvent.change(field, { target: { value } });
  };

  const openSingle = async () => {
    wrap(<AddNewMember openModal setOpenModal={vi.fn()} />);
    await screen.findByText("Who they are");
  };

  it("marks the field, instead of listing sentences away from it", async () => {
    await openSingle();
    fireEvent.click(screen.getByText("Create member"));

    expect(await screen.findByText("First name is required.")).toBeTruthy();
    expect(screen.getByText("Email is required.")).toBeTruthy();
    expect(post).not.toHaveBeenCalledWith("/db_member/new-member", expect.anything());
  });

  it("does not create the member twice when the guardian link fails", async () => {
    // Two writes: the member, then the guardian. The first had already
    // happened when the second failed, and nothing said so -- pressing again
    // used to create a second member.
    saveGuardian.mockImplementation(() => Promise.reject(new Error("link refused")));
    await openSingle();

    await fill("First name", "Grace");
    await fill("Last name", "Hopper");
    await fill("Email", "grace@x.com");
    await fill("Phone", "555");
    await fill("Date of birth", "2015-01-01");
    await fill("Parent / Guardian first name", "Mary");
    await fill("Parent / Guardian last name", "Hopper");
    await fill("Parent / Guardian email", "mum@x.com");
    await fill("Parent / Guardian phone", "556");

    fireEvent.click(screen.getByText("Create member"));

    expect(await screen.findByText(/was created, but linking/)).toBeTruthy();
    const createCalls = () =>
      post.mock.calls.filter(([url]) => url === "/db_member/new-member").length;
    expect(createCalls()).toBe(1);

    // The button now offers to finish the link, and pressing it does not
    // re-create the member.
    fireEvent.click(await screen.findByText("Finish linking"));
    await waitFor(() => expect(saveGuardian).toHaveBeenCalledTimes(2));
    expect(createCalls()).toBe(1);
  });
});

describe("RegisterMembersToEvent", () => {
  const openWithEvent = async () => {
    wrap(<RegisterMembersToEvent openModal setOpenModal={vi.fn()} />);
    fireEvent.click(await screen.findByPlaceholderText("Search active events…"));
    fireEvent.click(await screen.findByText("Science Fair"));
    return screen.findByPlaceholderText("Name, email or guardian email");
  };

  it("will not send before an event and a selection", async () => {
    wrap(<RegisterMembersToEvent openModal setOpenModal={vi.fn()} />);
    expect(
      (await screen.findByText("Send invitations")).closest("button").disabled
    ).toBe(true);
  });

  it("counts the members it has quietly disabled", async () => {
    // A run that left out thirty minors with no guardian email on file used to
    // look exactly like one that left out none.
    await openWithEvent();
    expect(await screen.findByText("Missing an email")).toBeTruthy();
    expect(screen.getByText("Alan Turing").closest("tr").textContent).toContain(
      "No guardian email on file"
    );
  });

  it("filters the list, which had no search at all", async () => {
    const searchField = await openWithEvent();
    expect(screen.getByText("Ada Lovelace")).toBeTruthy();

    fireEvent.change(searchField, { target: { value: "hopper" } });
    await waitFor(() => expect(screen.queryByText("Ada Lovelace")).toBeNull());
    expect(screen.getByText("Grace Hopper")).toBeTruthy();
  });

  it("shows who the invitation actually goes to", async () => {
    await openWithEvent();
    // The guardian for a minor, the member otherwise.
    expect(screen.getByText("Grace Hopper").closest("tr").textContent).toContain(
      "mum@x.com"
    );
    expect(screen.getByText("Ada Lovelace").closest("tr").textContent).toContain(
      "ada@x.com"
    );
  });
});
