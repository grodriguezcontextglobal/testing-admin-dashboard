import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SerialNumberAndMoreInfoComponentForm from "./SerialNumberAndMoreInfoComponentForm";

/**
 * The wizard renders the Units step conditionally, so stepping to Review
 * unmounts this component and stepping back mounts a fresh one. It therefore
 * has to rebuild its unit list from what the parent still holds.
 *
 * Before it did, a fresh mount started from [] and the next commit() published
 * only the unit just added — three staged units plus one more created one item.
 */
const setup = (props = {}) => {
  const setScannedSerialNumbers = vi.fn();
  const setMoreInfo = vi.fn();
  render(
    <SerialNumberAndMoreInfoComponentForm
      style={{}}
      moreInfo={[]}
      scannedSerialNumbers={[]}
      setScannedSerialNumbers={setScannedSerialNumbers}
      setMoreInfo={setMoreInfo}
      {...props}
    />
  );
  return { setScannedSerialNumbers, setMoreInfo };
};

describe("SerialNumberAndMoreInfoComponentForm — remount after Review", () => {
  it("rebuilds the staged units from the parent on mount", () => {
    setup({ scannedSerialNumbers: ["SN-1", "SN-2", "SN-3"] });
    expect(screen.getByText("SN-1")).toBeInTheDocument();
    expect(screen.getByText("SN-2")).toBeInTheDocument();
    expect(screen.getByText("SN-3")).toBeInTheDocument();
  });

  it("carries each unit's identifiers back across the remount", () => {
    setup({
      scannedSerialNumbers: ["SN-1"],
      moreInfo: [{ "SN-1": [{ name: "IMEI", value: "356938" }] }],
    });
    expect(screen.getByText("SN-1")).toBeInTheDocument();
  });

  it("starts empty when the parent holds nothing", () => {
    setup();
    expect(screen.queryByText("SN-1")).not.toBeInTheDocument();
  });
});

/* P1 `17:28` — "This whole thing here is not good… I don't even understand what
   this means at all." The three ways of entering units, and what each is for,
   are pinned here because that is the whole of what was wrong with them. */
describe("the three ways of adding units", () => {
  it("names each option by what it does", () => {
    setup();

    expect(screen.getByRole("radio", { name: "Enter one at a time" })).toBeInTheDocument();
    /* Capitalised on his instruction — `19:13`, "put only in caps" — because it
       is the answer to "can the scanner carry extra identifiers?". */
    expect(
      screen.getByRole("radio", { name: "Use scanner to scan serial numbers ONLY" })
    ).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Paste a list" })).toBeInTheDocument();
  });

  it("says when to enter units one at a time, in one sentence", () => {
    setup();

    expect(document.body.textContent).toContain(
      "Use this when your units carry different details from each other"
    );
  });

  /* The old block sent the reader to "Scan labels", a control that has never
     existed under that name — the radio next to it said something else. */
  it("does not point at a control that is not there", () => {
    setup();

    expect(document.body.textContent).not.toMatch(/scan labels/i);
    expect(document.body.textContent).not.toMatch(
      /For serial numbers alone, in volume/i
    );
  });
});
