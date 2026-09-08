import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import BlueButtonConfirmationComponent from "./BlueButtonConfirmation";
import DangerButtonConfirmationComponent from "./DangerButtonConfirmation";
import GrayButtonConfirmationComponent from "./GrayButtonConfirmation";
import LightBlueButtonConfirmationComponent from "./LightBlueButtonConfirmation";

/*
 * `toBeVisible()` is no use here: antd parks a popover at `left: -1000vw`
 * until it has measured a layout, and happy-dom has none. These assert on the
 * popup's presence and content instead.
 */
const popup = () => document.querySelector(".ant-popconfirm");
const popupTitle = () =>
  document.querySelector(".ant-popconfirm-title")?.textContent ?? "";
const popupButtons = () =>
  [...document.querySelectorAll(".ant-popconfirm-buttons button")].map(
    (button) => button.textContent
  );

const settle = () => new Promise((resolve) => setTimeout(resolve, 60));

const VARIANTS = [
  ["BlueButtonConfirmation", BlueButtonConfirmationComponent],
  ["DangerButtonConfirmation", DangerButtonConfirmationComponent],
  ["GrayButtonConfirmation", GrayButtonConfirmationComponent],
  ["LightBlueButtonConfirmation", LightBlueButtonConfirmationComponent],
];

let consoleError;

beforeEach(() => {
  consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  consoleError.mockRestore();
  document.body.innerHTML = "";
});

