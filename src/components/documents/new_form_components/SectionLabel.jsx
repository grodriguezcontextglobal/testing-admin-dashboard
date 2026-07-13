import { Typography, Box } from "@mui/material";

const SectionLabel = ({ title, description }) => {
  return (
    <Box>
      <Typography
        variant="h6"
        sx={{ textAlign: "left", fontSize: "14px", fontWeight: 500, color: "var(--gray-700, #484d47)" }}
      >
        {title}
      </Typography>
      <Typography
        variant="body1"
        sx={{ textAlign: "left", fontSize: "14px", fontWeight: 400, color: "var(--gray-600, #5d615a)" }}
      >
        {description}
      </Typography>
    </Box>
  );
};

export default SectionLabel;
