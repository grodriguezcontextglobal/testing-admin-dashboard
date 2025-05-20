import { styled } from "@mui/material";

const BlueButton = styled('button')({
  display: "flex",
  padding: "10px 18px",
  justifyContent: "center",
  alignItems: "center",
  gap: "8px",
  borderRadius: "8px",
  border: "1px solid var(--blue-dark-600)",
  background: "var(--blue-dark-600)",
  boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
  cursor: "pointer"
});

export default BlueButton;