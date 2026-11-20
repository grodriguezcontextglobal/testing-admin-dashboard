import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { devitrakApi, devitrakApiPlatform } from "../../api/devitrakApi";
import { onRemoveBackgroundJob } from "../../store/slices/backgroundJobsSlice";
import clearCacheMemory from "../../utils/actions/clearCacheMemory";
import { useStatusNotification } from "../notification/alerts/useStatusNotification";
import { exportDownloadError, exportFilename } from "../../pages/platform/utils/platformExports";

const TERMINAL_STATUSES = ["done", "failed", "dead"];

// Which client a job's file is fetched on. A name rather than the client
// itself, because a job descriptor lives in Redux and has to stay
// serialisable.
const DOWNLOAD_CLIENTS = { platform: devitrakApiPlatform, default: devitrakApi };

/**
 * Save a finished job's file.
 *
 * An authenticated request, not a link: the file comes back through the same
 * client, and therefore the same gate, that was allowed to produce it. A URL
 * in a notification would be a file anyone holding the string could fetch,
 * from a session that never passed that gate.
 */
const downloadJobFile = async (download) => {
  const client = DOWNLOAD_CLIENTS[download.api] ?? DOWNLOAD_CLIENTS.default;
  const response = await client.get(download.path, { responseType: "blob" });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = exportFilename(response.headers, { title: download.title });
  link.click();
  URL.revokeObjectURL(url);
};

const downloadButtonStyle = {
  minHeight: "32px",
  padding: "0 14px",
  borderRadius: "8px",
  border: "1px solid var(--blue-dark-600, #155eef)",
  background: "var(--blue-dark-600, #155eef)",
  color: "var(--basewhite, #fff)",
  cursor: "pointer",
  fontFamily: "Inter, sans-serif",
  fontSize: "14px",
  fontWeight: 600,
};

const TrackedBackgroundJob = ({ job, notify }) => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const handledRef = useRef(false);

  const { data } = useQuery({
    queryKey: ["backgroundJob", job.jobId],
    queryFn: () =>
      devitrakApi.get(`/jobs/owned/${job.jobId}`).then((res) => res.data),
    refetchInterval: (latest) =>
      latest && TERMINAL_STATUSES.includes(latest.status) ? false : 3000,
    refetchIntervalInBackground: true,
    retry: false,
  });

  useEffect(() => {
    if (!data || handledRef.current || !TERMINAL_STATUSES.includes(data.status))
      return;
    handledRef.current = true;

    if (data.status === "done") {
      // Keep `message` short (a fixed-height title the status icon anchors
      // to) and put the actual descriptive text in `description` — dumping a
      // long sentence into `message` forces it to wrap onto multiple lines,
      // which makes the icon look like it's sitting on top of the text
      // instead of beside a single title line.
      // A job that produced a file gets a button to collect it. Without this
      // the notification announces a file and offers no way to reach it.
      const description = job.successMessage || "Background task completed.";
      notify(
        "success",
        "Task completed",
        job.download
          ? {
              description,
              // Long enough to click. A file the operator waited for should
              // not vanish while they are looking at something else.
              duration: 0,
              btn: (
                <button
                  type="button"
                  onClick={() =>
                    downloadJobFile(job.download).catch((error) => {
                      const notice = exportDownloadError(error);
                      notify("error", notice.title, notice.description);
                    })
                  }
                  style={downloadButtonStyle}
                >
                  {job.download.label || "Download"}
                </button>
              ),
            }
          : description,
      );
      (job.invalidateKeys || []).forEach((queryKey) => {
        queryClient.invalidateQueries({
          queryKey,
          exact: true,
          refetchType: "active",
        });
      });
      (job.clearCacheKeys || []).forEach((key) => clearCacheMemory(key));
      if (
        job.navigateTo &&
        job.sourcePathname &&
        location.pathname === job.sourcePathname
      ) {
        navigate(job.navigateTo);
      }
    } else {
      notify(
        "error",
        job.failureMessage || "Background task failed.",
        data.lastError || "Please try again.",
      );
    }

    dispatch(onRemoveBackgroundJob(job.jobId));
  }, [data, dispatch, job, location.pathname, navigate, queryClient, notify]);

  return null;
};

const BackgroundJobsTracker = () => {
  const jobs = useSelector((state) => state.backgroundJobs.jobs);
  const { notify, contextHolder } = useStatusNotification();
  return (
    <>
      {contextHolder}
      {jobs.map((job) => (
        <TrackedBackgroundJob key={job.jobId} job={job} notify={notify} />
      ))}
    </>
  );
};

export default BackgroundJobsTracker;
