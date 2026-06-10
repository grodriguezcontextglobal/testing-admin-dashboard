import { Card, Skeleton, Space } from "antd";

/**
 * SkeletonInventoryCards
 *
 * Placeholder cards shown while inventory data loads. Mirrors the
 * dimensions and chrome of CardLocations so the layout stays stable
 * when the real cards replace them.
 *
 * @param {Object} props
 * @param {number} [props.count=6] - Number of skeleton cards to render.
 */
const SkeletonInventoryCards = ({ count = 6 }) => (
  <Space
    align="start"
    size={[8, 16]}
    wrap
    style={{ maxWidth: "1400px", minWidth: "320px", width: "100%" }}
  >
    {Array.from({ length: count }).map((_, index) => (
      <Card
        key={`skeleton-inventory-card-${index}`}
        style={{
          width: "100%",
          minWidth: "360px",
          borderRadius: "12px",
          border: "1px solid var(--gray-200, #EAECF0)",
          background: "var(--base-white, #FFF)",
          boxShadow:
            "0px 1px 2px 0px rgba(16, 24, 40, 0.06), 0px 1px 3px 0px rgba(16, 24, 40, 0.10)",
          margin: "0 1rem",
        }}
      >
        <Skeleton
          active
          title={{ width: "55%" }}
          paragraph={{ rows: 2, width: ["70%", "100%"] }}
        />
      </Card>
    ))}
  </Space>
);

export default SkeletonInventoryCards;
