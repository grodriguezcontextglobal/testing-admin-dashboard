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
 * The last step of a password change, signed in or from a reset link: the code
 * from the authenticator app, which the server checks before it saves the new
 * password.
 */
const PasswordMfaStep = ({ onConfirm, onBack, isLoading = false, error = "", confirmLabel = "Update password" }) => {
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
          helperText={message || "Enter the 6-digit code from your authenticator app to confirm the change."}
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
    </form>
  );
};

PasswordMfaStep.propTypes = {
  onConfirm: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  error: PropTypes.string,
  confirmLabel: PropTypes.string,
};

export default PasswordMfaStep;
