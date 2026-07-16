const Header = () => {
  return (
    <div style={{ padding: "4px 0 0" }}>
      <h2
        style={{
          fontSize: "18px",
          fontWeight: 600,
          color: "var(--gray-900, #101828)",
          margin: "0 0 4px",
          lineHeight: "28px",
        }}
      >
        Personal info
      </h2>
      <p
        style={{
          fontSize: "14px",
          color: "var(--gray-600, #5d615a)",
          margin: 0,
          lineHeight: "20px",
        }}
      >
        Update your photo and personal details.
      </p>
    </div>
  );
};

export default Header;
