import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { devitrakApi } from "../../api/devitrakApi";
import { onRemoveBackgroundJob } from "../../store/slices/backgroundJobsSlice";
import clearCacheMemory from "../../utils/actions/clearCacheMemory";
import { useStatusNotification } from "../notification/alerts/useStatusNotification";

const TERMINAL_STATUSES = ["done", "failed", "dead"];

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
      notify(
        "success",
        "Task completed",
        job.successMessage || "Background task completed.",
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
