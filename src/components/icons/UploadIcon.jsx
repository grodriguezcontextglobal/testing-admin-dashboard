export const UploadIcon = ({
  width = "21",
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
      viewBox="0 0 21 16"
      fill="none"
      className={className}
      style={style}
      {...props}
    >
      <path
        d="M7.16675 13.3333L10.5001 10M10.5001 10L13.8334 13.3333M10.5001 10V17.5M17.1667 13.9524C18.1847 13.1117 18.8334 11.8399 18.8334 10.4167C18.8334 7.88536 16.7814 5.83333 14.2501 5.83333C14.068 5.83333 13.8976 5.73833 13.8052 5.58145C12.7185 3.73736 10.7121 2.5 8.41675 2.5C4.96497 2.5 2.16675 5.29822 2.16675 8.75C2.16675 10.4718 2.86295 12.0309 3.98921 13.1613"
        stroke={currentStroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
  