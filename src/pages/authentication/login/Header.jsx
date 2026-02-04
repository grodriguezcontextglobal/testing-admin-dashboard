const Header = ({ currentStep, userEmail, TextFontSize30LineHeight38 }) => {
  return (
    <>
      <p
        style={{
          ...TextFontSize30LineHeight38,
          marginBottom: "1rem",
          width: "100%",
        }}
      >
        Welcome
      </p>
      <p
        style={{
          width: "100%",
          color: "var(--gray-500, #667085)",
          fontSize: "16px",
          fontFamily: "Inter",
          lineHeight: "24px",
        }}
      >
        {currentStep === "email"
          ? "Please enter your email"
          : `Welcome back, ${userEmail}`}
      </p>
    </>
  );
};

export default Header;
