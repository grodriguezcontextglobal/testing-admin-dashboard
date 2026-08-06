import PropTypes from "prop-types";
import {
  formatLoanDate,
  formatLoanDateTime,
  formatRelativeDay,
} from "./utils/loanStatus";
import "./profileShell.css";

/**
 * A date in a loan table: readable local date on top, relative day underneath,
 * exact timestamp on hover. Replaces printing the raw UTC ISO string, which
 * was both unreadable and quietly in the wrong timezone.
 */
const LoanDateCell = ({ value, showRelative, critical, now }) => {
  const exact = formatLoanDate(value);
  if (!exact) return <span className="profile-date__relative">—</span>;

  return (
    <span title={formatLoanDateTime(value)}>
      <span className="profile-date__exact">{exact}</span>
      {showRelative && (
        <span
          className={`profile-date__relative${critical ? " profile-date__relative--critical" : ""}`}
        >
          {formatRelativeDay(value, now)}
        </span>
      )}
    </span>
  );
};

LoanDateCell.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
  showRelative: PropTypes.bool,
  critical: PropTypes.bool,
  now: PropTypes.instanceOf(Date),
};

LoanDateCell.defaultProps = {
  value: null,
  showRelative: false,
  critical: false,
  now: undefined,
};

export default LoanDateCell;
