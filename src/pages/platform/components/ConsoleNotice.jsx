import PropTypes from "prop-types";
import { Info, ShieldAlert } from "lucide-react";

const TONES = {
  privacy: {
    Icon: ShieldAlert,
    border: "var(--warning-300, #fec84b)",
    background: "var(--warning-50, #fffaeb)",
    color: "var(--warning-800, #93370d)",
  },
  info: {
    Icon: Info,
    border: "var(--gray-300, #c6c7bb)",
    background: "var(--gray-50, #f7f7f4)",
    color: "var(--gray-700, #414840)",
  },
};

/**
 * A standing note on a console screen: what this page is, or what the server
 * records when you open it. Not dismissible on purpose — a warning somebody
 * can click away is a warning that is not there.
 */
const ConsoleNotice = ({ children, tone, testId }) => {
  const { Icon, border, background, color } = TONES[tone] ?? TONES.info;
  return (
    <div
      role="note"
      data-testid={testId}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        padding: "10px 14px",
        borderRadius: "var(--radius-md, 8px)",
        border: `1px solid ${border}`,
        background,
        color,
        fontFamily: "Inter, sans-serif",
        fontSize: "14px",
        lineHeight: "20px",
        boxSizing: "border-box",
        width: "100%",
      }}
    >
      <Icon size={18} aria-hidden="true" style={{ flexShrink: 0, marginTop: "1px" }} />
      <span style={{ minWidth: 0 }}>{children}</span>
    </div>
  );
};

ConsoleNotice.propTypes = {
  children: PropTypes.node.isRequired,
  tone: PropTypes.oneOf(["privacy", "info"]),
  testId: PropTypes.string,
};

export default ConsoleNotice;
