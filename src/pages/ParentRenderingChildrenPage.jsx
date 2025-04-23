import { Grid } from "@mui/material";
import { Outlet } from "react-router-dom";
// import OnlineUserBanner from "../components/general/OnlineUserBanner"

const ParentRenderingChildrenPage = () => {
  return (
    <Grid
      id="parent-container"
      display={"flex"}
      justifyContent={"center"}
      // alignItems={"center"}
      maxWidth={"1228px"}
      minWidth={"325px"} //768px
      alignSelf={"flex-start"}
      container
    >
      <Grid
        id="child-container"
        alignSelf={"flex-start"}
        sx={{
          minHeight: {
            xs: "calc(100dvh - 80px)",
            sm: "calc(100dvh - 80px)",
            md: "calc(100dvh - 80px)",
            lg: "calc(100dvh - 80px)",
          },
          padding: { xs: "0 12px", sm: "0 12px", md: "0 20px", lg: "0" },
          margin: "1rem 0 1rem",
        }}
        // margin={"8rem 0 1rem"}
        item
        xs={11}
        sm={12}
        md={12}
        lg={12}
      >
        <Outlet />
      </Grid>
    </Grid>
  );
};

export default ParentRenderingChildrenPage;
