const HighlightedPill = ({props}) => {
  return (
    <div
      style={{
        borderRadius: "16px",
        background: "var(--blue-dark-50, #EFF4FF)",
        mixBlendMode: "multiply",
        width: "fit-content",
        height: "fit-content",
      }}
    >
      <p
        style={{
          textTransform: "none",
          textAlign: "left",
          fontWeight: 500,
          fontSize: "12px",
          fontFamily: "Inter",
          lineHeight: "28px",
          color: "var(--blue-dark-700, #004EEB)",
          padding: "0px 8px",
        }}
      >
        {props}{" "}
      </p>
    </div>
  );
};

export default HighlightedPill;
