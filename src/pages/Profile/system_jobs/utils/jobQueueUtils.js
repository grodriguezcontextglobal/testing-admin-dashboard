const OBJECT_ID_PATTERN = /^[0-9a-f]{24}$/i;

// Mongo ObjectId shape — avoids firing a request the backend will just 400 on
// (GET /jobs/:jobId responds 400 for a malformed id).
export const isValidJobId = (value) => {
  if (!value) return false;
  return OBJECT_ID_PATTERN.test(String(value).trim());
};

const STATUS_META = {
  pending: { label: "Pending", color: "default" },
  processing: { label: "Processing", color: "blue" },
  done: { label: "Done", color: "green" },
  failed: { label: "Failed", color: "orange" },
  dead: { label: "Dead", color: "red" },
};

export const getJobStatusMeta = (status) => {
  if (!status) return { label: "—", color: "default" };
  return STATUS_META[status] ?? { label: status, color: "default" };
};
