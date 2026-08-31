import { Grid } from "@mui/material";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import MFA from "./MFA";

/* The step is rendered by Login.jsx, which hands it react-hook-form's helpers
   and MUI's Grid as props. The harness stands in for that caller. */
const renderMFA = (overrides = {}) =>
  render(
    <MFA
      handleSubmit={(fn) => fn}
      formFittingTrigger={() => "100%"}
      register={(name) => ({ name })}
      isLoading={false}
      onSubmitLogin={vi.fn()}
      Grid={Grid}
      setCurrentStep={vi.fn()}
      {...overrides}
    />
  );

describe("MFA step copy", () => {
  it("names the field in plain language, not in the acronym's jargon", () => {
    renderMFA();

    expect(screen.getByLabelText("Authentication code")).toBeInTheDocument();
    expect(screen.queryByText(/multi factor authentication/i)).toBeNull();
  });

  it("says where the code comes from", () => {
    renderMFA();

    expect(
      screen.getByText("Enter the 6-digit code from your authenticator app.")
    ).toBeInTheDocument();
  });

  it("points the input at the hint so a screen reader reads both", () => {
    renderMFA();

    const input = screen.getByLabelText("Authentication code");
    const hint = screen.getByText(
      "Enter the 6-digit code from your authenticator app."
    );

    expect(hint.id).toBeTruthy();
    expect(input.getAttribute("aria-describedby")).toBe(hint.id);
  });

  it("still offers the way back to the password step", () => {
    const setCurrentStep = vi.fn();
    renderMFA({ setCurrentStep });

    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Verify" })).toBeInTheDocument();
  });
});
