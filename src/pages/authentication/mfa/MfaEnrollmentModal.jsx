import { Typography } from "antd";
import PropTypes from "prop-types";
import { useCallback, useEffect, useState } from "react";

import { devitrakApiAdmin } from "../../../api/devitrakApi";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../components/UX/buttons/GrayButton";
import Input from "../../../components/UX/inputs/Input";
import ModalUX from "../../../components/UX/modal/ModalUX";
import { Subtitle } from "../../../styles/global/Subtitle";
import TextFontsize18LineHeight28 from "../../../styles/global/TextFontSize18LineHeight28";
import {
  MFA_CODE_LENGTH,
  isCompleteMfaCode,
  mfaRequestConfig,
  normalizeMfaCode,
} from "../utils/mfaEnrollment";

/**
 * The one screen that turns MFA on, wherever an account is caught without it.
 *
 * It is used at two points where no session exists yet — the login gate and the
 * last step of registration — so it never reads the token out of localStorage;
 * the caller hands it one. `/api/admin/mfa/generate` and `/verify` sit behind
 * `validateJWT`, which checks the JWT and nothing else, so the token issued by
 * either `/admin/login` or `/registration/new` authenticates both calls.
 *
 * The modal cannot be closed by clicking away or by an X. The way out is the
 * secondary button, which the caller labels, because what leaving means differs:
 * at the login gate it abandons the sign-in, and at registration it defers to
 * the next sign-in, where the gate will ask again.
 */

const bodyTextStyle = { ...Subtitle, color: "var(--gray-600, #5d615a)" };
const stepTitleStyle = {
  ...TextFontsize18LineHeight28,
  color: "var(--gray-900, #171d1a)",
};

const MfaEnrollmentModal = ({
  open,
  authToken,
  email,
  onEnrolled,
  onDismiss,
  dismissLabel,
  dismissHint,
}) => {
  const [qrCode, setQrCode] = useState(null);
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");

  const generate = useCallback(async () => {
    try {
      setIsGenerating(true);
      setError("");
      const response = await devitrakApiAdmin.post(
        "/mfa/generate",
        {},
        mfaRequestConfig(authToken)
      );
      if (!response.data?.qrCode) {
        throw new Error("No QR code in the response");
      }
      setQrCode(response.data.qrCode);
      setSecret(response.data.secret ?? "");
    } catch (err) {
      console.error("MFA generate", err);
      setQrCode(null);
      setError(
        err?.response?.data?.msg ??
          "We couldn't prepare the setup code. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  }, [authToken]);

  /* Asked for once per opening. The server writes a fresh secret on every
     call, so regenerating behind the user's back would invalidate the QR code
     they are in the middle of scanning. */
  useEffect(() => {
    if (!open) return;
    setCode("");
    setError("");
    generate();
  }, [open, generate]);

  const handleVerify = async (event) => {
    event.preventDefault();
    if (!isCompleteMfaCode(code)) {
      setError(`Enter the ${MFA_CODE_LENGTH} digits shown in your app.`);
      return;
    }
    try {
      setIsVerifying(true);
      setError("");
      await devitrakApiAdmin.post(
        "/mfa/verify",
        { token: normalizeMfaCode(code) },
        mfaRequestConfig(authToken)
      );
      onEnrolled();
    } catch (err) {
      console.error("MFA verify", err);
      /* The server answers "Invalid token" for a wrong code. Said back in the
         app's own words, with the reason it is usually wrong — the code rolls
         every 30 seconds and a stale one looks identical to a mistyped one. */
      setError(
        err?.response?.status === 400
          ? "That code didn't match. Codes expire every 30 seconds — try the one showing now."
          : err?.response?.data?.msg ??
              "We couldn't verify the code. Please try again."
      );
      setCode("");
    } finally {
      setIsVerifying(false);
    }
  };

  const body = (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <Typography.Paragraph style={{ ...bodyTextStyle, margin: 0 }}>
        Devitrak requires two-step verification on every account
        {email ? ` — including ${email}` : ""}. Set it up now to continue.
      </Typography.Paragraph>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <Typography.Text style={stepTitleStyle}>
          1. Scan this code
        </Typography.Text>
        <Typography.Paragraph style={{ ...bodyTextStyle, margin: 0 }}>
          Open your authenticator app — Google Authenticator, Authy, 1Password —
          and scan the image below.
        </Typography.Paragraph>
        {qrCode ? (
          <>
            <img
              src={qrCode}
              alt="Two-step verification setup code"
              style={{
                width: "180px",
                alignSelf: "flex-start",
                padding: "8px",
                borderRadius: "12px",
                border: "1px solid var(--gray-200, #ddded6)",
                background: "var(--base-white, #fff)",
              }}
            />
            {secret ? (
              <Typography.Paragraph style={{ ...bodyTextStyle, margin: 0 }}>
                Can&apos;t scan it? Enter this key in your app instead:{" "}
                <Typography.Text copyable code>{secret}</Typography.Text>
              </Typography.Paragraph>
            ) : null}
          </>
        ) : (
          <div
            style={{ display: "flex", alignItems: "center", gap: "12px" }}
          >
            <Typography.Text style={bodyTextStyle}>
              {isGenerating
                ? "Preparing your setup code…"
                : "No setup code yet."}
            </Typography.Text>
            {!isGenerating && (
              <GrayButtonComponent
                title="Try again"
                func={generate}
                buttonType="button"
              />
            )}
          </div>
        )}
      </div>

      <form
        onSubmit={handleVerify}
        style={{ display: "flex", flexDirection: "column", gap: "8px" }}
      >
        <Typography.Text style={stepTitleStyle}>
          2. Enter the code it shows
        </Typography.Text>
        <Input
          id="mfa-enrollment-code"
          /* No visible label: the step heading right above already says what
             this is, and a second one only crowded the modal. The name still
             has to exist for anything that reads the page aloud — and it has
             to go through `inputProps`, because MUI puts a bare `aria-label`
             on the wrapper, where it names nothing. */
          inputProps={{ "aria-label": "Authentication code" }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={(event) => setCode(normalizeMfaCode(event.target.value))}
          placeholder="000000"
          disabled={!qrCode}
          error={Boolean(error)}
          helperText={
            error ||
            `Enter the ${MFA_CODE_LENGTH}-digit code from your authenticator app.`
          }
          fullWidth
        />
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "8px",
            width: "100%",
          }}
        >
          <GrayButtonComponent
            title={dismissLabel}
            func={onDismiss}
            buttonType="button"
            disabled={isVerifying}
            styles={{ flex: "1" }}
          />
          <BlueButtonComponent
            title="Verify and continue"
            buttonType="submit"
            loadingState={isVerifying}
            disabled={!qrCode}
            styles={{ flex: "1" }}
          />
        </div>
        {dismissHint ? (
          <Typography.Paragraph
            style={{ ...bodyTextStyle, margin: "4px 0 0", fontSize: "13px" }}
          >
            {dismissHint}
          </Typography.Paragraph>
        ) : null}
      </form>
    </div>
  );

  return (
    <ModalUX
      title="Set up two-step verification"
      body={body}
      openDialog={open}
      closeModal={onDismiss}
      closable={false}
      width={520}
      footer={null}
    />
  );
};

MfaEnrollmentModal.propTypes = {
  open: PropTypes.bool.isRequired,
  authToken: PropTypes.string,
  email: PropTypes.string,
  onEnrolled: PropTypes.func.isRequired,
  onDismiss: PropTypes.func.isRequired,
  dismissLabel: PropTypes.string.isRequired,
  dismissHint: PropTypes.string,
};

export default MfaEnrollmentModal;
