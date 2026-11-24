// Staff assistant: what we send, what we accept back, and what we refuse.
// Pure -- no React, no api client, no store. There is a test asserting this
// file imports nothing, because the rules about untrusted model output live
// here and have to stay testable without mocking anything.
//
// The shape follows FRONTEND_assistant_proxy_2026-10-27.md and the narrowed
// FRONTEND_assistant_three_questions_2026-11-23.md. The backend has not
// answered yet, so every value the server gets to decide -- the route, the
// character cap -- is one constant here. Their answer should be a line of this
// file and nothing else.
//
// The flow is the one the dashboard already runs for long work and which the
// backend already operates for exports: POST answers 202 with a job id,
// BackgroundJobsTracker polls it, the answer arrives in a notification.
//
// ── Why this file is careful ─────────────────────────────────────────────────
// An assistant turns a person's text into API calls, and returns text written
// by a model that the question can steer. So both directions are untrusted:
//
//   going out  -- the request names the company and the staff member asking,
//                 because the agent answers far better when it does not have
//                 to guess. Those four ids come from the browser, so they are
//                 forgeable, and the rule that makes them safe lives on the
//                 server: VERIFY, DO NOT TRUST. Each id is compared with the
//                 validated token and a mismatch is a 403 and an audit row,
//                 never a query. Sent-and-checked is strictly better than not
//                 sent: a forged id stops being a field nobody looks at and
//                 becomes a tripwire that fires the moment it is touched.
//   coming back -- the answer is content, not instructions, and the links in
//                 it are destinations chosen by whoever wrote the question.
//
// Neither is handled by asking the model nicely. They are handled by the
// server checking what we send against what it knows, and by a link being
// unclickable unless our own route table recognises it.

/**
 * Agreed with the backend on 2026-11-23
 * (BACKEND_assistant_three_questions_REPLY_2026-11-23.md, §1). Under
 * /api/admin so it rides the staff session that already exists -- no new
 * header, so the production CORS allow-list does not change.
 *
 * The job it returns is polled on GET /api/jobs/owned/:jobId, which already
 * exists and already refuses a job that is not yours: it compares the job's
 * uid against the caller's. BackgroundJobsTracker polls exactly that route
 * today, so there is nothing to add on either side.
 */
export const ASSISTANT_ASK_PATH = "/assistant/ask";

/**
 * The backend's number, which turned out to be the one we had guessed (§3 of
 * their reply). Enforced here as well as there, as they asked: a user who sees
 * the limit before spending a request learns more than one who gets a 400
 * after. It also bounds how much instruction text an injection attempt can
 * carry in a single question.
 *
 * Their other two limits are the server's alone, and we deliberately do not
 * model them here -- a client-side copy of a rate limit is a second source of
 * truth that drifts: 10 questions per staff member per 10 minutes, 100 per
 * company per hour. We render the 429 (askStartError) rather than predict it.
 */
export const QUESTION_MAX_CHARS = 1000;

/** A source label names a thing. It is not a place for prose. */
export const LABEL_MAX_CHARS = 80;

/**
 * The statuses GET /api/jobs/owned/:jobId stops on. Defined once, here,
 * because two pieces of code have to agree with a third: the window that
 * polls, the stub that imitates the server, and BackgroundJobsTracker, which
 * owns the original list. A test in the stub reads the tracker's own source
 * and fails if these drift apart -- a job that finishes with a word the
 * poller does not recognise is polled every three seconds for the rest of the
 * session, and nothing looks broken while it happens.
 */
export const TERMINAL_JOB_STATUSES = ["done", "failed", "dead"];

/** Whether a polled job has stopped moving, whichever way it ended. */
export const isJobFinished = (status) => TERMINAL_JOB_STATUSES.includes(status);

const text = (value) => (typeof value === "string" ? value : "");

/**
 * Why the question cannot be sent, or null when it can.
 *
 * Checked here rather than only on the server because the cheapest refusal is
 * the one that never leaves the browser, and because a rate-limited user who
 * burns a request on a 2,000-character paste learns nothing from the 413.
 */
export const questionError = (question) => {
  const asked = text(question).trim();
  if (asked.length === 0) return "Type a question first.";
  if (asked.length > QUESTION_MAX_CHARS) {
    return `Questions are limited to ${QUESTION_MAX_CHARS} characters. Yours is ${asked.length}.`;
  }
  return null;
};

const id = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const asText = text(value).trim();
  return asText.length > 0 ? asText : null;
};

/**
 * The four ids of whoever is asking, read from the session.
 *
 * Devitrak runs on two stores, so a company and a staff member each have a
 * Mongo id and a SQL id (CLAUDE.md, "Session Headers"). Both forms go to the
 * agent: with only one, its first move on the other store would be a lookup
 * to find the id it was not given.
 *
 * The staff SQL id follows the fallback the dashboard already uses when it
 * writes `created_by` (CreateLocationModal, CreateSubLocationPathModal), so
 * the assistant names the same staff member the rest of the app does rather
 * than a second opinion about who that is.
 *
 * Blanks become null on purpose. An empty string is not an id: it would have
 * the agent look up a company that cannot exist and answer about nothing,
 * instead of the server noticing we do not know who is asking.
 */
export const requesterFromUser = (user) => ({
  companyId: id(user?.companyData?.id),
  companySqlId: id(user?.sqlInfo?.company_id),
  staffMemberId: id(user?.uid ?? user?.id),
  staffMemberSqlId: id(user?.sqlInfo?.staff_id ?? user?.sqlInfo?.id),
});

