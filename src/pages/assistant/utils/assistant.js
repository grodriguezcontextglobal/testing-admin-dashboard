// Staff assistant: what we send, what we accept back, and what we refuse.
// Pure -- no React, no api client, no store. There is a test asserting this
// file imports nothing, because the rules about untrusted server text live
// here and have to stay testable without mocking anything.
//
// ── What this file used to assume, and what it says now ──────────────────────
// It was written against FRONTEND_assistant_three_questions_2026-11-23.md: an
// agent with tool calls, answering 202 with a job to poll, returning markdown
// and in-app `sources`. The backend built something else and told us on
// 2026-11-24 (BACKEND_assistant_contract_2026-11-24.md). Three differences,
// each of which deletes code rather than adds it:
//
//   synchronous   -- no 202, no job, no polling. There is no model and no agent:
//                    the question is matched against a closed catalogue of six
//                    questions and one query runs. It answers in milliseconds.
//   own namespace -- /api/assistant/ask, not /api/admin/assistant/ask, and it
//                    resolves the company from `s-company-lq` (see the matching
//                    line in api/sessionHeaders.js, without which every request
//                    is a 400).
//   a catalogue   -- matching is keyword-based in Spanish and English, and it
//                    will miss. Missing is a 200 with `question_id:
//                    "unsupported"` and the catalogue inlined, not an error.
//
// ── What is still untrusted ──────────────────────────────────────────────────
// Less than before, and for a reason worth writing down: `answer` is composed
// by the server from the same numbers it puts in `data`, deterministically, so
// it cannot say anything `data` does not. No model sees the question. That
// removes the injection surface, it does not remove the rendering rule -- the
// answer is still text, still rendered as React children, never as HTML, and
// `safeSources` is still here for the day the links arrive (§9: not yet).

/** POST. The whole body is `{ question }`. Its own namespace, not /api/admin. */
export const ASSISTANT_ASK_PATH = "/assistant/ask";

/** GET. What it knows how to look up, for the chips shown before anyone types. */
export const ASSISTANT_CATALOG_PATH = "/assistant/catalog";

/** The `question_id` the server sends when its matcher found nothing. */
export const UNSUPPORTED_QUESTION_ID = "unsupported";

/**
 * The backend's cap, enforced here too as they asked: a user who sees the limit
 * before spending a request has a better time than one who sees a 400 after.
 * It also bounds how much text a single question can carry.
 *
 * Their rate limit -- 10 questions per 10 minutes per staff member -- is
 * deliberately NOT modelled here. A client-side copy of a server limit is a
 * second source of truth that drifts; we render the 429 instead (askError).
 */
export const QUESTION_MAX_CHARS = 1000;

/** A source label names a thing. It is not a place for prose. */
export const LABEL_MAX_CHARS = 80;

const text = (value) => (typeof value === "string" ? value : "");
const count = (value) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

/**
 * Why the question cannot be sent, or null when it can.
 *
 * Checked here rather than only on the server because the cheapest refusal is
 * the one that never leaves the browser, and because a rate-limited user who
 * burns one of ten requests on a 2,000-character paste learns nothing from the
 * 400 that comes back.
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
 * Mongo id and a SQL id (CLAUDE.md, "Session Headers"). The staff SQL id
 * follows the fallback the dashboard already uses when it writes `created_by`.
 */
export const requesterFromUser = (user) => ({
  companyId: id(user?.companyData?.id),
  companySqlId: id(user?.sqlInfo?.company_id),
  staffMemberId: id(user?.uid ?? user?.id),
  staffMemberSqlId: id(user?.sqlInfo?.staff_id ?? user?.sqlInfo?.id),
});

