export const RightBlueNarrow = ({
  width = "1.2em",
  height = "1.2em",
  stroke = "#155EEF",
  strokeWidth = "1",
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
      viewBox="0 0 24 24"
      className={className}
      style={style}
      {...props}
    >
      <path 
        fill="none" 
        stroke={currentStroke} 
        strokeWidth={strokeWidth}
        d="M5 12h14m-4 4 4-4m-4-4 4 4" 
      />
    </svg>
  );
};
  