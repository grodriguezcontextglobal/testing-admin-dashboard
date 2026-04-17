import { Box } from "@mui/material";
import BlueButtonComponent from "../../UX/buttons/BlueButton";
import GrayButtonComponent from "../../UX/buttons/GrayButton";

const SectionFooter = ({ cancelButton, saveButton }) => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "flex-end",
        gap: "12px",
        padding: "20px 0",
        borderTop: "1px solid #eaecf0",
      }}
    >
      <GrayButtonComponent title="Cancel" func={cancelButton} />      
      <BlueButtonComponent title="Save" func={saveButton} />
    </Box>
  );
};

export default SectionFooter;
