import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const post = vi.fn();
const patch = vi.fn();
vi.mock("../../api/devitrakApi", () => ({
  devitrakApi: {
    post: (...args) => post(...args),
    patch: (...args) => patch(...args),
  },
}));

const { default: AttendanceConfirmationLanding } = await import(
  "./AttendanceConfirmationLanding"
);

const PARAMS = {
  memberEmail: "ada@school.org",
  memberFirstName: "Ada",
  memberLastName: "Lovelace",
  eventId: "evt-1",
  eventName: "Science Fair",
  company: "Summit Unified",
  companyId: "co-1",
};

/** The page reads the query string straight off `window.location`. */
const withParams = (overrides = {}) => {
  const search = new URLSearchParams({ ...PARAMS, ...overrides }).toString();
  Object.defineProperty(window, "location", {
    writable: true,
    value: { ...window.location, search: `?${search}` },
  });
};

const noConsumer = { data: { ok: true, users: [] } };

beforeEach(() => {
  post.mockReset();
  patch.mockReset();
  withParams();
});

describe("AttendanceConfirmationLanding", () => {
  it("says who is asking, which the page never showed", () => {
    // `company` was parsed off the URL and rendered nowhere.
    render(<AttendanceConfirmationLanding />);
    expect(screen.getByText("Summit Unified")).toBeInTheDocument();
    expect(screen.getByText("Science Fair")).toBeInTheDocument();
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
  });

  it("tells a guardian that they are the one confirming", () => {
    // Which is what the write has always done, and what the page never said.
    withParams({ minor: "true", guardianEmail: "mum@x.com" });
    render(<AttendanceConfirmationLanding />);
    expect(screen.getByText("Confirm your child's attendance")).toBeInTheDocument();
    expect(
      screen.getByText(
        "You are confirming as Ada Lovelace's parent or guardian (mum@x.com)."
      )
    ).toBeInTheDocument();
  });

  it("says nothing about a guardian for an adult attendee", () => {
    render(<AttendanceConfirmationLanding />);
    expect(screen.getByText("Confirm your attendance")).toBeInTheDocument();
    expect(screen.queryByText(/parent or guardian/)).not.toBeInTheDocument();
  });

  it("refuses a link that is missing what it needs, and says nothing was recorded", () => {
    withParams({ eventId: "", eventName: "" });
    render(<AttendanceConfirmationLanding />);
    expect(screen.getByText("This link is not usable")).toBeInTheDocument();
    expect(screen.getByText(/nothing has been\s+recorded/)).toBeInTheDocument();
  });

  it("creates the consumer and confirms", async () => {
    post.mockImplementation((url) => {
      if (url === "/auth/user-query") return Promise.resolve(noConsumer);
      if (url === "/auth/new") return Promise.resolve({ data: { id: "usr-1" } });
      return Promise.resolve({ data: { ok: true } });
    });

    render(<AttendanceConfirmationLanding />);
    fireEvent.click(screen.getByText("Confirm attendance"));

    await waitFor(() =>
      expect(screen.getByText("Ada Lovelace is going to Science Fair")).toBeInTheDocument()
    );
    expect(
      post.mock.calls.some(([url]) => url === "/db_consumer/new_consumer")
    ).toBe(true);
  });

  it("does not report a confirmation when /auth/new refused it", async () => {
    /* The endpoint answers 200 with `{ ok: false }`. The response was
       discarded, so the flow created the SQL consumer anyway and showed
       "Attendance confirmed" for a person who had not been created. */
    post.mockImplementation((url) => {
      if (url === "/auth/user-query") return Promise.resolve(noConsumer);
      if (url === "/auth/new") {
        return Promise.resolve({ data: { ok: false, msg: "Email already in use." } });
      }
      return Promise.resolve({ data: { ok: true } });
    });

    render(<AttendanceConfirmationLanding />);
    fireEvent.click(screen.getByText("Confirm attendance"));

    await waitFor(() =>
      expect(screen.getByText("Email already in use.")).toBeInTheDocument()
    );
    expect(screen.queryByText(/is going to/)).not.toBeInTheDocument();
    expect(
      post.mock.calls.some(([url]) => url === "/db_consumer/new_consumer")
    ).toBe(false);
    expect(screen.getByText("Try again")).toBeInTheDocument();
  });

  it("recognises somebody already on the event, whatever type the id is", async () => {
    // The id from the URL is a string; the record's may be a number, and `===`
    // said "not confirmed" for somebody who was.
    post.mockImplementation((url) => {
      if (url === "/auth/user-query") {
        return Promise.resolve({
          data: { ok: true, users: [{ id: "usr-1", event_providers: ["evt-1"] }] },
        });
      }
      return Promise.resolve({ data: { ok: true } });
    });

    render(<AttendanceConfirmationLanding />);
    fireEvent.click(screen.getByText("Confirm attendance"));

    await waitFor(() =>
      expect(
        screen.getByText("Ada Lovelace is already going to Science Fair")
      ).toBeInTheDocument()
    );
    expect(patch).not.toHaveBeenCalled();
  });

  it("adds the event to a consumer who exists but is not on it", async () => {
    post.mockImplementation((url) => {
      if (url === "/auth/user-query") {
        return Promise.resolve({
          data: { ok: true, users: [{ id: "usr-1", event_providers: ["evt-other"] }] },
        });
      }
      return Promise.resolve({ data: { ok: true } });
    });
    patch.mockResolvedValue({ data: { ok: true } });

    render(<AttendanceConfirmationLanding />);
    fireEvent.click(screen.getByText("Confirm attendance"));

    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    expect(patch.mock.calls[0][0]).toBe("/auth/usr-1");
    await waitFor(() =>
      expect(screen.getByText("Ada Lovelace is going to Science Fair")).toBeInTheDocument()
    );
  });

  it("reports a rejected request and offers another go", async () => {
    post.mockImplementation(() => Promise.reject(new Error("Network Error")));

    render(<AttendanceConfirmationLanding />);
    fireEvent.click(screen.getByText("Confirm attendance"));

    await waitFor(() => expect(screen.getByText("Network Error")).toBeInTheDocument());
    expect(screen.getByText("Try again")).toBeInTheDocument();
  });

  it("says this page cannot decline, rather than leaving it unsaid", () => {
    render(<AttendanceConfirmationLanding />);
    expect(screen.getByText(/To\s+decline, reply to the invitation email/)).toBeInTheDocument();
  });
});
