import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let roleType = "admin";

vi.mock("react-redux", () => ({
  useSelector: (fn) =>
    fn({
      admin: {
        user: {
          roleType,
          sqlInfo: { company_id: 7 },
          companyData: { id: "co-1", industry: "Education" },
        },
      },
    }),
}));

const navigate = vi.fn();
vi.mock("react-router-dom", () => ({ useNavigate: () => navigate }));

const post = vi.fn(() => Promise.resolve({ data: { ok: true } }));
vi.mock("../../../../api/devitrakApi", () => ({
  devitrakApi: { post: (...args) => post(...args) },
}));

const activitySpy = vi.fn();
vi.mock("../../../../api/activityLog", () => ({
  registerStaffActivity: (...args) => activitySpy(...args),
}));

let consentResponse = null;
vi.mock("../../utils/guardianConsentApi", () => ({
  fetchStudentConsent: () => Promise.resolve(consentResponse),
}));

let schoolSettings = { enforce: false, enforce_under_13_consent: false };
vi.mock("../../../Profile/school_compliance/utils/schoolComplianceUtils", () => ({
  fetchSchoolSettings: () => Promise.resolve({ ok: true, settings: schoolSettings }),
}));

const { default: MemberProfileIdentity } = await import("./Header");

const student = {
  member_id: 41,
  first_name: "Ada",
  last_name: "Lovelace",
  email: "ada@school.edu",
  grade: "7",
  minor: 1,
  // 11 years old, so both age scopes cover her.
  date_of_birth: "2015-01-01",
};

const wrap = ({ deviceSummary = { out: 0, overdue: 0 }, member = student } = {}) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemberProfileIdentity
        detailMemberInfo={member}
        deviceSummary={deviceSummary}
      />
    </QueryClientProvider>
  );
};

const deleteCalls = () =>
  post.mock.calls.filter(([url]) => url === "/db_member/delete-member-info");

beforeEach(() => {
  roleType = "admin";
  consentResponse = null;
  schoolSettings = { enforce: false, enforce_under_13_consent: false };
  post.mockClear();
  post.mockImplementation(() => Promise.resolve({ data: { ok: true } }));
  activitySpy.mockClear();
  navigate.mockClear();
});

