import PropTypes from "prop-types";

/**
 * One block of the forecast screen: a title, a line saying what it answers, an
 * optional control on the right, and the content.
 *
 * The screen used to reach for `ReusableCardWithHeaderAndFooter` and then nest
 * more of them inside itself, and used MUI's `InputLabel` — a form control —
 * for section headings. One flat section per question keeps the hierarchy at a
 * single level.
 */
const ForecastSection = ({ title, hint, actions, children }) => (
  <section className="forecast__section">
    <div className="forecast__section-head">
      <div style={{ minWidth: 0 }}>
        <h2 className="forecast__section-title">{title}</h2>
        {hint && <p className="forecast__section-hint">{hint}</p>}
      </div>
      {actions && <div className="forecast__section-actions">{actions}</div>}
    </div>
    {children}
  </section>
);

ForecastSection.propTypes = {
  title: PropTypes.node.isRequired,
  hint: PropTypes.node,
  actions: PropTypes.node,
  children: PropTypes.node,
};

export default ForecastSection;
