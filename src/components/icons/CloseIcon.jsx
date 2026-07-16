export const CloseIcon = ({
  fill = "none",
  stroke = "currentColor",
  strokeWidth = 48,
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 512 512"
    >
      <path
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        d="M368 368 144 144m224 0L144 368"
      />
    </svg>
  );
};
