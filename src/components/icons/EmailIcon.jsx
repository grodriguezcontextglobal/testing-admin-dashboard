export const EmailIcon = ({
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
        d="M22 6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h16a2 2 0 0 0 2-2zm-2 0-8 5-8-5zm0 12H4V8l8 5 8-5z"
      />
    </svg>
  );
};
  