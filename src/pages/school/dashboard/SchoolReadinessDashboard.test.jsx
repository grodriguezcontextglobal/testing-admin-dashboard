import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const admin = {
  roleType: "admin",
  companyData: { id: "co-1", industry: "Education" },
  sqlInfo: { company_id: 7 },
};

vi.mock("react-redux", () => ({
  useDispatch: () => vi.fn(),
  useSelector: (fn) => fn({ admin: { user: admin } }),
}));

vi.mock("../compliance/loadDemoData", () => ({ loadDemoData: vi.fn() }));

// Ada and Zoe are under 13; Grace and Alan are minors but over 13.
const members = [
  { member_id: 11, first_name: "Ada", last_name: "Lovelace", date_of_birth: "2016-01-01" },
  { member_id: 12, first_name: "Zoe", last_name: "Byron", date_of_birth: "2016-06-01" },
  { member_id: 13, first_name: "Grace", last_name: "Hopper", date_of_birth: "2011-01-01" },
  { member_id: 14, first_name: "Alan", last_name: "Turing", date_of_birth: "2010-01-01" },
];

// The per-student summary (/school/consent/status): only Zoe is covered.
let registerFails = false;
let settings = {
  enforce_member_consent: true,
  enforce_under_13_consent: true,
  required_consent_policy_version: "3",
};
const DEFAULT_SETTINGS = { ...settings };
let statuses = { 11: "pending", 12: "agreed", 13: "missing", 14: "pending" };

// The register (/school/consent/list). `agreed` is 40 RECORDS across the
// company -- more than the school has students, because a student holds one
// row per policy version and per resend.
let register = {
  agreed: {
    ok: true,
    total: 40,
    // 40 agreed ROWS, of which exactly one belongs to a minor on the roster:
    // Zoe, twice, because she signed v2 and then v3. The rest belong to people
    // who are not minors on this roster.
    consents: [
      { id: 90, member_id: 12, status: "agreed", expired: false, policy_version: "3", consented_at: "2026-08-02T10:00:00Z" },
      { id: 91, member_id: 12, status: "agreed", expired: false, policy_version: "2", consented_at: "2025-08-02T10:00:00Z" },
      ...Array.from({ length: 38 }, (_, i) => ({
        id: 200 + i,
        member_id: 500 + i,
        status: "agreed",
        expired: false,
        policy_version: "3",
        consented_at: "2026-08-03T10:00:00Z",
      })),
    ],
  },
  pending: {
    ok: true,
    total: 2,
    consents: [
      {
        id: 1,
        member_id: 11,
        status: "pending",
        expired: false,
        requested_at: "2026-03-04T10:00:00Z",
        signer_email: "mum@x.com",
        policy_version: "3",
      },
      {
        id: 2,
        member_id: 14,
        status: "pending",
        expired: false,
        requested_at: "2026-07-01T10:00:00Z",
        signer_name: "Sara Turing",
        policy_version: "3",
      },
    ],
  },
  expired: { ok: true, total: 0, consents: [] },
  refused: { ok: true, total: 2, consents: [] },
};

// Everything is mocked at the transport, so the real payload builders run and
// the assertions below see the bodies the server would actually receive.
const post = vi.fn((url, body) => {
  switch (url) {
    case "/db_member/consulting-member":
      return Promise.resolve({ data: { members } });
    case "/db_member/retrieve-members-assigned-devices":
      return Promise.resolve({ data: { rows: [] } });
    case "/db_member/overdue-leases":
      return Promise.resolve({ data: { count: 0 } });
    case "/school/settings":
      return Promise.resolve({ data: { ok: true, settings } });
    case "/school/consent/status":
      return Promise.resolve({ data: { ok: true, statuses } });
    case "/school/consent/list":
      if (registerFails) return Promise.reject(new Error("register down"));
      return Promise.resolve({
        data: register[body.status] ?? { ok: true, total: 0, consents: [] },
      });
    default:
      return Promise.resolve({ data: {} });
  }
});

