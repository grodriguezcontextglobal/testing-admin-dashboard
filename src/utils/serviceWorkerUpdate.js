/**
 * What the "Refresh" button of the update notice does.
 *
 * vite-plugin-pwa's `updateServiceWorker(true)` sends SKIP_WAITING only to the
 * worker workbox itself saw waiting, and reloads only on a `controlling` event
 * it marks as an update. Outside that path — the new worker installed from
 * another tab, or workbox holding a stale reference — the click did nothing,
 * with no error and no sign, and the notice stayed. That is what happened in
 * front of Fredrik on 2026-09-25 and again on 2026-09-29.
 *
 * So the click now has three ways to end in a reload, and exactly one reload:
 * the plugin's own path, SKIP_WAITING posted straight to the waiting worker,
 * and — if nothing has taken control after `timeoutMs` — a plain reload.
 *
 * The direct message matters: a plain reload alone does not activate a waiting
 * worker, so without it the fallback would load the old version and show the
 * same notice again.
 */
export const applyServiceWorkerUpdate = async ({
  updateServiceWorker,
  serviceWorker = globalThis.navigator?.serviceWorker,
  reload = () => globalThis.location.reload(),
  setTimer = (fn, ms) => setTimeout(fn, ms),
  timeoutMs = 4000,
}) => {
  let reloaded = false;
  const reloadOnce = () => {
    if (reloaded) return;
    reloaded = true;
    reload();
  };

  serviceWorker?.addEventListener("controllerchange", reloadOnce);
  setTimer(reloadOnce, timeoutMs);

  try {
    const registration = await serviceWorker?.getRegistration();
    registration?.waiting?.postMessage({ type: "SKIP_WAITING" });
  } catch {
    // The timer still reloads.
  }

  try {
    await updateServiceWorker?.(true);
  } catch {
    // The timer still reloads.
  }
};
