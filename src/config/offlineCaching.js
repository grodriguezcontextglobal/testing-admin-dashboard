/**
 * What the service worker does with API calls
 * (fedRAMP/FRONTEND_action_plan_2026-10-26.md, A3 · SC-28, AC-12).
 *
 * vite.config.js passes these rules to workbox. Decided on 2026-10-29:
 *
 * - No API response is cached. The GET cache used to keep up to 30 responses
 *   (staff, consumers, students) on disk for 24 h. The app shell is still
 *   precached, so the dashboard opens without network.
 * - A POST or PUT made offline is queued and retried when the network
 *   returns, but only for 15 minutes: the queued request carries the
 *   x-token, and after 15 idle minutes the session it belongs to is over.
 *
 * Logout clears what is left in both queues, and any cache from older
 * builds (src/api/offlineData.js).
 */

// Matches IDLE_TIMEOUT_MS in src/hooks/idleSession.js; the test ties them.
export const MUTATION_QUEUE_RETENTION_MINUTES = 15;

// Workbox needs a unique queue name per BackgroundSyncPlugin instance, and
// one is created per rule: reusing a name throws duplicate-queue-name at
// service-worker startup.
const queuedWrite = (method, apiOriginPattern) => ({
  urlPattern: apiOriginPattern,
  method,
  handler: "NetworkOnly",
  options: {
    backgroundSync: {
      name: `devitrak-mutations-queue-${method.toLowerCase()}`,
      options: { maxRetentionTime: MUTATION_QUEUE_RETENTION_MINUTES },
    },
  },
});

/** Every rule keys off the API origins: without them, nothing is registered. */
export const buildApiRuntimeCaching = (apiOriginPattern) =>
  apiOriginPattern ? [queuedWrite("POST", apiOriginPattern), queuedWrite("PUT", apiOriginPattern)] : [];
