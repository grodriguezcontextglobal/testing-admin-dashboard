import { Typography, Box } from "@mui/material";

const SectionLabel = ({ title, description }) => {
  return (
    <Box>
      <Typography
        variant="h6"
        sx={{ fontSize: "14px", fontWeight: 500, color: "#344054" }}
      >
        {title}
      </Typography>
      <Typography
        variant="body1"
        sx={{ fontSize: "14px", fontWeight: 400, color: "#475467" }}
      >
        {description}
      </Typography>
    </Box>
  );
};

export default SectionLabel;
