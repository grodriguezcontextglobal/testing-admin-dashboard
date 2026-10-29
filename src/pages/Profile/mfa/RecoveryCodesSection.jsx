import { Typography } from "@mui/material";
import PropTypes from "prop-types";
import { useState } from "react";

import { devitrakApiAdmin } from "../../../api/devitrakApi";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import Input from "../../../components/UX/inputs/Input";
import { Subtitle } from "../../../styles/global/Subtitle";
import TextFontsize18LineHeight28 from "../../../styles/global/TextFontSize18LineHeight28";
import RecoveryCodesPanel from "../../authentication/mfa/RecoveryCodesPanel";
import {
  MFA_CODE_LENGTH,
  isCompleteMfaCode,
  normalizeMfaCode,
} from "../../authentication/utils/mfaEnrollment";
import { readRecoveryCodes } from "../../authentication/utils/mfaRecovery";

/**
 * New MFA recovery codes from the profile (FedRAMP A5 · IA-5).
 *
 * POST /admin/mfa/recovery-codes takes a current code from the authenticator
 * app and returns ten new codes; the old ones stop working. Accounts that
 * turned MFA on before 2026-10-27 have no codes at all, and the server does
 * not say which ones, so the text asks everyone to make sure they have them.
 */

const sectionTitleStyle = { ...TextFontsize18LineHeight28, color: "var(--gray-900, #171d1a)" };
const bodyTextStyle = { ...Subtitle, color: "var(--gray-600, #5d615a)" };

const RecoveryCodesSection = ({ email }) => {
  const [code, setCode] = useState("");
  const [codes, setCodes] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async (event) => {
    event.preventDefault();
    if (!isCompleteMfaCode(code)) {
      setError(`Enter the ${MFA_CODE_LENGTH} digits shown in your app.`);
      return;
    }
    try {
      setLoading(true);
      setError("");
      const response = await devitrakApiAdmin.post("/mfa/recovery-codes", {
        mfaCode: normalizeMfaCode(code),
      });
      const fresh = readRecoveryCodes(response.data);
      if (!fresh) throw new Error("No recovery codes in the response");
      setCodes(fresh);
    } catch (err) {
      setError(err?.response?.data?.msg ?? "We couldn't generate new codes. Please try again.");
    } finally {
      setCode("");
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "560px" }}>
      <Typography sx={sectionTitleStyle}>Recovery codes</Typography>
      {codes ? (
        <RecoveryCodesPanel codes={codes} email={email} onDone={() => setCodes(null)} doneLabel="Done" />
      ) : (
        <>
          <Typography sx={bodyTextStyle}>
            Recovery codes let you sign in if you lose the device with your
            authenticator app. If you don&apos;t have them saved, or have used
            most of them, generate a new set. Your old codes will stop working.
          </Typography>
          <form onSubmit={generate} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Input
              id="recovery-codes-mfa-code"
              inputProps={{ "aria-label": "Authentication code for new recovery codes" }}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(event) => setCode(normalizeMfaCode(event.target.value))}
              placeholder="000000"
              error={Boolean(error)}
              helperText={error || `Enter the ${MFA_CODE_LENGTH}-digit code from your authenticator app.`}
              fullWidth
            />
            <BlueButtonComponent
              title="Generate new codes"
              buttonType="submit"
              loadingState={loading}
              styles={{ alignSelf: "flex-start" }}
            />
          </form>
        </>
      )}
    </div>
  );
};

RecoveryCodesSection.propTypes = {
  email: PropTypes.string,
};

export default RecoveryCodesSection;
