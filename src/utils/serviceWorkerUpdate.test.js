import { describe, expect, it, vi } from "vitest";
import { applyServiceWorkerUpdate } from "./serviceWorkerUpdate";

/**
 * Reported twice, 2026-09-25 `0:15` and 2026-09-29 `0:03`: "I clicked on
 * refresh, but it didn't disappear or nothing happened."
 *
 * vite-plugin-pwa's `updateServiceWorker(true)` only messages the worker that
 * workbox itself saw waiting, and only reloads on a `controlling` event it
 * marks as an update. Outside that path it does nothing, says nothing, and the
 * notification — `duration: 0` — stays. These pin the three ways the click
 * now ends in a reload instead.
 */

const fakeContainer = ({ waiting = null } = {}) => {
  const listeners = {};
  return {
    waiting,
    addEventListener: vi.fn((type, handler) => {
      listeners[type] = handler;
    }),
    getRegistration: vi.fn(async () => ({ waiting })),
    fire: (type) => listeners[type]?.(),
  };
};

const fakeTimer = () => {
  let pending = null;
  return {
    setTimer: vi.fn((fn) => {
      pending = fn;
    }),
    elapse: () => pending?.(),
  };
};

const setup = ({ waiting, updateServiceWorker = vi.fn(async () => {}) } = {}) => {
  const serviceWorker = fakeContainer({ waiting });
  const timer = fakeTimer();
  const reload = vi.fn();
  const run = () =>
    applyServiceWorkerUpdate({
      updateServiceWorker,
      serviceWorker,
      reload,
      setTimer: timer.setTimer,
      timeoutMs: 4000,
    });
  return { serviceWorker, timer, reload, updateServiceWorker, run };
};

describe("applyServiceWorkerUpdate", () => {
  it("still asks the plugin to apply the update", async () => {
    const { run, updateServiceWorker } = setup();
    await run();
    expect(updateServiceWorker).toHaveBeenCalledWith(true);
  });

  it("tells the waiting worker to take over itself, not only through workbox", async () => {
    const waiting = { postMessage: vi.fn() };
    const { run } = setup({ waiting });
    await run();
    expect(waiting.postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" });
  });

  it("reloads as soon as the new worker takes control", async () => {
    const { run, serviceWorker, reload } = setup();
    await run();
    expect(reload).not.toHaveBeenCalled();

    serviceWorker.fire("controllerchange");
    expect(reload).toHaveBeenCalledTimes(1);
  });

  /* The case Fredrik hit: nothing takes control, nothing reloads. A click that
     does nothing teaches people not to click, so it ends in a reload anyway. */
  it("reloads anyway when nothing takes control in time", async () => {
    const { run, timer, reload } = setup();
    await run();
    expect(timer.setTimer).toHaveBeenCalledWith(expect.any(Function), 4000);

    timer.elapse();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("reloads once, even when both the takeover and the timeout fire", async () => {
    const { run, serviceWorker, timer, reload } = setup();
    await run();
    serviceWorker.fire("controllerchange");
    timer.elapse();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("does not get stuck when the plugin call itself fails", async () => {
    const { run, timer, reload } = setup({
      updateServiceWorker: vi.fn(async () => {
        throw new Error("registration failed");
      }),
    });
    await run();
    timer.elapse();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("falls back to a plain reload where there is no service worker at all", async () => {
    const reload = vi.fn();
    await applyServiceWorkerUpdate({
      updateServiceWorker: vi.fn(async () => {}),
      // null, not undefined: undefined would pick up the default navigator.
      serviceWorker: null,
      reload,
      setTimer: (fn) => fn(),
    });
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
