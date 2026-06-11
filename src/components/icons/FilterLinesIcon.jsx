const FilterLinesIcon = ({ width = 20, height = 20, stroke = "#344054" }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M5 10H15M2.5 5H17.5M7.5 15H12.5"
      stroke={stroke}
      strokeWidth="1.66667"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default FilterLinesIcon;
