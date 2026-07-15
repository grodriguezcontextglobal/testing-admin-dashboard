const QUEUEABLE_METHODS = ["post", "put"];

// Complements the backend's own job queue (see FRONTEND_task_queue_changes.md /
// backgroundJobsSlice.js): this decides whether a mutation should be treated
// as queued by the service worker's Background Sync because the browser
// itself has no network, not because the server is slow or down.
export const isOfflineQueueableRequest = ({ method, url, isOnline, apiOrigins = [] }) => {
  if (isOnline || !url) return false;
  if (!QUEUEABLE_METHODS.includes(String(method).toLowerCase())) return false;
  return apiOrigins.some((origin) => origin && url.startsWith(origin));
};
