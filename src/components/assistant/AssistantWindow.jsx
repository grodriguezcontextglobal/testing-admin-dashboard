import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { MessageSquare, Send, X } from "lucide-react";
import BlueButton from "../UX/buttons/BlueButton";
import Input from "../UX/inputs/Input";
import { useAssistantAsk } from "../../hooks/assistant/useAssistantAsk";
import { ASSISTANT_STUB, FEATURE_ASSISTANT } from "../../config/featureFlags";
import { QUESTION_MAX_CHARS } from "../../pages/assistant/utils/assistant";

// The staff assistant window.
//
// Nothing here renders HTML from the server. The answer arrives as text and is
// rendered as React children, which escapes it; there is no
// dangerouslySetInnerHTML in this file and there should not be one. When a
// markdown renderer is chosen it has to be one with raw HTML disabled, and
// that is a decision to take on purpose rather than inherit from whichever
// library is nearest -- so for now the answer keeps its line breaks and
// nothing else.
//
// The links in `sources` have already been judged by the hook, which hands us
// `path: null` for anything our own route table does not recognise. That is
// everything, today, because no matcher is wired yet. A refused source still
// shows its label: the staff member should see what the answer leaned on even
// when they cannot click through to it.

const palette = {
  staff: "var(--blue-dark-600, #155eef)",
  surface: "var(--gray-50, #f9fafb)",
  border: "var(--gray-200, #eaecf0)",
  muted: "var(--gray-500, #667085)",
  danger: "var(--error-600, #d92d20)",
};

const Source = ({ source }) =>
  source.path ? (
    <Link to={source.path} style={{ color: palette.staff, fontSize: "12px" }}>
      {source.label}
    </Link>
  ) : (
    // Not a link, and deliberately not styled like one: a destination we
    // refused should not look clickable and disabled, it should look like what
    // it is -- the name of a thing the answer leaned on.
    <span style={{ color: palette.muted, fontSize: "12px" }}>{source.label}</span>
  );

const Message = ({ message }) => {
  const fromStaff = message.from === "staff";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: fromStaff ? "flex-end" : "flex-start",
        marginBottom: "12px",
      }}
    >
      <div
        style={{
          maxWidth: "85%",
          padding: "10px 12px",
          borderRadius: "10px",
          background: fromStaff ? palette.staff : palette.surface,
          color: fromStaff ? "#fff" : "inherit",
          border: fromStaff ? "none" : `1px solid ${palette.border}`,
          fontSize: "14px",
          lineHeight: 1.5,
          // The answer's own line breaks are all the formatting it gets until
          // a markdown renderer is chosen deliberately.
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        <span style={message.failed ? { color: palette.danger } : undefined}>{message.text}</span>
        {message.sources?.length > 0 && (
          <div
            style={{
              marginTop: "8px",
              paddingTop: "8px",
              borderTop: `1px solid ${palette.border}`,
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            {message.sources.map((source, index) => (
              <Source key={`${source.label}-${index}`} source={source} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const AssistantWindow = () => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const { messages, ask, asking, error, dismissError } = useAssistantAsk();
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, asking]);

  // Compiled out of a build where the flag is off, rather than hidden by it.
  if (!FEATURE_ASSISTANT) return null;

  const tooLong = draft.length > QUESTION_MAX_CHARS;

  const send = async () => {
    if (asking || tooLong || draft.trim().length === 0) return;
    const question = draft;
    setDraft("");
    await ask(question);
  };

  if (!open) {
    return (
      <BlueButton
        title="Ask the assistant"
        iconLeading={<MessageSquare size={16} />}
        func={() => setOpen(true)}
        styles={{ position: "fixed", right: "24px", bottom: "24px", zIndex: 1000, width: "auto" }}
      />
    );
  }

  return (
    <section
      aria-label="Staff assistant"
      style={{
        position: "fixed",
        right: "24px",
        bottom: "24px",
        zIndex: 1000,
        width: "min(380px, calc(100vw - 48px))",
        height: "min(520px, calc(100vh - 96px))",
        display: "flex",
        flexDirection: "column",
        background: "var(--basewhite, #fff)",
        border: `1px solid ${palette.border}`,
        borderRadius: "12px",
        boxShadow: "0 12px 32px rgba(16, 24, 40, 0.16)",
        overflow: "hidden",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 14px",
          borderBottom: `1px solid ${palette.border}`,
        }}
      >
        <strong style={{ fontSize: "14px" }}>Assistant</strong>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close the assistant"
          style={{ background: "none", border: "none", cursor: "pointer", color: palette.muted }}
        >
          <X size={18} />
        </button>
      </header>

      {ASSISTANT_STUB && (
        // The same rule the console's sample data follows: invented content on
        // screen says so, permanently, where the reader is looking.
        <div
          style={{
            padding: "8px 14px",
            background: "var(--warning-50, #fffaeb)",
            borderBottom: `1px solid ${palette.border}`,
            fontSize: "12px",
          }}
        >
          <strong>Invented answers.</strong> The endpoint does not exist yet; this is the stub.
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", padding: "14px" }}>
        {messages.length === 0 && (
          <p style={{ color: palette.muted, fontSize: "13px", margin: 0 }}>
            Ask about your own company&apos;s devices, events or staff. The assistant reads the same
            data you can see, and it can be wrong — check anything you are about to act on.
          </p>
        )}
        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}
        {asking && (
          <p style={{ color: palette.muted, fontSize: "13px" }}>Working on it…</p>
        )}
        <div ref={endRef} />
      </div>

      {error && (
        <div
          role="alert"
          style={{
            padding: "8px 14px",
            borderTop: `1px solid ${palette.border}`,
            color: palette.danger,
            fontSize: "12px",
            display: "flex",
            justifyContent: "space-between",
            gap: "8px",
          }}
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={dismissError}
            aria-label="Dismiss"
            style={{ background: "none", border: "none", cursor: "pointer", color: palette.danger }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
        style={{ padding: "12px 14px", borderTop: `1px solid ${palette.border}` }}
      >
        <Input
          id="assistant-question"
          name="question"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Which devices are overdue this week?"
          disabled={asking}
          error={tooLong}
          // The cap is shown before the question is spent, not after the
          // server refuses it. The backend asked us to enforce it here too.
          helperText={
            tooLong
              ? `${draft.length} characters. The limit is ${QUESTION_MAX_CHARS}.`
              : undefined
          }
        />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
          <BlueButton
            title="Send"
            buttonType="submit"
            iconTrailing={<Send size={15} />}
            isDisabled={asking || tooLong || draft.trim().length === 0}
            isLoading={asking}
            styles={{ width: "auto" }}
          />
        </div>
      </form>
    </section>
  );
};

export default AssistantWindow;
