import { Grid, Typography } from "@mui/material";
import { Divider } from "antd";
import JobLookup from "./components/JobLookup";
import JobStats from "./components/JobStats";

const SystemJobsMainPage = () => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="h6">Background Job Queue</Typography>
        <Typography variant="body2" color="text.secondary">
          Platform-wide view of the async job queue (emails, bulk inventory
          jobs, document uploads, shipments).
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <JobStats />
      </Grid>
      <Grid item xs={12}>
        <Divider />
      </Grid>
      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom>
          Look up a job by id
        </Typography>
        <JobLookup />
      </Grid>
    </Grid>
  );
};

export default SystemJobsMainPage;
