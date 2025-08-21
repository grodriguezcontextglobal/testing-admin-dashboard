import { Grid } from "@mui/material";
import { Outlet } from "react-router-dom";

const ParentRenderingChildrenPage = () => {
  return (
    <Grid
      id="parent-container"
      display={"flex"}
      justifyContent={"center"}
      // sx={{
      //   width: "100%",
      //   maxWidth: "100%",
      //   minWidth: "100%"
      // }}
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
          // width: "100%",
          padding: { 
            xs: "0 10px", 
            sm: "0 15px", 
            md: "0", 
            lg: "0" 
          },
          margin: "1rem 0 1rem",
        }}
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