describe("the member page's delete action", () => {
  it("is offered to a role that may delete members", () => {
    wrap();
    expect(screen.getByText("Delete member")).toBeInTheDocument();
  });

  it("is not offered to a role that may not", () => {
    // member:delete is EVENT_D — root_admin, admin, event_manager.
    roleType = "assistant";
    wrap();
    expect(screen.queryByText("Delete member")).not.toBeInTheDocument();
  });

  it("asks before it acts, naming the member", async () => {
    wrap();
    fireEvent.click(screen.getByText("Delete member"));

    await waitFor(() =>
      expect(document.querySelector(".ant-popconfirm")).toBeTruthy()
    );
    expect(screen.getByText("Delete Ada Lovelace?")).toBeInTheDocument();
    expect(screen.getByText(/cannot be undone/)).toBeInTheDocument();
    expect(deleteCalls()).toHaveLength(0);
  });

  it("deletes on confirmation, with the body the endpoint takes", async () => {
    wrap();
    fireEvent.click(screen.getByText("Delete member"));
    fireEvent.click(await screen.findByText("Delete"));

    await waitFor(() => expect(deleteCalls()).toHaveLength(1));
    expect(deleteCalls()[0][1]).toEqual({ member_ids: [41], company_id: 7 });
  });

  it("records who was removed, since the record itself is going", async () => {
    wrap();
    fireEvent.click(screen.getByText("Delete member"));
    fireEvent.click(await screen.findByText("Delete"));

    await waitFor(() => expect(activitySpy).toHaveBeenCalledTimes(1));
    expect(activitySpy.mock.calls[0][0]).toMatchObject({
      action: "DELETE",
      target_model: "Member",
      target_id: 41,
    });
    expect(activitySpy.mock.calls[0][0].details.name).toBe("Ada Lovelace");
  });

  it("goes back to the list, since the page it was on no longer has a member", async () => {
    wrap();
    fireEvent.click(screen.getByText("Delete member"));
    fireEvent.click(await screen.findByText("Delete"));

    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/members"));
  });

  it("will not delete a member who is still holding devices", async () => {
    // Deleting them leaves the assignment pointing at nobody.
    wrap({ deviceSummary: { out: 2, overdue: 1 } });

    const button = screen.getByText("Delete member").closest("button");
    expect(button.disabled).toBe(true);
    fireEvent.click(button);
    await waitFor(() => expect(deleteCalls()).toHaveLength(0));
  });

  it("says why, on the page rather than only in a tooltip", () => {
    wrap({ deviceSummary: { out: 2, overdue: 1 } });
    expect(
      screen.getByText(
        "2 devices still assigned, 1 overdue. Check them in before removing the record."
      )
    ).toBeInTheDocument();
  });

  it("waits rather than offering to delete while the device count is unknown", () => {
    // `null`, not `undefined` — the destructuring default would swallow that.
    wrap({ deviceSummary: null });
    expect(screen.getByText("Delete member").closest("button").disabled).toBe(true);
  });

  it("reports a refused delete and stays on the page", async () => {
    post.mockImplementation((url) => {
      if (url === "/db_member/delete-member-info") {
        return Promise.resolve({ data: { ok: false, msg: "Member has open fees." } });
      }
      return Promise.resolve({ data: { ok: true } });
    });
    wrap();
    fireEvent.click(screen.getByText("Delete member"));
    fireEvent.click(await screen.findByText("Delete"));

    await waitFor(() =>
      expect(screen.getByText("Member has open fees.")).toBeInTheDocument()
    );
    expect(navigate).not.toHaveBeenCalledWith("/members");
    expect(activitySpy).not.toHaveBeenCalled();
  });

  it("reports a rejected request too", async () => {
    post.mockImplementation((url) => {
      if (url === "/db_member/delete-member-info") {
        return Promise.reject(new Error("Network Error"));
      }
      return Promise.resolve({ data: { ok: true } });
    });
    wrap();
    fireEvent.click(screen.getByText("Delete member"));
    fireEvent.click(await screen.findByText("Delete"));

    await waitFor(() => expect(screen.getByText("Network Error")).toBeInTheDocument());
    expect(navigate).not.toHaveBeenCalledWith("/members");
  });
});

describe("the consent pill on the member page", () => {
  it("shows nothing when the company does not require consent and none is on record", async () => {
    /* Reported: a company that is not asking for consent still got "Consent not
       requested" in warning yellow — a compliance failure to chase for
       something nobody was supposed to have done. */
    schoolSettings = { enforce: false, enforce_under_13_consent: false };
    wrap();

    await waitFor(() => expect(screen.getByText("Ada Lovelace")).toBeInTheDocument());
    expect(screen.queryByText("Consent not requested")).not.toBeInTheDocument();
    expect(screen.queryByText(/Device AUP/)).not.toBeInTheDocument();
  });

  it("warns when the company DOES require consent and none was requested", async () => {
    schoolSettings = { enforce: true };
    // A record exists saying nothing has been asked. (A response of `null`
    // shows no chip at all — pre-existing, and not what this change is about.)
    consentResponse = { status: "missing" };
    wrap();

    await waitFor(() =>
      expect(screen.getByText("Consent not requested")).toBeInTheDocument()
    );
  });

  it("covers an under-13 through the COPPA toggle, read under the key the server sends", async () => {
    // `/school/settings` returns `enforce_under_13_consent`; the helper only
    // knew the write key `enforce_under_13`, so this was silently off.
    schoolSettings = { enforce: false, enforce_under_13_consent: true };
    consentResponse = { status: "missing" };
    wrap();

    await waitFor(() =>
      expect(screen.getByText("Consent not requested")).toBeInTheDocument()
    );
  });

  it("still shows a refusal when consent is not required, without the alarm", async () => {
    // A guardian actually refused. Hiding that would hide real data.
    schoolSettings = { enforce: false, enforce_under_13_consent: false };
    consentResponse = { status: "refused" };
    wrap();

    await waitFor(() => expect(screen.getByText("Consent refused")).toBeInTheDocument());
    expect(screen.getByText(/not currently requiring consent/)).toBeInTheDocument();
  });
});
