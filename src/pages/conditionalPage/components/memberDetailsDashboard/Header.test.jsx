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

vi.mock("../../utils/guardianConsentApi", () => ({
  fetchStudentConsent: () => Promise.resolve(null),
}));

const { default: MemberProfileIdentity } = await import("./Header");

const student = {
  member_id: 41,
  first_name: "Ada",
  last_name: "Lovelace",
  email: "ada@school.edu",
  grade: "7",
  minor: 1,
};

const wrap = ({ deviceSummary = { out: 0, overdue: 0 }, member = student } = {}) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemberProfileIdentity
        detailMemberInfo={member}
        deviceSummary={deviceSummary}
        setAddingNewMember={vi.fn()}
      />
    </QueryClientProvider>
  );
};

const deleteCalls = () =>
  post.mock.calls.filter(([url]) => url === "/db_member/delete-member-info");

beforeEach(() => {
  roleType = "admin";
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
