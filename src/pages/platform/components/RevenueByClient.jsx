import PropTypes from "prop-types";
import { Link } from "react-router";

/**
 * "Revenue by client" (design board Main): one measure across named clients,
 * so a ranked horizontal bar.
 *
 * Deliberate choices:
 * - One series, so one hue and no legend; the section title names the measure.
 * - The amount is written beside each bar instead of behind an axis. With six
 *   rows that is the readable form, and it means the chart is never read by
 *   colour alone.
 * - Bars are measured against the largest, which is what makes a ranking
 *   legible; the share of the total is on hover, because that is the question
 *   people ask next.
 * - The name is a link: a bar you can see but not open is a dead end.
 */
const RevenueByClient = ({ rows }) => (
  <ol
    style={{
      listStyle: "none",
      margin: 0,
      padding: "0 20px 20px",
      display: "grid",
      gap: "14px",
    }}
  >
    {rows.map((row) => (
      <li key={row.companyId} style={{ display: "grid", gap: "6px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <Link
            to={`/platform/clients/${encodeURIComponent(row.companyId)}`}
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "14px",
              fontWeight: 500,
              color: "var(--gray-900, #171d1a)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {row.name}
          </Link>
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--gray-900, #171d1a)",
              fontVariantNumeric: "tabular-nums",
              whiteSpace: "nowrap",
            }}
          >
            {row.amount}
          </span>
        </div>
        <div
          title={`${row.share} of the revenue shown`}
          style={{
            height: "8px",
            borderRadius: "4px",
            background: "var(--gray-100, #eceee9)",
            overflow: "hidden",
          }}
        >
          <div
            role="img"
            aria-label={`${row.name}: ${row.amount}, ${row.share} of the revenue shown`}
            style={{
              width: `${row.width}%`,
              height: "100%",
              borderRadius: "4px",
              background: "var(--blue-dark-600, #155eef)",
            }}
          />
        </div>
      </li>
    ))}
  </ol>
);

RevenueByClient.propTypes = {
  rows: PropTypes.arrayOf(
    PropTypes.shape({
      companyId: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      amount: PropTypes.string.isRequired,
      width: PropTypes.number.isRequired,
      share: PropTypes.string.isRequired,
    }),
  ).isRequired,
};

export default RevenueByClient;
