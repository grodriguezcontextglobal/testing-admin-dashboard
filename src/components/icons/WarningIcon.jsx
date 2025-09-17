export const WarningIcon = ({
  width = "1em",
  height = "1em",
  fill = "currentColor",
  color, // Keep for backward compatibility
  className,
  style,
  isHovered = false,
  hoverFill,
  ...props
}) => {
  // Prioritize color prop for backward compatibility, then fill, then default
  const baseFill = color || fill;
  const currentFill = isHovered && hoverFill ? hoverFill : baseFill;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 24 24"
      className={className}
      style={style}
      {...props}
    >
      <path
        fill={currentFill}
        d="M12 2L1 21h22M12 6l7.53 13H4.47M11 10v4h2v-4m-2 6v2h2v-2"
      />
    </svg>
  );
};
