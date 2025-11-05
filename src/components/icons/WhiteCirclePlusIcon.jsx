export const WhiteCirclePlusIcon = ({
  stroke = "#fff",
  viewBox = "0 0 24 24",
  width = "20",
  height = "18",
  hoverStroke = "var(--blue-dark--800)", // Add hover stroke prop
  isHovered = false, // Add hover state prop
}) => {
  return (
    <span
      style={{
        width: "100%",
        aspectRatio: "1/1",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "0.25px 0",
      }}
    >
      <svg width={width} height={height} viewBox={viewBox} fill="none">
        <path
          d="M12 8V16M8 12H16M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
          stroke={isHovered ? hoverStroke : stroke}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
};
