export const PlusIcon = ({
  width = "21",
  height = "20",
  stroke = "currentColor",
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
        d="M10.5 4.167v11.666M4.667 10h11.666" 
      />
    </svg>
  );
};
  