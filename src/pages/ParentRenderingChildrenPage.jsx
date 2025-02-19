import { Grid } from "@mui/material";
import { Outlet } from "react-router-dom";
// import OnlineUserBanner from "../components/general/OnlineUserBanner"

const ParentRenderingChildrenPage = () => {
  return (
    <Grid
      id="parent-container"
      display={"flex"}
      justifyContent={"center"}
      alignItems={"center"}
      maxWidth={"1228px"}
      minWidth={"768px"}
      container
    >
      <Grid
        alignSelf={"flex-start"}
        sx={{
          minHeight: "80dvh",
          padding: { xs: "0 24px", sm: "0 24px", md: 0, lg: 0 },
        }}
        margin={"14dvh 0 1dvh"}
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
