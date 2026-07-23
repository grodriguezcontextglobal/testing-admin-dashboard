import { useCallback, useEffect, useState } from "react";

// Captures the browser's `beforeinstallprompt` event so the app can trigger
// the native install dialog from its own UI instead of relying on the
// browser's built-in (and easy-to-miss) mini-infobar.
export const useInstallPrompt = () => {
  const [installEvent, setInstallEvent] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallEvent(event);
    };
    const handleAppInstalled = () => {
      setInstallEvent(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!installEvent) return null;
    installEvent.prompt();
    const choice = await installEvent.userChoice;
    setInstallEvent(null);
    return choice;
  }, [installEvent]);

  return {
    canInstall: Boolean(installEvent),
    promptInstall,
  };
};
