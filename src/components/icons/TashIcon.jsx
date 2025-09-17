export const TrashIcon = ({
  width = "21",
  height = "20",
  fill = "currentColor",
  className = "",
  style = {},
  isHovered = false,
  hoverFill = "#dc2626",
  ...props
}) => {
  const currentFill = isHovered ? hoverFill : fill;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 21 20"
      fill="none"
      className={className}
      style={style}
      {...props}
    >
      <path
        fill={currentFill}
        d="M9 3v1H4v2h1v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6h1V4h-5V3zM7 6h10v13H7zm2 2v9h2V8zm4 0v9h2V8z"
      />
    </svg>
  );
};
  