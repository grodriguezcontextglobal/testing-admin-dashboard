import { Grid } from "@mui/material";
import TextFontsize18LineHeight28 from "../../../../styles/global/TextFontSize18LineHeight28";

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
        display={"flex"}
        alignSelf={"stretch"}
        justifyContent={"flex-start"}
        marginY={0}
        item
        xs={12}
        sm={12}
        md={12}
        lg={12}
      >
        <p style={TextFontsize18LineHeight28}>Update company information</p>
      </Grid>
    </Grid>
  );
};

export default Header;
