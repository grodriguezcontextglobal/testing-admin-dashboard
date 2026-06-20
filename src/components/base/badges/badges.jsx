const COLOR_MAP = {
  brand:          { bg: "#F9F5FF", text: "#6941C6", dot: "#7F56D9", border: "#E9D7FE" },
  gray:           { bg: "#F2F4F7", text: "#344054", dot: "#667085", border: "#D0D5DD" },
  error:          { bg: "#FEF3F2", text: "#B42318", dot: "#F04438", border: "#FECDCA" },
  warning:        { bg: "#FFFAEB", text: "#B54708", dot: "#F79009", border: "#FEDF89" },
  success:        { bg: "#ECFDF3", text: "#027A48", dot: "#12B76A", border: "#ABEFC6" },
  blue:           { bg: "#EFF8FF", text: "#175CD3", dot: "#2E90FA", border: "#B2DDFF" },
  "blue-light":   { bg: "#F0F9FF", text: "#026AA2", dot: "#0BA5EC", border: "#B9E6FE" },
  indigo:         { bg: "#EEF4FF", text: "#3538CD", dot: "#6172F3", border: "#C7D7FE" },
  purple:         { bg: "#F4F3FF", text: "#5925DC", dot: "#7A5AF8", border: "#D9D6FE" },
  pink:           { bg: "#FDF2FA", text: "#C11574", dot: "#EE46BC", border: "#FCCEEE" },
  orange:         { bg: "#FFF6ED", text: "#C4320A", dot: "#EF6820", border: "#F9DBAF" },
};

/**
 * Untitled UI – BadgeWithDot
 *
 * @param {"pill-color"} [type="pill-color"]
 * @param {"brand"|"gray"|"error"|"warning"|"success"|"blue"|"blue-light"|"indigo"|"purple"|"pink"|"orange"} [color="gray"]
 * @param {"sm"|"md"} [size="sm"]
 * @param {React.ReactNode} children
 * @param {React.CSSProperties} [style]
 */
export const BadgeWithDot = ({ type = "pill-color", color = "gray", size = "sm", children, style = {} }) => {
  const c = COLOR_MAP[color] ?? COLOR_MAP.gray;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: size === "sm" ? "2px 8px" : "4px 10px",
        borderRadius: "9999px",
        backgroundColor: c.bg,
        border: `1px solid ${c.border}`,
        fontSize: size === "sm" ? "12px" : "14px",
        fontWeight: 500,
        lineHeight: "18px",
        color: c.text,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          backgroundColor: c.dot,
          flexShrink: 0,
        }}
      />
      {children}
    </span>
  );
};

export default BadgeWithDot;
