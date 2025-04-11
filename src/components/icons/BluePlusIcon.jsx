export const BluePlusIcon = (props = null) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.width ?? "20"}
      height={props.height ?? "20"}
      // viewBox={`0 0 ${props.width ?? "20"} ${props.height ?? "20"}`}
    >
      <path
        stroke={props.stroke ?? "#0040C1"}
        d="M10 4.167v11.666M4.167 10h11.666"
      />
    </svg>
  );
};
