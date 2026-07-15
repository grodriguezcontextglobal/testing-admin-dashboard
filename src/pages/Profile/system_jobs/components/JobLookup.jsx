import { Grid, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { message, Tag } from "antd";
import { useState } from "react";
import { devitrakApi } from "../../../../api/devitrakApi";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import ReusableCard from "../../../../components/UX/cards/ReusableCard";
import Input from "../../../../components/UX/inputs/Input";
import { getJobStatusMeta, isValidJobId } from "../utils/jobQueueUtils";

const JobLookup = () => {
  const [jobIdInput, setJobIdInput] = useState("");
  const [activeJobId, setActiveJobId] = useState(null);

  const jobQuery = useQuery({
    queryKey: ["jobLookup", activeJobId],
    queryFn: () => devitrakApi.get(`/jobs/${activeJobId}`),
    enabled: !!activeJobId,
    retry: false,
  });

  const handleLookup = () => {
    const trimmed = jobIdInput.trim();
    if (!isValidJobId(trimmed)) {
      message.warning("That doesn't look like a valid job id.");
      return;
    }
    setActiveJobId(trimmed);
  };

  const job = jobQuery.data?.data;
  const statusMeta = job ? getJobStatusMeta(job.status) : null;

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={8} md={6}>
        <Input
          placeholder="Job id (24-character ObjectId)"
          fullWidth
          value={jobIdInput}
          onChange={(e) => setJobIdInput(e.target.value)}
        />
      </Grid>
      <Grid item xs={12} sm={4} md={2}>
        <BlueButtonComponent
          title="Look up"
          func={handleLookup}
          isLoading={jobQuery.isFetching}
          styles={{ width: "100%" }}
        />
      </Grid>

      {activeJobId && jobQuery.isError && (
        <Grid item xs={12}>
          <Typography color="error">
            {jobQuery.error?.response?.status === 404
              ? "No job found with that id."
              : "Something went wrong looking up that job."}
          </Typography>
        </Grid>
      )}

      {job && (
        <Grid item xs={12}>
          <ReusableCard title={`Job ${job.id}`}>
            <Grid container spacing={1}>
              <Grid item xs={12}>
                <Tag color={statusMeta.color}>{statusMeta.label}</Tag>
                <Typography component="span" style={{ marginLeft: 8 }}>
                  {job.type} · {job.attempts} attempt(s)
                </Typography>
              </Grid>
              {job.lastError && (
                <Grid item xs={12}>
                  <Typography color="error" variant="body2">
                    Last error: {job.lastError}
                  </Typography>
                </Grid>
              )}
              <Grid item xs={12}>
                <Typography
                  variant="caption"
                  component="pre"
                  style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                >
                  {JSON.stringify(job.result ?? job.payload ?? {}, null, 2)}
                </Typography>
              </Grid>
            </Grid>
          </ReusableCard>
        </Grid>
      )}
    </Grid>
  );
};

export default JobLookup;
