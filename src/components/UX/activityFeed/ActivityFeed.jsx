import { Icon } from "@iconify/react";
import PropTypes from "prop-types";

/**
 * Untitled UI activity feed: vertical timeline of events with icon nodes,
 * connector line, title/description/timestamp.
 *
 * items: [{ id, icon, iconColor?, title, description?, timestamp, badge? }]
 */
const ActivityFeed = ({ items }) => (
  <div style={{ width: "100%", textAlign: "left" }}>
    {items.map((item, idx) => {
      const isLast = idx === items.length - 1;
      return (
        <div key={item.id} style={{ display: "flex", gap: "12px" }}>
          {/* node + connector */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "40px",
                height: "40px",
                borderRadius: "9999px",
                background: "var(--gray-50, #f7f7f4)",
                border: "1px solid var(--gray-200, #ddded6)",
              }}
            >
              <Icon
                icon={item.icon}
                width={20}
                color={item.iconColor || "var(--gray-600, #5d615a)"}
              />
            </span>
            {!isLast && (
              <span
                style={{
                  flex: 1,
                  width: "2px",
                  minHeight: "16px",
                  margin: "4px 0",
                  borderRadius: "2px",
                  background: "var(--gray-200, #ddded6)",
                }}
              />
            )}
          </div>
          {/* content */}
          <div style={{ paddingBottom: isLast ? 0 : "24px", minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "var(--gray-900, #171d1a)",
                }}
              >
                {item.title}
              </span>
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "12px",
                  color: "var(--gray-500, #777b73)",
                }}
              >
                {item.timestamp}
              </span>
            </div>
            {item.description && (
              <p
                style={{
                  margin: "2px 0 0",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "14px",
                  lineHeight: "20px",
                  color: "var(--gray-600, #5d615a)",
                }}
              >
                {item.description}
              </p>
            )}
          </div>
        </div>
      );
    })}
  </div>
);

ActivityFeed.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      icon: PropTypes.string.isRequired,
      iconColor: PropTypes.string,
      title: PropTypes.node.isRequired,
      description: PropTypes.node,
      timestamp: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default ActivityFeed;
