// Admin Console exports (plan F8, and B3 `POST /api/platform/exports`).
// Pure: what to ask the server for, and what the job tracker should say about
// it afterwards. No React, no I/O.
//
// The flow is the one the rest of the dashboard already uses for long work:
// the server answers 202 with a job id, BackgroundJobsTracker polls
// `/api/jobs/owned/:jobId` until it is done or failed, and notifies. Nothing
// here downloads a file: the finished job carries the link.

// An export is the whole filtered set. The page the user is looking at is an
// accident of scrolling and has no business narrowing a download.
const NOT_A_FILTER = new Set(["page", "limit"]);

const isEmpty = (value) => value === null || value === undefined || value === "";

/** The body for POST /api/platform/exports, from a screen and its filters. */
export const buildExportRequest = ({ resource, query = {} } = {}) => ({
  resource,
  format: "csv",
  filters: Object.fromEntries(
    Object.entries(query).filter(([key, value]) => !NOT_A_FILTER.has(key) && !isEmpty(value)),
  ),
});

/**
 * The job id from the 202 answer, or null. Null matters: a job tracked
 * without an id would sit in the store for the rest of the session, polling
 * nothing and never telling the user anything.
 */
export const readExportJobId = (body) => {
  const id = body?.jobId ?? body?.data?.jobId;
  return typeof id === "string" && id.length > 0 ? id : null;
};

/** The descriptor BackgroundJobsTracker needs for one export. */
export const exportJob = ({ jobId, title }) => ({
  jobId,
  type: "platform-export",
  successMessage: `Your ${title} export is ready. Open it from the job notification.`,
  failureMessage: `The ${title} export failed.`,
  // Empty on purpose. The tracker invalidates with `exact: true`, and a
  // console list key is ["platform", resource, query] with the query object
  // in it, so a key like ["platform", "audit"] would match nothing: a quiet
  // no-op that reads like a refresh. The audit page picks the export up on
  // its next fetch.
  invalidateKeys: [],
});

/** What to tell the user when the export could not even be started. */
export const exportStartError = (error) => {
  const status = error?.response?.status;
  if (status === 404) {
    return {
      title: "The server does not have this yet",
      description: "POST /api/platform/exports answered 404.",
    };
  }
  if (status === 429) {
    return {
      title: "Too many exports",
      description: "Wait a moment and try again.",
    };
  }
  return {
    title: "Could not start the export",
    description: "Nothing was exported.",
  };
};
