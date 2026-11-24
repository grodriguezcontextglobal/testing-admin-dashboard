import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { MessageSquare, Send, X } from "lucide-react";
import BlueButton from "../UX/buttons/BlueButton";
import Input from "../UX/inputs/Input";
import { useAssistantAsk } from "../../hooks/assistant/useAssistantAsk";
import { ASSISTANT_STUB, FEATURE_ASSISTANT } from "../../config/featureFlags";
import { catalogLabel, QUESTION_MAX_CHARS } from "../../pages/assistant/utils/assistant";

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

const palette = {
  staff: "var(--blue-dark-600, #155eef)",
  surface: "var(--gray-50, #f9fafb)",
  border: "var(--gray-200, #eaecf0)",
  muted: "var(--gray-500, #667085)",
  danger: "var(--error-600, #d92d20)",
  notice: "var(--warning-50, #fffaeb)",
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

const Chip = ({ entry, onPick, disabled }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={() => onPick(entry.label || catalogLabel(entry))}
    style={{
      border: `1px solid ${palette.border}`,
      borderRadius: "999px",
      background: "var(--basewhite, #fff)",
      color: palette.staff,
      padding: "5px 10px",
      fontSize: "12px",
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

const Message = ({ message, onPick, disabled }) => {
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
          // The sentence's own line breaks are all the formatting it gets: the
          // lists under a count are newline-separated bullets, not markup.
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {message.segments.map((segment, index) =>
          segment.bold ? (
            <strong key={index}>{segment.text}</strong>
          ) : (
            <span key={index} style={message.unknown ? { color: palette.muted } : undefined}>
              {segment.text}
            </span>
          )
        )}

        {/* A scoped staff member sees a smaller number than the real one.
            Said out loud, because with no notice they read their own blind
            spot as a fact. */}
        {message.partial && (
          <p style={{ margin: "8px 0 0", fontSize: "12px", color: palette.muted }}>
            Showing only the categories assigned to you, so this is partial.
          </p>
        )}

        {message.catalog?.length > 0 && (
          <Chips catalog={message.catalog} onPick={onPick} disabled={disabled} />
        )}

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
  // The catalogue is fetched when the panel opens, not on sign-in.
  const { messages, catalog, ask, asking, error, dismissError } = useAssistantAsk({
    enabled: open,
  });
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, asking]);

  // Compiled out of a build where the flag is off, rather than hidden by it.
  if (!FEATURE_ASSISTANT) return null;

  const tooLong = draft.length > QUESTION_MAX_CHARS;

  const send = async (question) => {
    if (asking) return;
    const asked = typeof question === "string" ? question : draft;
    if (asked.trim().length === 0 || asked.length > QUESTION_MAX_CHARS) return;
    setDraft("");
    await ask(asked);
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
            background: palette.notice,
            borderBottom: `1px solid ${palette.border}`,
            fontSize: "12px",
          }}
        >
          <strong>Invented answers.</strong> This is the stub, not the server.
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", padding: "14px" }}>
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
        {asking && <p style={{ color: palette.muted, fontSize: "13px" }}>Working on it…</p>}
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
          placeholder="How many devices are out right now?"
          disabled={asking}
          error={tooLong}
          // The cap is shown before the question is spent, not after the
          // server refuses it. The backend asked us to enforce it here too.
          helperText={
            tooLong ? `${draft.length} characters. The limit is ${QUESTION_MAX_CHARS}.` : undefined
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
