export const ReturnIcon = ({
  width = "2em",
  height = "2em",
  stroke = "#004EEB",
  fill = "none",
  viewBox = "0 0 24 24",
  className = "",
  style = {},
  isHovered = false,
  hoverStroke = "#155eef",
  ...props
}) => {
  const currentStroke = isHovered ? hoverStroke : stroke;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      fill={fill}
      viewBox={viewBox}
      className={className}
      style={style}
      {...props}
    >
      <path
        stroke={currentStroke}
        d="M2.5 3.333h2.833c2.8 0 4.2 0 5.27.545a5 5 0 0 1 2.185 2.185c.545 1.07.545 2.47.545 5.27v5.334m0 0L9.167 12.5m4.166 4.167L17.5 12.5"
      />
    </svg>
  );
};
  