import PropTypes from "prop-types";

/**
 * Untitled UI page header: title + supporting text on the left, actions on
 * the right, optional divider below. Drop-in for page tops.
 */
const PageHeader = ({ title, supportingText, actions, divider, children }) => (
  <div style={{ width: "100%" }}>
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "16px",
        flexWrap: "wrap",
        width: "100%",
      }}
    >
      <div style={{ textAlign: "left", minWidth: 0 }}>
        <h1
          style={{
            margin: 0,
            fontFamily: "Inter, sans-serif",
            fontSize: "24px",
            lineHeight: "32px",
            fontWeight: 600,
            color: "var(--gray-900, #171d1a)",
          }}
        >
          {title}
        </h1>
        {supportingText && (
          <p
            style={{
              margin: "4px 0 0",
              fontFamily: "Inter, sans-serif",
              fontSize: "14px",
              lineHeight: "20px",
              color: "var(--gray-600, #5d615a)",
            }}
          >
            {supportingText}
          </p>
        )}
      </div>
      {actions && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            minWidth: 0,
          }}
        >
          {actions}
        </div>
      )}
    </div>
    {children}
    {divider && (
      <div
        style={{
          width: "100%",
          height: "1px",
          background: "var(--gray-200, #ddded6)",
          margin: "20px 0 0",
        }}
      />
    )}
  </div>
);

PageHeader.propTypes = {
  title: PropTypes.node.isRequired,
  supportingText: PropTypes.node,
  actions: PropTypes.node,
  divider: PropTypes.bool,
  children: PropTypes.node,
};

PageHeader.defaultProps = {
  divider: true,
};

export default PageHeader;
