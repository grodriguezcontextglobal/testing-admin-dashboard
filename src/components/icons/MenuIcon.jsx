const MenuIcon = ({
  width = 24,
  height = 24,
  fill = "none",
  stroke = "currentColor",
  strokeWidth = 2,
}) => {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill={fill}>
      <path
        d="M3 12H21M3 6H21M3 18H21"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default MenuIcon;
