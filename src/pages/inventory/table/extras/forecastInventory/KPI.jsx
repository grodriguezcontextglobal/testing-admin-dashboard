import PropTypes from "prop-types";

/**
 * The row of numbers the forecast opens with.
 *
 * There used to be a single `KPI` card — "Item Types" — sitting alone in a
 * quarter-width grid column, with the rest of the summary commented out beside
 * it. Everything else the screen knew (peak demand, lowest availability, events
 * in the window) was buried in chip labels further down the page.
 */
const KpiStrip = ({ stats }) => (
  <div className="forecast__kpis">
    {stats.map((stat) => (
      <div
        className={`forecast__kpi forecast__kpi--${stat.tone ?? "neutral"}`}
        key={stat.key}
      >
        <p className="forecast__kpi-label">{stat.label}</p>
        <p className="forecast__kpi-value">
          {Number(stat.value ?? 0).toLocaleString()}
        </p>
        {stat.hint && <p className="forecast__kpi-hint">{stat.hint}</p>}
      </div>
    ))}
  </div>
);

KpiStrip.propTypes = {
  stats: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      hint: PropTypes.string,
      tone: PropTypes.string,
    })
  ).isRequired,
};

export default KpiStrip;
