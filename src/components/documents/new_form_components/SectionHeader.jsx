import { Box, Typography } from "@mui/material";
import BlueButtonComponent from "../../UX/buttons/BlueButton";
import GrayButtonComponent from "../../UX/buttons/GrayButton";

const SectionHeader = ({ title, subtitle, cancelButton, saveButton }) => {
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
          sx={{ textAlign: "left", fontSize: "18px", fontWeight: 600, color: "#101828" }}
        >
          {title}
        </Typography>
        <Typography
          variant="body1"
          sx={{ textAlign: "left", fontSize: "14px", fontWeight: 400, color: "#475467" }}
        >
          {subtitle}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", gap: "12px" }}>
      <GrayButtonComponent title="Cancel" func={cancelButton} />      
      <BlueButtonComponent title="Save" func={saveButton} />
      </Box>
    </Box>
  );
};

export default SectionHeader;
