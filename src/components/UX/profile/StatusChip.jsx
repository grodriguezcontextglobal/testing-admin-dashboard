import PropTypes from "prop-types";
import "./profileShell.css";

/**
 * Semantic status pill. `tone` describes what the reader should do about it —
 * critical (now), warning (soon), success (resolved), neutral (nothing) — and is
 * deliberately independent of the action blue used for selection and CTAs.
 */
const StatusChip = ({ label, tone, pip, title, ...rest }) => (
  <span
    className={`profile-status${tone && tone !== "neutral" ? ` profile-status--${tone}` : ""}`}
    title={title}
    {...rest}
  >
    {pip && <span className="profile-status__pip" aria-hidden="true" />}
    {label}
  </span>
);

StatusChip.propTypes = {
  label: PropTypes.node.isRequired,
  tone: PropTypes.oneOf(["neutral", "critical", "warning", "success", "action"]),
  pip: PropTypes.bool,
  title: PropTypes.string,
};

StatusChip.defaultProps = {
  tone: "neutral",
  pip: false,
  title: undefined,
};

export default StatusChip;
