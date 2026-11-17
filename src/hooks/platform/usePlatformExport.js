import { useState } from "react";
import { useDispatch } from "react-redux";
import { devitrakApiPlatform } from "../../api/devitrakApi";
import { useStatusNotification } from "../../components/notification/alerts/useStatusNotification";
import { onTrackBackgroundJob } from "../../store/slices/backgroundJobsSlice";
import {
  buildExportRequest,
  exportJob,
  exportStartError,
  readExportJobId,
} from "../../pages/platform/utils/platformExports";

/**
 * Export one console screen (plan F8).
 *
 * Long work, so the server answers 202 with a job id and
 * BackgroundJobsTracker takes it from there: nothing blocks, and the
 * notification arrives when the file is ready. The export covers everything
 * the current filters match, never the page on screen.
 *
 * The server records every export in the audit log (plan B2). This hook does
 * not, and must not be the only place it is written down.
 *
 * Render `contextHolder` once wherever the button lives.
 */
export const usePlatformExport = ({ resource, title }) => {
  const [exporting, setExporting] = useState(false);
  const dispatch = useDispatch();
  const { notify, contextHolder } = useStatusNotification();

  const startExport = async (query) => {
    setExporting(true);
    try {
      const { data } = await devitrakApiPlatform.post(
        "/exports",
        buildExportRequest({ resource, query }),
      );
      const jobId = readExportJobId(data);
      if (!jobId) {
        notify("error", "Could not start the export", "The server sent no job to follow.");
        return;
      }
      dispatch(onTrackBackgroundJob(exportJob({ jobId, title })));
      notify("info", "Export started", "You can keep working; we will tell you when it is ready.");
    } catch (error) {
      const notice = exportStartError(error);
      notify("error", notice.title, notice.description);
    } finally {
      setExporting(false);
    }
  };

  return { startExport, exporting, contextHolder };
};

export default usePlatformExport;