vi.mock("../../../api/devitrakApi", () => ({
  devitrakApi: { post: (...args) => post(...args) },
}));

const { default: SchoolReadinessDashboard } = await import("./SchoolReadinessDashboard");

const wrap = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <SchoolReadinessDashboard />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

const DEFAULT_STATUSES = { ...statuses };
const DEFAULT_REGISTER = JSON.parse(JSON.stringify(register));

beforeEach(() => {
  post.mockClear();
  registerFails = false;
  settings = { ...DEFAULT_SETTINGS };
  statuses = { ...DEFAULT_STATUSES };
  register = JSON.parse(JSON.stringify(DEFAULT_REGISTER));
});

/** The attention rows, read off the list's own markup. */
const rowNames = () =>
  [...document.querySelectorAll(".consent-attention__name")].map((node) =>
    node.textContent.trim()
  );

const findRow = async (name) => {
  await waitFor(() => expect(rowNames()).toContain(name));
  return [...document.querySelectorAll(".consent-attention__row")]
    .find((row) => row.textContent.includes(name))
    .textContent;
};

const consentListCalls = () =>
  post.mock.calls.filter(([url]) => url === "/school/consent/list").map(([, body]) => body);

describe("SchoolReadinessDashboard, on the consent register", () => {
  it("counts minors who agreed from the per-student summary, not from register rows", async () => {
    // The register holds 40 agreed ROWS -- one per policy version and per
    // resend -- so using its total here would report more consenting students
    // than the school has.
    wrap();
    expect(await screen.findByText("Minors who agreed")).toBeTruthy();
    await waitFor(() => expect(screen.getByText("1/4")).toBeTruthy());
    expect(screen.queryByText("40/4")).toBeNull();
    expect(screen.getByText("25% of minors requiring consent")).toBeTruthy();
  });

  it("shows the register's four states in the Needs attention header", async () => {
    wrap();
    expect(await screen.findByText("Consent records on file")).toBeTruthy();
    expect(await screen.findByText("40 agreed")).toBeTruthy();
    expect(screen.getByText("2 awaiting")).toBeTruthy();
    expect(screen.getByText("2 refused")).toBeTruthy();
    expect(screen.getByText("0 expired")).toBeTruthy();
    // Under the 200-per-state detail cap, so no truncation note.
    expect(screen.queryByText(/detail shown for the first/)).toBeNull();
    // agreed + pending + expired + refused, no row counted twice.
    expect(screen.getByText(/44 total/)).toBeTruthy();
  });

  it("asks the server for each state separately, with a whitelisted status", async () => {
    wrap();
    await screen.findByText("Consent records on file");

    const bodies = consentListCalls();
    expect(bodies.map((body) => body.status).sort()).toEqual([
      "agreed",
      "expired",
      "pending",
      "refused",
    ]);
    // Every body is exactly what the endpoint declares, nothing more.
    bodies.forEach((body) => {
      expect(Object.keys(body).sort()).toEqual([
        "company_id",
        "page",
        "page_size",
        "status",
      ]);
      expect(body.company_id).toBe(7);
      expect(body.page_size).toBeLessThanOrEqual(200);
    });
  });

  it("puts the register's detail on the row instead of a generic status line", async () => {
    wrap();
    const row = await findRow("Ada Lovelace");
    expect(row).toContain("asked mum@x.com");
    expect(row).toContain("requested");
    expect(row).toContain("policy v3");
  });

  it("falls back to the generic copy for a student nobody has asked yet", async () => {
    // "missing" cannot come from the register: there is no row to return.
    wrap();
    expect(await findRow("Grace Hopper")).toContain(
      "Consent has not been requested yet."
    );
  });

  it("lists under-13 first, then the more stuck consent", async () => {
    const { container } = wrap();
    await waitFor(() => expect(rowNames().length).toBe(3));

    // Ada is under 13; then Grace (never asked) ahead of Alan (asked, waiting).
    expect(rowNames()).toEqual(["Ada Lovelace", "Grace Hopper", "Alan Turing"]);
    // Zoe has agreed, so she is not on the list at all.
    expect(container.textContent).not.toContain("Zoe");
  });
});

