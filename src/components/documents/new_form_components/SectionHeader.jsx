import { Box, Typography } from "@mui/material";
import BlueButtonComponent from "../../UX/buttons/BlueButton";
import GrayButtonComponent from "../../UX/buttons/GrayButton";

const SectionHeader = ({ title, subtitle, cancelButton, saveButton, loading = false }) => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Box>
        <Typography
          variant="h5"
          sx={{ textAlign: "left", fontSize: "18px", fontWeight: 600, color: "var(--gray-900, #171d1a)" }}
        >
          {title}
        </Typography>
        <Typography
          variant="body1"
          sx={{ textAlign: "left", fontSize: "14px", fontWeight: 400, color: "var(--gray-600, #5d615a)" }}
        >
          {subtitle}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", gap: "12px" }}>
        <GrayButtonComponent title="Cancel" func={cancelButton} disabled={loading} />
        <BlueButtonComponent title="Save" func={saveButton} loadingState={loading} />
      </Box>
    </Box>
  );
};

export default SectionHeader;
