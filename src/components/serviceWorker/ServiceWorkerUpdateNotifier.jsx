import { useEffect, useRef } from "react";
import { registerSW } from "virtual:pwa-register";
import BlueButtonComponent from "../UX/buttons/BlueButton";
import { useStatusNotification } from "../notification/alerts/useStatusNotification";
import { applyServiceWorkerUpdate } from "../../utils/serviceWorkerUpdate";

const UPDATE_NOTICE_KEY = "service-worker-update";

// registerSW's callbacks run outside any component (registration happens at
// module scope), so they can't call the useStatusNotification hook directly.
// This component owns the registration (once, on mount) and feeds the
// callbacks through a ref so notify/contextHolder still come from the
// centralized hook and stay themed like the rest of the app's notifications.
const ServiceWorkerUpdateNotifier = () => {
  const { notify, contextHolder } = useStatusNotification();
  const notifyRef = useRef(notify);
  notifyRef.current = notify;
  const updateServiceWorkerRef = useRef(null);

  useEffect(() => {
    // The click replaces the notice in place (same key) so it visibly
    // responds, then applyServiceWorkerUpdate guarantees it ends in a reload.
    const applyUpdate = () => {
      notifyRef.current("info", "Updating…", {
        key: UPDATE_NOTICE_KEY,
        description: "Reloading with the new version.",
        duration: 0,
      });
      applyServiceWorkerUpdate({
        updateServiceWorker: updateServiceWorkerRef.current,
      });
    };

    // registerType: "prompt" (see vite.config.js) — the deployment ships a
    // single bundle with no partial-chunk-upload tolerance, so the update is
    // surfaced to the user instead of silently swapped mid-session.
    updateServiceWorkerRef.current = registerSW({
      onNeedRefresh() {
        notifyRef.current("info", "Update available", {
          key: UPDATE_NOTICE_KEY,
          description: "A new version of the app is ready.",
          duration: 0,
          btn: <BlueButtonComponent title="Refresh" func={applyUpdate} />,
        });
      },
      onOfflineReady() {
        notifyRef.current("success", "Ready to work offline", {
          description: "The app shell is cached and available without a connection.",
        });
      },
    });
  }, []);

  return contextHolder;
};

export default ServiceWorkerUpdateNotifier;
