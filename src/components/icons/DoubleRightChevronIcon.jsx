export const DoubleRightChevronIcon = ({ width = "24", height = "24", viewBox = "0 0 24 24",
    fill = "none",
    stroke = "currentColor",
    strokeWidth = 2 }) => {
    return (<svg width={width} height={height} viewBox={viewBox} fill={fill}>
        <path
            d="M6 17L11 12L6 7M13 17L18 12L13 7"
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>)
}