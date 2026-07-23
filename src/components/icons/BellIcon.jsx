export const BellIcon = ({
  width = "1em",
  height = "1em",
  fill = "currentColor",
  viewBox = "0 0 24 24",
  className = "",
  style = {},
  isHovered = false,
  hoverFill = "#3b82f6",
  ...props
}) => {
  const currentFill = isHovered ? hoverFill : fill;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox={viewBox}
      className={className}
      style={style}
      {...props}
    >
      <path
        fill={currentFill}
        d="M12 2a6 6 0 0 0-6 6c0 7-3 9-3 9h18s-3-2-3-9a6 6 0 0 0-6-6m1.73 19a2 2 0 0 1-3.46 0z"
      />
    </svg>
  );
};
