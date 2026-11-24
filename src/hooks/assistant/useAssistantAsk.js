import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { devitrakApi, devitrakApiAdmin } from "../../api/devitrakApi";
import { ASSISTANT_STUB } from "../../config/featureFlags";
import {
  ASSISTANT_ASK_PATH,
  askStartError,
  buildAskRequest,
  isJobFinished,
  questionError,
  readAnswer,
  readAskJobId,
  requesterFromUser,
  safeSources,
} from "../../pages/assistant/utils/assistant";
import { createAssistantStub } from "../../pages/assistant/utils/stub/assistantStub";

/**
 * One conversation with the staff assistant.
 *
 * The shape is the one this dashboard already uses for long work, and the
 * backend confirmed on 2026-11-23 that both halves of it already exist on
 * their side: POST /api/admin/assistant/ask answers 202 with a job id, and
 * GET /api/jobs/owned/:jobId -- the route BackgroundJobsTracker has been
 * polling for months -- reports on it and refuses a job that is not yours.
 *
 * ── Why this polls instead of handing the job to BackgroundJobsTracker ──────
 * The tracker exists for work whose result is somewhere else: a file to
 * download, a list to refresh. It notifies and gets out of the way. An answer
 * is not somewhere else -- it is text that belongs in the conversation that
 * produced it, and the job store keeps descriptors, not results, so the
 * tracker could not hand it over even if we asked.
 *
 * A notification saying "your answer is ready" with no way to read it is
 * exactly the broken promise the exports already had once, and the comment at
 * the top of platformExports.js is the record of fixing it. So the window
 * polls while it is open, and `assistantJob` stays unused in the utils until
 * there is a notification that can reopen this window -- at which point it
 * has something true to say.
 *
 * Sources are made safe here rather than in the component, so no screen can
 * render a link this hook has not already judged.
 */
export const useAssistantAsk = () => {
  const { user } = useSelector((state) => state.admin);
  const [messages, setMessages] = useState([]);
  const [jobId, setJobId] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [error, setError] = useState(null);

  // One stub per conversation, created only in a dev server. In a build
  // ASSISTANT_STUB is false at compile time, so this branch and the module
  // behind it are removed rather than merely skipped.
  const stubRef = useRef(null);
  if (ASSISTANT_STUB && !stubRef.current) stubRef.current = createAssistantStub();

  // Guards the effect below, which runs on every poll: without it, a finished
  // job appends its answer again on each render until the window is closed.
  const handledRef = useRef(null);

  const { data } = useQuery({
    queryKey: ["assistant", "job", jobId],
    queryFn: () =>
      ASSISTANT_STUB
        ? stubRef.current.status(jobId)
        : devitrakApi.get(`/jobs/owned/${jobId}`).then((response) => response.data),
    enabled: Boolean(jobId),
    // react-query v4, where this callback is handed the data itself. The
    // tracker does the same; on v5 it would be the query object instead, and
    // the predicate would quietly never be true.
    refetchInterval: (latest) => (isJobFinished(latest?.status) ? false : 3000),
    refetchIntervalInBackground: true,
    retry: false,
  });

  useEffect(() => {
    if (!data || !isJobFinished(data.status) || handledRef.current === jobId) return;
    handledRef.current = jobId;
    setJobId(null);

    if (data.status !== "done") {
      setMessages((thread) => [
        ...thread,
        {
          id: `${handledRef.current}-answer`,
          from: "assistant",
          failed: true,
          text: "The assistant could not answer that. Try asking again.",
          sources: [],
        },
      ]);
      return;
    }

    const result = data.result ?? data;
    if (result?.conversation_id) setConversationId(result.conversation_id);
    setMessages((thread) => [
      ...thread,
      {
        id: `${handledRef.current}-answer`,
        from: "assistant",
        failed: false,
        text: readAnswer(result),
        sources: safeSources(result?.sources),
      },
    ]);
  }, [data, jobId]);

  const ask = useCallback(
    async (question) => {
      // One question at a time. A second POST while the first is unanswered
      // would orphan the first job: its id is gone, so nothing would ever read
      // the answer the server is still working on.
      if (jobId) return;

      const refusal = questionError(question);
      if (refusal) {
        setError(refusal);
        return;
      }
      setError(null);

      const asked = question.trim();
      setMessages((thread) => [
        ...thread,
        { id: `${Date.now()}-question`, from: "staff", text: asked, sources: [] },
      ]);

      const body = buildAskRequest({
        question: asked,
        conversationId,
        requester: requesterFromUser(user),
      });

      try {
        const accepted = ASSISTANT_STUB
          ? stubRef.current.ask(body)
          : await devitrakApiAdmin.post(ASSISTANT_ASK_PATH, body).then((res) => res.data);

        const accepted_id = readAskJobId(accepted);
        if (!accepted_id) {
          // Stop rather than wait. A job tracked without an id polls nothing
          // for the rest of the session behind a spinner that cannot resolve.
          setError("The server took the question but sent no job to follow.");
          return;
        }
        setJobId(accepted_id);
      } catch (failure) {
        const notice = askStartError(failure);
        setError(`${notice.title}. ${notice.description}`);
      }
    },
    [conversationId, jobId, user],
  );

  return {
    messages,
    ask,
    asking: Boolean(jobId),
    error,
    dismissError: () => setError(null),
  };
};

export default useAssistantAsk;
