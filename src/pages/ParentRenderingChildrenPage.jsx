import { Grid } from "@mui/material";
import { Outlet } from "react-router-dom";
// import OnlineUserBanner from "../components/general/OnlineUserBanner"

const ParentRenderingChildrenPage = () => {
  return (
    <Grid
      display={"flex"}
      justifyContent={"center"}
      alignItems={"center"}
      maxWidth={'1228px'}
      minWidth={'768px'}
      container
    >
      <Grid
        alignSelf={"flex-start"}
        style={{ minHeight: "80dvh" }}
        margin={"14dvh auto 1dvh"}
        item
        xs={12}
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
