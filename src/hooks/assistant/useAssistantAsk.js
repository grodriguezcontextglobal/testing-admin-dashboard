import { useCallback, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { devitrakApi } from "../../api/devitrakApi";
import { ASSISTANT_STUB } from "../../config/featureFlags";
import {
  answerSegments,
  ASSISTANT_ASK_PATH,
  ASSISTANT_CATALOG_PATH,
  askError,
  buildAskRequest,
  describeAnswer,
  isCompanyUnknown,
  isPartial,
  isUnsupported,
  questionError,
  readCatalog,
  readReply,
  requesterFromUser,
} from "../../pages/assistant/utils/assistant";
import { createAssistantStub } from "../../pages/assistant/utils/stub/assistantStub";

/**
 * One conversation with the staff assistant.
 *
 * ── Why there is no polling here any more ────────────────────────────────────
 * There was, and it was right for the design we had been given: an agent with
 * tool calls takes tens of seconds, so it answered 202 with a job and
 * BackgroundJobsTracker's route reported on it. The backend built something
 * else and said so on 2026-11-24: no agent, no model, a closed catalogue of six
 * questions and one query. It answers in the same request, in milliseconds.
 *
 * So this is an ordinary POST. The polling code was deleted rather than left
 * dormant -- the tracker still owns the pattern for the work that genuinely
 * runs long, and a second copy of it sitting unused in the assistant would read
 * as a feature that exists.
 *
 * ── The three things this hook is careful about ──────────────────────────────
 *   a miss is not an error   -- `question_id: "unsupported"` comes back 200 and
 *                               is the most likely outcome of a keyword matcher.
 *                               It becomes a message with the catalogue in it,
 *                               never the red error strip.
 *   unknown is not zero      -- `data: null` on an understood question means the
 *                               company could not be resolved. Rendering it as a
 *                               count would state a fact nobody checked.
 *   English comes from data  -- `answer` is the server's Spanish convenience;
 *                               `data` is the truth. We build the sentence from
 *                               `data` and keep `answer` as the fallback.
 */
export const useAssistantAsk = ({ enabled = true } = {}) => {
  const { user } = useSelector((state) => state.admin);
  const [messages, setMessages] = useState([]);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState(null);

  // One stub per conversation, created only in a dev server. In a build
  // ASSISTANT_STUB is false at compile time, so this branch and the module
  // behind it are removed rather than merely skipped.
  const stubRef = useRef(null);
  if (ASSISTANT_STUB && !stubRef.current) stubRef.current = createAssistantStub();

  // Fetched when the panel opens, not on sign-in: until the endpoint is
  // deployed this is a 404, and a 404 nobody asked for in every session is
  // noise that teaches people to ignore the console.
  const { data: catalogPayload } = useQuery({
    queryKey: ["assistant", "catalog"],
    queryFn: () =>
      ASSISTANT_STUB
        ? stubRef.current.catalog()
        : devitrakApi.get(ASSISTANT_CATALOG_PATH).then((response) => response.data),
    enabled,
    staleTime: Infinity,
    retry: false,
  });

  const catalog = useMemo(() => readCatalog(catalogPayload), [catalogPayload]);

  const ask = useCallback(
    async (question) => {
      // One question at a time. Not because the server minds, but because two
      // answers landing out of order would read as replies to each other.
      if (asking) return;

      const refusal = questionError(question);
      if (refusal) {
        setError(refusal);
        return;
      }
      setError(null);

      const asked = question.trim();
      const turn = `${Date.now()}`;
      setMessages((thread) => [
        ...thread,
        {
          id: `${turn}-question`,
          from: "staff",
          at: new Date().toISOString(),
          segments: [{ text: asked, bold: false }],
        },
      ]);
      setAsking(true);

      const body = buildAskRequest({ question: asked, requester: requesterFromUser(user) });

      try {
        const payload = ASSISTANT_STUB
          ? stubRef.current.ask(body)
          : await devitrakApi.post(ASSISTANT_ASK_PATH, body).then((res) => res.data);

        const reply = readReply(payload);

        // A miss. Not a failure: showing the questions again turns a guessing
        // game into a menu.
        if (isUnsupported(reply)) {
          setMessages((thread) => [
            ...thread,
            {
              id: `${turn}-answer`,
              from: "assistant",
              at: new Date().toISOString(),
              segments: [
                { text: "I cannot answer that yet. Here is what I can look up:", bold: false },
              ],
              catalog: reply.catalog.length > 0 ? reply.catalog : catalog,
              sources: [],
            },
          ]);
          return;
        }

        // Understood, but the company could not be crossed between the two
        // stores. The sentence has to say unknown, because the alternative a
        // reader will assume is zero.
        if (isCompanyUnknown(reply)) {
          setMessages((thread) => [
            ...thread,
            {
              id: `${turn}-answer`,
              from: "assistant",
              at: new Date().toISOString(),
              unknown: true,
              segments: [
                {
                  text: "Your company could not be identified, so this is unknown — not zero.",
                  bold: false,
                },
              ],
              sources: [],
            },
          ]);
          return;
        }

        const english = describeAnswer(reply);
        setMessages((thread) => [
          ...thread,
          {
            id: `${turn}-answer`,
            from: "assistant",
            at: new Date().toISOString(),
            // Ours when we can build it from `data`; the server's own sentence
            // when we cannot, which is truthful even when it is not in English.
            segments: english ? [{ text: english, bold: false }] : answerSegments(reply.answer),
            partial: isPartial(reply),
            sources: reply.sources,
          },
        ]);
      } catch (failure) {
        const notice = askError(failure);
        setError(`${notice.title}. ${notice.description}`);
      } finally {
        setAsking(false);
      }
    },
    [asking, catalog, user],
  );

  return {
    messages,
    catalog,
    ask,
    asking,
    error,
    dismissError: () => setError(null),
  };
};

export default useAssistantAsk;
