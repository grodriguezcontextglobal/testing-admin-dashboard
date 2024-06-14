const FooterComponent = () => {
  return (
    <p
      style={{
        textAlign: "left",
        fontWeight: 400,
        fontFamily: "Inter",
        fontSize: "14px",
        fontStyle: "normal",
        lineHeight: "20px",
        color: "var(--gray-600, #475467)",
      }}
    >
      © Devitrak {new Date().getFullYear()}{" "}
    </p>
  );
};

export default FooterComponent;
