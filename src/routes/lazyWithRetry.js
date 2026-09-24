import { lazy } from "react";

/**
 * `React.lazy`, but one failed chunk fetch does not kill the route.
 *
 * Reported after the react-router 7 upgrade: clicking through the menu works
 * for a while, then the URL changes and the screen does not. It is not the
 * router — it is what the router's new default does to a failed dynamic import.
 *
 * Three things line up:
 *
 * 1. **`v7_startTransition` is the default in v7.** Navigation state updates
 *    are wrapped in `startTransition`, and a transition deliberately keeps the
 *    *current* screen on display while the next one loads, instead of falling
 *    back to the `<Suspense>` spinner. That is the feature. It also means a
 *    load that never finishes looks exactly like a page that ignored the click.
 * 2. **`React.lazy` caches the promise it is given — including a rejected
 *    one.** A single transient chunk failure is permanent: every later attempt
 *    to render that route replays the same rejection, so the route is dead for
 *    the rest of the session. That is the "and then it stops working" half.
 * 3. **Nothing catches it.** The routed tree has one `<Suspense>` around every
 *    route and an `ErrorBoundary` on two of them, so the rejection has nowhere
 *    to surface and the transition simply never completes.
 *
 * This fixes the second point, which is the one that makes the failure stick:
 * the factory retries once before giving up, so the promise `lazy` caches is
 * the retry's, not the first attempt's. A genuine failure still throws — and
 * should, so the boundary above `<Routes>` can say so.
 */

/** Long enough to outlast a blip, short enough not to feel like a hang. */
export const RETRY_DELAY_MS = 400;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Runs the import, and on failure runs it exactly once more.
 *
 * Separate from `lazyWithRetry` so the retry rule can be tested without
 * rendering anything: `lazy` swallows its factory inside React's internals.
 *
 * @param {() => Promise<unknown>} importer
 * @returns {Promise<unknown>} the module, or the second attempt's rejection.
 */
export const retryImport = (importer) =>
  importer().catch(() => wait(RETRY_DELAY_MS).then(importer));

/** Drop-in for `lazy(() => import("…"))`. */
export const lazyWithRetry = (importer) => lazy(() => retryImport(importer));

export default lazyWithRetry;
