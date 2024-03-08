import { Grid, Typography, Button } from "@mui/material";
import React from "react";

const Header = () => {
  return (
    <Grid
      style={{
        padding: "5px",
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
      }}
      container
    >
      <Grid
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
        container
      >
        <Grid
          display={"flex"}
          flexDirection={"column"}
          alignSelf={"stretch"}
          marginY={0}
          item
          xs={5}
          sm={5}
          md={6}
        >
          <Typography
            textTransform={"none"}
            style={{
              color: "var(--gray-900, #101828)",
              lineHeight: "38px",
            }}
            textAlign={"left"}
            fontWeight={600}
            fontFamily={"Inter"}
            fontSize={"18px"}
            lineHeight={"28px"}
          >
            Email notifications
          </Typography>
          <Typography
            textTransform={"none"}
            style={{
              color: "#475467",
              lineHeight: "38px",
            }}
            textAlign={"left"}
            fontWeight={400}
            fontFamily={"Inter"}
            fontSize={"14x"}
            lineHeight={"20px"}
          >
            Manage your email notifications.
          </Typography>
        </Grid>
        <Grid
          display={"flex"}
          justifyContent={"flex-end"}
          alignItems={"center"}
          marginY={0}
          gap={2}
          item
          xs={5}
          sm={5}
          md={6}
        >
          {/* <Button
            style={{
              width: "fit-content",
              border: "1px solid var(--gray-300, #D0D5DD)",
              borderRadius: "8px",
              background: "var(--base-white, #FFF)",
              boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
            }}
          >
            <Typography
              textTransform={"none"}
              style={{
                color: "#344054",
                fontSize: "14px",
                fontWeight: "600",
                fontFamily: "Inter",
                lineHeight: "20px",
              }}
            >
              Cancel
            </Typography>
          </Button>
          <Button
            style={{
              width: "fit-content",
              border: "1px solid var(--blue-dark-600, #155EEF)",
              borderRadius: "8px",
              background: "var(--blue-dark-600, #155EEF)",
              boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05",
            }}
          >
            <Typography
              textTransform={"none"}
              style={{
                color: "var(--base-white, #FFF",
                fontSize: "14px",
                fontWeight: "600",
                fontFamily: "Inter",
                lineHeight: "20px",
              }}
            >
              Save
            </Typography>
          </Button> */}
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Header;
