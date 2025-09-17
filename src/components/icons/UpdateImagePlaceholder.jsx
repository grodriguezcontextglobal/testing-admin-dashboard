export const UploadImagePlaceholder = ({
  width = "33",
  height = "32",
  stroke = "#475467",
  strokeWidth = "2",
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
      viewBox="0 0 33 32"
      fill="none"
      className={className}
      style={style}
      {...props}
    >
      <path
        d="M21.8337 8L25.8337 4M25.8337 4L29.8337 8M25.8337 4V12M21.8337 28V26.4C21.8337 24.1598 21.8337 23.0397 21.3977 22.184C21.0142 21.4314 20.4023 20.8195 19.6496 20.436C18.794 20 17.6739 20 15.4337 20H9.56699C7.32678 20 6.20668 20 5.35103 20.436C4.59838 20.8195 3.98646 21.4314 3.60297 22.184C3.16699 23.0397 3.16699 24.1598 3.16699 26.4V28M17.167 10C17.167 12.5773 15.0777 14.6667 12.5003 14.6667C9.923 14.6667 7.83366 12.5773 7.83366 10C7.83366 7.42267 9.923 5.33333 12.5003 5.33333C15.0777 5.33333 17.167 7.42267 17.167 10Z"
        stroke={currentStroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
  
  