describe("SchoolReadinessDashboard, when the per-student summary comes back empty", () => {
  // The reported bug: the register plainly held 2 agreed and 1 expired, and
  // the dashboard showed "0/20", "100% coverage" and "No outstanding consent
  // actions 🎉" -- three claims derived from an empty /school/consent/status.
  beforeEach(() => {
    statuses = {};
    register = {
      agreed: {
        ok: true,
        total: 2,
        consents: [
          { id: 1, member_id: 11, status: "agreed", expired: false, policy_version: "3", consented_at: "2026-08-01T10:00:00Z" },
          { id: 2, member_id: 12, status: "agreed", expired: false, policy_version: "3", consented_at: "2026-08-02T10:00:00Z" },
        ],
      },
      pending: { ok: true, total: 0, consents: [] },
      expired: {
        ok: true,
        total: 1,
        consents: [
          { id: 3, member_id: 13, status: "pending", expired: true, policy_version: "3", requested_at: "2026-06-01T10:00:00Z", otc_expires_at: "2026-06-08T10:00:00Z" },
        ],
      },
      refused: { ok: true, total: 0, consents: [] },
    };
  });

  it("counts the agreed students off the register instead of reporting zero", async () => {
    wrap();
    await screen.findByText("Minors who agreed");
    // Two of the four minors agreed. It used to say 0/4.
    await waitFor(() => expect(screen.getByText("2/4")).toBeTruthy());
    expect(screen.queryByText("0/4")).toBeNull();
  });

  it("never claims full coverage from an empty summary", async () => {
    wrap();
    await screen.findByText("Consent records on file");
    await waitFor(() => expect(screen.getByText(/50% of minors/)).toBeTruthy());
    expect(screen.queryByText(/100% of minors/)).toBeNull();
  });

  it("shows the expired link the header is counting", async () => {
    wrap();
    // The one thing the user could see in the counts and nowhere in the list.
    await waitFor(() => expect(screen.getByText("1 expired")).toBeTruthy());
    await waitFor(() =>
      expect(document.body.textContent).toContain("Consent link expired")
    );
    expect(document.body.textContent).not.toContain("No outstanding consent actions");
  });

  it("treats a minor with no register row as never asked, not as compliant", async () => {
    wrap();
    await screen.findByText("Consent records on file");
    // Alan (14) holds no row at all once the whole register is in hand.
    await waitFor(() =>
      expect(document.body.textContent).toContain("Consent not requested")
    );
  });
});

describe("SchoolReadinessDashboard, when the register cannot be read", () => {
  beforeEach(() => {
    statuses = {};
    registerFails = true;
  });

  it("says so instead of celebrating an empty list", async () => {
    wrap();
    await screen.findByText("Minors who agreed");
    await waitFor(() =>
      expect(document.body.textContent).toContain(
        "The consent records could not be read"
      )
    );
    expect(document.body.textContent).not.toContain("🎉");
    // Both the tile and the list header say it -- neither may look confident.
    expect(screen.getAllByText("consent records could not be read")).toHaveLength(2);
    expect(screen.getByText("—")).toBeTruthy();
  });
});

describe("SchoolReadinessDashboard, on the enforcement setting", () => {
  it("explains what enforcement is doing and links to the setting", async () => {
    wrap();
    expect(await screen.findByText(/Consent enforcement is on · policy v3/)).toBeTruthy();
    expect(
      document.querySelector('a[href="/profile/school-compliance"]')
    ).toBeTruthy();
  });

  it("explains how to switch it on when it is off", async () => {
    settings = { enforce_member_consent: false, enforce_under_13_consent: false };
    wrap();
    expect(await screen.findByText("Consent enforcement is off")).toBeTruthy();
    expect(screen.getByText("Turn it on in School compliance →")).toBeTruthy();
    // The old grey pill said only this much, and nothing else.
    expect(screen.queryByText("Consent enforcement off")).toBeNull();
  });
});
