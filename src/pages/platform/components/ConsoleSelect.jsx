import PropTypes from "prop-types";
import { useId } from "react";

/**
 * A labelled dropdown for the console's filter bars (design boards: Client,
 * Plan, Staff member, Date range).
 *
 * A native <select> on purpose: it is keyboard and screen-reader correct
 * without any work, and it is the control the operating system already knows
 * how to render on a phone.
 */
const ConsoleSelect = ({ label, value, options, onChange, disabled, testId }) => {
  const id = useId();
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
      <label
        htmlFor={id}
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: "14px",
          fontWeight: 500,
          color: "var(--gray-600, #5d615a)",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </label>
      <select
        id={id}
        data-testid={testId}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        style={{
          minHeight: "40px",
          maxWidth: "220px",
          padding: "0 10px",
          borderRadius: "var(--radius-md, 8px)",
          border: "1px solid var(--gray-300, #c6c7bb)",
          background: "var(--base-white, #fff)",
          boxShadow: "var(--shadow-xs)",
          fontFamily: "Inter, sans-serif",
          fontSize: "14px",
          fontWeight: 500,
          color: "var(--gray-800, #313732)",
          cursor: disabled ? "default" : "pointer",
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

ConsoleSelect.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    }),
  ).isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  testId: PropTypes.string,
};

export default ConsoleSelect;
