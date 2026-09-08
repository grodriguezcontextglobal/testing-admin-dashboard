import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MESSAGE_MAX_LENGTH } from "./utils/singleEmailUtils";

let customer = { name: "Ada", lastName: "Lovelace", email: "ada@x.com" };
let event = {
  company: "Acme Rentals",
  eventInfoDetail: { eventName: "Science Fair" },
};

vi.mock("react-redux", () => ({
  useSelector: (fn) => fn({ customer: { customer }, event: { event } }),
}));

const post = vi.fn(() => Promise.resolve({ data: { ok: true } }));
vi.mock("../../../api/devitrakApi", () => ({
  devitrakApi: { post: (...args) => post(...args) },
}));

const { default: SingleEmailNotification } = await import("./SingleEmail");

const setOpen = vi.fn();

const wrap = () =>
  render(
    <SingleEmailNotification
      customizedEmailNotificationModal
      setCustomizedEmailNotificationModal={setOpen}
    />
  );

const write = ({ subject = "Your devices", message = "Please collect them." } = {}) => {
  fireEvent.change(screen.getByLabelText("Subject *"), { target: { value: subject } });
  fireEvent.change(screen.getByLabelText("Message *"), { target: { value: message } });
};

beforeEach(() => {
  customer = { name: "Ada", lastName: "Lovelace", email: "ada@x.com" };
  event = { company: "Acme Rentals", eventInfoDetail: { eventName: "Science Fair" } };
  post.mockClear();
  post.mockImplementation(() => Promise.resolve({ data: { ok: true } }));
  setOpen.mockClear();
});

describe("SingleEmailNotification — layout", () => {
  it("labels both fields, so a filled form still says which box is which", () => {
    wrap();
    expect(screen.getByLabelText("Subject *")).toBeInTheDocument();
    expect(screen.getByLabelText("Message *")).toBeInTheDocument();
  });

  it("states who the email goes to and which event it mentions", () => {
    wrap();
    expect(screen.getByText(/Ada Lovelace, ada@x.com/)).toBeInTheDocument();
    expect(screen.getByText(/mentions Science Fair/)).toBeInTheDocument();
  });

  it("says there is no event rather than referencing one silently", () => {
    event = {};
    wrap();
    expect(screen.getByText(/No event is in context/)).toBeInTheDocument();
  });

  it("states the character budget instead of enforcing it silently", () => {
    wrap();
    expect(
      screen.getByText(`${MESSAGE_MAX_LENGTH} of ${MESSAGE_MAX_LENGTH} characters left.`)
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Message *"), {
      target: { value: "12345" },
    });
    expect(
      screen.getByText(`${MESSAGE_MAX_LENGTH - 5} of ${MESSAGE_MAX_LENGTH} characters left.`)
    ).toBeInTheDocument();
  });

  it("says the email cannot be recalled before it is sent", () => {
    wrap();
    expect(
      screen.getByText("The email is queued as soon as you send it, and cannot be recalled.")
    ).toBeInTheDocument();
  });

  it("offers a way out that is not the close cross", () => {
    wrap();
    fireEvent.click(screen.getByText("Cancel"));
    expect(setOpen).toHaveBeenCalledWith(false);
  });
});

describe("SingleEmailNotification — a consumer with no address", () => {
  it("says so instead of printing 'sent to undefined'", () => {
    customer = { name: "Ada", lastName: "Lovelace" };
    wrap();
    expect(
      screen.getByText(/no email address on record/)
    ).toBeInTheDocument();
  });

  it("does not let you write and send an email that has no recipient", async () => {
    customer = { name: "Ada", lastName: "Lovelace" };
    wrap();
    fireEvent.click(screen.getByText("Send email"));
    await waitFor(() => expect(post).not.toHaveBeenCalled());
  });
});

describe("SingleEmailNotification — validation", () => {
  it("names both empty fields and sends nothing", async () => {
    wrap();
    fireEvent.click(screen.getByText("Send email"));
    await waitFor(() =>
      expect(screen.getByText("The email needs a subject.")).toBeInTheDocument()
    );
    expect(screen.getByText("Write the message you want to send.")).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it("says nothing before the first send", () => {
    wrap();
    expect(screen.queryByText("The email needs a subject.")).not.toBeInTheDocument();
  });

  it("says how far over the limit a long message is", async () => {
    wrap();
    write({ message: "x".repeat(MESSAGE_MAX_LENGTH + 3) });
    fireEvent.click(screen.getByText("Send email"));
    await waitFor(() =>
      expect(
        screen.getByText(`3 characters over the ${MESSAGE_MAX_LENGTH}-character limit.`)
      ).toBeInTheDocument()
    );
    expect(post).not.toHaveBeenCalled();
  });
});

describe("SingleEmailNotification — sending", () => {
  it("sends the body the endpoint already accepts", async () => {
    wrap();
    write();
    fireEvent.click(screen.getByText("Send email"));

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith("/nodemailer/single-email-notification", {
        consumer: "ada@x.com",
        subject: "Your devices",
        message: "Please collect them.",
        eventSelected: "Science Fair",
        company: "Acme Rentals",
      })
    );
    await waitFor(() => expect(setOpen).toHaveBeenCalledWith(false));
  });

  it("sends once however many times Send is pressed", async () => {
    let release;
    post.mockImplementation(
      () => new Promise((resolve) => { release = () => resolve({ data: { ok: true } }); })
    );
    wrap();
    write();
    const button = screen.getByText("Send email");
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    release();
  });

  it("reports a refused send on the form instead of doing nothing", async () => {
    post.mockImplementation(() => Promise.resolve({ data: { ok: false } }));
    wrap();
    write();
    fireEvent.click(screen.getByText("Send email"));

    await waitFor(() =>
      expect(
        screen.getByText("The email was not queued. Nothing was sent — try again.")
      ).toBeInTheDocument()
    );
    expect(setOpen).not.toHaveBeenCalledWith(false);
  });

  it("reports a rejected request and leaves the message on screen", async () => {
    post.mockImplementation(() => Promise.reject(new Error("Network Error")));
    wrap();
    write();
    fireEvent.click(screen.getByText("Send email"));

    await waitFor(() => expect(screen.getByText("Network Error")).toBeInTheDocument());
    expect(screen.getByLabelText("Message *")).toHaveValue("Please collect them.");
    expect(setOpen).not.toHaveBeenCalledWith(false);
  });
});