describe.each(VARIANTS)("%s", (name, Component) => {
  it("opens a confirmation with both a way forward and a way out", async () => {
    render(
      <Component
        title="Delete"
        func={vi.fn()}
        confirmationTitle="Delete this group?"
        confirmationDescription="This cannot be undone."
      />
    );

    fireEvent.click(screen.getByText("Delete"));

    await waitFor(() => expect(popup()).toBeTruthy());
    expect(popupTitle()).toBe("Delete this group?");
    expect(popupButtons()).toEqual(["Cancel", "Confirm"]);
  });

  it("stays open — it used to appear and vanish before anything could be pressed", async () => {
    render(<Component title="Delete" func={vi.fn()} confirmationTitle="Sure?" />);

    fireEvent.click(screen.getByText("Delete"));
    await waitFor(() => expect(popup()).toBeTruthy());
    await settle();

    expect(popup()).toBeTruthy();
    expect(popup().classList.contains("ant-popover-hidden")).toBe(false);
    expect(popupTitle()).toBe("Sure?");
  });

  it("anchors to a real element, so the popup has something to position against", async () => {
    // DangerButtonConfirmation had no wrapper element: antd cannot attach a ref
    // to a plain function component, so it was left with no anchor — which is
    // what makes a popup mis-place itself and close on the click that opened
    // it. Asserted on the DOM rather than on React's ref warning, which is
    // logged once per component type and so cannot be relied on per test.
    render(<Component title="Delete" func={vi.fn()} />);
    fireEvent.click(screen.getByText("Delete"));
    await waitFor(() => expect(popup()).toBeTruthy());

    const anchor = document.querySelector("[aria-describedby].ant-popover-open");
    expect(anchor).toBeTruthy();
    expect(anchor.tagName).toBe("SPAN");
    expect(anchor.contains(screen.getByText("Delete"))).toBe(true);
  });

  it("does not act on the click that opens the confirmation", async () => {
    const func = vi.fn();
    render(<Component title="Delete" func={func} />);

    fireEvent.click(screen.getByText("Delete"));
    await settle();

    expect(func).not.toHaveBeenCalled();
  });

  it("acts once Confirm is pressed", async () => {
    const func = vi.fn();
    render(<Component title="Delete" func={func} />);

    fireEvent.click(screen.getByText("Delete"));
    await waitFor(() => expect(popupButtons()).toContain("Confirm"));
    fireEvent.click(screen.getByText("Confirm"));

    await waitFor(() => expect(func).toHaveBeenCalledTimes(1));
  });

  it("does not act when Cancel is pressed", async () => {
    const func = vi.fn();
    render(<Component title="Delete" func={func} />);

    fireEvent.click(screen.getByText("Delete"));
    await waitFor(() => expect(popupButtons()).toContain("Cancel"));
    fireEvent.click(screen.getByText("Cancel"));
    await settle();

    expect(func).not.toHaveBeenCalled();
  });

  it("never submits the form it sits in", async () => {
    // The reported symptom's cause: `buttonType="submit"` reached the trigger,
    // so the click both opened the confirmation and submitted the form, and the
    // re-render tore the popup down again.
    const onSubmit = vi.fn((domEvent) => domEvent.preventDefault());
    render(
      <form id="delete-form" onSubmit={onSubmit}>
        <Component
          title="Delete"
          func={vi.fn()}
          buttonType="submit"
          form="delete-form"
          confirmationTitle="Sure?"
        />
      </form>
    );

    fireEvent.click(screen.getByText("Delete"));
    await waitFor(() => expect(popup()).toBeTruthy());
    await settle();

    expect(onSubmit).not.toHaveBeenCalled();
    expect(popup()).toBeTruthy();
    expect(popupTitle()).toBe("Sure?");
  });

  it("keeps the trigger a plain button, whatever the caller asked for", async () => {
    render(
      <Component title="Delete" func={vi.fn()} buttonType="submit" form="delete-form" />
    );
    const trigger = screen.getByText("Delete").closest("button");
    expect(trigger.getAttribute("type")).toBe("button");
    expect(trigger.getAttribute("form")).toBeNull();
  });

  it("opens no confirmation when it is disabled", async () => {
    const func = vi.fn();
    render(<Component title="Delete" func={func} isDisabled />);

    fireEvent.click(screen.getByText("Delete"));
    await settle();

    expect(popup()).toBeNull();
    expect(func).not.toHaveBeenCalled();
    expect(screen.getByText("Delete").closest("button").disabled).toBe(true);
  });

  it("opens no confirmation while it is already working", async () => {
    const func = vi.fn();
    render(<Component title="Delete" func={func} isLoading />);

    fireEvent.click(screen.getByText("Delete"));
    await settle();

    expect(popup()).toBeNull();
    expect(func).not.toHaveBeenCalled();
  });

  it("still submits when it has no action of its own to confirm", () => {
    // `<BlueButtonConfirmationComponent title="Search" buttonType="submit" />`
    // with no `func` is a plain submit button and has to stay one.
    render(<Component title="Search" buttonType="submit" />);
    expect(screen.getByText("Search").closest("button").getAttribute("type")).toBe(
      "submit"
    );
  });

  it("is uncontrolled unless a caller actually controls it", async () => {
    // `open` used to be forwarded even as undefined; a stray `open` that never
    // changes puts Popconfirm in controlled mode and pins it shut.
    render(<Component title="Delete" func={vi.fn()} open={undefined} />);
    fireEvent.click(screen.getByText("Delete"));
    await waitFor(() => expect(popup()).toBeTruthy());
  });

  it("obeys a caller that does control it", async () => {
    const onOpenChange = vi.fn();
    render(
      <Component title="Delete" func={vi.fn()} open={false} onOpenChange={onOpenChange} />
    );
    fireEvent.click(screen.getByText("Delete"));
    await settle();

    expect(popup()).toBeNull();
    expect(onOpenChange).toHaveBeenCalled();
  });
});

describe("DangerButtonConfirmation", () => {
  it("makes the confirming button destructive too", async () => {
    render(<DangerButtonConfirmationComponent title="Delete" func={vi.fn()} />);
    fireEvent.click(screen.getByText("Delete"));

    await waitFor(() => expect(popup()).toBeTruthy());
    const confirm = screen.getByText("Confirm").closest("button");
    expect(confirm.className).toMatch(/ant-btn-dangerous|ant-btn-color-dangerous/);
  });

  it("lets a caller override that", async () => {
    render(
      <DangerButtonConfirmationComponent
        title="Delete"
        func={vi.fn()}
        okButtonProps={{ danger: false }}
      />
    );
    fireEvent.click(screen.getByText("Delete"));

    await waitFor(() => expect(popup()).toBeTruthy());
    const confirm = screen.getByText("Confirm").closest("button");
    expect(confirm.className).not.toMatch(/ant-btn-dangerous/);
  });
});
