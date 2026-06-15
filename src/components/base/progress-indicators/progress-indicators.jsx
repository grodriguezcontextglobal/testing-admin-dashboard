const labelStyle = {
  margin: "0px",
  fontFamily: "Inter",
  fontSize: "14px",
  fontWeight: 500,
  lineHeight: "20px",
  color: "var(--gray-700, #344054)",
  whiteSpace: "nowrap",
};

/**
 * Linear progress bar.
 *
 * Color shifts blue → warning → success as value approaches max.
 *
 * @param {string}  [label]          - Optional text label
 * @param {"left"|"right"} [labelPosition="right"] - Where to show the percentage label
 * @param {number}  [min=0]
 * @param {number}  [max=100]
 * @param {number}  [value=0]
 */
export const ProgressBar = ({
  label,
  labelPosition = "right",
  min = 0,
  max = 100,
  value = 0,
}) => {
  const pct =
    max > min ? Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100)) : 0;

  const progressColor =
    pct >= 100
      ? "var(--success-600, #039855)"
      : pct >= 75
      ? "var(--warning-500, #F79009)"
      : "var(--blue-600, #1570EF)";

  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%" }}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
    >
      {label && labelPosition !== "right" && (
        <span style={labelStyle}>{label}</span>
      )}
      <div
        style={{
          flex: 1,
          height: "8px",
          borderRadius: "4px",
          background: "var(--gray-100, #F2F4F7)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            borderRadius: "4px",
            background: progressColor,
            transition: "width 0.4s ease, background 0.3s ease",
          }}
        />
      </div>
      {labelPosition === "right" && (
        <span style={{ ...labelStyle, minWidth: "36px", textAlign: "right" }}>
          {Math.round(pct)}%
        </span>
      )}
    </div>
  );
};
