import { forwardRef } from "react";
import { Subtitle } from "../../styles/global/Subtitle";
import { Grid } from "@mui/material";

const FooterComponent = forwardRef(function FooterComponent() {
  return (
    <Grid container>
      <Grid sx={{padding:{
        xs:"0 20px",
        sm:"0 20px",
        md:"0px",
        lg:"0px",
      }}} item xs={10} sm={10} md={12} lg={12}>
        <p
          style={{
            ...Subtitle,
            textAlign: "left",
          }}
        >
          © Devitrak {new Date().getFullYear()}{" "}
        </p>
      </Grid>
    </Grid>
  );
});

export default FooterComponent;
