import { Grid, Typography } from "@mui/material";
import { forwardRef } from "react";
import { useSelector } from "react-redux";
import CenteringGrid from "../../styles/global/CenteringGrid";
import { Subtitle } from "../../styles/global/Subtitle";

const UpperBanner = forwardRef(function UpperBanner() {
  const { user } = useSelector((state) => state.admin);
  return (
    <Grid
      id="upper-nav-component"
      style={{
        ...CenteringGrid,
        backgroundColor: "var(--blue-dark--800)",
      }}
      container
    >
      <Typography
        style={{
          ...Subtitle,
          color: "var(--gray300)",
          textAlign: "center",
          textTransform: "none",
        }}
        padding={"0.8rem auto"}
      >
        {user.company}
      </Typography>
    </Grid>
  );
});

export default UpperBanner;
