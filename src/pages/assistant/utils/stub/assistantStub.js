// A stand-in for POST /api/admin/assistant/ask and the job route behind it,
// so the chat window can be built, reviewed and argued about before the
// backend has answered FRONTEND_assistant_three_questions_2026-11-23.md.
//
// Dev server only. featureFlags.ASSISTANT_STUB is pinned to
// `import.meta.env.DEV`, so no release can answer a staff question with text
// we invented. That is a stronger rule than the console's sample data gets,
// and the reason is in the flag's comment: invented numbers under a banner
// read as a prototype; an invented sentence reads as an answer.
//
// It imitates the real contract rather than a convenient one:
//
//   ask    -> the 202 body, { jobId }, which readAskJobId already parses;
//   status -> what GET /jobs/owned/:jobId returns, using the same words
//             BackgroundJobsTracker treats as terminal ("done", "failed",
//             "dead") -- there is a test that reads the tracker and fails if
//             these drift apart.
//
// It is deliberately unhelpful in two ways. It takes a few polls to finish,
// because a stub that is instantly done hides every loading state we are here
// to build. And it returns sources with links that must be refused, because a
// stub that only returns well-behaved data would mean the first refused link
// anyone ever saw came from a real model in production.

/** The words the tracker stops polling on. Kept here so a test can compare. */
export const STUB_TERMINAL_STATUSES = ["done", "failed", "dead"];

const sourcesFor = () => [
  // Fine, assuming the route table knows /inventory.
  { label: "Inventory", path: "/inventory" },
  // An in-app shape the route table should not recognise.
  { label: "A screen that does not exist", path: "/not-a-real-route" },
  // Off-site, dressed as a citation. This is the one the window must render
  // as plain text, and the reason safeSources exists.
  { label: "Supporting document", path: "https://example.invalid/looks-official" },
  // Leaving by a different door.
  { label: "Another way out", path: "//example.invalid/steal" },
];

const answerFor = (question) =>
  [
    "**This answer is invented.** The assistant endpoint does not exist yet;",
    "you are looking at the stub in `src/pages/assistant/utils/stub/`.",
    "",
    `You asked: ${question}`,
    "",
    "A real answer would arrive as markdown, and the sources below would be",
    "checked against the route table before any of them became a link.",
  ].join("\n");

/**
 * One stub instance, with its own jobs. Create it where the window lives.
 *
 * `pollsBeforeDone` is how many times `status` says "pending" before it
 * finishes -- 0 to finish at once. A question containing "fail" ends as
 * "failed" instead, because the error state needs building too and waiting
 * for a real failure to happen is not a plan.
 */
export const createAssistantStub = ({ pollsBeforeDone = 2 } = {}) => {
  const jobs = new Map();
  let issued = 0;

  const ask = ({ question } = {}) => {
    issued += 1;
    const jobId = `stub-job-${issued}`;
    const asked = typeof question === "string" ? question : "";
    jobs.set(jobId, {
      asked,
      polls: 0,
      fails: asked.toLowerCase().includes("fail"),
    });
    return { jobId };
  };

  const status = (jobId) => {
    const job = jobs.get(jobId);
    // "dead" rather than "pending": the tracker polls a non-terminal status
    // every three seconds for as long as the session lasts, so shrugging at
    // an id nobody issued would leave whoever is working on this watching a
    // spinner and looking for the bug in their own code.
    if (!job) return { status: "dead" };

    if (job.polls < pollsBeforeDone) {
      job.polls += 1;
      return { status: "pending" };
    }
    if (job.fails) return { status: "failed" };

    return {
      status: "done",
      result: {
        answer: answerFor(job.asked),
        conversation_id: `stub-conversation-${jobId}`,
        sources: sourcesFor(),
      },
    };
  };

  return { ask, status };
};