/**
 * The body for POST /api/assistant/ask.
 *
 * The server's whole body is `{ question }`. The ids are still sent, and this
 * comment is here so nobody mistakes that for the server needing them:
 *
 * The backend confirmed on 2026-11-24 (§3) that `company_id` and
 * `staff_member_id` are **never read** -- not validated and then ignored: the
 * controller hands the company resolver a view of the request with `body` and
 * `query` emptied. The staff identity comes from the signed JWT and the company
 * from the `s-company-lq` header.
 *
 * So the reason they were added -- give the agent its scope without a round of
 * lookups, and make a forged id a tripwire rather than a field nobody checks --
 * does not apply to this version: there is no agent, and nothing reads the
 * field to be tripped by it. They are kept because they are harmless and
 * because the decision to send them was taken deliberately; dropping them is a
 * one-line change whenever we want one fewer copy of a fact that already
 * arrives twice.
 *
 * No `conversation_id`: §9 says there is none, so every question is matched on
 * its own. Sending a field the server does not have would be us describing a
 * feature that does not exist.
 */
export const buildAskRequest = ({ question, requester } = {}) => {
  const who = requester ?? {};
  return {
    question: text(question).trim(),
    company_id: { nosql: id(who.companyId), sql: id(who.companySqlId) },
    staff_member_id: { nosql: id(who.staffMemberId), sql: id(who.staffMemberSqlId) },
  };
};

/**
 * One catalogue entry, or null. The label is the server's Spanish text; the
 * English one this dashboard shows is chosen by `catalogLabel` below.
 */
const readEntry = (entry) => {
  const entryId = text(entry?.id).trim();
  if (entryId.length === 0) return null;
  return { id: entryId, label: text(entry?.label).trim().slice(0, LABEL_MAX_CHARS) };
};

/** The catalogue, from either endpoint: GET /catalog, or inlined in a miss. */
export const readCatalog = (payload) => {
  const list = Array.isArray(payload)
    ? payload
    : payload?.catalog ?? payload?.data?.catalog ?? payload?.data;
  if (!Array.isArray(list)) return [];
  return list.map(readEntry).filter(Boolean);
};

/**
 * One answer, normalised.
 *
 * `data` keeps `null` as a value rather than becoming `{}`: §5 says a company
 * registered in SQL inventory that cannot be crossed with its Mongo record
 * comes back as `data: null`, and that means UNKNOWN. Collapsing it into an
 * empty object would let a caller read a missing count as zero, which is a
 * different sentence about the business.
 */
export const readReply = (payload) => ({
  questionId: text(payload?.question_id).trim() || UNSUPPORTED_QUESTION_ID,
  answer: text(payload?.answer),
  data: payload?.data ?? null,
  scope: payload?.scope ?? null,
  params: payload?.params ?? {},
  catalog: readCatalog(payload),
  // None today (§9) -- they arrive once questions return lists rather than
  // counts. Read through safeSources from the start so the first one that ever
  // arrives is already judged rather than trusted.
  sources: safeSources(payload?.sources),
});

/** The matcher found nothing. A normal outcome, and a 200. */
export const isUnsupported = (reply) => reply?.questionId === UNSUPPORTED_QUESTION_ID;

/**
 * The question was understood but the company could not be resolved. Must not
 * be rendered as zero: unknown and none are different answers.
 */
export const isCompanyUnknown = (reply) =>
  Boolean(reply) && !isUnsupported(reply) && reply.data === null;

/**
 * The answer covers only part of the company's data, because the staff member
 * is scoped to certain categories.
 *
 * Worth saying out loud on screen. A `category_assistant` sees a smaller number
 * than the real one, and with no notice they read their own blind spot as a
 * fact -- the same reasoning that had us drop the Overdue tile, except a
 * sentence hides it less badly than an empty tile does.
 */
export const isPartial = (reply) => reply?.scope?.scoped === true;

/**
 * `answer` is markdown, and the only markdown the server composes is `**bold**`
 * around a number. Split into runs rather than parse: each run is rendered as a
 * React child, so there is no HTML anywhere in the path and nothing to escape.
 *
 * An unclosed `**` keeps its asterisks instead of making the rest of the
 * sentence bold -- a stray marker should look like a typo, not change the
 * reading of the text after it.
 */
