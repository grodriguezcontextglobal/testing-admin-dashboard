import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { createAssistantStub } from "./assistantStub";
import {
  readAskJobId,
  readAnswer,
  safeSources,
  TERMINAL_JOB_STATUSES,
} from "../assistant";

describe("createAssistantStub", () => {
  it("answers an ask the way a 202 does, with an id our reader accepts", () => {
    const stub = createAssistantStub();
    const body = stub.ask({ question: "Which devices are overdue?" });
    expect(readAskJobId(body)).toBeTruthy();
  });

  it("gives each question its own job", () => {
    const stub = createAssistantStub();
    const first = readAskJobId(stub.ask({ question: "one" }));
    const second = readAskJobId(stub.ask({ question: "two" }));
    expect(first).not.toBe(second);
  });

  // The window has to survive a job that is not finished yet, which is most
  // of the life of a real one. A stub that is instantly done hides every
  // loading state we are meant to be building.
  it("stays unfinished for a few polls before it is done", () => {
    const stub = createAssistantStub({ pollsBeforeDone: 2 });
    const jobId = readAskJobId(stub.ask({ question: "slow" }));
    expect(stub.status(jobId).status).toBe("pending");
    expect(stub.status(jobId).status).toBe("pending");
    expect(stub.status(jobId).status).toBe("done");
  });

  it("can be told to finish at once", () => {
    const stub = createAssistantStub({ pollsBeforeDone: 0 });
    const jobId = readAskJobId(stub.ask({ question: "fast" }));
    expect(stub.status(jobId).status).toBe("done");
  });

  it("repeats the finished answer instead of forgetting it", () => {
    const stub = createAssistantStub({ pollsBeforeDone: 0 });
    const jobId = readAskJobId(stub.ask({ question: "x" }));
    expect(stub.status(jobId)).toEqual(stub.status(jobId));
  });

  it("echoes the question so it is obvious which answer belongs to which", () => {
    const stub = createAssistantStub({ pollsBeforeDone: 0 });
    const jobId = readAskJobId(stub.ask({ question: "Which devices are overdue?" }));
    expect(readAnswer(stub.status(jobId).result)).toContain("Which devices are overdue?");
  });

  // Failure is a state the window has to render, and the only reliable way to
  // see it while building is to be able to ask for it.
  it("fails on demand, because the error state needs building too", () => {
    const stub = createAssistantStub({ pollsBeforeDone: 0 });
    const jobId = readAskJobId(stub.ask({ question: "please fail this one" }));
    expect(stub.status(jobId).status).toBe("failed");
  });

  // Never "pending" for an id nobody issued: the tracker polls a non-terminal
  // status every three seconds forever, so a stub that shrugs at an unknown
  // id would leave a dev watching a spinner and blaming their own code.
  it("is terminal for a job it never issued", () => {
    const stub = createAssistantStub();
    expect(TERMINAL_JOB_STATUSES).toContain(stub.status("never-issued").status);
  });

  it("returns a conversation id so the follow-up question can carry one", () => {
    const stub = createAssistantStub({ pollsBeforeDone: 0 });
    const jobId = readAskJobId(stub.ask({ question: "x" }));
    expect(stub.status(jobId).result.conversation_id).toBeTruthy();
  });
});

describe("the sources the stub sends back", () => {
  const sourcesOf = (question = "anything") => {
    const stub = createAssistantStub({ pollsBeforeDone: 0 });
    const jobId = readAskJobId(stub.ask({ question }));
    return stub.status(jobId).result.sources;
  };

  // The reason the stub ships hostile links on purpose. A stub that only ever
  // returns well-behaved data teaches the window nothing, and the first time
  // anyone sees a refused link would be in production, from a real model.
  it("includes at least one link that must not be clickable", () => {
    const safe = safeSources(sourcesOf(), { isKnownRoute: () => true });
    expect(safe.some((source) => source.path === null)).toBe(true);
  });

  it("includes at least one link that survives a matching route table", () => {
    const safe = safeSources(sourcesOf(), { isKnownRoute: () => true });
    expect(safe.some((source) => source.path !== null)).toBe(true);
  });

  it("has every source keep a label, refused or not", () => {
    const safe = safeSources(sourcesOf(), { isKnownRoute: () => true });
    expect(safe.length).toBeGreaterThan(1);
    for (const source of safe) expect(source.label).toBeTruthy();
  });
});

describe("the stub and the real job route agree", () => {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const trackerPath = path.join(
    here,
    "..",
    "..",
    "..",
    "..",
    "components",
    "backgroundJobs",
    "BackgroundJobsTracker.jsx",
  );

  // The whole value of a stub is that the code written against it works
  // against the server. The tracker stops polling on its own list of terminal
  // statuses; if the stub finished with a word that list does not contain,
  // every stubbed job would poll forever and we would not find out until the
  // endpoint was live.
  it("finishes with words the tracker treats as terminal", () => {
    const tracker = fs.readFileSync(trackerPath, "utf8");
    const declared = /TERMINAL_STATUSES\s*=\s*\[([^\]]*)\]/.exec(tracker);
    expect(declared).toBeTruthy();
    const terminal = [...declared[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
    expect(terminal.length).toBeGreaterThan(0);
    for (const status of TERMINAL_JOB_STATUSES) {
      expect(terminal, `the tracker does not treat "${status}" as terminal`).toContain(status);
    }
  });

  // The stub writes its words out rather than importing the constant, so that
  // it can disagree. This is the test that would notice if it did.
  it("ends on words the shared list already knows", () => {
    const done = createAssistantStub({ pollsBeforeDone: 0 });
    const doneId = readAskJobId(done.ask({ question: "x" }));
    expect(TERMINAL_JOB_STATUSES).toContain(done.status(doneId).status);

    const broken = createAssistantStub({ pollsBeforeDone: 0 });
    const brokenId = readAskJobId(broken.ask({ question: "fail" }));
    expect(TERMINAL_JOB_STATUSES).toContain(broken.status(brokenId).status);
  });

  it("uses a non-terminal word while it is still working", () => {
    const tracker = fs.readFileSync(trackerPath, "utf8");
    const declared = /TERMINAL_STATUSES\s*=\s*\[([^\]]*)\]/.exec(tracker);
    const terminal = [...declared[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
    const stub = createAssistantStub({ pollsBeforeDone: 1 });
    const jobId = readAskJobId(stub.ask({ question: "x" }));
    expect(terminal).not.toContain(stub.status(jobId).status);
  });
});
