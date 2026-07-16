import { Box } from "@mui/material";
import BlueButtonComponent from "../../UX/buttons/BlueButton";
import GrayButtonComponent from "../../UX/buttons/GrayButton";

const SectionFooter = ({ cancelButton, saveButton, loading = false }) => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "flex-end",
        gap: "12px",
        padding: "20px 0",
        borderTop: "1px solid var(--gray-200, #ddded6)",
        marginTop: "8px",
      }}
    >
      <GrayButtonComponent title="Cancel" func={cancelButton} disabled={loading} />
      <BlueButtonComponent title="Save" func={saveButton} loadingState={loading} />
    </Box>
  );
};

export default SectionFooter;
