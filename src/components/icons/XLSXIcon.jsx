export const XLSXIcon = ({
  width = "1em",
  height = "1em",
  fill = "currentColor",
  className,
  style,
  isHovered = false,
  hoverFill,
  ...props
}) => {
  const currentFill = isHovered && hoverFill ? hoverFill : fill;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 16 16"
      className={className}
      style={style}
      {...props}
    >
      <path
        fill={currentFill}
        d="M14 5v6h-1V5h-2a2 2 0 0 1-1-2V1H4a1 1 0 0 0-1 1v9H2V2a2 2 0 0 1 2-2h6zM8 15a1 1 0 0 0 0 1h2l1-1v-1a1 1 0 0 0-1 0l-1-1v-1l1 1h1a1 1 0 0 0 0-1 1 1 0 0 0-1 0 2 2 0 0 0-1 0H8v2q0 1 0 0h2v1H9zm-4-3h1l-1 2 1 2H4l-1-1-1 1 1-2-1-2 1 1zm2 3h2v1H5v-4h1zm8-3h1l-2 2 2 2h-1l-1-1-1 1h-1l1-2-1-2h1l1 1z"
      />
    </svg>
  );
};
  
  