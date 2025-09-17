export const RightNarrowInCircle = ({
  width = "20",
  height = "20",
  stroke = "#475467",
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
      fill="none"
      className={className}
      style={style}
      {...props}
    >
      <path
        stroke={currentStroke}
        strokeWidth={strokeWidth}
        d="M2.782 5.833a8.333 8.333 0 1 1 0 8.333M10 13.334 13.333 10m0 0L10 6.667M13.333 10H1.667"
      />
    </svg>
  );
};
  