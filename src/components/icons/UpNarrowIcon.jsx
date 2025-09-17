export const UpNarrowIcon = ({
  width = "20",
  height = "20",
  stroke = "#475467",
  strokeWidth = "1.66667",
  className,
  style,
  isHovered = false,
  hoverStroke,
  ...props
}) => {
  const currentStroke = isHovered && hoverStroke ? hoverStroke : stroke;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      style={style}
      {...props}
    >
      <path
        d="M15 12.5L10 7.5L5 12.5"
        stroke={currentStroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
  