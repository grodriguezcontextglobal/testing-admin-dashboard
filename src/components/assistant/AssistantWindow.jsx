import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { Bot, MessageSquare, Send, X } from "lucide-react";
import BlueButton from "../UX/buttons/BlueButton";
import TextArea from "../UX/inputs/TextArea";
import { useAssistantAsk } from "../../hooks/assistant/useAssistantAsk";
import { ASSISTANT_STUB, FEATURE_ASSISTANT } from "../../config/featureFlags";
import { catalogLabel, clockTime, QUESTION_MAX_CHARS } from "../../pages/assistant/utils/assistant";
import "./assistantWindow.css";

// The staff assistant window.
//
// Nothing here renders HTML from the server. An answer arrives as text and is
// rendered as React children, which escapes it; there is no
// dangerouslySetInnerHTML in this file and there should not be one. The only
// formatting the server composes is `**bold**` around a number, and the hook
// has already split that into runs -- so no markdown library is needed, and
// the day one is chosen it has to be one with raw HTML disabled.
//
// ── The chips are the main interface, not decoration ─────────────────────────
// Matching is keyword-based and the backend says plainly that it will miss
// (BACKEND_assistant_contract_2026-11-24.md §1). A user who guesses the
// phrasing gets an answer and a user who does not gets "unsupported". Showing
// the questions turns that from a guessing game into a menu, and the text box
// becomes the shortcut rather than the only door.
//
// Chips print OUR English label and send the SERVER'S own wording. The label
// the server authored is the one its matcher is guaranteed to understand; the
// label a reader sees should be in the same language as the rest of the app.
//
// ── What makes it read as a conversation ─────────────────────────────────────
// Not the bubbles -- those were already here. The things that were missing:
// a timestamp, so two answers to similar questions can be told apart; a tail
// on the bubble, which is the cheapest signal in interface design that a line
// was said by someone; dots while it works, because a sentence that says
// "working on it" is read once and then becomes furniture; and Enter to send,
// because a composer that needs the mouse is a form, not a chat.

const palette = {
  staff: "var(--blue-dark-600, #155eef)",
  surface: "var(--gray-50, #f9fafb)",
  border: "var(--gray-200, #eaecf0)",
  muted: "var(--gray-500, #667085)",
  faint: "var(--gray-400, #98a2b3)",
  danger: "var(--error-600, #d92d20)",
  notice: "var(--warning-50, #fffaeb)",
  white: "var(--basewhite, #fff)",
};

