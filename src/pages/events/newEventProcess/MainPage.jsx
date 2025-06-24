import { Grid, Typography, useTheme, useMediaQuery } from "@mui/material";
import { Outlet } from "react-router-dom";
import { TextFontSize30LineHeight38 } from "../../../styles/global/TextFontSize30LineHeight38";
import { lazy, Suspense } from "react";
import CenteringGrid from "../../../styles/global/CenteringGrid";
import Loading from "../../../components/animation/Loading";

const StepsLine = lazy(() => import("../newEventProcess/components/StepsLine"));

const MainPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Suspense
      fallback={
        <div style={CenteringGrid}>
          <Loading />
        </div>
      }
    >
      <Grid
        container
        display="flex"
        justifyContent="center"
        alignItems="center"
        key="settingUp-deviceList-event"
        sx={{
          px: isMobile ? 2 : 3,
          py: isMobile ? 2 : 4,
        }}
      >
        <Grid
          item
          xs={12}
          display="flex"
          flexDirection="column"
          gap={isMobile ? 1 : 2}
          sx={{
            mb: isMobile ? 3 : 4,
          }}
        >
          <Typography
            style={{
              ...TextFontSize30LineHeight38,
              margin: 0,
              textAlign: "left",
              fontSize: isMobile ? "24px" : "30px",
              lineHeight: isMobile ? "32px" : "38px",
            }}
          >
            Create a new event
          </Typography>

          <Typography
            sx={{
              textAlign: "left",
              fontFamily: "Inter",
              fontSize: isMobile ? "16px" : "20px",
              fontWeight: 400,
              lineHeight: isMobile ? "24px" : "30px",
              color: "var(--gray-600, #475467)",
            }}
          >
            Fill out the details below to create a new event.
          </Typography>
        </Grid>

        <Grid
          container
          spacing={isMobile ? 3 : 2}
          sx={{
            mt: isMobile ? 2 : 3,
            flexDirection: {
              xs: "column",
              sm: "column",
              md: "row",
              lg: "row",
            },
          }}
        >
          <Grid
            item
            xs={12}
            sm={12}
            md={4}
            lg={4}
            sx={{
              mb: isMobile ? 3 : 4,
            }}
          >
            <Grid
              display="flex"
              justifyContent={isMobile ? "center" : "flex-start"}
              alignItems="center"
            >
              <StepsLine props={2} />
            </Grid>
          </Grid>

          <Grid
            item
            xs={12}
            sm={12}
            md={8}
            lg={8}
            sx={{
              mb: isMobile ? 3 : 4,
            }}
          >
            <Outlet />
          </Grid>
        </Grid>
      </Grid>
    </Suspense>
  );
};

export default MainPage;