export const answerSegments = (answer) => {
  const parts = text(answer).split("**");
  if (parts.length % 2 === 0) return [{ text: text(answer), bold: false }];
  return parts
    .map((part, index) => ({ text: part, bold: index % 2 === 1 }))
    .filter((segment) => segment.text.length > 0);
};

/**
 * The clock time to print under a message, or "" when there is nothing to
 * print.
 *
 * Empty rather than "Invalid Date" for a timestamp we cannot read: a line of
 * metadata that cannot be trusted should disappear, not shout. The locale and
 * zone are the reader's by default and are arguments only so a test can pin
 * them -- a fixed locale here would show one staff member a time in a format
 * nobody around them uses.
 */
export const clockTime = (at, { locale, timeZone } = {}) => {
  if (typeof at !== "string" && typeof at !== "number") return "";
  const moment = new Date(at);
  if (Number.isNaN(moment.getTime())) return "";
  return moment.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", timeZone });
};

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

const RANGE_LABELS = { "7d": "7 days", "30d": "30 days", "90d": "90 days" };

const bullets = (items) => items.map((line) => `• ${line}`).join("\n");

/**
 * The English sentence this dashboard shows, built from `data`.
 *
 * Two reasons this exists rather than rendering `answer` straight:
 *
 *   `answer` is in Spanish today (§4). Every other string in this dashboard is
 *   in English, and a chat bubble is not the place to make an exception.
 *   The backend offered language negotiation and did not guess; asking for it
 *   is in the reply note.
 *
 *   `data` is the source of truth and `answer` is a convenience (§4, their
 *   words). Rendering from `data` is language-neutral and survives them
 *   rewording a sentence.
 *
 * Returns null when the shape is not one we know -- a new `question_id`, or a
 * field missing. The caller then falls back to the server's own sentence, which
 * is always truthful even when it is not in our language. Guessing at a shape
 * we do not recognise would be the one way to put a wrong number on screen.
 */
export const describeAnswer = (reply) => {
  const data = reply?.data;
  if (!data || typeof data !== "object") return null;

  switch (reply.questionId) {
    case "company_inventory_summary": {
      const total = count(data.deviceCount);
      const out = count(data.devicesOut);
      const stored = count(data.inWarehouse);
      if (total === null || out === null || stored === null) return null;
      return `${plural(total, "device", "devices")} in total: ${out} out and ${stored} in the warehouse.`;
    }
    case "company_devices_out": {
      const out = count(data.devicesOut);
      if (out === null) return null;
      return `${out} ${out === 1 ? "device is" : "devices are"} out of the warehouse right now.`;
    }
    case "company_events_active": {
      const active = count(data.activeEvents);
      if (active === null) return null;
      const names = Array.isArray(data.events) ? data.events.filter(Boolean) : [];
      const headline = `${plural(active, "active event", "active events")}.`;
      return names.length > 0 ? `${headline}\n${bullets(names)}` : headline;
    }
    case "company_staff_list": {
      const total = count(data.staffCount);
      if (total === null) return null;
      const people = Array.isArray(data.staff) ? data.staff : [];
      const lines = people
        .map((person) => {
          const name = text(person?.name).trim();
          if (name.length === 0) return null;
          const role = text(person?.role).trim();
          return role.length > 0 ? `${name} — ${role}` : name;
        })
        .filter(Boolean);
      const headline = `${plural(total, "staff member", "staff members")}.`;
      return lines.length > 0 ? `${headline}\n${bullets(lines)}` : headline;
    }
    case "company_subscription_status": {
      const plan = text(data.plan).trim();
      const status = text(data.status).trim();
      if (plan.length === 0 || status.length === 0) return null;
      return `Plan ${plan}, status ${status}.`;
    }
    case "company_activity_recent": {
      const entries = count(data.count);
      if (entries === null) return null;
      const range = RANGE_LABELS[text(data.range).trim()] ?? "the selected period";
      const rows = Array.isArray(data.activity) ? data.activity : [];
      const lines = rows
        .map((row) => {
          const summary = text(row?.summary).trim();
          if (summary.length === 0) return null;
          const actor = text(row?.actor).trim();
          return actor.length > 0 ? `${summary} — ${actor}` : summary;
        })
        .filter(Boolean);
      const headline = `${plural(entries, "entry", "entries")} in the last ${range}.`;
      return lines.length > 0 ? `${headline}\n${bullets(lines)}` : headline;
    }
    default:
      return null;
  }
};

