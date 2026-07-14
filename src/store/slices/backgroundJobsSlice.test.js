import { describe, it, expect } from "vitest";
import reducer, {
  onTrackBackgroundJob,
  onRemoveBackgroundJob,
  onResetBackgroundJobs,
} from "./backgroundJobsSlice";

const initialState = reducer(undefined, { type: "@@INIT" });

const job = {
  jobId: "job-1",
  type: "bulk-inventory-insert",
  successMessage: "Items created.",
  invalidateKeys: [["listOfItemsInStock"]],
  navigateTo: "/inventory",
  sourcePathname: "/inventory/new-bulk-items",
};

describe("backgroundJobsSlice — estado inicial", () => {
  it("jobs es un array vacío", () => {
    expect(initialState.jobs).toEqual([]);
  });
});

describe("backgroundJobsSlice — onTrackBackgroundJob", () => {
  it("agrega un job nuevo", () => {
    const state = reducer(initialState, onTrackBackgroundJob(job));
    expect(state.jobs).toHaveLength(1);
    expect(state.jobs[0]).toEqual(job);
  });

  it("no duplica un job con el mismo jobId", () => {
    const onceTracked = reducer(initialState, onTrackBackgroundJob(job));
    const state = reducer(onceTracked, onTrackBackgroundJob(job));
    expect(state.jobs).toHaveLength(1);
  });

  it("permite trackear varios jobs distintos a la vez", () => {
    const first = reducer(initialState, onTrackBackgroundJob(job));
    const state = reducer(
      first,
      onTrackBackgroundJob({ ...job, jobId: "job-2" })
    );
    expect(state.jobs).toHaveLength(2);
  });
});

describe("backgroundJobsSlice — onRemoveBackgroundJob", () => {
  it("quita solo el job indicado", () => {
    const withTwo = reducer(
      reducer(initialState, onTrackBackgroundJob(job)),
      onTrackBackgroundJob({ ...job, jobId: "job-2" })
    );
    const state = reducer(withTwo, onRemoveBackgroundJob("job-1"));
    expect(state.jobs).toHaveLength(1);
    expect(state.jobs[0].jobId).toBe("job-2");
  });

  it("no falla si el jobId no existe", () => {
    const state = reducer(initialState, onRemoveBackgroundJob("nope"));
    expect(state.jobs).toEqual([]);
  });
});

describe("backgroundJobsSlice — onResetBackgroundJobs", () => {
  it("vacía la lista de jobs", () => {
    const withJob = reducer(initialState, onTrackBackgroundJob(job));
    const state = reducer(withJob, onResetBackgroundJobs());
    expect(state.jobs).toEqual([]);
  });
});
