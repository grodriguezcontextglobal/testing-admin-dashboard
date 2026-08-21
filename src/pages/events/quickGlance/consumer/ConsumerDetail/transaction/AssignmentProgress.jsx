import PropTypes from "prop-types";
import { StatusChip } from "../../../../../../components/UX/profile";
import "../../consumerDetail.css";

/**
 * How much of this transaction has actually been handed over.
 *
 * The old version printed a sentence — "Total Qty Requested: 4 • Assigned: 1 •
 * Remaining: 3" — in three different hard-coded colours, above a list where
 * every line repeated the same three numbers as three coloured pills. Eleven
 * numbers to answer one question.
 *
 * Now: one meter for the transaction, and a per-type line only when there is
 * more than one type to disambiguate. The arithmetic lives in
 * utils/transactionAssignment.js and is tested there.
 */
const AssignmentProgress = ({ summary }) => {
  const { rows, totals, isComplete } = summary;

  if (totals.requested === 0 && totals.assigned === 0) return null;

  const percent =
    totals.requested === 0
      ? 100
      : Math.min(Math.round((totals.assigned / totals.requested) * 100), 100);

  return (
    <div className="assignment" data-testid="assignment-progress">
      <div className="assignment__summary">
        <span className="assignment__count">
          {totals.assigned} of {totals.requested} assigned{" "}
          {totals.remaining > 0 && (
            <em>
              · {totals.remaining} still to scan
            </em>
          )}
        </span>
        {isComplete ? (
          <StatusChip tone="success" pip label="Complete" />
        ) : (
          <StatusChip tone="warning" pip label="Incomplete" />
        )}
      </div>

      <div
        className={`assignment__meter${
          isComplete ? " assignment__meter--complete" : ""
        }`}
        role="progressbar"
        aria-valuenow={totals.assigned}
        aria-valuemin={0}
        aria-valuemax={totals.requested}
        aria-label="Devices assigned on this transaction"
      >
        <span style={{ width: `${percent}%` }} />
      </div>

      {/* One device type needs no breakdown — the meter already said it. */}
      {rows.length > 1 && (
        <ul className="assignment__lines">
          {rows.map((row) => (
            <li className="assignment__line" key={row.deviceType}>
              <span className="assignment__type">{row.deviceType}</span>
              <span className="assignment__tally">
                {row.assigned} / {row.requested}
                {row.remaining > 0 && (
                  <StatusChip
                    tone="warning"
                    label={`${row.remaining} left`}
                  />
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

AssignmentProgress.propTypes = {
  summary: PropTypes.shape({
    rows: PropTypes.arrayOf(
      PropTypes.shape({
        deviceType: PropTypes.string,
        requested: PropTypes.number,
        assigned: PropTypes.number,
        remaining: PropTypes.number,
      })
    ),
    totals: PropTypes.shape({
      requested: PropTypes.number,
      assigned: PropTypes.number,
      remaining: PropTypes.number,
    }),
    isComplete: PropTypes.bool,
  }).isRequired,
};

export default AssignmentProgress;
