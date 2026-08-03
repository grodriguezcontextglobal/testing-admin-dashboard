import { useState } from "react";
import { useInstallPromptContext } from "../../hooks/useInstallPromptContext";
import BlueButtonComponent from "../UX/buttons/BlueButton";
import XCloseIcon from "../icons/XCloseIcon";

const DISMISS_KEY = "pwa-install-banner-dismissed";

const bannerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexWrap: "wrap",
  gap: "16px",
  width: "100%",
  padding: "10px 16px",
  backgroundColor: "var(--blue-50, #eff8ff)",
  borderBottom: "1px solid var(--blue-200, #b2ddff)",
};

const textStyle = {
  margin: 0,
  fontFamily: "Inter, sans-serif",
  fontSize: "14px",
  fontWeight: 500,
  color: "var(--gray-700, #344054)",
  textAlign: "center",
};

const closeButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "transparent",
  border: "none",
  padding: 0,
  cursor: "pointer",
  flexShrink: 0,
};

// Persistent top banner shown once the browser reports the dashboard is
// installable — replaces a one-shot toast (easy to miss, auto-dismissed
// after a few seconds) with a bar that stays visible until the user
// installs or dismisses it. Dismissal is remembered for the rest of the
// browser session (sessionStorage), the same idiom App.jsx already uses
// for the slow-network notice.
const InstallAppBanner = () => {
  const { canInstall, promptInstall } = useInstallPromptContext();
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem(DISMISS_KEY) === "true",
  );

  if (!canInstall || dismissed) return null;

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "true");
    setDismissed(true);
  };

  return (
    <div style={bannerStyle} role="region" aria-label="Install Devitrak">
      <p style={textStyle}>
        Install Devitrak on your desktop for quicker, full-screen access.
      </p>
      <BlueButtonComponent title="Install" size="sm" func={promptInstall} />
      <button
        type="button"
        style={closeButtonStyle}
        onClick={handleDismiss}
        aria-label="Dismiss install banner"
      >
        <XCloseIcon width={16} height={16} />
      </button>
    </div>
  );
};

export default InstallAppBanner;
