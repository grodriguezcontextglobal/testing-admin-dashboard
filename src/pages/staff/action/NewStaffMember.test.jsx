import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const post = vi.fn();
const patch = vi.fn();

vi.mock("../../../api/devitrakApi", () => ({
  devitrakApi: {
    post: (...args) => post(...args),
    patch: (...args) => patch(...args),
  },
}));

vi.mock("react-redux", () => ({
  useSelector: (fn) =>
    fn({
      admin: {
        user: {
          company: "Dev Co",
          companyData: { id: "co-1" },
          roleType: "root_admin",
          name: "Root",
          lastName: "Admin",
        },
      },
    }),
}));

const { NewStaffMember } = await import("./NewStaffMember");

const submitForm = () => {
  // happy-dom does not run implicit form submission when a submit button is
  // clicked, so the form is submitted directly.
  fireEvent.submit(document.querySelector("form.new-staff"));
};

const renderModal = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <NewStaffMember modalState setModalState={vi.fn()} />
    </QueryClientProvider>
  );
};

const company = (employees = []) => ({
  data: { company: [{ employees }] },
});

describe("NewStaffMember", () => {
  beforeEach(() => {
    post.mockReset();
    patch.mockReset();
  });

  it("opens on step 1 and does not offer to send anything yet", async () => {
    post.mockResolvedValue(company());
    renderModal();
    expect(await screen.findByText(/Step 1 of 2/)).toBeTruthy();
    expect(screen.getByText("Continue")).toBeTruthy();
    expect(screen.queryByText("Send invitation")).toBeNull();
  });

  it("refuses an email that is already on the staff list, without calling the lookup", async () => {
    post.mockImplementation((url) => {
      if (url === "/company/search-company") {
        return Promise.resolve(
          company([
            {
              user: "ada@devitrak.com",
              firstName: "Ada",
              lastName: "Lovelace",
              roleType: "event_manager",
              status: "Pending",
            },
          ])
        );
      }
      return Promise.resolve({ data: {} });
    });

    renderModal();
    await screen.findByText(/Step 1 of 2/);
    await waitFor(() =>
      expect(
        post.mock.calls.some((call) => call[0] === "/company/search-company")
      ).toBe(true)
    );

    fireEvent.change(screen.getByPlaceholderText("name@company.com"), {
      target: { value: "ADA@devitrak.com " },
    });
    expect(screen.getByText("Continue")).toBeTruthy();
    submitForm();

    expect(await screen.findByText(/already on your staff list/)).toBeTruthy();
    expect(
      post.mock.calls.some((call) => call[0] === "/staff/admin-users")
    ).toBe(false);
  });

  it("moves to step 2 naming the person it found, and only then offers to send", async () => {
    post.mockImplementation((url) => {
      if (url === "/company/search-company") return Promise.resolve(company());
      if (url === "/staff/admin-users") {
        return Promise.resolve({
          data: { adminUsers: [{ name: "Grace", lastName: "Hopper" }] },
        });
      }
      return Promise.resolve({ data: {} });
    });

    renderModal();
    await screen.findByText(/Step 1 of 2/);

    fireEvent.change(screen.getByPlaceholderText("name@company.com"), {
      target: { value: "grace@devitrak.com" },
    });
    expect(screen.getByText("Continue")).toBeTruthy();
    submitForm();

    expect(await screen.findByText(/Step 2 of 2/)).toBeTruthy();
    expect(screen.getByText("Grace Hopper")).toBeTruthy();
    expect(screen.getByText("Existing account")).toBeTruthy();
    expect(screen.getByText("Send invitation")).toBeTruthy();
    // The lookup must not have written anything.
    expect(patch).not.toHaveBeenCalled();
  });

  it("asks for name and phone when the email is new to the platform", async () => {
    post.mockImplementation((url) => {
      if (url === "/company/search-company") return Promise.resolve(company());
      if (url === "/staff/admin-users") {
        return Promise.resolve({ data: { adminUsers: [] } });
      }
      return Promise.resolve({ data: {} });
    });

    renderModal();
    await screen.findByText(/Step 1 of 2/);

    fireEvent.change(screen.getByPlaceholderText("name@company.com"), {
      target: { value: "new@devitrak.com" },
    });
    expect(screen.getByText("Continue")).toBeTruthy();
    submitForm();

    expect(await screen.findByText("New account")).toBeTruthy();
    expect(screen.getByPlaceholderText("Enter phone number")).toBeTruthy();
  });
});
