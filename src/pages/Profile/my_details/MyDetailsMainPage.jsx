import { Grid } from "@mui/material";
import Body from "./components/Body";

const MyDetailsMainPage = () => {
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
      <Body />
    </Grid>
  );
};

export default MyDetailsMainPage;
