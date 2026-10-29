import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RecoveryCodesPanel from "./RecoveryCodesPanel";

// FedRAMP A5: the codes are shown once, so the person has to say they kept
// them before moving on.
const CODES = ["aaaa-bbbb-cccc-dddd", "eeee-ffff-gggg-hhhh"];

describe("RecoveryCodesPanel", () => {
  it("shows every code", () => {
    render(<RecoveryCodesPanel codes={CODES} onDone={vi.fn()} doneLabel="Continue" />);
    CODES.forEach((code) => expect(screen.getByText(code)).toBeTruthy());
  });

  it("only lets the person go on once they confirm they saved the codes", () => {
    const onDone = vi.fn();
    render(<RecoveryCodesPanel codes={CODES} onDone={onDone} doneLabel="Continue" />);
    const done = screen.getByText("Continue").closest("button");
    expect(done.disabled).toBe(true);
    fireEvent.click(screen.getByLabelText(/i saved these codes/i));
    expect(done.disabled).toBe(false);
    fireEvent.click(done);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("offers to copy and to download them", () => {
    render(<RecoveryCodesPanel codes={CODES} onDone={vi.fn()} doneLabel="Continue" />);
    expect(screen.getByText("Copy codes")).toBeTruthy();
    expect(screen.getByText("Download")).toBeTruthy();
  });
});
