// Admin Console exports (plan F8, and B3 `POST /api/platform/exports`).
// Pure: what to ask the server for, and what the job tracker should say about
// it afterwards. No React, no I/O.
//
// The flow is the one the rest of the dashboard already uses for long work:
// the server answers 202 with a job id, BackgroundJobsTracker polls
// `/api/jobs/owned/:jobId` until it is done or failed, and notifies.
//
// Getting the file is the part that was missing. The tracker never read a
// link, never opened a window and never built an anchor, while our own
// success text told the operator to "open it from the job notification" -- a
// promise nothing could keep. It did not show in production only because the
// server has no POST /exports yet, so the flow dies at the first step and
// says so.
//
// So the finished job carries no URL. It carries the job id it already has,
// and the file is fetched with an authenticated request on the console's own
// client, which passes the same gate the export did and lets the server write
// a second audit row for the download itself. A plain link in a notification
// would be a file reachable by anyone holding it, from a session that never
// passed the gate (BACKEND_console_client_calls_review, §7).

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

/**
 * Where the finished file is fetched from.
 *
 * Under /api/platform on purpose, so it passes the console gate the export
 * passed. The exact path is still ours to propose -- the backend has not
 * answered §7 -- and it is one constant precisely so their answer is a
 * one-line change here and nothing else. Until it exists the request 404s and
 * the notification says so, which is the same way POST /exports behaves
 * today.
 */
export const EXPORT_DOWNLOAD_PATH = (jobId) => `/exports/${encodeURIComponent(jobId)}/file`;

const slug = (text) =>
  String(text ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/**
 * What to call the saved file. The server's own Content-Disposition wins when
 * it sends one: it knows the format and the row count, and a name invented
 * here would contradict it. Ours is the fallback, dated so two exports of the
 * same screen do not overwrite each other in a downloads folder.
 */
export const exportFilename = (headers, { title, at = new Date() } = {}) => {
  const disposition = headers?.["content-disposition"] ?? headers?.["Content-Disposition"] ?? "";
  const quoted = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
  const fromServer = quoted?.[1]?.trim();
  if (fromServer) return decodeURIComponent(fromServer);
  const day = at.toISOString().slice(0, 10);
  return `devitrak-${slug(title) || "export"}-${day}.csv`;
};

/** The descriptor BackgroundJobsTracker needs for one export. */
export const exportJob = ({ jobId, title }) => ({
  jobId,
  type: "platform-export",
  successMessage: `Your ${title} export is ready.`,
  failureMessage: `The ${title} export failed.`,
  // The tracker turns this into a button in the completion notification and
  // fetches it on the named client. Without it the operator is told the file
  // is ready and has no way to get it.
  download: {
    api: "platform",
    path: EXPORT_DOWNLOAD_PATH(jobId),
    title,
    label: "Download",
  },
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

/**
 * What to tell the operator when the file itself could not be fetched. Kept
 * apart from exportStartError because the two failures mean opposite things:
 * there, nothing was exported; here, the export exists on the server and only
 * this attempt to collect it failed, so "try again" is honest advice rather
 * than a repeat of expensive work.
 */
export const exportDownloadError = (error) => {
  const status = error?.response?.status;
  if (status === 404) {
    return {
      title: "The server does not have this yet",
      description: `GET /api/platform${EXPORT_DOWNLOAD_PATH(":jobId")} answered 404.`,
    };
  }
  if (status === 403 || status === 401) {
    return {
      title: "Not allowed to download this export",
      description: "The console checked again and refused. Sign in again if this is unexpected.",
    };
  }
  if (status === 410) {
    return {
      title: "This export has expired",
      description: "Run it again to get a fresh file.",
    };
  }
  return {
    title: "Could not download the export",
    description: "The export is still on the server. Try again.",
  };
};
