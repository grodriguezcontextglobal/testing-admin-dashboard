import { FormLabel } from "@mui/material";
import PropTypes from "prop-types";
import { useState } from "react";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../components/UX/buttons/GrayButton";
import Input from "../../../components/UX/inputs/Input";
import {
  MFA_CODE_LENGTH,
  isCompleteMfaCode,
  normalizeMfaCode,
} from "../utils/mfaEnrollment";

/**
 * The last step of a password change, signed in or from a reset link, and of
 * an invitation accepted by an existing account: the code from the
 * authenticator app, which the server checks before it saves anything.
 */
/* The global `button` rules (index.css padding, the Stripe checkout sheet) reach
   every button, so this one is reset to read as a link. */
const linkButtonStyle = {
  display: "inline",
  width: "auto",
  padding: 0,
  margin: 0,
  border: "none",
  background: "transparent",
  color: "var(--blue-dark-600, #155eef)",
  fontSize: "14px",
  fontWeight: 600,
  cursor: "pointer",
};

const PasswordMfaStep = ({
  onConfirm,
  onBack,
  isLoading = false,
  error = "",
  confirmLabel = "Update password",
  hint = "Enter the 6-digit code from your authenticator app to confirm the change.",
  setupPrompt = null,
}) => {
  const [code, setCode] = useState("");
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isCompleteMfaCode(code)) {
      setLocalError(`Enter the ${MFA_CODE_LENGTH} digits shown in your app.`);
      return;
    }
    setLocalError("");
    const accepted = await onConfirm(normalizeMfaCode(code));
    if (accepted === false) setCode("");
  };

  const message = localError || error;

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}
    >
      <FormLabel htmlFor="password-mfa-code" style={{ width: "100%", textAlign: "left" }}>
        Authentication code
        <Input
          id="password-mfa-code"
          type="text"
          inputProps={{ inputMode: "numeric", autoComplete: "one-time-code" }}
          placeholder="000000"
          value={code}
          onChange={(event) => setCode(normalizeMfaCode(event.target.value))}
          error={Boolean(message)}
          helperText={message || hint}
          autoFocus
          fullWidth
        />
      </FormLabel>
      <div style={{ display: "flex", gap: "12px", width: "100%" }}>
        <GrayButtonComponent
          buttonType="button"
          title="Back"
          func={onBack}
          disabled={isLoading}
          styles={{ flex: 1 }}
        />
        <BlueButtonComponent
          buttonType="submit"
          title={confirmLabel}
          isLoading={isLoading}
          loadingState={isLoading}
          disabled={isLoading}
          styles={{ flex: 1 }}
        />
      </div>
      {setupPrompt ? (
        <p style={{ margin: 0, fontSize: "14px", color: "var(--gray-600, #475467)", textAlign: "center" }}>
          No authenticator app set up yet?{" "}
          <button
            type="button"
            onClick={setupPrompt.onClick}
            disabled={isLoading || setupPrompt.isLoading}
            style={linkButtonStyle}
          >
            {setupPrompt.isLoading ? "Checking…" : "Set up two-step verification"}
          </button>
        </p>
      ) : null}
    </form>
  );
};

PasswordMfaStep.propTypes = {
  onConfirm: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  error: PropTypes.string,
  confirmLabel: PropTypes.string,
  hint: PropTypes.string,
  /* Offers MFA setup to an account that has none yet. */
  setupPrompt: PropTypes.shape({
    onClick: PropTypes.func.isRequired,
    isLoading: PropTypes.bool,
  }),
};

export default PasswordMfaStep;