const Avatar = () => (
  <div
    aria-hidden="true"
    style={{
      flexShrink: 0,
      width: "26px",
      height: "26px",
      borderRadius: "50%",
      background: palette.surface,
      border: `1px solid ${palette.border}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: palette.staff,
    }}
  >
    <Bot size={14} />
  </div>
);

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

const Chip = ({ entry, onPick, disabled }) => (
  <button
    type="button"
    className="assistant-chip"
    disabled={disabled}
    onClick={() => onPick(entry.label || catalogLabel(entry))}
    style={{
      border: `1px solid ${palette.border}`,
      borderRadius: "999px",
      background: palette.white,
      color: palette.staff,
      padding: "6px 11px",
      fontSize: "12px",
      lineHeight: 1.2,
      cursor: disabled ? "default" : "pointer",
      opacity: disabled ? 0.5 : 1,
    }}
  >
    {catalogLabel(entry)}
  </button>
);

const Chips = ({ catalog, onPick, disabled }) =>
  catalog.length === 0 ? null : (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
      {catalog.map((entry) => (
        <Chip key={entry.id} entry={entry} onPick={onPick} disabled={disabled} />
      ))}
    </div>
  );

const Bubble = ({ fromStaff, unknown, children }) => (
  <div
    style={{
      padding: "9px 12px",
      // The tail: the one corner that is square is the one nearest its author.
      borderRadius: fromStaff ? "12px 12px 3px 12px" : "12px 12px 12px 3px",
      background: fromStaff ? palette.staff : palette.surface,
      color: fromStaff ? "#fff" : "inherit",
      border: fromStaff ? "none" : `1px solid ${palette.border}`,
      fontSize: "14px",
      lineHeight: 1.5,
      // The sentence's own line breaks are all the formatting it gets: the
      // lists under a count are newline-separated bullets, not markup.
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
      fontStyle: unknown ? "italic" : "normal",
    }}
  >
    {children}
  </div>
);

const Message = ({ message, onPick, disabled }) => {
  const fromStaff = message.from === "staff";
  const time = clockTime(message.at);
  return (
    <div
      className="assistant-message"
      style={{
        display: "flex",
        gap: "8px",
        alignItems: "flex-start",
        justifyContent: fromStaff ? "flex-end" : "flex-start",
        marginBottom: "14px",
      }}
    >
      {!fromStaff && <Avatar />}
      <div style={{ maxWidth: "82%", minWidth: 0 }}>
        <Bubble fromStaff={fromStaff} unknown={message.unknown}>
          {message.segments.map((segment, index) =>
            segment.bold ? (
              <strong key={index}>{segment.text}</strong>
            ) : (
              <span key={index}>{segment.text}</span>
            )
          )}

          {/* A scoped staff member sees a smaller number than the real one.
              Said out loud, because with no notice they read their own blind
              spot as a fact. */}
          {message.partial && (
            <span
              style={{
                display: "block",
                marginTop: "8px",
                paddingTop: "8px",
                borderTop: `1px solid ${palette.border}`,
                fontSize: "12px",
                color: palette.muted,
              }}
            >
              Showing only the categories assigned to you, so this is partial.
            </span>
          )}

          {message.sources?.length > 0 && (
            <span
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                marginTop: "8px",
                paddingTop: "8px",
                borderTop: `1px solid ${palette.border}`,
              }}
            >
              {message.sources.map((source, index) => (
                <Source key={`${source.label}-${index}`} source={source} />
              ))}
            </span>
          )}
        </Bubble>

        {/* Outside the bubble: a suggestion is an invitation, not something
            the assistant said. */}
        {message.catalog?.length > 0 && (
          <Chips catalog={message.catalog} onPick={onPick} disabled={disabled} />
        )}

        {time && (
          <p
            style={{
              margin: "4px 2px 0",
              fontSize: "11px",
              color: palette.faint,
              textAlign: fromStaff ? "right" : "left",
            }}
          >
            {time}
          </p>
        )}
      </div>
    </div>
  );
};

const Thinking = () => (
  <div
    className="assistant-message"
    style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "14px" }}
  >
    <Avatar />
    <div
      aria-label="The assistant is working on it"
      role="status"
      style={{
        display: "flex",
        gap: "4px",
        alignItems: "center",
        padding: "11px 12px",
        borderRadius: "12px 12px 12px 3px",
        background: palette.surface,
        border: `1px solid ${palette.border}`,
      }}
    >
      <span className="assistant-dot" />
      <span className="assistant-dot" />
      <span className="assistant-dot" />
    </div>
  </div>
);

const AssistantWindow = () => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  // The catalogue is fetched when the panel opens, not on sign-in.
  const { messages, catalog, ask, asking, error, dismissError } = useAssistantAsk({
    enabled: open,
  });
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, asking]);

  // Compiled out of a build where the flag is off, rather than hidden by it.
  if (!FEATURE_ASSISTANT) return null;

  const tooLong = draft.length > QUESTION_MAX_CHARS;
  const canSend = !asking && !tooLong && draft.trim().length > 0;

  const send = async (question) => {
    if (asking) return;
    const asked = typeof question === "string" ? question : draft;
    if (asked.trim().length === 0 || asked.length > QUESTION_MAX_CHARS) return;
    setDraft("");
    await ask(asked);
  };

  // Enter sends, Shift+Enter starts a line. A composer that needs the mouse is
  // a form, not a chat -- and the textarea is here precisely so a long question
  // can have paragraphs.
  const onKeyDown = (event) => {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    if (canSend) send();
  };

  if (!open) {
    return (
      <BlueButton
        title="Ask Devi"
        iconLeading={<MessageSquare size={16} />}
        func={() => setOpen(true)}
        styles={{
          position: "fixed",
          right: "24px",
          bottom: "24px",
          zIndex: 1000,
          width: "auto",
          borderRadius: "999px",
          boxShadow: "0 8px 20px rgba(16, 24, 40, 0.18)",
        }}
      />
    );
  }

  return (
    <section
      aria-label="Staff assistant"
      className="assistant-panel"
      style={{
        position: "fixed",
        right: "24px",
        bottom: "24px",
        zIndex: 1000,
        width: "min(420px, calc(100vw - 32px))",
        height: "min(580px, calc(100vh - 96px))",
        display: "flex",
        flexDirection: "column",
        background: palette.white,
        border: `1px solid ${palette.border}`,
        borderRadius: "16px",
        boxShadow: "0 16px 40px rgba(16, 24, 40, 0.18)",
        overflow: "hidden",
        // Not cosmetic. The app sets text-align: center high up, and inherited
        // centring turns a thread into a poster: ragged on both sides, with no
        // left edge for the eye to come back to. Every line in a conversation
        // starts in the same place. Cut here, at the panel, so the rule stays
        // local to this component and the per-message alignment below (a
        // timestamp hugging its own bubble) still decides its own side.
        textAlign: "left",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "12px 14px",
          borderBottom: `1px solid ${palette.border}`,
        }}
      >
        <Avatar />
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong style={{ display: "block", fontSize: "14px", lineHeight: 1.3 }}>Assistant</strong>
          <span style={{ fontSize: "11px", color: palette.muted }}>
            Answers from your own company&apos;s data
          </span>
        </div>
        <button
          type="button"
          className="assistant-icon-button"
          onClick={() => setOpen(false)}
          aria-label="Close the assistant"
          style={{
            background: "none",
            border: "none",
            borderRadius: "6px",
            padding: "4px",
            display: "flex",
            cursor: "pointer",
            color: palette.muted,
          }}
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
            background: palette.notice,
            borderBottom: `1px solid ${palette.border}`,
            fontSize: "12px",
          }}
        >
          <strong>Invented answers.</strong> This is the stub, not the server.
        </div>
      )}

      <div className="assistant-thread" style={{ flex: 1, overflowY: "auto", padding: "14px" }}>
        {messages.length === 0 && (
          <div style={{ color: palette.muted, fontSize: "13px" }}>
            <p style={{ margin: 0 }}>
              Ask about your own company&apos;s inventory, events, staff or subscription. These are
              the questions it can answer today:
            </p>
            <Chips catalog={catalog} onPick={send} disabled={asking} />
          </div>
        )}
        {messages.map((message) => (
          <Message key={message.id} message={message} onPick={send} disabled={asking} />
        ))}
        {asking && <Thinking />}
        <div ref={endRef} />
      </div>

      {error && (
        <div
          role="alert"
          style={{
            padding: "9px 14px",
            borderTop: `1px solid ${palette.border}`,
            background: "var(--error-25, #fffbfa)",
            color: palette.danger,
            fontSize: "12px",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "8px",
          }}
        >
          <span>{error}</span>
          <button
            type="button"
            className="assistant-icon-button"
            onClick={dismissError}
            aria-label="Dismiss"
            style={{
              background: "none",
              border: "none",
              borderRadius: "6px",
              padding: "2px",
              display: "flex",
              cursor: "pointer",
              color: palette.danger,
            }}
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
        style={{ padding: "10px 12px", borderTop: `1px solid ${palette.border}` }}
      >
        <div style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <TextArea
              id="assistant-question"
              name="question"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder="How many devices are out right now?"
              disabled={asking}
              error={tooLong}
              textAreaProps={{ autoSize: { minRows: 1, maxRows: 5 } }}
              style={{ borderRadius: "10px", minHeight: "40px", resize: "none" }}
            />
          </div>
          {/* A raw button rather than BlueButton: this is a round icon-only
              control sized to the composer row, and BlueButton is built around
              a title with optional icons. Forcing it here would mean fighting
              its own CSS for a shape it does not have. The launcher above IS
              BlueButton, because that one is the shape it was made for. */}
          <button
            type="submit"
            className="assistant-send"
            disabled={!canSend}
            aria-label="Send the question"
            style={{
              flexShrink: 0,
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              border: "none",
              background: palette.staff,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <Send size={16} />
          </button>
        </div>

        {/* The counter appears as the cap comes into view, not before. A number
            that is always on screen is a number nobody reads when it matters. */}
        {draft.length > QUESTION_MAX_CHARS * 0.8 && (
          <p
            style={{
              margin: "6px 2px 0",
              fontSize: "11px",
              textAlign: "right",
              color: tooLong ? palette.danger : palette.faint,
            }}
          >
            {draft.length} / {QUESTION_MAX_CHARS}
          </p>
        )}
      </form>
    </section>
  );
};

export default AssistantWindow;
