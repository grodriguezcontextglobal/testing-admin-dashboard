import { Typography } from "antd";
import PropTypes from "prop-types";
import { useState } from "react";

import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../components/UX/buttons/GrayButton";
import CheckboxReusableComponent from "../../../components/UX/checkbox/CheckboxReusableComponent";
import { Subtitle } from "../../../styles/global/Subtitle";
import { recoveryCodesFileText } from "../utils/mfaRecovery";

/**
 * The ten MFA recovery codes, shown the one time the server hands them out
 * (FedRAMP A5): when MFA is turned on and when the codes are regenerated.
 * The server keeps only their hashes, so the way on stays shut until the
 * person says they saved them.
 */

const bodyTextStyle = { ...Subtitle, color: "var(--gray-600, #5d615a)", margin: 0 };

const RecoveryCodesPanel = ({ codes, email, onDone, doneLabel }) => {
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(codes.join("\n"));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const download = () => {
    const blob = new Blob([recoveryCodesFileText(codes, { email })], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "devitrak-recovery-codes.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Typography.Paragraph style={bodyTextStyle}>
        If you lose the device with your authenticator app, sign in with one of
        these codes. Each code works once. This is the only time they are shown:
        keep them somewhere safe and private.
      </Typography.Paragraph>

      <ul
        aria-label="Recovery codes"
        style={{
          listStyle: "none",
          margin: 0,
          padding: "12px 16px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: "8px 16px",
          borderRadius: "12px",
          border: "1px solid var(--gray-200, #ddded6)",
          background: "var(--gray-50, #f9faf7)",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
          fontSize: "14px",
          color: "var(--gray-900, #171d1a)",
        }}
      >
        {codes.map((code) => (
          <li key={code}>{code}</li>
        ))}
      </ul>

      <div style={{ display: "flex", gap: "12px", width: "100%" }}>
        <GrayButtonComponent
          title={copied ? "Copied" : "Copy codes"}
          func={copy}
          buttonType="button"
          styles={{ flex: "1" }}
        />
        <GrayButtonComponent title="Download" func={download} buttonType="button" styles={{ flex: "1" }} />
      </div>

      <CheckboxReusableComponent
        name="recovery-codes-saved"
        label="I saved these codes somewhere safe"
        checked={saved}
        onChange={(event) => setSaved(event.target.checked)}
      />

      <BlueButtonComponent
        title={doneLabel}
        func={onDone}
        buttonType="button"
        disabled={!saved}
        styles={{ width: "100%" }}
      />
    </div>
  );
};

RecoveryCodesPanel.propTypes = {
  codes: PropTypes.arrayOf(PropTypes.string).isRequired,
  email: PropTypes.string,
  onDone: PropTypes.func.isRequired,
  doneLabel: PropTypes.string.isRequired,
};

export default RecoveryCodesPanel;
