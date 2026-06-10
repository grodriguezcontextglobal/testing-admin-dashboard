export const RightChevronIcon = ({
    width = "20",
    height = "20",
    stroke = "#667085",
    strokeWidth = "1",
    isHovered = false,
    hoverStroke,
    viewBox = "0 0 24 24",
    fill = "none",
}) => {
    const currentStroke = isHovered && hoverStroke ? hoverStroke : stroke;
    return (
        <svg width={width} height={height} viewBox={viewBox} fill={fill}>
            <path d="M9 18L15 12L9 6" stroke={currentStroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};