import { useEffect, useRef } from "react";
import { useInstallPrompt } from "../../hooks/useInstallPrompt";
import BlueButtonComponent from "../UX/buttons/BlueButton";
import { useStatusNotification } from "../notification/alerts/useStatusNotification";

const NOTIFICATION_KEY = "pwa-install-available";

// Shown once per app load when the browser reports the dashboard is
// installable — surfaces the desktop-install option instead of relying on
// the browser's own, easy-to-miss install affordance.
const InstallAppNotification = () => {
  const { canInstall, promptInstall } = useInstallPrompt();
  const hasShownRef = useRef(false);
  const { notify, contextHolder, api } = useStatusNotification();

  useEffect(() => {
    if (!canInstall || hasShownRef.current) return;
    hasShownRef.current = true;

    const handleInstallClick = async () => {
      api.destroy(NOTIFICATION_KEY);
      await promptInstall();
    };

    notify("info", "Install Devitrak", {
      key: NOTIFICATION_KEY,
      description:
        "You can install this dashboard on your desktop for quicker, full-screen access.",
      duration: 12,
      btn: <BlueButtonComponent title="Install" func={handleInstallClick} />,
    });
  }, [canInstall, promptInstall, notify, api]);

  return contextHolder;
};

export default InstallAppNotification;
