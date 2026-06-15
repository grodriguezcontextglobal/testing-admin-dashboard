const SIZE_MAP = {
  xs: { viewSize: 80,  strokeWidth: 8  },
  sm: { viewSize: 100, strokeWidth: 10 },
  md: { viewSize: 120, strokeWidth: 12 },
  lg: { viewSize: 160, strokeWidth: 14 },
  xl: { viewSize: 200, strokeWidth: 16 },
};

/**
 * Half-circle (speedometer) progress indicator.
 *
 * The arc opens at the bottom and fills left-to-right from 0 → max.
 * Color shifts blue → warning → success as value approaches max.
 *
 * @param {"xs"|"sm"|"md"|"lg"|"xl"} size
 * @param {number} min
 * @param {number} max
 * @param {number} value
 */
export const ProgressBarHalfCircle = ({ size = "md", min = 0, max = 100, value = 0 }) => {
  const { viewSize, strokeWidth } = SIZE_MAP[size] ?? SIZE_MAP.md;

  const cx = viewSize / 2;
  const cy = viewSize / 2;
  // Shrink radius so the stroke cap fits entirely in the viewBox width
  const radius = cx - strokeWidth / 2 - 4;
  const halfCircumference = Math.PI * radius;

  const pct = max > min ? Math.max(0, Math.min(1, (value - min) / (max - min))) : 0;
  // rotate(180) → arc starts at 9 o'clock, traces top half clockwise to 3 o'clock
  // dashoffset shifts from the right; 0 = full arc, halfCircumference = empty
  const dashOffset = halfCircumference * (1 - pct);

  // Clip the SVG to the top half only (+ enough room for the stroke caps)
  const svgHeight = cy + strokeWidth / 2 + 4;

  const trackColor = "var(--gray-100, #F2F4F7)";
  const progressColor =
    pct >= 1
      ? "var(--success-600, #039855)"
      : pct >= 0.75
      ? "var(--warning-500, #F79009)"
      : "var(--blue-600, #1570EF)";

  const sharedCircleProps = {
    cx,
    cy,
    r: radius,
    fill: "none",
    strokeWidth,
    strokeLinecap: "round",
    strokeDasharray: `${halfCircumference} ${halfCircumference}`,
    transform: `rotate(180 ${cx} ${cy})`,
  };

  return (
    <svg
      width={viewSize}
      height={svgHeight}
      viewBox={`0 0 ${viewSize} ${svgHeight}`}
      aria-label={`Progress ${Math.round(pct * 100)}%`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
    >
      {/* Track */}
      <circle {...sharedCircleProps} stroke={trackColor} strokeDashoffset={0} />
      {/* Progress */}
      <circle
        {...sharedCircleProps}
        stroke={progressColor}
        strokeDashoffset={dashOffset}
        style={{ transition: "stroke-dashoffset 0.4s ease, stroke 0.3s ease" }}
      />
    </svg>
  );
};
