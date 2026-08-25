import { describe, expect, it } from "vitest";
import {
  WRITE_STEPS,
  describeWriteOutcome,
  describeWriteSteps,
  initialWriteState,
  markWriteStep,
} from "./eventWriteProgress";

const run = (state, pairs) =>
  pairs.reduce((acc, [index, status]) => markWriteStep(acc, index, status), state);

// The four steps are the real write chain in the action hooks, in order:
//   0 POST /db_event/event_device
//   1 POST /db_item/item-out-warehouse
//   2 POST /receiver/receivers-pool-bulk
//   3 POST /event/event-list + PATCH /event/edit-event/:id
const ALL_DONE = [
  [0, "done"],
  [1, "done"],
  [2, "done"],
  [3, "done"],
];

describe("WRITE_STEPS", () => {
  it("describes four steps, each naming what it touches", () => {
    expect(WRITE_STEPS).toHaveLength(4);
    WRITE_STEPS.forEach((step) => {
      expect(step.label.length).toBeGreaterThan(0);
      expect(step.scope.length).toBeGreaterThan(0);
    });
  });
});

describe("initialWriteState", () => {
  it("starts with every step pending and nothing failed", () => {
    const state = initialWriteState();
    expect(state.statuses).toEqual(["pending", "pending", "pending", "pending"]);
    expect(state.failedAt).toBeNull();
  });

  it("returns a fresh object each time so retries do not share state", () => {
    const a = initialWriteState();
    markWriteStep(a, 0, "done");
    expect(initialWriteState().statuses[0]).toBe("pending");
  });
});

describe("markWriteStep", () => {
  it("does not mutate the state it is given", () => {
    const before = initialWriteState();
    const after = markWriteStep(before, 0, "running");
    expect(before.statuses[0]).toBe("pending");
    expect(after.statuses[0]).toBe("running");
  });

  it("records which step failed", () => {
    const state = run(initialWriteState(), [
      [0, "done"],
      [1, "failed"],
    ]);
    expect(state.failedAt).toBe(1);
    expect(state.statuses).toEqual(["done", "failed", "pending", "pending"]);
  });

  it("keeps the first failure rather than overwriting it with a later one", () => {
    const state = run(initialWriteState(), [
      [1, "failed"],
      [2, "failed"],
    ]);
    expect(state.failedAt).toBe(1);
  });

  it("ignores an index outside the chain", () => {
    const state = markWriteStep(initialWriteState(), 9, "done");
    expect(state.statuses).toEqual(["pending", "pending", "pending", "pending"]);
  });

  it("survives a missing state", () => {
    expect(markWriteStep(null, 0, "done").statuses[0]).toBe("done");
  });
});

describe("describeWriteSteps", () => {
  it("exposes one flag per status so the row renders without branching", () => {
    const rows = describeWriteSteps(
      run(initialWriteState(), [
        [0, "done"],
        [1, "running"],
      ]),
    );
    expect(rows[0].isDone).toBe(true);
    expect(rows[1].isRunning).toBe(true);
    expect(rows[2].isPending).toBe(true);
    expect(rows.map((r) => r.label)).toEqual(WRITE_STEPS.map((s) => s.label));
  });

  it("says a step was never attempted once an earlier one failed", () => {
    const rows = describeWriteSteps(
      run(initialWriteState(), [
        [0, "done"],
        [1, "failed"],
      ]),
    );
    expect(rows[1].isFailed).toBe(true);
    expect(rows[1].note).toMatch(/rejected/i);
    expect(rows[2].note).toBe("Not attempted.");
    expect(rows[3].note).toBe("Not attempted.");
  });

  it("leaves notes empty on a clean run", () => {
    const rows = describeWriteSteps(run(initialWriteState(), ALL_DONE));
    expect(rows.every((r) => r.note === null)).toBe(true);
  });
});

describe("describeWriteOutcome", () => {
  it("reports nothing before the write starts", () => {
    const o = describeWriteOutcome(initialWriteState(), 12);
    expect(o.phase).toBe("idle");
    expect(o.hasVerdict).toBe(false);
  });

  it("locks the primary action while the write is in flight", () => {
    const o = describeWriteOutcome(
      run(initialWriteState(), [
        [0, "done"],
        [1, "running"],
      ]),
      12,
    );
    expect(o.phase).toBe("running");
    expect(o.title).toBe("Adding 12 devices");
    expect(o.primaryDisabled).toBe(true);
    // The three inserts carry no dedup key — see commit 95a61580.
    expect(o.footerHint).toBe(
      "Do not submit again — a second run would add these devices twice.",
    );
    expect(o.hasVerdict).toBe(false);
  });

  it("confirms a clean run", () => {
    const o = describeWriteOutcome(run(initialWriteState(), ALL_DONE), 12);
    expect(o.phase).toBe("ok");
    expect(o.title).toBe("12 devices added");
    expect(o.verdictTone).toBe("good");
    expect(o.verdictTitle).toBe("All four steps completed");
    expect(o.canRetry).toBe(false);
    expect(o.primaryDisabled).toBe(false);
  });

  it("uses singular wording for a single device", () => {
    const o = describeWriteOutcome(run(initialWriteState(), ALL_DONE), 1);
    expect(o.title).toBe("1 device added");
  });

  // The point of the whole change: a swallowed failure used to reach this same
  // place as "Items added to event inventory."
  it("does not call a partial write a success", () => {
    const o = describeWriteOutcome(
      run(initialWriteState(), [
        [0, "done"],
        [1, "done"],
        [2, "failed"],
      ]),
      12,
    );
    expect(o.phase).toBe("partial");
    expect(o.title).toBe("Only part of this went through");
    expect(o.verdictTone).toBe("bad");
    expect(o.committedCount).toBe(2);
    expect(o.verdictTitle).toBe(
      "2 of 4 steps committed, and they cannot be undone from here",
    );
    expect(o.canRetry).toBe(true);
  });

  it("names the step that failed in the detail", () => {
    const o = describeWriteOutcome(
      run(initialWriteState(), [
        [0, "done"],
        [1, "done"],
        [2, "failed"],
      ]),
      12,
    );
    expect(o.verdictDetail).toContain(WRITE_STEPS[2].label.toLowerCase());
  });

  it("warns against re-running the whole thing rather than the failed step", () => {
    const o = describeWriteOutcome(
      run(initialWriteState(), [
        [0, "done"],
        [1, "failed"],
      ]),
      12,
    );
    expect(o.verdictDetail).toMatch(/second time|again/i);
  });

  it("reports a first-step failure as nothing committed", () => {
    const o = describeWriteOutcome(
      run(initialWriteState(), [[0, "failed"]]),
      12,
    );
    expect(o.committedCount).toBe(0);
    expect(o.verdictTitle).toBe("Nothing was written");
    expect(o.canRetry).toBe(true);
  });

  it("survives a missing state", () => {
    expect(describeWriteOutcome(null, 0).phase).toBe("idle");
  });
});