/**
 * The body for POST /api/admin/assistant/ask.
 *
 * The question, the conversation it continues when there is one, and who is
 * asking in both id forms so the agent can scope its work without a round of
 * lookups first.
 *
 * **The server must verify these four ids against the validated token rather
 * than read them.** They arrive from a browser, so they can be edited before
 * they leave; a server that trusts them lets any staff member ask about
 * another company's data by changing one line in a console. Checked, the same
 * field becomes useful twice over: the agent gets its scope, and a mismatch
 * is a deliberate act that can be refused and recorded.
 *
 * Written down because it is not true yet: the backend told us on 2026-11-23
 * (§5 of their reply) that COMPANY_CONTEXT_MODE -- the control that compares
 * the company in the body against the one in the header -- is in `warn`, so
 * today a mismatch writes a log line and continues. The tripwire described
 * above exists and is not armed. The assistant resolves the company from the
 * session regardless, so nothing here depends on it; what depends on it is
 * whether anyone finds out when the body disagrees.
 *
 * There are also two company headers, not one: `x-company-id` on the Mongo
 * side and `s-company-lq` on the MySQL side. Both are real and both are in
 * CORS. One of them has to be the authoritative resolution for the assistant
 * and the other ignored, or we inherit an ambiguity that today only produces
 * a log line. That choice is the server's to make and to state.
 *
 * Both envelopes are always present, with null for an id we do not have. The
 * agent should never have to branch on whether a key exists -- a null says
 * "we do not know", a missing key is indistinguishable from a bug.
 *
 * Extra keys handed to this function are dropped rather than forwarded, so
 * the contract cannot grow by accident.
 */
export const buildAskRequest = ({ question, conversationId, requester } = {}) => {
  const who = requester ?? {};
  const body = {
    question: text(question).trim(),
    company_id: { nosql: id(who.companyId), sql: id(who.companySqlId) },
    staff_member_id: { nosql: id(who.staffMemberId), sql: id(who.staffMemberSqlId) },
  };
  const conversation = text(conversationId).trim();
  if (conversation.length > 0) body.conversation_id = conversation;
  return body;
};

/**
 * The job id from the 202 answer, or null. Null matters: a job tracked without
 * an id sits in the store for the rest of the session polling nothing, and the
 * user is left watching a spinner that will never resolve.
 */
export const readAskJobId = (body) => {
  const id = body?.jobId ?? body?.data?.jobId;
  return typeof id === "string" && id.length > 0 ? id : null;
};

/** The answer markdown, or an empty string. Never null, so callers can render. */
export const readAnswer = (body) => text(body?.answer ?? body?.data?.answer);

/** The descriptor BackgroundJobsTracker needs for one question. */
export const assistantJob = ({ jobId } = {}) => ({
  jobId,
  type: "assistant-ask",
  successMessage: "Your answer is ready.",
  failureMessage: "The assistant could not answer that.",
  // No `download`: there is no file. A download button on an answer that is
  // already text on the screen would be a button that cannot do anything.
  //
  // Empty `invalidateKeys` on purpose, and it should stay empty for as long as
  // the assistant is read-only: an answer changes nothing on the server, so
  // there is no cached list to refresh. The day it can act is the day this
  // line needs an argument, not a habit.
  invalidateKeys: [],
});

/** What to tell the user when the question could not even be sent. */
export const askStartError = (error) => {
  const status = error?.response?.status;
  if (status === 404) {
    return {
      title: "The server does not have this yet",
      description: `POST /api/admin${ASSISTANT_ASK_PATH} answered 404.`,
    };
  }
  if (status === 401 || status === 403) {
    return {
      title: "The assistant refused the session",
      description: "Sign in again if this is unexpected.",
    };
  }
  if (status === 429) {
    return {
      title: "Too many questions",
      description: "Wait a moment and try again.",
    };
  }
  return {
    title: "Could not ask the assistant",
    description: "The question was not sent.",
  };
};

/**
 * Whether a string is a path inside this application, and nothing else.
 *
 * Deliberately strict, because every rejected form below is a real way to
 * leave the application while looking like an in-app link:
 *
 *   https://…, javascript:, data:  -- a scheme, so not a path at all;
 *   //host, /\host, /\/host        -- protocol-relative, and browsers differ
 *                                     on which slash shapes they accept, so we
 *                                     refuse any second character that is not
 *                                     a plain path character;
 *   inventory                      -- relative, so where it lands depends on
 *                                     where the user happened to be.
 *
 * Leading whitespace is trimmed first: " javascript:" is a scheme too.
 */
const isInAppPath = (value) => {
  const candidate = text(value).trim();
  if (candidate.length < 2) return false;
  if (candidate[0] !== "/") return false;
  if (candidate[1] === "/" || candidate[1] === "\\") return false;
  if (candidate.includes("\\")) return false;
  return true;
};

/**
 * The `sources` of an answer, made safe to render.
 *
 * Every entry comes back as `{ label, path }` where a `path` of null means
 * "show the label as text, not as a link". Refusing the link is not refusing
 * the source: the staff member should still see what the answer leaned on, so
 * they can judge it. Dropping it silently would hide the one clue that an
 * answer was built on something odd.
 *
 * `isKnownRoute` defaults to refusing everything. That is not a placeholder to
 * tidy up later -- it is the behaviour we want until the real route matcher is
 * wired in. A default that accepted paths would mean a mistake in wiring shows
 * up as working links to nowhere, instead of as text.
 */
export const safeSources = (sources, { isKnownRoute = () => false } = {}) => {
  if (!Array.isArray(sources)) return [];
  const safe = [];
  for (const source of sources) {
    const label = text(source?.label).trim().slice(0, LABEL_MAX_CHARS);
    if (label.length === 0) continue;
    const candidate = text(source?.path).trim();
    const usable = isInAppPath(candidate) && isKnownRoute(candidate) === true;
    safe.push({ label, path: usable ? candidate : null });
  }
  return safe;
};