/** The English chip labels, so the catalogue reads like the rest of the app. */
const CATALOG_LABELS = {
  company_inventory_summary: "Inventory summary",
  company_devices_out: "Devices out of the warehouse",
  company_events_active: "Active events",
  company_staff_list: "Staff members",
  company_subscription_status: "Subscription status",
  company_activity_recent: "Recent activity",
};

/**
 * What to print on a chip. Ours when we know the question, the server's label
 * otherwise -- a catalogue entry we have never seen should still be offerable,
 * in whatever language it arrives in, rather than silently missing.
 */
export const catalogLabel = (entry) =>
  CATALOG_LABELS[entry?.id] ?? text(entry?.label).trim();

/**
 * How long until the user may ask again, in seconds, or null.
 *
 * Read from the standard RateLimit-* headers the limiter sends (§7). Axios
 * lower-cases header names. `Retry-After` wins when both are present: it is the
 * one that answers this question directly.
 */
export const retryAfterSeconds = (error) => {
  const headers = error?.response?.headers ?? {};
  const raw = headers["retry-after"] ?? headers["ratelimit-reset"];
  const seconds = Number(raw);
  return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : null;
};

/**
 * What to tell the user when the question could not be answered.
 *
 * The server's own `msg` is used where it has one: §8 lists them and they are
 * written in English and for a reader. Replacing a specific sentence with a
 * generic one of ours would be losing information on purpose.
 */
export const askError = (error) => {
  const status = error?.response?.status;
  const serverMessage = text(error?.response?.data?.msg).trim();

  if (status === 429) {
    const seconds = retryAfterSeconds(error);
    return {
      title: "Too many questions",
      description: seconds
        ? `You can ask again in ${seconds} ${seconds === 1 ? "second" : "seconds"}.`
        : "The limit is 10 questions every 10 minutes. Try again shortly.",
    };
  }
  if (status === 400) {
    return {
      title: "The assistant refused the question",
      description: serverMessage || "Check the question and try again.",
    };
  }
  if (status === 401 || status === 403) {
    return {
      title: "The assistant refused the session",
      description: serverMessage || "Sign in again if this is unexpected.",
    };
  }
  if (status === 404) {
    return {
      title: "The server does not have this yet",
      description: `POST /api${ASSISTANT_ASK_PATH} answered 404.`,
    };
  }
  if (status === 500) {
    // Worth its own sentence rather than "something went wrong". Every answered
    // question writes an audit row BEFORE the reply is sent, and a failed write
    // means the question is not answered: a read that leaves no trace is not
    // served (§8). Rare, and not a bug when it happens.
    return {
      title: "The assistant could not answer",
      description: serverMessage || "Try the question again.",
    };
  }
  return {
    title: "Could not reach the assistant",
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
 * §9: there are none yet -- they arrive once questions return lists rather than
 * counts, built from the server's route table. This stays, unwired, because the
 * rule is easier to keep than to rediscover, and because the day a link does
 * arrive is not the day to start thinking about whether it may be clicked.
 *
 * Every entry comes back as `{ label, path }` where a `path` of null means
 * "show the label as text, not as a link". Refusing the link is not refusing
 * the source: the staff member should still see what the answer leaned on.
 *
 * `isKnownRoute` defaults to refusing everything. That is not a placeholder to
 * tidy up later -- a default that accepted paths would mean a mistake in wiring
 * shows up as working links to nowhere, instead of as text.
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
