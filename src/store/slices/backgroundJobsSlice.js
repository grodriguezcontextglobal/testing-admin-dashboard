import { createSlice } from "@reduxjs/toolkit";

const backgroundJobsSlice = createSlice({
  name: "backgroundJobs",
  initialState: {
    jobs: [],
  },
  reducers: {
    onTrackBackgroundJob: (state, { payload }) => {
      if (state.jobs.some((job) => job.jobId === payload.jobId)) return;
      state.jobs.push(payload);
    },
    onRemoveBackgroundJob: (state, { payload }) => {
      state.jobs = state.jobs.filter((job) => job.jobId !== payload);
    },
    onResetBackgroundJobs: (state) => {
      state.jobs = [];
    },
  },
});

export const {
  onTrackBackgroundJob,
  onRemoveBackgroundJob,
  onResetBackgroundJobs,
} = backgroundJobsSlice.actions;

export default backgroundJobsSlice.reducer;
