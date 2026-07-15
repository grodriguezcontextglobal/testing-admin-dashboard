import { notification } from "antd";
import { useEffect, useRef } from "react";
import { useInstallPrompt } from "../../hooks/useInstallPrompt";
import BlueButtonComponent from "../UX/buttons/BlueButton";

const NOTIFICATION_KEY = "pwa-install-available";

// Shown once per app load when the browser reports the dashboard is
// installable — surfaces the desktop-install option instead of relying on
// the browser's own, easy-to-miss install affordance.
const InstallAppNotification = () => {
  const { canInstall, promptInstall } = useInstallPrompt();
  const hasShownRef = useRef(false);

  useEffect(() => {
    if (!canInstall || hasShownRef.current) return;
    hasShownRef.current = true;

    const handleInstallClick = async () => {
      notification.destroy(NOTIFICATION_KEY);
      await promptInstall();
    };

    notification.info({
      key: NOTIFICATION_KEY,
      message: "Install Devitrak",
      description:
        "You can install this dashboard on your desktop for quicker, full-screen access.",
      duration: 12,
      btn: <BlueButtonComponent title="Install" func={handleInstallClick} />,
    });
  }, [canInstall, promptInstall]);

  return null;
};

export default InstallAppNotification;
