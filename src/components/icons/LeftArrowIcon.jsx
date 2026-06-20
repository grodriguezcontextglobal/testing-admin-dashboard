export const LeftArrowIcon = ({ size = 24, stroke = "currentColor" }) => {
  return (
<svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
        d="M20 12H4M4 12L10 18M4 12L10 6"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    />
</svg>
  );
};