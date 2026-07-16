import { Icon } from "@iconify/react";
import PropTypes from "prop-types";

/**
 * Untitled UI empty state: featured icon in concentric rings, title,
 * supporting text, optional action slot. Use for empty tables, lists,
 * search results, and widgets.
 */
const ring = (size, opacity) => ({
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: size,
  height: size,
  borderRadius: "9999px",
  border: "1px solid var(--gray-200, #ddded6)",
  opacity,
  pointerEvents: "none",
});

const EmptyState = ({ icon, title, description, action, compact }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      padding: compact ? "24px 16px" : "48px 24px",
      width: "100%",
    }}
  >
    <div
      style={{
        position: "relative",
        width: compact ? "40px" : "48px",
        height: compact ? "40px" : "48px",
        marginBottom: compact ? "12px" : "16px",
      }}
    >
      {!compact && (
        <>
          <span style={ring("72px", 0.9)} />
          <span style={ring("104px", 0.6)} />
          <span style={ring("136px", 0.3)} />
        </>
      )}
      <span
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          borderRadius: "10px",
          background: "var(--base-white, #fff)",
          border: "1px solid var(--gray-200, #ddded6)",
          boxShadow: "var(--shadow-xs)",
        }}
      >
        <Icon
          icon={icon}
          width={compact ? 20 : 24}
          color="var(--gray-600, #5d615a)"
        />
      </span>
    </div>
    <p
      style={{
        margin: 0,
        fontFamily: "Inter, sans-serif",
        fontSize: compact ? "14px" : "16px",
        fontWeight: 600,
        color: "var(--gray-900, #171d1a)",
      }}
    >
      {title}
    </p>
    {description && (
      <p
        style={{
          margin: "4px 0 0",
          maxWidth: "352px",
          fontFamily: "Inter, sans-serif",
          fontSize: "14px",
          lineHeight: "20px",
          color: "var(--gray-600, #5d615a)",
        }}
      >
        {description}
      </p>
    )}
    {action && <div style={{ marginTop: "20px" }}>{action}</div>}
  </div>
);

EmptyState.propTypes = {
  icon: PropTypes.string,
  title: PropTypes.node.isRequired,
  description: PropTypes.node,
  action: PropTypes.node,
  compact: PropTypes.bool,
};

EmptyState.defaultProps = {
  icon: "tabler:search",
  compact: false,
};

export default EmptyState;
