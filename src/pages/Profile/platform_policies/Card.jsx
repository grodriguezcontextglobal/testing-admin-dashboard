import { Box, Typography } from "@mui/material";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";

const Card = ({ doc, handleViewDocument }) => {
  return (
    <Box
      sx={{
        display: "flex",
        width: "100%",
        flexDirection: { xs: "column", sm: "row" },
        overflow: "hidden",
        borderRadius: "12px",
        backgroundColor: "var(--basewhite)",
        boxShadow:
          "0px 1px 2px 0px rgba(16, 24, 40, 0.06), 0px 1px 3px 0px rgba(16, 24, 40, 0.10)",
        border: "1px solid var(--gray-200, #EAECF0)",
      }}
    >
      <Box
        sx={{
          position: "relative",
          height: { xs: "150px", sm: "auto" },
          width: { xs: "100%", sm: "150px" },
        }}
      >
        <img
          src={"https://devitrakadmindashboardlogotesting.s3.amazonaws.com/maskable_icon_white_background.png"}
          alt="Devotrak Logo"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            border: "1px solid rgba(0, 0, 0, 0.1)",
            borderRadius: { xs: "12px 12px 0 0", sm: "12px 0 0 12px" },
          }}
        />
      </Box>
      <Box
        sx={{
          flex: 1,
          padding: { xs: "16px", sm: "24px" },
          border: "1px solid var(--gray-200, #EAECF0)",
          borderTop: { xs: "none", sm: "1px solid var(--gray-200, #EAECF0)" },
          borderLeft: { xs: "1px solid var(--gray-200, #EAECF0)", sm: "none" },
          borderRadius: { xs: "0 0 12px 12px", sm: "0 12px 12px 0" },
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: "#101828" }}>
            {doc.title}
          </Typography>
          <Typography
            variant="body2"
            sx={{ marginTop: "4px", color: "#475467" }}
          >
            {doc.description}
          </Typography>
          <Box
            sx={{
              marginTop: "20px",
              display: "flex",
              flexDirection: { xs: "column-reverse", sm: "row" },
              gap: "12px",
            }}
          >
            <BlueButtonComponent
              func={() => handleViewDocument(doc)}
              title={"View policy"}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Card;
