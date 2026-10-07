import { Box, Typography } from "@mui/material";
import { useState } from "react";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";

const DEVITRAK_LOGO_URL =
  "https://res.cloudinary.com/dpdzkhh07/image/upload/v1791386367/devitrak_login_jeki3x.svg";

const Card = ({ doc }) => {
  const [showContract, setShowContract] = useState(false);

  const toggleContract = () => {
    setShowContract(!showContract);
  };
  return (
    <Box
      sx={{
        display: "flex",
        width: "100%",
        flexDirection: "column",
        overflow: "hidden",
        borderRadius: "12px",
        backgroundColor: "var(--base-white, #fff)",
        boxShadow: "var(--shadow-xs, 0 1px 2px 0 rgba(23, 29, 26, 0.05))",
        border: "1px solid var(--gray-200, #ddded6)",
      }}
    >
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" } }}>
        {/* The old S3 logo answers 403 (2026-10-07). This one is white, so the
            tile is the brand's dark blue. */}
        <Box
          sx={{
            position: "relative",
            height: { xs: "150px", sm: "auto" },
            minHeight: { sm: "150px" },
            width: { xs: "100%", sm: "150px" },
          }}
          style={{
            backgroundColor: "#021833",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src={DEVITRAK_LOGO_URL}
            alt="Devitrak"
            style={{ width: "60%", height: "auto", maxHeight: "60%" }}
          />
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              border: "1px solid rgba(0, 0, 0, 0.1)",
              borderRadius: { xs: "12px 12px 0 0", sm: "12px 0 0 0" },
            }}
          />
        </Box>
        <Box
          sx={{
            flex: 1,
            padding: { xs: "16px", sm: "24px" },
            border: "1px solid var(--gray-200, #ddded6)",
            borderTop: { xs: "none", sm: "1px solid var(--gray-200, #ddded6)" },
            borderLeft: {
              xs: "1px solid var(--gray-200, #ddded6)",
              sm: "none",
            },
            borderRadius: { xs: "0", sm: "0 12px 0 0" },
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, color: "var(--gray-900, #171d1a)" }}
            >
              {doc.title}
            </Typography>
            <Typography
              variant="body2"
              sx={{ marginTop: "4px", color: "var(--gray-600, #5d615a)" }}
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
                func={toggleContract}
                title={showContract ? "Hide policy" : "View policy"}
              />
            </Box>
          </Box>
        </Box>
      </Box>
      {showContract && (
        <Box
          sx={{
            width: "100%",
            height: "500px",
            borderTop: "1px solid var(--gray-200, #ddded6)",
          }}
        >
          <iframe
            src={doc.url}
            title={doc.title}
            width="100%"
            height="100%"
            style={{ border: "none" }}
          />
        </Box>
      )}
    </Box>
  );
};

export default Card;
